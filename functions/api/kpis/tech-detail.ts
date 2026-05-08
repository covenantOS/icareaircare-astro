// GET /api/kpis/tech-detail?id=<hcp_id>&days=30
//
// Per-tech profile page data: KPI block, 12-week trend, top jobs by ticket,
// best/worst close-rate week, peer comparison, and a Formula-A score.

import { authOrError, jsonResponse, type AuthEnv } from '../../_lib/auth';
import { weeklyTrendByTech } from '../../_lib/trends';
import { computeByTech } from '../../_lib/kpi-queries';
import { DEFAULT_WEIGHTS, DEFAULT_TARGETS, type ScoreWeights, type ScoreTargets } from '../../_lib/scoring';

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

  // Score = peer-relative percentile rank within ICAC's field techs.
  // Industry-anchored absolute scoring penalized service techs unfairly
  // because their revenue/day naturally sits below install-tech benchmarks.
  // Shop-relative scoring asks "of the techs at THIS shop, how does this
  // one compare?" — exactly the question Tim is trying to answer.
  const cfg = await readScoreConfig(env);
  const NON_FIELD_RE = /owner|admin|office|csr|dispatch|sales/i;
  const allTechs = await computeByTech(env.DB, { from: from.toISOString(), to: to.toISOString() });
  const peers = allTechs.filter(
    (t) => t.jobs >= 5 && !(t.role && NON_FIELD_RE.test(t.role)),
  );

  const measured: Record<keyof ScoreWeights, boolean> = {
    revenue_per_day: true,
    avg_ticket: true,
    close_rate: true,
    membership_conversion: false,
    callback_rate_inverted: true,
    review_rate: true,        // we now attribute Google reviews to techs by name match
    utilization: false,
    volume: true,
  };
  let measuredWeight = 0;
  for (const k of Object.keys(cfg.weights) as Array<keyof ScoreWeights>) {
    if (measured[k]) measuredWeight += cfg.weights[k];
  }
  if (measuredWeight === 0) measuredWeight = 1;

  function inputsOf(t: { revenue: number; avg_ticket: number; close_rate_pct: number; jobs: number; callback_rate_pct: number; review_rate_pct?: number }): Record<keyof ScoreWeights, number> {
    return {
      revenue_per_day: t.revenue / Math.max(1, days),
      avg_ticket: t.avg_ticket,
      close_rate: t.close_rate_pct,
      membership_conversion: 0,
      callback_rate_inverted: -t.callback_rate_pct,
      review_rate: t.review_rate_pct || 0,
      utilization: 0,
      volume: t.jobs / Math.max(1, days),
    } as Record<keyof ScoreWeights, number>;
  }
  const peerInputs = peers.map(inputsOf);
  function pct(values: number[], v: number): number {
    if (values.length <= 1) return 50;
    const below = values.filter((x) => x < v).length;
    const equal = values.filter((x) => x === v).length;
    return Math.round(((below + 0.5 * equal) / values.length) * 100);
  }

  // Look up this tech's review attribution count in window
  const reviewRow = await env.DB
    .prepare(
      `SELECT COUNT(*) AS n FROM reviews
       WHERE attributed_tech_hcp_id = ?
         AND posted_at IS NOT NULL AND posted_at >= ? AND posted_at <= ?`,
    )
    .bind(techId, from.toISOString(), to.toISOString())
    .first<{ n: number }>();
  const reviewsGen = reviewRow?.n || 0;
  const reviewRatePct = summary.jobs > 0 ? round((reviewsGen / summary.jobs) * 100, 1) : 0;
  // Splice the review fields onto summary so the response includes them.
  (summary as TechSummary & { reviews_generated: number; review_rate_pct: number }).reviews_generated = reviewsGen;
  (summary as TechSummary & { reviews_generated: number; review_rate_pct: number }).review_rate_pct = reviewRatePct;

  const myInp = inputsOf({
    revenue: summary.revenue,
    avg_ticket: summary.avg_ticket,
    close_rate_pct: summary.close_rate_pct,
    jobs: summary.jobs,
    callback_rate_pct: summary.callback_rate_pct,
    review_rate_pct: reviewRatePct,
  });

  const components: Record<keyof ScoreWeights, { raw: number; normalized: number; weighted: number; measured: boolean }> = {} as never;
  let total = 0;
  for (const k of Object.keys(cfg.weights) as Array<keyof ScoreWeights>) {
    const isMeasured = !!measured[k];
    const raw = myInp[k] ?? 0;
    const dist = peerInputs.map((p) => p[k] ?? 0);
    const normalized = isMeasured ? pct(dist, raw) : 0;
    const effWeight = isMeasured ? cfg.weights[k] / measuredWeight : 0;
    const weighted = normalized * effWeight;
    components[k] = { raw, normalized, weighted, measured: isMeasured };
    total += weighted;
  }
  const grade: 'A' | 'B' | 'C' | 'D' | 'F' =
    total >= 90 ? 'A' : total >= 80 ? 'B' : total >= 70 ? 'C' : total >= 60 ? 'D' : 'F';
  const scoreOut = {
    total: Math.round(total * 10) / 10,
    grade,
    components,
    measured_weight: Math.round(measuredWeight * 100) / 100,
    peer_count: peers.length,
    peer_relative: true,
  };

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
