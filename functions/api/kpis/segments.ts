// GET /api/kpis/segments?name=<dormant_12mo|members_renewing|top_ltv|new>&limit=<n>
import { authOrError, jsonResponse, type AuthEnv } from '../../_lib/auth';
import { dormant12mo, membersRenewingSoon, topByLtv, newCustomers } from '../../_lib/segments';

interface Env extends AuthEnv {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = authOrError(request, env);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);
  if (!env.DB) return jsonResponse({ error: 'D1 not configured' }, 503);

  const url = new URL(request.url);
  const name = (url.searchParams.get('name') || 'dormant_12mo').toLowerCase();
  const limit = Math.min(500, parseInt(url.searchParams.get('limit') || '100', 10) || 100);

  let rows;
  switch (name) {
    case 'dormant_12mo':       rows = await dormant12mo(env.DB, limit); break;
    case 'members_renewing':   rows = await membersRenewingSoon(env.DB, limit); break;
    case 'top_ltv':            rows = await topByLtv(env.DB, limit); break;
    case 'new':                rows = await newCustomers(env.DB, 30, limit); break;
    default: return jsonResponse({ error: `Unknown segment: ${name}` }, 400);
  }
  return jsonResponse({ name, count: rows.length, rows });
};
