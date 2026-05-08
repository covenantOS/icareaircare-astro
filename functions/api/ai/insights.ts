// GET /api/ai/insights?days=30&refresh=1
//
// Generates a natural-language weekly executive summary using MiniMax.
// Caches the result in KV under key `ai:insights:<days>` for 6 hours
// to save tokens. ?refresh=1 forces regeneration.

import { authOrError, jsonResponse, type AuthEnv } from '../../_lib/auth';
import { computeSummary, computeByTech } from '../../_lib/kpi-queries';
import { weeklyTrend } from '../../_lib/trends';
import { dormant12mo, membersRenewingSoon } from '../../_lib/segments';
import { chat, type MiniMaxEnv } from '../../_lib/minimax';

interface Env extends AuthEnv, MiniMaxEnv {
  DB: D1Database;
  KPI_CONFIG?: KVNamespace;
}

const CACHE_TTL_S = 6 * 3600; // 6 hours

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = authOrError(request, env);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);
  if (!env.DB) return jsonResponse({ error: 'D1 not configured' }, 503);
  if (!env.MINIMAX_API_KEY) return jsonResponse({ error: 'MINIMAX_API_KEY not configured' }, 503);

  const url = new URL(request.url);
  const days = Math.min(180, Math.max(7, parseInt(url.searchParams.get('days') || '30', 10) || 30));
  const refresh = url.searchParams.get('refresh') === '1';
  const cacheKey = `ai:insights:${days}`;

  if (!refresh && env.KPI_CONFIG) {
    const cached = await env.KPI_CONFIG.get(cacheKey, 'json');
    if (cached) return jsonResponse({ ...(cached as object), cached: true });
  }

  // Pull data — pass to MiniMax in compact JSON, ask for narrative
  const to = new Date().toISOString();
  const from = new Date(Date.now() - days * 86400_000).toISOString();
  const [summary, byTech, trend, dormant, renewing] = await Promise.all([
    computeSummary(env.DB, { from, to }),
    computeByTech(env.DB, { from, to }),
    weeklyTrend(env.DB, 12),
    dormant12mo(env.DB, 50),
    membersRenewingSoon(env.DB, 30),
  ]);

  // Compute simple deltas (current week vs prior 4-week average)
  const recent = trend.slice(-1)[0];
  const priorAvg = trend.slice(-5, -1);
  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const deltas = recent
    ? {
        revenue_pct: ((recent.revenue - avg(priorAvg.map((p) => p.revenue))) /
          Math.max(1, avg(priorAvg.map((p) => p.revenue)))) * 100,
        close_pp: recent.close_rate_pct - avg(priorAvg.map((p) => p.close_rate_pct)),
        ticket_pct: ((recent.avg_ticket - avg(priorAvg.map((p) => p.avg_ticket))) /
          Math.max(1, avg(priorAvg.map((p) => p.avg_ticket)))) * 100,
      }
    : null;

  const compactInputs = {
    business: {
      name: 'I Care Air Care',
      city: 'Wesley Chapel, FL',
      owner: 'Tim Hawk',
      window_days: days,
    },
    headline: {
      total_jobs: summary.totals.completed_jobs,
      sold_jobs: summary.totals.sold_jobs,
      revenue: summary.totals.invoiced_total,
      close_rate_pct: summary.close_rate.overall_pct,
      avg_ticket: summary.average_ticket.overall,
    },
    by_call_type: {
      tune_up_count: summary.call_volume.tune_up,
      diagnostic_count: summary.call_volume.diagnostic,
      estimate_count: summary.call_volume.estimate,
      tune_up_close_pct: summary.close_rate.by_type.tune_up?.pct || 0,
      diagnostic_close_pct: summary.close_rate.by_type.diagnostic?.pct || 0,
      tune_up_avg: summary.average_ticket.by_type.tune_up || 0,
      diagnostic_avg: summary.average_ticket.by_type.diagnostic || 0,
    },
    customers: summary.customer_type,
    top_techs_by_revenue: byTech.slice(0, 6).map((t) => ({
      name: t.tech_name,
      jobs: t.jobs,
      close_pct: t.close_rate_pct,
      avg_ticket: t.avg_ticket,
      revenue: t.revenue,
      callbacks: t.callbacks,
    })),
    weekly_trend_last_12_weeks: trend.map((p) => ({
      week: p.week_start,
      jobs: p.jobs,
      revenue: p.revenue,
      close_pct: p.close_rate_pct,
      avg_ticket: p.avg_ticket,
    })),
    week_over_week_delta_vs_prior_4w: deltas,
    re_engagement_pool: {
      dormant_12mo_count: dormant.length,
      dormant_12mo_lifetime_value:
        Math.round(dormant.reduce((s, r) => s + r.lifetime_value, 0) * 100) / 100,
      members_up_for_renewal_count: renewing.length,
    },
    industry_benchmarks_for_context: {
      revenue_per_tech_per_day_top: 2400,
      revenue_per_tech_per_day_avg: 2000,
      avg_ticket_top: 600,
      avg_ticket_avg: 450,
      close_rate_diagnostic_top: 85,
      close_rate_diagnostic_avg: 67,
      close_rate_tune_up_top: 75,
      close_rate_tune_up_avg: 50,
      callback_rate_top: 2,
      callback_rate_avg: 3,
    },
  };

  const systemPrompt = `You are an HVAC operations analyst writing a weekly executive briefing for the owner of an HVAC service company. Tone: direct, specific, actionable, no fluff. Use the company's name "I Care Air Care" and the owner's first name "Tim" naturally.

Write the briefing as Markdown with these sections:

## Headlines
3-5 short bullets that capture the most important numbers and trends. Each bullet must include a concrete number.

## What's working
2-3 bullets identifying the strongest performers (techs, call types, segments) with specific numbers.

## What needs attention
2-3 bullets identifying the weakest performers, declining trends, or under-performing call types. Be specific about who or what.

## Recommended actions this week
3-5 numbered actions Tim can take THIS week. Each should be concrete (e.g. "Run a re-engagement campaign to the 50 dormant customers — total lifetime value $XX,XXX") not vague (e.g. "improve customer service").

Rules:
- Reference industry benchmarks when explaining why something is good or bad (e.g., "Erick's 51% tune-up close rate is at the industry average of 50% but well below top-quartile 75%")
- Never invent numbers — only use the numbers in the input JSON
- Don't mention "the JSON" or "the data" — write as if you read the actual books
- Keep total length under 400 words
- Output ONLY the markdown — no preamble, no "Here is your briefing:"`;

  const userPrompt = `Write the briefing using this data:\n\n${JSON.stringify(compactInputs, null, 2)}`;

  const r = await chat(env, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], { temperature: 0.4, max_tokens: 1200 });

  if (!r.ok) {
    return jsonResponse({ error: r.error || 'MiniMax error', duration_ms: r.duration_ms }, 502);
  }

  const result = {
    days,
    generated_at: new Date().toISOString(),
    markdown: r.text || '',
    tokens: { in: r.tokens_in, out: r.tokens_out },
    duration_ms: r.duration_ms,
    inputs_summary: {
      revenue: compactInputs.headline.revenue,
      jobs: compactInputs.headline.total_jobs,
      dormant_pool: compactInputs.re_engagement_pool.dormant_12mo_count,
    },
    cached: false,
  };

  if (env.KPI_CONFIG) {
    await env.KPI_CONFIG.put(cacheKey, JSON.stringify(result), { expirationTtl: CACHE_TTL_S });
  }

  return jsonResponse(result);
};
