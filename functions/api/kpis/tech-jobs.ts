// GET /api/kpis/tech-jobs?id=<tech_hcp_id>&from=ISO&to=ISO[&type=tune_up|...][&days=30]
//
// The "show me the actual calls this tech is credited for" drill-down.
// Tim needs this to reconcile the dashboard's per-tech revenue against
// Housecall Pro's own reports (2026-05-30 — "revenue is not matching").
//
// CRUCIAL: this uses the SAME multi-tech credit + equal-split logic as
// computeByTech in _lib/kpi-queries.ts, so the sum of `credited_amount`
// across the returned rows EQUALS the tech's `revenue` figure on the
// leaderboard. Each row shows the full ticket AND this tech's credited
// share, so any discrepancy with HCP is visible line by line.

import { authOrError, jsonResponse, type AuthEnv } from '../../_lib/auth';

interface Env extends AuthEnv {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = authOrError(request, env);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);
  if (!env.DB) return jsonResponse({ error: 'D1 not configured' }, 503);

  const url = new URL(request.url);
  const techId = url.searchParams.get('id');
  if (!techId) return jsonResponse({ error: 'Missing ?id=<tech_hcp_id>' }, 400);

  // Window: explicit from/to wins, else rolling days.
  const fromParam = url.searchParams.get('from');
  const toParam = url.searchParams.get('to');
  let from: string, to: string;
  if (fromParam && toParam) {
    from = fromParam; to = toParam;
  } else {
    const days = Math.min(3650, Math.max(1, parseInt(url.searchParams.get('days') || '30', 10) || 30));
    const toD = new Date();
    from = new Date(toD.getTime() - days * 86400_000).toISOString();
    to = toD.toISOString();
  }
  const typeFilter = url.searchParams.get('type'); // optional job_type narrowing

  // Pull every job where this tech is credited (in all_tech_hcp_ids, or is
  // primary when the array is empty/missing), with the equal-split share.
  // Mirrors the tech_jobs CTE in computeByTech.
  const rows = await env.DB
    .prepare(
      `WITH credited AS (
         SELECT
           j.hcp_id AS job_id,
           j.completed_at,
           j.job_type,
           j.status,
           j.is_sold,
           j.is_callback,
           j.invoice_total_cents,
           j.primary_tech_hcp_id,
           j.customer_hcp_id,
           COALESCE(je.value, j.primary_tech_hcp_id) AS credited_tech,
           CASE
             WHEN json_valid(j.all_tech_hcp_ids) AND json_array_length(j.all_tech_hcp_ids) > 0
               THEN 1.0 / json_array_length(j.all_tech_hcp_ids)
             ELSE 1.0
           END AS share,
           CASE
             WHEN json_valid(j.all_tech_hcp_ids) AND json_array_length(j.all_tech_hcp_ids) > 0
               THEN json_array_length(j.all_tech_hcp_ids)
             ELSE 1
           END AS tech_count
         FROM jobs j
         LEFT JOIN json_each(CASE WHEN json_valid(j.all_tech_hcp_ids) THEN j.all_tech_hcp_ids ELSE '[]' END) je
         WHERE j.completed_at >= ? AND j.completed_at <= ?
       )
       SELECT
         cr.job_id, cr.completed_at, cr.job_type, cr.status, cr.is_sold, cr.is_callback,
         cr.invoice_total_cents, cr.primary_tech_hcp_id, cr.share, cr.tech_count,
         c.first_name AS c_first, c.last_name AS c_last, c.company AS c_company
       FROM credited cr
       LEFT JOIN customers c ON c.hcp_id = cr.customer_hcp_id
       WHERE cr.credited_tech = ?
       ${typeFilter ? 'AND cr.job_type = ?' : ''}
       ORDER BY cr.invoice_total_cents DESC`,
    )
    .bind(...(typeFilter ? [from, to, techId, typeFilter] : [from, to, techId]))
    .all<{
      job_id: string; completed_at: string; job_type: string; status: string;
      is_sold: number; is_callback: number; invoice_total_cents: number | null;
      primary_tech_hcp_id: string | null; share: number; tech_count: number;
      c_first: string | null; c_last: string | null; c_company: string | null;
    }>();

  let totalCreditedCents = 0;
  let totalFullCents = 0;
  const jobs = (rows.results || []).map((r) => {
    const full = r.invoice_total_cents || 0;
    const credited = full * (r.share || 1);
    totalCreditedCents += credited;
    totalFullCents += full;
    return {
      job_id: r.job_id,
      customer_name: [r.c_first, r.c_last].filter(Boolean).join(' ').trim() || r.c_company || 'Unknown customer',
      job_type: r.job_type || 'other',
      status: r.status,
      completed_at: r.completed_at,
      is_sold: r.is_sold === 1,
      is_callback: r.is_callback === 1,
      is_primary: r.primary_tech_hcp_id === techId,
      tech_count: r.tech_count,                       // how many techs split this job
      full_ticket: round(full / 100, 2),              // the whole invoice
      credited_amount: round(credited / 100, 2),      // this tech's share (what hits their revenue)
    };
  });

  return jsonResponse({
    tech_id: techId,
    window: { from, to },
    type_filter: typeFilter || null,
    job_count: jobs.length,
    total_credited: round(totalCreditedCents / 100, 2),  // == leaderboard revenue for this tech/window/type
    total_full_value: round(totalFullCents / 100, 2),    // sum of full tickets (what HCP "by job" would show)
    jobs,
  });
};

function round(n: number, decimals = 0): number {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}
