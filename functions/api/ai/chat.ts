// POST /api/ai/chat — "Ask the dashboard" conversational endpoint.
//
// Phase 4. The browser sends the conversation; we pre-load relevant context
// from D1 (tech leaderboard, summary, segments, reviews, current goals) and
// hand it to MiniMax. The model gets the live data inline as a system
// prompt — that's our "tool use over D1" without needing function-calling
// (which MiniMax-M2.7's chatcompletion_v2 supports loosely; this approach
// is simpler and more reliable for our shape of question).
//
// We also do lightweight intent detection on the latest user message to
// decide which D1 queries to run, so we don't bloat the prompt with
// segments when the user is asking about callbacks.

import { authOrError, jsonResponse, type AuthEnv } from '../../_lib/auth';
import { chat as miniChat, type MiniMaxEnv } from '../../_lib/minimax';
import { computeSummary, computeByTech } from '../../_lib/kpi-queries';
import { dormant12mo, membersRenewingSoon, topByLtv } from '../../_lib/segments';

interface Env extends AuthEnv, MiniMaxEnv {
  DB: D1Database;
  KPI_CONFIG?: KVNamespace;
}

interface ChatBody {
  messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  window?: { from: string; to: string };
  range_days?: number;
}

const SYSTEM_PROMPT = `You are the AI assistant embedded in I Care Air Care's KPI dashboard. ICAC is a Wesley Chapel, FL HVAC contractor.

Your job: answer the owner's questions about tech performance, customers, callbacks, jobs, and reviews using ONLY the live data in the CONTEXT block below. Do not invent numbers.

Style:
- Concise. Bullet points when listing 3+ items, prose when 1-2.
- Always name the data source: "Housecall Pro" (not "your CRM"), or "Google Reviews via DataForSEO".
- When you cite a metric, include the actual number from CONTEXT.
- When data looks anomalous (e.g. only 4 estimates in 30 days for a 1,400-job shop), flag it as an HCP tagging-hygiene issue first, not a real performance gap.
- If the user asks something that needs data not in CONTEXT, say so plainly and suggest what to enable (e.g. "I'd need Timesheets ingest for that").
- For action recommendations, be specific: name techs, name customers, name jobs.

Never reveal raw IDs (HCP UUIDs). Use names. Never reveal PII beyond what the dashboard already shows the owner.`;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = authOrError(request, env);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);

  let body: ChatBody = {};
  try { body = (await request.json()) as ChatBody; } catch { /* allow empty */ }

  const messages = body.messages || [];
  const userMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
  if (!userMsg.trim()) return jsonResponse({ error: 'No user message provided' }, 400);

  const days = body.range_days || 30;
  const win = body.window || {
    from: new Date(Date.now() - days * 86400000).toISOString(),
    to: new Date().toISOString(),
  };

  // Intent-driven context loading. Always include summary + by-tech (cheap,
  // and most questions touch them); only pull segments / reviews when the
  // question signals interest.
  const q = userMsg.toLowerCase();
  const wantsSegments = /custom|dorma|member|renew|vip|ltv|lifetime|reach.?out|call.?list|leads?\b/i.test(userMsg);
  const wantsReviews  = /review|google|star|rating|reputation|feedback/i.test(userMsg);
  const wantsTechDetail = /(top|best|worst|leader|coach|fire|underperform).*(tech)|tech\s+\w+\s+(score|grade|breakdown)/i.test(userMsg);

  const tools_used: string[] = ['kpi-summary', 'tech-leaderboard'];

  const [summary, techs, goals] = await Promise.all([
    computeSummary(env.DB, win),
    computeByTech(env.DB, win),
    readGoals(env),
  ]);

  let segmentsBlock = '';
  if (wantsSegments) {
    const [dormant, renew, vip] = await Promise.all([
      dormant12mo(env.DB, 8),
      membersRenewingSoon(env.DB, 8),
      topByLtv(env.DB, 8),
    ]);
    tools_used.push('segments');
    segmentsBlock = `\n\n## Customer segments
- Dormant 12+mo (top 8 by lifetime value):
${dormant.map(r => `  - ${r.name} · ${fmt$(r.lifetime_value || 0)} LTV · ${r.days_since_last_job ?? '?'}d since last job`).join('\n')}
- Members renewing soon (top 8):
${renew.map(r => `  - ${r.name} · ${r.days_since_last_job ?? '?'}d ago`).join('\n')}
- VIPs (top 8 by LTV):
${vip.map(r => `  - ${r.name} · ${fmt$(r.lifetime_value || 0)} LTV`).join('\n')}`;
  }

  let reviewsBlock = '';
  if (wantsReviews) {
    try {
      const snap = await env.DB
        .prepare(`SELECT * FROM review_summary_snapshots ORDER BY fetched_at DESC LIMIT 1`)
        .first<any>();
      const recent = await env.DB
        .prepare(`SELECT reviewer_name, rating, posted_at, attributed_tech_hcp_id, text FROM reviews ORDER BY posted_at DESC LIMIT 8`)
        .all<any>();
      tools_used.push('reviews');
      const techNames = new Map(techs.map(t => [t.tech_id, t.tech_name] as [string, string]));
      reviewsBlock = `\n\n## Google Reviews (via DataForSEO)
- Average: ${snap?.rating_avg ?? '?'} stars from ${snap?.rating_count ?? '?'} reviews
- Owner response rate: ${snap?.response_rate_pct ?? 0}%
- Recent (last 8):
${(recent.results || []).map((r: any) => {
  const tech = r.attributed_tech_hcp_id ? techNames.get(r.attributed_tech_hcp_id) || '?' : 'unattributed';
  return `  - ${r.rating}★ ${r.reviewer_name || 'anon'} → ${tech}: "${(r.text || '').slice(0, 140).replace(/\n/g, ' ')}"`;
}).join('\n')}`;
    } catch { /* no reviews table yet — skip */ }
  }

  // Tech leaderboard summary — top 8 by revenue, plus any explicitly named tech.
  const namedTech = findNamedTech(userMsg, techs);
  if (namedTech) tools_used.push(`tech:${namedTech.tech_name}`);
  const topTechs = techs.filter(t => t.jobs > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 8);

  const techsBlock = `## Tech leaderboard (window: last ${days} days)
${topTechs.map(t => `- ${t.tech_name}${t.is_owner ? ' [owner/office]' : ''}: ${t.jobs} jobs · ${fmt$(t.revenue)} rev · ${t.close_rate_pct}% close · ${fmt$(t.avg_ticket)} ticket · ${t.callbacks} callbacks (${t.callback_rate_pct}%) · ${t.reviews_generated} reviews`).join('\n')}${namedTech && !topTechs.find(t => t.tech_id === namedTech.tech_id) ? `\n- ${namedTech.tech_name}: ${namedTech.jobs} jobs · ${fmt$(namedTech.revenue)} rev · ${namedTech.close_rate_pct}% close (specifically asked about)` : ''}`;

  const goalsBlock = `## Shop goals (set by Tim in Settings)
- Revenue per tech / month: ${fmt$(goals.revenue_monthly)} (window-prorated to ${fmt$(goals.revenue_monthly * (days / 30))})
- Close rate: ${goals.close_rate}%
- Avg ticket: ${fmt$(goals.avg_ticket)}
- Callback rate (max): ${goals.callback_rate}%
- Reviews per 100 jobs: ${goals.review_rate}`;

  const summaryBlock = `## Shop summary (window: last ${days} days)
- Call volume: ${summary.call_volume.total} jobs (${summary.call_volume.tune_up} TU · ${summary.call_volume.diagnostic} Dx · ${summary.call_volume.estimate} Est · ${summary.call_volume.install} Install)
- Close rate (overall): ${summary.close_rate.overall_pct}% (${summary.totals.sold_jobs}/${summary.totals.completed_jobs})
- Avg ticket: ${fmt$(summary.average_ticket.overall)}
- Total revenue: ${fmt$(summary.revenue.total)}
- Customer mix: ${summary.customer_type.new_customers} new · ${summary.customer_type.existing_customers} existing · ${summary.customer_type.member_customers} care-plan
- Callbacks: ${summary.callbacks.total} (${summary.callbacks.rate_pct}% rate)`;

  const contextBlock = `# CONTEXT (live data from Housecall Pro + Google Reviews)

${summaryBlock}

${techsBlock}

${goalsBlock}${segmentsBlock}${reviewsBlock}`;

  // MiniMax-M2.7 rejects multiple system messages with "invalid params" —
  // merge the role prompt and live-data context block into a single system
  // message. Then send the trailing 6 user/assistant turns from history.
  const trailing = messages.slice(-6).filter(m => m.role === 'user' || m.role === 'assistant');
  const result = await miniChat(env, [
    { role: 'system', content: `${SYSTEM_PROMPT}\n\n${contextBlock}` },
    ...trailing.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ], { temperature: 0.4, max_tokens: 4000 });

  if (!result.ok) {
    return jsonResponse({
      error: result.error || 'AI unavailable',
      answer: `I'm having trouble reaching MiniMax right now (${result.error || 'unknown'}). The dashboard's live data is still good — try refreshing in a minute.`,
      tools_used,
    }, 200);
  }

  return jsonResponse({
    answer: result.text || '',
    tools_used,
    tokens: { in: result.tokens_in, out: result.tokens_out },
    duration_ms: result.duration_ms,
  });
};

function fmt$(n: number): string {
  if (n == null || isNaN(n)) return '$0';
  return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

interface Goals {
  revenue_monthly: number;
  close_rate: number;
  avg_ticket: number;
  callback_rate: number;
  review_rate: number;
}

const DEFAULT_GOALS: Goals = {
  revenue_monthly: 15000,
  close_rate: 55,
  avg_ticket: 400,
  callback_rate: 3,
  review_rate: 15,
};

async function readGoals(env: Env): Promise<Goals> {
  if (!env.KPI_CONFIG) return DEFAULT_GOALS;
  try {
    const v = await env.KPI_CONFIG.get('goals', 'json');
    if (v && typeof v === 'object') return { ...DEFAULT_GOALS, ...(v as Partial<Goals>) };
  } catch { /* fall through */ }
  return DEFAULT_GOALS;
}

// Detect a named tech in the question — first-name match against the
// leaderboard. Helps the AI focus when the user asks "how is Kleber doing?"
function findNamedTech(q: string, techs: Array<{ tech_id: string; tech_name: string; jobs: number; revenue: number; close_rate_pct: number }>) {
  const lower = q.toLowerCase();
  for (const t of techs) {
    if (!t.tech_name) continue;
    const first = t.tech_name.split(' ')[0].toLowerCase();
    if (first.length >= 4 && lower.includes(first)) return t;
  }
  return null;
}
