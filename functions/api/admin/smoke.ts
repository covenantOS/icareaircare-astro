// GET /api/admin/smoke?key=<ADMIN_KEY>
//
// Probes the HCP API to verify which (URL prefix, auth mode) combination works
// for each resource endpoint we care about: employees, customers, jobs,
// invoices, estimates. Returns a per-endpoint table of which variants
// succeeded so we can pin the right pattern in our sync code.
//
// Protected by ADMIN_SECRET env var so it's not crawlable.
// Set with:  npx wrangler pages secret put ADMIN_SECRET --project-name icareaircare-astro

import { probeEndpoint, hcpFetch } from '../../_lib/hcp';

interface Env {
  HCP_API_KEY: string;
  HCP_API_BASE?: string;
  ADMIN_SECRET?: string;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  // Cheap auth gate. Cloudflare Access will replace this once /admin/* is locked down.
  const url = new URL(request.url);
  const provided = url.searchParams.get('key') || request.headers.get('x-admin-key') || '';
  if (!env.ADMIN_SECRET || provided !== env.ADMIN_SECRET) {
    return json({ error: 'Unauthorized — pass ?key=<ADMIN_SECRET> or X-Admin-Key header' }, 401);
  }

  if (!env.HCP_API_KEY) {
    return json({ error: 'HCP_API_KEY not configured' }, 503);
  }

  // ?path=/jobs/JOB_ID  — full body dump for a single HCP resource (no truncation)
  // Use to inspect actual response schema rather than re-deriving from docs.
  const path = url.searchParams.get('path');
  if (path) {
    const r = await hcpFetch(env, { path });
    return json({
      summary: 'HCP single-path fetch',
      path,
      status: r.status,
      ok: r.ok,
      // Full body — caller asked, caller gets.
      data: r.data,
      headers: r.headers,
      error: r.error,
    });
  }

  // Allow caller to pass ?endpoints=foo,bar to probe arbitrary names.
  // Falls back to the canonical set we ship with.
  const requested = url.searchParams.get('endpoints');
  const endpoints = requested
    ? requested.split(',').map(s => s.trim()).filter(Boolean)
    : ['employees', 'customers', 'jobs', 'invoices', 'estimates'];
  const start = Date.now();
  const results: Record<string, unknown> = {};
  for (const ep of endpoints) {
    results[ep] = await probeEndpoint(env, ep);
  }

  return json({
    summary: 'HCP API probe complete',
    duration_ms: Date.now() - start,
    base_used: env.HCP_API_BASE || 'https://api.housecallpro.com',
    results,
  });
};
