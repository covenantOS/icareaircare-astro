// Shared spam-protection guard for the form-handling Pages Functions.
//
// guardRequest() reads the request body exactly once and runs a series of
// cheap pre-filters followed by a Cloudflare Turnstile check. A submission
// only counts as legitimate if every layer passes. The parsed fields are
// returned to the caller so the body is never read twice.

export const MAX_BODY_BYTES = 32 * 1024;

// Hostnames allowed to POST to the form endpoints. Preview deploys land on
// *.pages.dev, covered by the suffix check in hostAllowed().
const ALLOWED_HOSTS = new Set([
  'icareaircare.com',
  'www.icareaircare.com',
  'icareaircare-astro.pages.dev',
  'localhost',
  '127.0.0.1',
]);

// Junk phrases seen in real form-spam payloads. Matched case-insensitively
// against every submitted value. Kept deliberately tight — an HVAC lead form
// never contains these, and a loose list risks dropping real leads.
const SPAM_KEYWORDS = [
  'graph.org/balance',
  'transaction to you',
  'bitcoin',
  'btc wallet',
  'usdt',
  'crypto wallet',
  't.me/',
  '<<<',
];

export interface GuardEnv {
  TURNSTILE_SECRET_KEY?: string;
}

export type GuardResult =
  | { ok: true; fields: Record<string, string> }
  | { ok: false; reason: string };

function hostAllowed(host: string): boolean {
  return ALLOWED_HOSTS.has(host) || host.endsWith('.pages.dev');
}

// Reject cross-site POSTs. A missing Origin and Referer is allowed through —
// some privacy setups strip both — because Turnstile is the real gate and
// this layer is only cheap pre-filtering.
function originAllowed(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (origin) {
    try { return hostAllowed(new URL(origin).hostname); }
    catch { return false; }
  }
  const referer = request.headers.get('referer');
  if (referer) {
    try { return hostAllowed(new URL(referer).hostname); }
    catch { return false; }
  }
  return true;
}

async function readFields(request: Request): Promise<Record<string, string>> {
  const ct = request.headers.get('content-type') || '';
  const fields: Record<string, string> = {};
  if (ct.includes('application/json')) {
    const body = await request.json().catch(() => ({}));
    for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
      if (v == null) continue;
      fields[k] = typeof v === 'object' ? JSON.stringify(v) : String(v);
    }
    return fields;
  }
  const form = await request.formData().catch(() => null);
  if (form) {
    for (const [k, v] of form.entries()) {
      fields[k] = typeof v === 'string' ? v : v.name;
    }
  }
  return fields;
}

async function verifyTurnstile(token: string, secret: string, ip: string): Promise<boolean> {
  if (!token) return false;
  try {
    const body = new FormData();
    body.set('secret', secret);
    body.set('response', token);
    if (ip) body.set('remoteip', ip);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    const data = await res.json().catch(() => ({ success: false }));
    return Boolean((data as { success?: boolean }).success);
  } catch {
    return false;
  }
}

// Runs every spam layer in order; the first failure short-circuits. On success
// the caller receives the parsed form fields.
export async function guardRequest(request: Request, env: GuardEnv): Promise<GuardResult> {
  if (request.method !== 'POST') return { ok: false, reason: 'method' };
  if (!originAllowed(request)) return { ok: false, reason: 'origin' };
  if (request.headers.get('cf-ipcountry') === 'T1') return { ok: false, reason: 'tor' };

  const declaredLen = Number(request.headers.get('content-length') || '0');
  if (declaredLen > MAX_BODY_BYTES) return { ok: false, reason: 'too_large' };

  const fields = await readFields(request);

  if ((fields._honey || '').trim() !== '') return { ok: false, reason: 'honeypot' };

  const haystack = Object.entries(fields)
    .filter(([k]) => k !== 'cf-turnstile-response')
    .map(([, v]) => v)
    .join(' \n ')
    .toLowerCase();
  if (SPAM_KEYWORDS.some((kw) => haystack.includes(kw))) {
    return { ok: false, reason: 'keyword' };
  }

  // Turnstile is the real gate. If the secret is not configured yet the check
  // is skipped, so a deploy made before the secret is set degrades to the
  // cheap layers above instead of silently dropping every lead.
  if (env.TURNSTILE_SECRET_KEY) {
    const token = fields['cf-turnstile-response'] || '';
    const ip = request.headers.get('cf-connecting-ip') || '';
    const pass = await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY, ip);
    if (!pass) return { ok: false, reason: 'turnstile' };
  }

  return { ok: true, fields };
}
