// GET /api/kpis/by-tech?from=ISO&to=ISO
//
// Per-tech leaderboard: jobs, close rate, avg ticket, revenue, callbacks.

import { authOrError, jsonResponse, type AuthEnv } from '../../_lib/auth';
import { computeByTech, type RoleBand } from '../../_lib/kpi-queries';
import { readRoleOverrides, applySeedsByName } from '../../_lib/role-overrides';

interface Env extends AuthEnv {
  DB: D1Database;
  KPI_CONFIG?: KVNamespace;
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

  const explicit = await readRoleOverrides(env);
  // First pass: compute with explicit overrides only. Then we know the
  // tech names; layer in name-based seeds (Erick → service, Cesar →
  // install, etc.) for anyone Tim hasn't explicitly assigned yet.
  const first = await computeByTech(env.DB, { from, to }, explicit as Record<string, RoleBand> | undefined);
  const merged = applySeedsByName(first.map(t => ({ tech_id: t.tech_id, tech_name: t.tech_name })), explicit);
  // Second pass with merged overrides if any new techs got mapped.
  const overridesChanged = Object.keys(merged).length > Object.keys(explicit).length;
  const techs = overridesChanged
    ? await computeByTech(env.DB, { from, to }, merged as Record<string, RoleBand> | undefined)
    : first;
  return jsonResponse({ window: { from, to }, techs, role_overrides: merged });
};
