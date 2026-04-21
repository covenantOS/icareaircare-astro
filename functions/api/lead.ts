// Cloudflare Pages Function — POST /api/lead
// Accepts form submissions from public forms (LeadForm, MultiStepForm, Careers application)
// and forwards them to LeadConnector (GoHighLevel) via webhook. Falls back to FormSubmit
// if the webhook fails so Tim is never blind to a real lead.
//
// Env vars (set in Cloudflare Pages → Settings → Environment Variables, optional):
//   LC_LEAD_WEBHOOK — override the LeadConnector webhook URL
//
// The default LC webhook URL is baked in as a fallback so the site works without
// env setup; rotate here or override via env var.

interface Env {
  LC_LEAD_WEBHOOK?: string;
  FORMSUBMIT_FALLBACK_EMAIL?: string;
}

const DEFAULT_LEAD_WEBHOOK =
  'https://services.leadconnectorhq.com/hooks/9z6AJkL0xkPy2TPVG0J3/webhook-trigger/MTyKfllEL7s6kVraDwmN';
const DEFAULT_FALLBACK_EMAIL = 'tim@icareaircare.com';

function makeRequestId(): string {
  try {
    return (globalThis.crypto as Crypto | undefined)?.randomUUID?.().slice(0, 8) || Math.random().toString(36).slice(2, 10);
  } catch {
    return Math.random().toString(36).slice(2, 10);
  }
}

function normalizePhone(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (digits.length > 0) return `+${digits}`;
  return '';
}

function splitName(full: string) {
  const parts = (full || '').trim().split(/\s+/);
  const first_name = parts[0] || '';
  const last_name = parts.slice(1).join(' ') || '';
  return { first_name, last_name };
}

async function readAllFields(request: Request): Promise<Record<string, string>> {
  const ct = request.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    const body = await request.json().catch(() => ({}));
    const flat: Record<string, string> = {};
    for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
      if (v == null) continue;
      flat[k] = typeof v === 'object' ? JSON.stringify(v) : String(v);
    }
    return flat;
  }
  // form-data or x-www-form-urlencoded
  const form = await request.formData();
  const flat: Record<string, string> = {};
  for (const [k, v] of form.entries()) {
    flat[k] = typeof v === 'string' ? v : v.name; // File → filename
  }
  return flat;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const reqId = makeRequestId();
  const origin = new URL(request.url).origin;
  const raw = await readAllFields(request).catch(() => ({}));

  // Honeypot — silently accept and redirect, don't flag to bots
  if (raw._honey) {
    return Response.redirect(`${origin}/thank-you/`, 303);
  }

  // Split name for CRM compatibility (LeadConnector maps first_name/last_name natively)
  const { first_name, last_name } = splitName(raw.name || raw.full_name || '');

  // Strip meta fields ( _next, _subject, _captcha, _honey, _form_type ) from the CRM payload
  const cleanFields: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!k.startsWith('_') && v != null && v !== '') cleanFields[k] = v;
  }

  const formType = raw._form_type || 'contact';

  const payload = {
    ...cleanFields,
    first_name,
    last_name,
    full_name: raw.name || raw.full_name || [first_name, last_name].filter(Boolean).join(' '),
    phone: normalizePhone(raw.phone || ''),
    email: (raw.email || '').trim().toLowerCase(),
    source: 'icareaircare.com',
    form_type: formType,
    tags: ['website-lead', `form:${formType}`],
    submitted_at: new Date().toISOString(),
    user_agent: request.headers.get('user-agent') || null,
    referer: request.headers.get('referer') || null,
    request_id: reqId,
  };

  const leadWebhook = env.LC_LEAD_WEBHOOK || DEFAULT_LEAD_WEBHOOK;

  // Primary: LeadConnector webhook
  let webhookOk = false;
  try {
    const res = await fetch(leadWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    });
    webhookOk = res.ok;
    if (!res.ok) {
      console.log(JSON.stringify({
        level: 'warn', request_id: reqId,
        msg: 'lc_webhook_failed', status: res.status,
      }));
    } else {
      console.log(JSON.stringify({
        level: 'info', request_id: reqId,
        msg: 'lc_webhook_ok', form_type: formType,
      }));
    }
  } catch (err) {
    console.log(JSON.stringify({
      level: 'error', request_id: reqId, msg: 'lc_webhook_error',
      error: err instanceof Error ? err.message : String(err),
    }));
  }

  // Backup: mirror to FormSubmit so Tim always gets an email even if LC is down
  const fallbackEmail = env.FORMSUBMIT_FALLBACK_EMAIL || DEFAULT_FALLBACK_EMAIL;
  if (!webhookOk && fallbackEmail) {
    try {
      const fsForm = new FormData();
      for (const [k, v] of Object.entries(cleanFields)) fsForm.set(k, v);
      fsForm.set('_subject', `[fallback] ${formType} lead from icareaircare.com`);
      fsForm.set('request_id', reqId);
      await fetch(`https://formsubmit.co/ajax/${fallbackEmail}`, { method: 'POST', body: fsForm });
      console.log(JSON.stringify({ level: 'info', request_id: reqId, msg: 'formsubmit_fallback_sent' }));
    } catch (err) {
      console.log(JSON.stringify({ level: 'error', request_id: reqId, msg: 'formsubmit_fallback_failed' }));
    }
  }

  // Where to send the user after submit — honor form's _next if present + same-origin
  let redirectTo = `${origin}/thank-you/?ref=${encodeURIComponent(formType)}`;
  if (raw._next) {
    try {
      const u = new URL(raw._next);
      if (u.origin === origin) redirectTo = u.toString();
    } catch { /* ignore */ }
  }

  return Response.redirect(redirectTo, 303);
};
