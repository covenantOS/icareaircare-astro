// POST /api/reviews/sync?key=<ADMIN_SECRET>
// GET  /api/reviews/sync?key=<ADMIN_SECRET>  (idempotent enough for v1)
//
// Pulls Google reviews for I Care Air Care via DataForSEO live endpoint,
// upserts into D1, captures a summary snapshot. ~$0.001 per call.

import { authOrError, jsonResponse, type AuthEnv } from '../../_lib/auth';
import { fetchGoogleReviews, type DataForSEOEnv } from '../../_lib/dataforseo';

interface Env extends AuthEnv, DataForSEOEnv {
  DB: D1Database;
}

const BUSINESS_KEYWORD = 'I Care Air Care Wesley Chapel FL';

const handler: PagesFunction<Env> = async ({ request, env }) => {
  const auth = authOrError(request, env);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);
  if (!env.DB) return jsonResponse({ error: 'D1 not configured' }, 503);
  if (!env.DATAFORSEO_LOGIN || !env.DATAFORSEO_PASSWORD) {
    return jsonResponse({ error: 'DataForSEO credentials not configured' }, 503);
  }

  const url = new URL(request.url);
  const depth = Math.min(700, Math.max(50, parseInt(url.searchParams.get('depth') || '200', 10) || 200));
  const keyword = url.searchParams.get('keyword') || BUSINESS_KEYWORD;

  const r = await fetchGoogleReviews(env, { keyword, depth });
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
