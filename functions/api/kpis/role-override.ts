// GET  /api/kpis/role-override            → current overrides map
// POST /api/kpis/role-override  body: { tech_hcp_id, band }
//   band ∈ service | install | helper | office | owner | other | "" (clear)
//
// Tim asked (2026-05-30) for a way to move/reclassify a tech when they get
// promoted or change positions. This persists an explicit per-tech role
// band into KV (role_overrides), which computeByTech reads first — so the
// change takes effect on the next dashboard load.

import { authOrError, jsonResponse, type AuthEnv } from '../../_lib/auth';
import { readRoleOverrides, writeRoleOverrides } from '../../_lib/role-overrides';
import type { RoleBand } from '../../_lib/kpi-queries';

interface Env extends AuthEnv {
  KPI_CONFIG?: KVNamespace;
}

const VALID_BANDS = ['service', 'install', 'helper', 'office', 'owner', 'other'] as const;

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = authOrError(request, env);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);
  const overrides = await readRoleOverrides(env);
  return jsonResponse({ overrides, valid_bands: VALID_BANDS });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = authOrError(request, env);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);
  if (!env.KPI_CONFIG) return jsonResponse({ error: 'KV not configured' }, 503);

  let body: { tech_hcp_id?: string; band?: string } = {};
  try { body = await request.json(); } catch { return jsonResponse({ error: 'Invalid JSON' }, 400); }

  const techId = body.tech_hcp_id;
  if (!techId) return jsonResponse({ error: 'tech_hcp_id required' }, 400);
  const band = (body.band || '').trim();
  if (band && !VALID_BANDS.includes(band as typeof VALID_BANDS[number])) {
    return jsonResponse({ error: `Invalid band. Use one of: ${VALID_BANDS.join(', ')} (or empty to clear)` }, 400);
  }

  const overrides = await readRoleOverrides(env);
  if (band) {
    overrides[techId] = band as RoleBand;
  } else {
    delete overrides[techId]; // empty band clears the override → falls back to name-seed / HCP role
  }
  await writeRoleOverrides(env, overrides);

  return jsonResponse({ ok: true, tech_hcp_id: techId, band: band || null, overrides });
};
