// GET /api/kpis/trends?weeks=12  (overall)
// GET /api/kpis/trends?weeks=12&tech=<hcp_id>  (per-tech)
import { authOrError, jsonResponse, type AuthEnv } from '../../_lib/auth';
import { weeklyTrend, weeklyTrendByTech } from '../../_lib/trends';

interface Env extends AuthEnv {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = authOrError(request, env);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);
  if (!env.DB) return jsonResponse({ error: 'D1 not configured' }, 503);

  const url = new URL(request.url);
  const weeks = Math.min(52, Math.max(1, parseInt(url.searchParams.get('weeks') || '12', 10) || 12));
  const tech = url.searchParams.get('tech');
  const points = tech
    ? await weeklyTrendByTech(env.DB, tech, weeks)
    : await weeklyTrend(env.DB, weeks);
  return jsonResponse({ weeks, tech: tech || null, points });
};
