// POST /api/sync/run?key=<ADMIN_SECRET>
// GET  /api/sync/run?key=<ADMIN_SECRET>  (also works, idempotent enough for v1)
//
// Triggers a sync of HCP → D1. Body (optional JSON):
//   { daysBack?: number, endpoints?: ['employees'|'customers'|'jobs'], maxPagesPerEndpoint?: number }
//
// Returns the SyncResult JSON.
//
// Production: this same logic will eventually run on a cron Worker. Keeping
// it as a Pages Function makes it dead-simple to trigger from the dashboard
// "Sync now" button and tail logs in Cloudflare's UI.

import { runSync, type SyncEnv, type SyncOptions } from '../../_lib/sync';

interface Env extends SyncEnv {
  ADMIN_SECRET?: string;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

async function authOk(request: Request, env: Env): Promise<boolean> {
  if (!env.ADMIN_SECRET) return false;
  const url = new URL(request.url);
  const provided = url.searchParams.get('key') || request.headers.get('x-admin-key') || '';
  return provided === env.ADMIN_SECRET;
}

async function parseOpts(request: Request): Promise<Partial<SyncOptions>> {
  if (request.method !== 'POST') return {};
  try {
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const body = await request.json();
      return (body || {}) as Partial<SyncOptions>;
    }
  } catch {
    /* ignore */
  }
  return {};
}

const handler: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await authOk(request, env))) return json({ error: 'Unauthorized' }, 401);
  if (!env.HCP_API_KEY) return json({ error: 'HCP_API_KEY not configured for this environment' }, 503);
  if (!env.DB) return json({ error: 'D1 binding DB not configured' }, 503);

  const userOpts = await parseOpts(request);
  const result = await runSync(env, {
    trigger: 'manual',
    daysBack: userOpts.daysBack ?? 30,
    endpoints: userOpts.endpoints,
    // Defer to runSync's default (50) unless caller explicitly sets it.
    maxPagesPerEndpoint: userOpts.maxPagesPerEndpoint,
  });

  return json(result, result.success ? 200 : 502);
};

export const onRequestGet = handler;
export const onRequestPost = handler;
