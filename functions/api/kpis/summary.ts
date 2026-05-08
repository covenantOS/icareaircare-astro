// GET /api/kpis/summary?from=ISO&to=ISO
//
// Returns the headline KPI rollup for a date window. Used by the dashboard.
// Auth: ADMIN_SECRET (dev) OR Cloudflare Access (production).

import { authOrError, jsonResponse, type AuthEnv } from '../../_lib/auth';
import { computeSummary, getLastSync } from '../../_lib/kpi-queries';

interface Env extends AuthEnv {
  DB: D1Database;
}

function defaultWindow(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getTime() - 30 * 86400_000);
  return { from: from.toISOString(), to: to.toISOString() };
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = authOrError(request, env);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);
  if (!env.DB) return jsonResponse({ error: 'D1 not configured' }, 503);

  const url = new URL(request.url);
  const def = defaultWindow();
  const from = url.searchParams.get('from') || def.from;
  const to = url.searchParams.get('to') || def.to;

  const [summary, lastSync] = await Promise.all([
    computeSummary(env.DB, { from, to }),
    getLastSync(env.DB),
  ]);

  return jsonResponse({
    summary,
    last_sync: lastSync,
    auth_method: auth.method,
  });
};
