// GET /api/kpis/by-tech?from=ISO&to=ISO
//
// Per-tech leaderboard: jobs, close rate, avg ticket, revenue, callbacks.

import { authOrError, jsonResponse, type AuthEnv } from '../../_lib/auth';
import { computeByTech } from '../../_lib/kpi-queries';

interface Env extends AuthEnv {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = authOrError(request, env);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);
  if (!env.DB) return jsonResponse({ error: 'D1 not configured' }, 503);

  const url = new URL(request.url);
  const to = url.searchParams.get('to') || new Date().toISOString();
  const from =
    url.searchParams.get('from') ||
    new Date(Date.parse(to) - 30 * 86400_000).toISOString();

  const techs = await computeByTech(env.DB, { from, to });
  return jsonResponse({ window: { from, to }, techs });
};
