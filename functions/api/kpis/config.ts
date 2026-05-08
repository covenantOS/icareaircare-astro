// GET  /api/kpis/config — read tunable thresholds & ranking-formula weights
// POST /api/kpis/config — update them (JSON body, partial merge)
//
// Stored in KV under key 'thresholds' and 'formula_weights'.

import { authOrError, jsonResponse, type AuthEnv } from '../../_lib/auth';

interface Env extends AuthEnv {
  KPI_CONFIG?: KVNamespace;
}

const DEFAULT_THRESHOLDS = {
  sold:      { default: 110, tune_up: 110, diagnostic: 110, estimate: 110 },
  minTicket: { default: 175, tune_up: 175, diagnostic: 275, estimate: 175 },
};

// Formula A from the industry research — Balanced Service-Tech Score.
// Re-tuned 2026-05-08: close rate weight increased (strongest quality signal),
// revenue weight reduced (was over-rewarding install-only techs), review
// weight reduced (text-match attribution still imperfect).
const DEFAULT_WEIGHTS = {
  revenue_per_day: 0.20,
  avg_ticket: 0.15,
  close_rate: 0.25,
  membership_conversion: 0.10,
  callback_rate_inverted: 0.10,
  review_rate: 0.05,
  utilization: 0.10,
  volume: 0.05,
};

const DEFAULT_TARGETS = {
  // 0-point and 100-point anchors for each component, for normalization.
  revenue_per_day: { zero: 1000, hundred: 2400 },     // dollars
  avg_ticket:      { zero: 200,  hundred: 550 },      // dollars
  close_rate:      { zero: 50,   hundred: 90 },       // percent
  membership_conversion: { zero: 10, hundred: 35 },   // percent
  callback_rate_inverted: { zero: 5, hundred: 0 },    // percent (inverted)
  review_rate:     { zero: 5,    hundred: 30 },       // percent
  utilization:     { zero: 50,   hundred: 75 },       // percent
  volume:          { zero: 2,    hundred: 5 },        // jobs/day
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = authOrError(request, env);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);

  let thresholds = DEFAULT_THRESHOLDS;
  let weights = DEFAULT_WEIGHTS;
  let targets = DEFAULT_TARGETS;
  if (env.KPI_CONFIG) {
    const t = await env.KPI_CONFIG.get('thresholds', 'json');
    if (t && typeof t === 'object') thresholds = { ...DEFAULT_THRESHOLDS, ...(t as object) } as typeof DEFAULT_THRESHOLDS;
    const w = await env.KPI_CONFIG.get('formula_weights', 'json');
    if (w && typeof w === 'object') weights = { ...DEFAULT_WEIGHTS, ...(w as object) } as typeof DEFAULT_WEIGHTS;
    const tg = await env.KPI_CONFIG.get('formula_targets', 'json');
    if (tg && typeof tg === 'object') targets = { ...DEFAULT_TARGETS, ...(tg as object) } as typeof DEFAULT_TARGETS;
  }

  return jsonResponse({ thresholds, weights, targets });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = authOrError(request, env);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);
  if (!env.KPI_CONFIG) return jsonResponse({ error: 'KV not configured' }, 503);

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  if (body.thresholds && typeof body.thresholds === 'object') {
    await env.KPI_CONFIG.put('thresholds', JSON.stringify(body.thresholds));
  }
  if (body.weights && typeof body.weights === 'object') {
    await env.KPI_CONFIG.put('formula_weights', JSON.stringify(body.weights));
  }
  if (body.targets && typeof body.targets === 'object') {
    await env.KPI_CONFIG.put('formula_targets', JSON.stringify(body.targets));
  }

  return jsonResponse({ ok: true });
};
