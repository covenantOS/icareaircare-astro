// POST /api/reviews/sync?key=<ADMIN_SECRET>
// GET  /api/reviews/sync?key=<ADMIN_SECRET>  (idempotent enough for v1)
//
// Pulls Google reviews for I Care Air Care via DataForSEO live endpoint,
// upserts into D1, captures a summary snapshot. ~$0.001 per call.

import { authOrError, jsonResponse, type AuthEnv } from '../../_lib/auth';
import { fetchGoogleReviews, getReviewsTask, type DataForSEOEnv } from '../../_lib/dataforseo';

interface Env extends AuthEnv, DataForSEOEnv {
  DB: D1Database;
  KPI_CONFIG?: KVNamespace;
}

const PENDING_TASK_KEY = 'reviews:pending_task_id';

const BUSINESS_KEYWORD = 'I Care Air Care Wesley Chapel FL';

const handler: PagesFunction<Env> = async ({ request, env }) => {
  const auth = authOrError(request, env);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);
  if (!env.DB) return jsonResponse({ error: 'D1 not configured' }, 503);
  if (!env.DATAFORSEO_LOGIN || !env.DATAFORSEO_PASSWORD) {
    return jsonResponse({ error: 'DataForSEO credentials not configured' }, 503);
  }

  const url = new URL(request.url);
  const depth = Math.min(700, Math.max(10, parseInt(url.searchParams.get('depth') || '50', 10) || 50));
  const keyword = url.searchParams.get('keyword') || BUSINESS_KEYWORD;
  const cid = url.searchParams.get('cid') || undefined;
  const explicitTaskId = url.searchParams.get('task_id') || undefined;

  // 1. Try retrieving a previously-submitted but not-yet-fetched task. The
  //    fetch loop in the prior request times out before the task is ready;
  //    we stash its id in KV and pick it up here next time.
  let r;
  const storedTaskId = explicitTaskId
    || (env.KPI_CONFIG ? await env.KPI_CONFIG.get(PENDING_TASK_KEY) : null);
  if (storedTaskId) {
    const got = await getReviewsTask(env, storedTaskId);
    if (got.ok) {
      // Got it — clear the pending marker so subsequent syncs submit a fresh task.
      if (env.KPI_CONFIG) await env.KPI_CONFIG.delete(PENDING_TASK_KEY);
      r = got;
    } else if (got.pending) {
      // Still queued. Don't waste a new task_post — tell caller to wait.
      return jsonResponse({
        success: false,
        pending: true,
        task_id: storedTaskId,
        message: got.error || 'Task still queued at DataForSEO; retry in ~30 seconds.',
        duration_ms: got.duration_ms,
      }, 202);
    }
    // got.ok=false and !pending → task gone bad; clear it and submit new
    if (!r) {
      if (env.KPI_CONFIG) await env.KPI_CONFIG.delete(PENDING_TASK_KEY);
    }
  }

  // 2. No stored task or it failed → submit a new one and poll briefly.
  if (!r) {
    r = await fetchGoogleReviews(env, {
      keyword: cid ? undefined : keyword,
      cid,
      location_name: 'Wesley Chapel,Florida,United States',
      language_name: 'English',
      depth,
      max_wait_ms: 45000,
    });
    if (!r.ok && r.pending && r.task_id && env.KPI_CONFIG) {
      // Stash for next sync attempt to pick up.
      await env.KPI_CONFIG.put(PENDING_TASK_KEY, r.task_id, { expirationTtl: 7 * 86400 });
    }
  }
  if (!r.ok && r.pending) {
    return jsonResponse({
      success: false,
      pending: true,
      task_id: r.task_id,
      message: r.error,
      duration_ms: r.duration_ms,
    }, 202);
  }
  if (!r.ok) {
    return jsonResponse({
      error: r.error || 'DataForSEO fetch failed',
      duration_ms: r.duration_ms,
      status: r.status,
    }, 502);
  }

  const summary = r.summary!;
  const reviews = r.reviews || [];
  const synced_at = new Date().toISOString();

  // Upsert reviews
  const batch: D1PreparedStatement[] = [];
  for (const rev of reviews) {
    batch.push(env.DB.prepare(
      `INSERT INTO reviews (review_id, source, reviewer_name, rating, text, posted_at, response_text, response_at, reviewer_url, raw_json, fetched_at, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(review_id) DO UPDATE SET
         reviewer_name=excluded.reviewer_name,
         rating=excluded.rating,
         text=excluded.text,
         posted_at=excluded.posted_at,
         response_text=excluded.response_text,
         response_at=excluded.response_at,
         reviewer_url=excluded.reviewer_url,
         raw_json=excluded.raw_json,
         fetched_at=excluded.fetched_at,
         synced_at=excluded.synced_at`,
    ).bind(
      rev.review_id, rev.source, rev.reviewer_name, rev.rating, rev.text,
      rev.posted_at, rev.response_text, rev.response_at, rev.reviewer_url,
      rev.raw_json, summary.fetched_at, synced_at,
    ));
  }
  // Snapshot
  batch.push(env.DB.prepare(
    `INSERT INTO review_summary_snapshots (fetched_at, rating_avg, rating_count, count_5, count_4, count_3, count_2, count_1, response_rate_pct, business_name, business_address, cid, cost_usd, duration_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    summary.fetched_at, summary.rating_avg, summary.rating_count,
    summary.count_5, summary.count_4, summary.count_3, summary.count_2, summary.count_1,
    summary.response_rate_pct, summary.business_name, summary.business_address, summary.cid,
    r.cost_usd ?? null, r.duration_ms,
  ));
  if (batch.length) await env.DB.batch(batch);

  return jsonResponse({
    success: true,
    summary,
    reviews_synced: reviews.length,
    cost_usd: r.cost_usd,
    duration_ms: r.duration_ms,
  });
};

export const onRequestGet = handler;
export const onRequestPost = handler;
