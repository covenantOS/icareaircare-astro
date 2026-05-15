// Manual review attribution — Tim's path for the ~40% of reviews that
// don't auto-attribute cleanly (per his 2026-05-09 email).
//
// GET  /api/reviews/manual?status=unattributed|low_confidence|all&limit=50
//      Returns reviews + the tech roster for the dropdown.
//
// POST /api/reviews/manual  body: { review_id, tech_hcp_id|null }
//      Sets the attribution (or clears it if tech_hcp_id is null/empty).
//      attribution_method becomes 'manual'.

import { authOrError, jsonResponse, type AuthEnv } from '../../_lib/auth';

interface Env extends AuthEnv {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = authOrError(request, env);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);
  if (!env.DB) return jsonResponse({ error: 'D1 not configured' }, 503);

  const url = new URL(request.url);
  const status = url.searchParams.get('status') || 'unattributed';
  const limit = Math.min(200, Math.max(5, parseInt(url.searchParams.get('limit') || '50', 10) || 50));
  const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10) || 0);
  const q = (url.searchParams.get('q') || '').trim();

  let where = `attributed_tech_hcp_id IS NULL`;
  if (status === 'low_confidence') {
    where = `attribution_method IN ('first_name_match', 'fuzzy_name_match', 'text_first_name')`;
  } else if (status === 'manual') {
    where = `attribution_method = 'manual'`;
  } else if (status === 'attributed') {
    where = `attributed_tech_hcp_id IS NOT NULL`;
  } else if (status === 'all') {
    where = `1 = 1`;
  }

  // Search across reviewer name + review text (LIKE is fine on ~1k rows).
  const bindParams: (string | number)[] = [];
  let qClause = '';
  if (q) {
    qClause = ` AND (LOWER(reviewer_name) LIKE ? OR LOWER(text) LIKE ?)`;
    const wild = '%' + q.toLowerCase() + '%';
    bindParams.push(wild, wild);
  }

  // Total count BEFORE pagination so the UI can show "showing X-Y of Z"
  const countRes = await env.DB
    .prepare(`SELECT COUNT(*) AS n FROM reviews WHERE ${where}${qClause}`)
    .bind(...bindParams)
    .first<{ n: number }>();
  const totalMatching = countRes?.n || 0;

  const reviewsRes = await env.DB
    .prepare(
      `SELECT review_id, reviewer_name, rating, text, posted_at, response_text,
              attributed_tech_hcp_id, attribution_method
       FROM reviews
       WHERE ${where}${qClause}
       ORDER BY posted_at DESC
       LIMIT ? OFFSET ?`,
    )
    .bind(...bindParams, limit, offset)
    .all();

  // Roster of techs for the dropdown. Active field techs first.
  const techsRes = await env.DB
    .prepare(
      `SELECT hcp_id, first_name, last_name, role, is_active
       FROM techs
       WHERE is_active = 1
       ORDER BY is_active DESC, first_name ASC`,
    )
    .all<{ hcp_id: string; first_name: string | null; last_name: string | null; role: string | null; is_active: number }>();

  // Resolve current attribution name for each review (for display)
  const techMap = new Map((techsRes.results || []).map(t =>
    [t.hcp_id, `${t.first_name || ''} ${t.last_name || ''}`.trim() || t.hcp_id]));

  return jsonResponse({
    status,
    q,
    pagination: {
      limit,
      offset,
      total: totalMatching,
      has_more: (offset + (reviewsRes.results || []).length) < totalMatching,
    },
    reviews: (reviewsRes.results || []).map((r: Record<string, unknown>) => ({
      ...r,
      attributed_tech_name: r.attributed_tech_hcp_id ? techMap.get(r.attributed_tech_hcp_id as string) || null : null,
    })),
    techs: (techsRes.results || []).map(t => ({
      hcp_id: t.hcp_id,
      name: `${t.first_name || ''} ${t.last_name || ''}`.trim() || t.hcp_id,
      role: t.role,
    })),
    // Counts for the UI header
    counts: await loadCounts(env.DB),
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = authOrError(request, env);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);
  if (!env.DB) return jsonResponse({ error: 'D1 not configured' }, 503);

  let body: { review_id?: string; tech_hcp_id?: string | null } = {};
  try { body = await request.json(); } catch { return jsonResponse({ error: 'Invalid JSON' }, 400); }

  const review_id = body.review_id;
  if (!review_id) return jsonResponse({ error: 'review_id required' }, 400);
  const tech_hcp_id = body.tech_hcp_id || null;

  // Sanity check the tech exists if one was passed
  if (tech_hcp_id) {
    const exists = await env.DB
      .prepare(`SELECT hcp_id FROM techs WHERE hcp_id = ?`)
      .bind(tech_hcp_id)
      .first<{ hcp_id: string }>();
    if (!exists) return jsonResponse({ error: 'Unknown tech_hcp_id' }, 400);
  }

  // Sanity check the review exists
  const reviewExists = await env.DB
    .prepare(`SELECT review_id FROM reviews WHERE review_id = ?`)
    .bind(review_id)
    .first<{ review_id: string }>();
  if (!reviewExists) return jsonResponse({ error: 'Unknown review_id' }, 404);

  await env.DB
    .prepare(
      `UPDATE reviews
       SET attributed_tech_hcp_id = ?, attribution_method = ?
       WHERE review_id = ?`,
    )
    .bind(tech_hcp_id, tech_hcp_id ? 'manual' : null, review_id)
    .run();

  return jsonResponse({ ok: true, review_id, tech_hcp_id });
};

async function loadCounts(db: D1Database) {
  const total = await db.prepare(`SELECT COUNT(*) AS n FROM reviews`).first<{ n: number }>();
  const attributed = await db.prepare(`SELECT COUNT(*) AS n FROM reviews WHERE attributed_tech_hcp_id IS NOT NULL`).first<{ n: number }>();
  const manual = await db.prepare(`SELECT COUNT(*) AS n FROM reviews WHERE attribution_method = 'manual'`).first<{ n: number }>();
  const lowConfidence = await db.prepare(`SELECT COUNT(*) AS n FROM reviews WHERE attribution_method IN ('first_name_match', 'fuzzy_name_match', 'text_first_name')`).first<{ n: number }>();
  return {
    total: total?.n || 0,
    attributed: attributed?.n || 0,
    unattributed: (total?.n || 0) - (attributed?.n || 0),
    manual: manual?.n || 0,
    low_confidence: lowConfidence?.n || 0,
  };
}
