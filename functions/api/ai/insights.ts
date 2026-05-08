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
  // Cloudflare Workers AI (bound via wrangler.toml [ai]).
  // Type is `Ai` from @cloudflare/workers-types — but it's globally available
  // when the binding is set, so we widen to `unknown` to avoid type drift.
  AI?: { run: (model: string, input: Record<string, unknown>) => Promise<unknown> };
}

const CACHE_TTL_S = 6 * 3600; // 6 hours

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = authOrError(request, env);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);
  if (!env.DB) return jsonResponse({ error: 'D1 not configured' }, 503);
  if (!env.MINIMAX_API_KEY && !env.AI) {
    return jsonResponse({ error: 'No AI provider configured (need MINIMAX_API_KEY or AI binding)' }, 503);
  }

  const url = new URL(request.url);
  const days = Math.min(180, Math.max(7, parseInt(url.searchParams.get('days') || '30', 10) || 30));
  const refresh = url.searchParams.get('refresh') === '1';
  const provider = (url.searchParams.get('provider') || 'auto').toLowerCase(); // auto | minimax | workers_ai
  const cacheKey = `ai:insights:${days}:${provider}`;

  if (!refresh && env.KPI_CONFIG) {
    const cached = await env.KPI_CONFIG.get(cacheKey, 'json');
    // Don't return cached entries with empty markdown — those were captured
    // from a prior failed run and are useless.
    if (cached && (cached as { markdown?: string }).markdown) {
      return jsonResponse({ ...(cached as object), cached: true });
    }
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

  const systemPrompt = `You are an operations analyst writing the weekly briefing for Tim Hawk, the owner of I Care Air Care — a residential HVAC company in Wesley Chapel, FL. The data comes from **Housecall Pro (HCP)** — their job/customer/invoice management software. Always reference Housecall Pro by name, never call it "the CRM" or "ServiceTitan" or any other vendor.

Output STRICT JSON only — NO markdown, NO preamble, NO trailing commentary. Just the JSON object.

JSON schema:
{
  "headline_summary": string,           // ONE punchy sentence summarising the week, ≤140 chars
  "headlines": [                         // 3-5 items, ordered by importance
    { "label": string, "value": string, "context": string, "tone": "good"|"neutral"|"warn" }
  ],
  "whats_working": [                     // 2-3 items
    { "title": string, "detail": string, "tech": string | null }
  ],
  "needs_attention": [                   // 2-3 items
    { "title": string, "detail": string, "tech": string | null, "severity": "high"|"med"|"low" }
  ],
  "data_quality_notes": [                // 0-2 items — see Rule 4 below
    { "title": string, "detail": string, "fix": string }
  ],
  "actions": [                           // 3-5 prioritised actions
    { "priority": number, "title": string, "detail": string, "value_estimate": string | null }
  ]
}

Critical rules:
1. **Use real numbers from the input JSON only.** Never invent.
2. **Reference Housecall Pro explicitly** when discussing data sources or actions — never "your CRM", "ServiceTitan", or "the software".
3. **Reference industry benchmarks for context** (e.g. "below top-quartile 75% tune-up close rate"). The benchmarks are in the input under industry_benchmarks_for_context.
4. **Anomaly detection: data hygiene FIRST.** If a metric looks oddly low or high given the company's known volume (≥20,000 lifetime jobs at HCP), it's almost always a tagging/classification issue in HCP, NOT a real business problem. Examples:
   - "Only 4 estimates in 30 days" → these are likely being booked under generic 'service call' or untagged in Housecall Pro. Don't say "you have a leadgen problem"; flag it under data_quality_notes with a fix like "Train office staff to apply HCP's 'Estimate' job type when scheduling replacement consultations."
   - "Other" job types > 20% of total → tagging hygiene issue, not a business issue.
   - Membership conversion at 0% across all techs → likely Care plan tag isn't being applied at job close.
   Put these in data_quality_notes, NOT in needs_attention. The fix field tells Tim what to change in HCP usage.
5. **whats_working / needs_attention are for REAL business observations** about people, performance, or patterns — not data gaps.
6. **actions must be concrete and HCP-actionable.** "Run a Marketing Center campaign in Housecall Pro to the 50 dormant customers" — not "do better marketing".
7. **Tech names exactly as given.** No nicknaming, no fixing typos.
8. **value_estimate** when you can compute one — e.g. "$14,000+ at company-avg ticket".
9. Keep it tight. Each detail field ≤ 200 chars. headline_summary ≤ 140 chars.`;

  const userPrompt = `Write the briefing using this data:\n\n${JSON.stringify(compactInputs, null, 2)}`;

  // Provider selection: try MiniMax first (if configured + provider != workers_ai),
  // fall back to Cloudflare Workers AI Llama on failure.
  let markdown = '';
  let providerUsed = '';
  let tokensIn: number | undefined;
  let tokensOut: number | undefined;
  let totalDuration = 0;
  const errors: string[] = [];

  const wantMiniMax = env.MINIMAX_API_KEY && (provider === 'auto' || provider === 'minimax');
  const wantWorkersAI = env.AI && (provider === 'auto' || provider === 'workers_ai');

  if (wantMiniMax) {
    const r = await chat(env, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.4, max_tokens: 6000, response_format: 'json_object' });
    totalDuration += r.duration_ms;
    if (r.ok && r.text && r.text.trim()) {
      markdown = r.text;
      providerUsed = 'minimax';
      tokensIn = r.tokens_in;
      tokensOut = r.tokens_out;
    } else {
      errors.push(`minimax: ${r.error || 'empty response'}`);
    }
  }

  if (!markdown && wantWorkersAI && env.AI) {
    const start = Date.now();
    try {
      const aiResp = (await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1200,
        temperature: 0.4,
      })) as { response?: string; result?: { response?: string } };
      const out = aiResp?.response || aiResp?.result?.response || '';
      totalDuration += Date.now() - start;
      if (out && out.trim()) {
        markdown = out;
        providerUsed = 'workers_ai_llama_3_3_70b';
      } else {
        errors.push(`workers_ai: empty response`);
      }
    } catch (e) {
      totalDuration += Date.now() - start;
      errors.push(`workers_ai: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (!markdown) {
    return jsonResponse({
      error: 'All AI providers failed',
      provider_errors: errors,
      duration_ms: totalDuration,
    }, 502);
  }

  // Try to parse the response as JSON (per the new structured prompt). If it's
  // not valid JSON, the frontend will fall back to markdown rendering.
  let briefing: Record<string, unknown> | null = null;
  try {
    // Strip markdown fences if the model wrapped JSON in ```json ... ```.
    const cleaned = markdown.trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === 'object') {
      briefing = parsed;
    }
  } catch {
    // leave briefing null — frontend renders markdown fallback
  }

  const result = {
    days,
    generated_at: new Date().toISOString(),
    briefing,                            // structured (preferred)
    markdown,                            // fallback / debugging
    provider: providerUsed,
    tokens: { in: tokensIn, out: tokensOut },
    duration_ms: totalDuration,
    inputs_summary: {
      revenue: compactInputs.headline.revenue,
      jobs: compactInputs.headline.total_jobs,
      dormant_pool: compactInputs.re_engagement_pool.dormant_12mo_count,
    },
    provider_errors: errors.length ? errors : undefined,
    cached: false,
  };

  if (env.KPI_CONFIG && markdown) {
    await env.KPI_CONFIG.put(cacheKey, JSON.stringify(result), { expirationTtl: CACHE_TTL_S });
  }

  return jsonResponse(result);
};
