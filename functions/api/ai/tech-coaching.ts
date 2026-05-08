// GET /api/ai/tech-coaching?id=<tech_hcp_id>&days=30[&refresh=1]
//
// Per-tech AI-generated coaching observations. Pulls the same data as the
// tech-detail endpoint, plus shop peer averages, plus the tech's actual
// Google reviews (text), and asks MiniMax to write a structured coaching
// briefing for THIS specific tech.
//
// Cached in KV under `ai:tech_coaching:<id>:<days>` for 6 hours.

import { authOrError, jsonResponse, type AuthEnv } from '../../_lib/auth';
import { computeByTech } from '../../_lib/kpi-queries';
import { weeklyTrendByTech } from '../../_lib/trends';
import { chat, type MiniMaxEnv } from '../../_lib/minimax';

interface Env extends AuthEnv, MiniMaxEnv {
  DB: D1Database;
  KPI_CONFIG?: KVNamespace;
}

const CACHE_TTL_S = 6 * 3600;

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = authOrError(request, env);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);
  if (!env.DB) return jsonResponse({ error: 'D1 not configured' }, 503);
  if (!env.MINIMAX_API_KEY) return jsonResponse({ error: 'MINIMAX_API_KEY not configured' }, 503);

  const url = new URL(request.url);
  const techId = url.searchParams.get('id');
  if (!techId) return jsonResponse({ error: 'Missing ?id=<tech_hcp_id>' }, 400);
  const days = Math.min(365, Math.max(1, parseInt(url.searchParams.get('days') || '30', 10) || 30));
  const refresh = url.searchParams.get('refresh') === '1';
  const cacheKey = `ai:tech_coaching:${techId}:${days}`;

  if (!refresh && env.KPI_CONFIG) {
    const cached = await env.KPI_CONFIG.get(cacheKey, 'json');
    if (cached && (cached as { briefing?: unknown }).briefing) {
      return jsonResponse({ ...(cached as object), cached: true });
    }
  }

  const to = new Date();
  const from = new Date(to.getTime() - days * 86400_000);

  const tech = await env.DB
    .prepare(`SELECT hcp_id, first_name, last_name, role, email FROM techs WHERE hcp_id = ?`)
    .bind(techId)
    .first<{ hcp_id: string; first_name: string | null; last_name: string | null; role: string | null; email: string | null }>();
  if (!tech) return jsonResponse({ error: `Tech ${techId} not found` }, 404);

  const allTechs = await computeByTech(env.DB, { from: from.toISOString(), to: to.toISOString() });
  const me = allTechs.find((t) => t.tech_id === techId);
  if (!me) {
    return jsonResponse({ error: `No completed jobs for ${tech.first_name || techId} in this window` }, 404);
  }

  // Peer group (same filter as the leaderboard scoring)
  const NON_FIELD_RE = /owner|admin|office|csr|dispatch|sales/i;
  const peers = allTechs.filter(
    (t) => t.tech_id !== techId && t.jobs >= 5 && !(t.role && NON_FIELD_RE.test(t.role)),
  );

  // Recent attributed Google reviews for THIS tech
  const techReviews = await env.DB
    .prepare(
      `SELECT reviewer_name, rating, text, posted_at
       FROM reviews
       WHERE attributed_tech_hcp_id = ?
       ORDER BY posted_at DESC LIMIT 10`,
    )
    .bind(techId)
    .all<{ reviewer_name: string; rating: number; text: string; posted_at: string }>();

  // Top + bottom jobs by ticket
  const topJobs = await env.DB
    .prepare(
      `SELECT hcp_id, job_type, completed_at, invoice_total_cents
       FROM jobs WHERE primary_tech_hcp_id = ? AND completed_at >= ? AND completed_at <= ? AND invoice_total_cents IS NOT NULL
       ORDER BY invoice_total_cents DESC LIMIT 5`,
    )
    .bind(techId, from.toISOString(), to.toISOString())
    .all<{ hcp_id: string; job_type: string; completed_at: string; invoice_total_cents: number }>();

  const trend = await weeklyTrendByTech(env.DB, techId, 12);

  // Median helper
  const median = (arr: number[]): number => {
    if (arr.length === 0) return 0;
    const s = arr.slice().sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };

  const peerStats = {
    revenue_median: round(median(peers.map((p) => p.revenue))),
    revenue_max: peers.length ? Math.round(Math.max(...peers.map((p) => p.revenue))) : 0,
    avg_ticket_median: round(median(peers.map((p) => p.avg_ticket))),
    close_rate_median: round(median(peers.map((p) => p.close_rate_pct)), 1),
    review_rate_median: round(median(peers.map((p) => p.review_rate_pct)), 1),
    callback_rate_median: round(median(peers.map((p) => p.callback_rate_pct)), 2),
  };

  const techName = [tech.first_name, tech.last_name].filter(Boolean).join(' ').trim() || techId;
  const compactInputs = {
    company: 'I Care Air Care · Wesley Chapel FL · using Housecall Pro',
    window_days: days,
    tech: {
      name: techName,
      role: tech.role || 'field tech',
      jobs: me.jobs,
      tune_ups: me.tune_ups,
      diagnostics: me.diagnostics,
      estimates: me.estimates,
      avg_ticket: me.avg_ticket,
      close_rate_pct: me.close_rate_pct,
      revenue: me.revenue,
      callbacks: me.callbacks,
      callback_rate_pct: me.callback_rate_pct,
      reviews_generated_this_window: me.reviews_generated,
      review_rate_pct: me.review_rate_pct,
    },
    shop_peers_n: peers.length,
    shop_peer_medians: peerStats,
    twelve_week_trend: trend.map((p) => ({
      week_start: p.week_start, jobs: p.jobs, revenue: p.revenue,
      close_pct: p.close_rate_pct, avg_ticket: p.avg_ticket,
    })),
    top_5_jobs_by_ticket: (topJobs.results || []).map((j) => ({
      type: j.job_type, completed: j.completed_at, ticket: j.invoice_total_cents / 100,
    })),
    google_reviews_attributed_to_tech: (techReviews.results || []).map((r) => ({
      reviewer: r.reviewer_name, stars: r.rating, posted: r.posted_at, snippet: (r.text || '').slice(0, 240),
    })),
    industry_benchmarks: {
      revenue_per_day_top: 2400,
      avg_ticket_top: 600, avg_ticket_avg: 450,
      close_rate_diagnostic_top: 85, close_rate_diagnostic_avg: 67,
      close_rate_tune_up_top: 75, close_rate_tune_up_avg: 50,
      callback_rate_top: 2, callback_rate_avg: 3,
      review_rate_top: 30, review_rate_avg: 20,
    },
  };

  const systemPrompt = `You are an HVAC ops coach writing a one-pager about a specific service technician at I Care Air Care, a residential HVAC company in Wesley Chapel, FL. The data comes from Housecall Pro (HCP) — always say HCP / Housecall Pro by name when referring to the data source or actions, never "the CRM" or generic vendor names.

Output STRICT JSON only, no markdown, no preamble:
{
  "headline": string,                  // ≤140 chars: this tech's story in one line
  "score_reading": string,             // ≤140 chars: how to read their score relative to peers
  "strengths": [                        // 1-3 items
    { "title": string, "detail": string, "evidence": string | null }
  ],
  "concerns": [                         // 1-3 items
    { "title": string, "detail": string, "evidence": string | null, "severity": "high"|"med"|"low" }
  ],
  "review_signals": [                   // 0-3 items, ONLY use the google_reviews_attributed_to_tech text
    { "reviewer": string, "takeaway": string, "tone": "good"|"warn"|"neutral" }
  ],
  "coaching_actions": [                 // 3-5 specific actions Tim can run with this tech
    { "priority": number, "title": string, "detail": string, "value_estimate": string | null }
  ],
  "compare_to_peers": [                 // 3-5 metric comparisons to peer median
    { "metric": string, "tech_value": string, "peer_median": string, "gap": string, "tone": "good"|"warn"|"neutral" }
  ]
}

Rules:
1. Use REAL numbers from the input. Never invent.
2. Reference Housecall Pro / HCP by name where relevant.
3. **Compare to PEER medians, not industry, when calling something good or bad.** Industry benchmarks are context, peers are the bar at this shop.
4. **review_signals**: ONLY pull from google_reviews_attributed_to_tech. Quote what the customer actually said. If a reviewer mentions the tech by name (e.g. "Kleber was great"), call that out as identity-confirmed attribution.
5. **Coaching actions** must be SPECIFIC and SHOP-RUNNABLE. Bad: "improve your close rate." Good: "Erick's avg tune-up ticket is $122 below shop median — ride along on his next 5 tune-ups and audit which add-on recommendations he's skipping."
6. **Severity** rules: "high" only if the gap to peers is >25% AND in a key metric (revenue, close, callback). "med" 10-25% gap. "low" <10%.
7. Tone matters — assume Tim respects this person and wants them to win, not get fired. Coach, don't accuse.
8. Keep each detail field ≤200 chars.`;

  const userPrompt = `Write the coaching briefing using this data:\n\n${JSON.stringify(compactInputs, null, 2)}`;

  const r = await chat(env, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], { temperature: 0.4, max_tokens: 6000, response_format: 'json_object' });

  if (!r.ok || !r.text) {
    return jsonResponse({ error: r.error || 'AI unavailable', duration_ms: r.duration_ms }, 502);
  }

  let briefing: Record<string, unknown> | null = null;
  try {
    const cleaned = r.text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === 'object') briefing = parsed;
  } catch {
    /* leave null */
  }

  const result = {
    tech_id: techId,
    tech_name: techName,
    days,
    generated_at: new Date().toISOString(),
    briefing,
    raw_text: briefing ? undefined : r.text,
    tokens: { in: r.tokens_in, out: r.tokens_out },
    duration_ms: r.duration_ms,
    cached: false,
  };

  if (env.KPI_CONFIG && briefing) {
    await env.KPI_CONFIG.put(cacheKey, JSON.stringify(result), { expirationTtl: CACHE_TTL_S });
  }
  return jsonResponse(result);
};

function round(n: number, decimals = 0): number {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}
