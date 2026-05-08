// Housecall Pro API client — shared across Pages Functions and the sync Worker.
//
// Auth pattern: `Authorization: Token <HCP_API_KEY>` (NOT Bearer — confirmed by
// the existing /leads call in functions/api/book.ts which has been working in
// production since 2026-04).
//
// URL pattern: HCP currently exposes endpoints at BOTH the bare root
// (https://api.housecallpro.com/leads) and a /v1 prefix
// (https://api.housecallpro.com/v1/jobs). The smoke test resolves which
// pattern each endpoint speaks. We default to the /v1 prefix for the
// resource endpoints (jobs/customers/employees/invoices) and fall back to
// root if /v1 returns 404.

export interface HcpEnv {
  HCP_API_KEY: string;
  HCP_API_BASE?: string;
}

const DEFAULT_BASE = 'https://api.housecallpro.com';

export type HcpAuthMode = 'token' | 'bearer';

export interface HcpFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;                  // e.g. '/jobs' or '/v1/jobs'
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  authMode?: HcpAuthMode;        // default 'token'
}

export interface HcpFetchResult<T = unknown> {
  ok: boolean;
  status: number;
  url: string;
  data?: T;
  error?: string;
  headers: Record<string, string>;
}

export async function hcpFetch<T = unknown>(
  env: HcpEnv,
  opts: HcpFetchOptions,
): Promise<HcpFetchResult<T>> {
  const base = env.HCP_API_BASE || DEFAULT_BASE;
  const url = new URL(opts.path, base);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }

  const authMode = opts.authMode || 'token';
  const authValue =
    authMode === 'bearer' ? `Bearer ${env.HCP_API_KEY}` : `Token ${env.HCP_API_KEY}`;

  const init: RequestInit = {
    method: opts.method || 'GET',
    headers: {
      'Authorization': authValue,
      'Accept': 'application/json',
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  };

  try {
    const res = await fetch(url.toString(), init);
    const text = await res.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    const respHeaders: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      respHeaders[k] = v;
    });
    return {
      ok: res.ok,
      status: res.status,
      url: url.toString(),
      data: data as T,
      headers: respHeaders,
      error: res.ok ? undefined : (typeof data === 'string' ? data.slice(0, 500) : JSON.stringify(data).slice(0, 500)),
    };
  } catch (err: unknown) {
    return {
      ok: false,
      status: 0,
      url: url.toString(),
      headers: {},
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─────────────────────────────────────────────────────────────────
// PROBE — try multiple URL/auth variants for an endpoint and report
// which combinations succeed. Used by the smoke test to reverse-engineer
// the API surface without touching docs.
// ─────────────────────────────────────────────────────────────────

export interface ProbeResult {
  endpoint: string;
  variant: string;
  url: string;
  status: number;
  ok: boolean;
  hasBody: boolean;
  bodySnippet?: string;
  rateLimitHeaders?: Record<string, string>;
  error?: string;
}

export async function probeEndpoint(
  env: HcpEnv,
  endpointName: string,    // e.g. 'jobs'
): Promise<ProbeResult[]> {
  const variants: Array<{ name: string; path: string; authMode: HcpAuthMode; query?: Record<string, string> }> = [
    { name: 'token + /v1', path: `/v1/${endpointName}`, authMode: 'token', query: { page_size: '1' } },
    { name: 'token + root', path: `/${endpointName}`, authMode: 'token', query: { page_size: '1' } },
    { name: 'bearer + /v1', path: `/v1/${endpointName}`, authMode: 'bearer', query: { page_size: '1' } },
    { name: 'bearer + root', path: `/${endpointName}`, authMode: 'bearer', query: { page_size: '1' } },
  ];

  const results: ProbeResult[] = [];
  for (const v of variants) {
    const r = await hcpFetch(env, { path: v.path, authMode: v.authMode, query: v.query });
    const bodyPreview =
      r.data === null || r.data === undefined
        ? undefined
        : typeof r.data === 'string'
        ? r.data.slice(0, 300)
        : JSON.stringify(r.data).slice(0, 300);
    const rateLimitHeaders: Record<string, string> = {};
    for (const [k, val] of Object.entries(r.headers)) {
      const lk = k.toLowerCase();
      if (lk.startsWith('x-ratelimit') || lk === 'retry-after' || lk.startsWith('x-rate-limit')) {
        rateLimitHeaders[k] = val;
      }
    }
    results.push({
      endpoint: endpointName,
      variant: v.name,
      url: r.url,
      status: r.status,
      ok: r.ok,
      hasBody: !!bodyPreview,
      bodySnippet: bodyPreview,
      rateLimitHeaders: Object.keys(rateLimitHeaders).length ? rateLimitHeaders : undefined,
      error: r.error,
    });
  }
  return results;
}
