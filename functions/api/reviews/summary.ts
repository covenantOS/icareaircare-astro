// GET /api/reviews/summary?key=<ADMIN_SECRET>
//
// Returns the latest review snapshot + recent reviews for the dashboard
// reviews widget. Reads from D1 (no DataForSEO call) so it's fast and free.

import { authOrError, jsonResponse, type AuthEnv } from '../../_lib/auth';

interface Env extends AuthEnv {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = authOrError(request, env);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);
  if (!env.DB) return jsonResponse({ error: 'D1 not configured' }, 503);

  const url = new URL(request.url);
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '8', 10) || 8));

  const snapshot = await env.DB
    .prepare(`SELECT * FROM review_summary_snapshots ORDER BY id DESC LIMIT 1`)
    .first<{
      fetched_at: string; rating_avg: number; rating_count: number;
      count_5: number; count_4: number; count_3: number; count_2: number; count_1: number;
      response_rate_pct: number; business_name: string; cid: string | null; cost_usd: number;
    }>();

  // Trend — last 12 snapshots, for sparkline of avg rating + count over time
  const snapshots = await env.DB
    .prepare(`SELECT fetched_at, rating_avg, rating_count, response_rate_pct FROM review_summary_snapshots ORDER BY id DESC LIMIT 12`)
    .all<{ fetched_at: string; rating_avg: number; rating_count: number; response_rate_pct: number }>();

  const recent = await env.DB
    .prepare(`SELECT review_id, reviewer_name, rating, text, posted_at, response_text, response_at, attributed_tech_hcp_id FROM reviews ORDER BY posted_at DESC LIMIT ?`)
    .bind(limit)
    .all<{
      review_id: string; reviewer_name: string | null; rating: number | null;
      text: string | null; posted_at: string | null;
      response_text: string | null; response_at: string | null;
      attributed_tech_hcp_id: string | null;
    }>();

  return jsonResponse({
    snapshot: snapshot || null,
    history: (snapshots.results || []).reverse(),  // oldest first for sparkline
    recent: recent.results || [],
  });
};
