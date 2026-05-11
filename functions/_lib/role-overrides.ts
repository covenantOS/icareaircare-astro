// Per-tech role-band overrides — Tim's labels for service vs install vs
// helper, since HCP's role string ("Field Technician") doesn't distinguish.
// Stored in KV under key `role_overrides` as { [hcp_id]: 'service'|'install'|... }.
// Settings drawer lets Tim toggle bands per tech. Defaults below seed
// the labels Tim provided on 2026-05-09.

import type { RoleBand } from './kpi-queries';

export interface RoleOverrideEnv {
  KPI_CONFIG?: KVNamespace;
}

// Default seed mapping by first-name + last-initial. We resolve to hcp_ids
// at read time by joining against techs table. This makes the seed durable
// even if HCP IDs shift between syncs.
//
// Tim's email (2026-05-09):
// "Service techs are Erick, Kleber, Gerald and James
//  Install techs are Cesar and Daniel, Install helpers are Angel and Paul."
const DEFAULT_SEEDS: Array<{ match: RegExp; band: RoleBand }> = [
  { match: /\berick\b/i,   band: 'service' },
  { match: /\bkleber\b/i,  band: 'service' },
  { match: /\bgerald\b/i,  band: 'service' },
  { match: /\bjames\b/i,   band: 'service' },
  { match: /\bcesar\b/i,   band: 'install' },
  { match: /\bdaniel\b/i,  band: 'install' },
  { match: /\bangel\b/i,   band: 'helper' },
  { match: /\bpaul\b/i,    band: 'helper' },
  // Owner explicit catch
  { match: /\btim\b.*\bhawk\b/i, band: 'owner' },
];

// Read explicit overrides from KV, then fill in any tech not yet mapped
// via name-based defaults. Returns { hcp_id -> band } map.
export async function readRoleOverrides(env: RoleOverrideEnv): Promise<Record<string, RoleBand>> {
  const explicit: Record<string, RoleBand> = {};
  if (env.KPI_CONFIG) {
    try {
      const v = await env.KPI_CONFIG.get('role_overrides', 'json');
      if (v && typeof v === 'object') Object.assign(explicit, v);
    } catch { /* ignore */ }
  }
  return explicit;
}

// Apply name-based defaults for any tech without an explicit override.
// Pass the full techs list so we can resolve names → IDs.
export function applySeedsByName(
  techs: Array<{ tech_id: string; tech_name: string }>,
  explicit: Record<string, RoleBand>,
): Record<string, RoleBand> {
  const merged: Record<string, RoleBand> = { ...explicit };
  for (const t of techs) {
    if (merged[t.tech_id]) continue; // explicit wins
    for (const seed of DEFAULT_SEEDS) {
      if (seed.match.test(t.tech_name)) {
        merged[t.tech_id] = seed.band;
        break;
      }
    }
  }
  return merged;
}

export async function writeRoleOverrides(env: RoleOverrideEnv, map: Record<string, RoleBand>): Promise<void> {
  if (!env.KPI_CONFIG) return;
  await env.KPI_CONFIG.put('role_overrides', JSON.stringify(map));
}
