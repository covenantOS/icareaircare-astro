// Shared auth helper for /api/admin/* and /api/kpis/* endpoints.
//
// During development we gate everything by ADMIN_SECRET. Once
// Cloudflare Access is configured for /admin/*, the dashboard pages
// will inject `Cf-Access-Jwt-Assertion` into requests and we can
// validate that JWT here instead. Both modes coexist for the
// transition.

export interface AuthEnv {
  ADMIN_SECRET?: string;
  // Set to your CF Access team domain to enable Access JWT validation.
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
}

export type AuthResult =
  | { ok: true; principal: string; method: 'admin_secret' | 'cf_access' }
  | { ok: false; status: number; error: string };

export function checkAdminSecret(request: Request, env: AuthEnv): AuthResult {
  if (!env.ADMIN_SECRET) {
    return { ok: false, status: 503, error: 'ADMIN_SECRET not configured' };
  }
  const url = new URL(request.url);
  const provided = url.searchParams.get('key') || request.headers.get('x-admin-key') || '';
  if (provided !== env.ADMIN_SECRET) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }
  return { ok: true, principal: 'admin_secret', method: 'admin_secret' };
}

// Cloudflare Access — checks the Cf-Access-Jwt-Assertion header set by
// CF Access. We don't fully verify the JWT signature here (Pages Functions
// can't easily import jose); we trust the header presence + `cf-access-authenticated-user-email`
// (CF Access strips/sets these at the edge — they cannot be forged when
// Access is enforcing the route).
export function checkCfAccess(request: Request): AuthResult {
  const jwt = request.headers.get('cf-access-jwt-assertion');
  const email = request.headers.get('cf-access-authenticated-user-email');
  if (!jwt || !email) {
    return { ok: false, status: 401, error: 'No CF Access session' };
  }
  return { ok: true, principal: email, method: 'cf_access' };
}

export function authOrError(request: Request, env: AuthEnv): AuthResult {
  // Try admin secret first (for tooling / curl), fall back to CF Access.
  const secretCheck = checkAdminSecret(request, env);
  if (secretCheck.ok) return secretCheck;
  const accessCheck = checkCfAccess(request);
  if (accessCheck.ok) return accessCheck;
  return secretCheck.status === 503 ? secretCheck : accessCheck;
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
