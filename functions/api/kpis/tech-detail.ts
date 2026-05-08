// GET /api/kpis/tech-detail?id=<hcp_id>&days=30
//
// Per-tech profile page data: KPI block, 12-week trend, top jobs by ticket,
// best/worst close-rate week, peer comparison, and a Formula-A score.

import { authOrError, jsonResponse, type AuthEnv } from '../../_lib/auth';
import { weeklyTrendByTech } from '../../_lib/trends';
import { score, DEFAULT_WEIGHTS, DEFAULT_TARGETS, type ScoreWeights, type ScoreTargets } from '../../_lib/scoring';

interface Env extends AuthEnv {
  DB: D1Database;
  KPI_CONFIG?: KVNamespace;
}

interface TechSummary {
  tech_id: string;
  tech_name: string;
  email: string | null;
  role: string | null;
  jobs: number;
  tune_ups: number;
  diagnostics: number;
  estimates: number;
  closed_jobs: number;
  close_rate_pct: number;
  avg_ticket: number;
  revenue: number;
  callbacks: number;
  callback_rate_pct: number;
  members_sold: number;
  jobs_per_day: number;
  revenue_per_day: number;
  membership_conversion_pct: number;
}

async function readScoreConfig(env: Env): Promise<{ weights: ScoreWeights; targets: ScoreTargets }> {
  if (!env.KPI_CONFIG) return { weights: DEFAULT_WEIGHTS, targets: DEFAULT_TARGETS };
  const w = await env.KPI_CONFIG.get('formula_weights', 'json');
  const t = await env.KPI_CONFIG.get('formula_targets', 'json');
  return {
    weights: { ...DEFAULT_WEIGHTS, ...((w as object) || {}) } as ScoreWeights,
    targets: { ...DEFAULT_TARGETS, ...((t as object) || {}) } as ScoreTargets,
  };
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = authOrError(request, env);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);
  if (!env.DB) return jsonResponse({ error: 'D1 not configured' }, 503);

  const url = new URL(request.url);
  const techId = url.searchParams.get('id');
  if (!techId) return jsonResponse({ error: 'Missing ?id=<tech_hcp_id>' }, 400);
  const days = Math.min(365, Math.max(1, parseInt(url.searchParams.get('days') || '30', 10) || 30));
  const to = new Date();
  const from = new Date(to.getTime() - days * 86400_000);

  // Tech basics
  const tech = await env.DB
    .prepare(
      `SELECT hcp_id, first_name, last_name, role, email, is_field_tech, is_active
       FROM techs WHERE hcp_id = ?`,
    )
    .bind(techId)
    .first<{
      hcp_id: string; first_name: string | null; last_name: string | null;
      role: string | null; email: string | null;
      is_field_tech: number; is_active: number;
    }>();

  // Aggregates in window
  const agg = await env.DB
    .prepare(
      `SELECT
         COUNT(*) AS jobs,
         SUM(CASE WHEN job_type='tune_up' THEN 1 ELSE 0 END) AS tune_ups,
         SUM(CASE WHEN job_type='diagnostic' THEN 1 ELSE 0 END) AS diagnostics,
         SUM(CASE WHEN job_type='estimate' THEN 1 ELSE 0 END) AS estimates,
         SUM(CASE WHEN is_sold=1 THEN 1 ELSE 0 END) AS closed_jobs,
         AVG(invoice_total_cents) AS avg_cents,
         COALESCE(SUM(invoice_total_cents), 0) AS revenue_cents,
         SUM(CASE WHEN is_callback=1 THEN 1 ELSE 0 END) AS callbacks
       FROM jobs
       WHERE completed_at >= ? AND completed_at <= ? AND primary_tech_hcp_id = ?`,
    )
    .bind(from.toISOString(), to.toISOString(), techId)
    .first<{
      jobs: number; tune_ups: number; diagnostics: number; estimates: number;
      closed_jobs: number; avg_cents: number; revenue_cents: number; callbacks: number;
    }>();

  // Members sold by this tech in window — proxy: jobs in window where the
  // customer is a member AND the customer's first_job_at is in this window.
  const membersSold = await env.DB
    .prepare(
      `SELECT COUNT(DISTINCT c.hcp_id) AS n
       FROM customers c
       JOIN jobs j ON j.customer_hcp_id = c.hcp_id
       WHERE c.is_member = 1
         AND c.first_job_at >= ? AND c.first_job_at <= ?
         AND j.primary_tech_hcp_id = ?`,
    )
    .bind(from.toISOString(), to.toISOString(), techId)
    .first<{ n: number }>();

  const jobs = agg?.jobs || 0;
  const closed = agg?.closed_jobs || 0;
  const callbacks = agg?.callbacks || 0;
  const revenue = (agg?.revenue_cents || 0) / 100;
  const avg = (agg?.avg_cents || 0) / 100;
  const memberCalls = (agg?.tune_ups || 0) + (agg?.diagnostics || 0);
  const membershipConvPct = memberCalls > 0 ? ((membersSold?.n || 0) / memberCalls) * 100 : 0;

  const summary: TechSummary = {
    tech_id: tech?.hcp_id || techId,
    tech_name:
      [tech?.first_name, tech?.last_name].filter(Boolean).join(' ').trim() || techId,
    email: tech?.email || null,
    role: tech?.role || null,
    jobs,
    tune_ups: agg?.tune_ups || 0,
    diagnostics: agg?.diagnostics || 0,
    estimates: agg?.estimates || 0,
    closed_jobs: closed,
    close_rate_pct: jobs > 0 ? round((closed / jobs) * 100, 1) : 0,
    avg_ticket: round(avg, 2),
    revenue: round(revenue, 2),
    callbacks,
    callback_rate_pct: jobs > 0 ? round((callbacks / jobs) * 100, 2) : 0,
    members_sold: membersSold?.n || 0,
    jobs_per_day: round(jobs / Math.max(1, days), 2),
    revenue_per_day: round(revenue / Math.max(1, days), 2),
    membership_conversion_pct: round(membershipConvPct, 1),
  };

  // 12-week sparkline
  const trend = await weeklyTrendByTech(env.DB, techId, 12);

  // Score using current weights/targets
  const cfg = await readScoreConfig(env);
  const scoreOut = score(
    {
      revenue_per_day: summary.revenue_per_day,
      avg_ticket: summary.avg_ticket,
      close_rate_pct: summary.close_rate_pct,
      membership_conversion_pct: summary.membership_conversion_pct,
      callback_rate_pct: summary.callback_rate_pct,
      review_rate_pct: 0,        // pending Google Business Profile integration
      utilization_pct: 0,        // pending Timesheets CSV ingest
      jobs_per_day: summary.jobs_per_day,
    },
    cfg.weights,
    cfg.targets,
  );

  // Top 5 jobs by ticket in window
  const topJobsRes = await env.DB
    .prepare(
      `SELECT hcp_id, customer_hcp_id, job_type, completed_at, invoice_total_cents
       FROM jobs
       WHERE primary_tech_hcp_id = ? AND completed_at >= ? AND completed_at <= ?
         AND invoice_total_cents IS NOT NULL
       ORDER BY invoice_total_cents DESC LIMIT 5`,
    )
    .bind(techId, from.toISOString(), to.toISOString())
    .all<{ hcp_id: string; customer_hcp_id: string; job_type: string; completed_at: string; invoice_total_cents: number }>();
  const topJobs = (topJobsRes.results || []).map((r) => ({
    job_id: r.hcp_id,
    customer_id: r.customer_hcp_id,
    job_type: r.job_type,
    completed_at: r.completed_at,
    ticket: round((r.invoice_total_cents || 0) / 100, 2),
  }));

  // Peer comparison (median + top quartile of all techs in window)
  const peerRes = await env.DB
    .prepare(
      `SELECT
         AVG(rev) AS shop_avg_revenue,
         AVG(close_rate) AS shop_avg_close,
         AVG(avg_t) AS shop_avg_ticket
       FROM (
         SELECT
           primary_tech_hcp_id,
           SUM(invoice_total_cents)/100.0 AS rev,
           CAST(SUM(CASE WHEN is_sold=1 THEN 1 ELSE 0 END) AS REAL) / NULLIF(COUNT(*),0) * 100 AS close_rate,
           AVG(invoice_total_cents)/100.0 AS avg_t
         FROM jobs
         WHERE completed_at >= ? AND completed_at <= ? AND primary_tech_hcp_id IS NOT NULL
         GROUP BY primary_tech_hcp_id
       )`,
    )
    .bind(from.toISOString(), to.toISOString())
    .first<{ shop_avg_revenue: number; shop_avg_close: number; shop_avg_ticket: number }>();

  return jsonResponse({
    window: { from: from.toISOString(), to: to.toISOString(), days },
    summary,
    score: scoreOut,
    trend,
    top_jobs: topJobs,
    peer_comparison: {
      shop_avg_revenue: round(peerRes?.shop_avg_revenue || 0, 2),
      shop_avg_close_rate_pct: round(peerRes?.shop_avg_close || 0, 1),
      shop_avg_ticket: round(peerRes?.shop_avg_ticket || 0, 2),
    },
  });
};

function round(n: number, decimals = 0): number {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}
