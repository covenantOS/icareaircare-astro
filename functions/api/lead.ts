// Cloudflare Pages Function — POST /api/lead
// Accepts form submissions from the public forms (LeadForm, MultiStepForm,
// careers application) and forwards them to LeadConnector (GoHighLevel) via
// webhook. Falls back to FormSubmit if the webhook fails so Tim is never
// blind to a real lead.
//
// Every submission first passes through guardRequest() (see _lib/spam-guard),
// which runs the origin / honeypot / keyword / Turnstile checks. A rejected
// submission is silently redirected to /thank-you/ and never reaches the CRM —
// a bot can't tell it failed, so it gets no feedback to adapt to.
//
// Secrets (Cloudflare Pages → Settings → Environment Variables, set for both
// Production and Preview):
//   LC_MAIN_WEBHOOK       — LeadConnector webhook for contact / quote forms
//   LC_CAREERS_WEBHOOK    — LeadConnector webhook for the careers form
//   TURNSTILE_SECRET_KEY  — server-side Turnstile validation key
// The webhook URLs are intentionally NOT hardcoded here: anything committed to
// git is permanently exposed and must be treated as burned.

import { guardRequest, type GuardEnv } from '../_lib/spam-guard';

interface Env extends GuardEnv {
  LC_MAIN_WEBHOOK?: string;        // contact / quote forms
  LC_CAREERS_WEBHOOK?: string;     // careers application form
  FORMSUBMIT_FALLBACK_EMAIL?: string;
}

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

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const reqId = makeRequestId();
  const origin = new URL(request.url).origin;

  // Spam gate — runs before anything is forwarded. A failure is absorbed:
  // redirect to /thank-you/ exactly like a real submit, but never call the CRM.
  const guard = await guardRequest(request, env);
  if (!guard.ok) {
    console.log(JSON.stringify({ level: 'info', request_id: reqId, msg: 'lead_rejected', reason: guard.reason }));
    return Response.redirect(`${origin}/thank-you/`, 303);
  }
  const raw = guard.fields;

  // Split name for CRM compatibility (LeadConnector maps first_name/last_name natively)
  const { first_name, last_name } = splitName(raw.name || raw.full_name || '');

  // Strip meta fields ( _next, _subject, _captcha, _honey, _form_type ) and the
  // Turnstile token from the CRM payload.
  const cleanFields: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k.startsWith('_') || k === 'cf-turnstile-response') continue;
    if (v != null && v !== '') cleanFields[k] = v;
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

  // Route to the correct LC webhook based on form type:
  //   - careers_application → careers webhook
  //   - everything else (quote_request, hero_multistep, contact) → main webhook
  const isCareers = formType === 'careers_application';
  const leadWebhook = isCareers ? env.LC_CAREERS_WEBHOOK : env.LC_MAIN_WEBHOOK;

  // Primary: LeadConnector webhook. If the secret is not configured the fetch
  // is skipped and the FormSubmit fallback below carries the lead instead.
  let webhookOk = false;
  if (leadWebhook) {
    try {
      const res = await fetch(leadWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });
      webhookOk = res.ok;
      console.log(JSON.stringify({
        level: res.ok ? 'info' : 'warn', request_id: reqId,
        msg: res.ok ? 'lc_webhook_ok' : 'lc_webhook_failed',
        status: res.status, webhook: isCareers ? 'careers' : 'main',
      }));
    } catch (err) {
      console.log(JSON.stringify({
        level: 'error', request_id: reqId, msg: 'lc_webhook_error',
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  } else {
    console.log(JSON.stringify({
      level: 'warn', request_id: reqId, msg: 'lc_webhook_unconfigured',
      webhook: isCareers ? 'careers' : 'main',
    }));
  }

  // Backup: mirror to FormSubmit so Tim always gets an email even if the
  // webhook is down or not yet configured.
  const fallbackEmail = env.FORMSUBMIT_FALLBACK_EMAIL || DEFAULT_FALLBACK_EMAIL;
  if (!webhookOk && fallbackEmail) {
    try {
      const fsForm = new FormData();
      for (const [k, v] of Object.entries(cleanFields)) fsForm.set(k, v);
      fsForm.set('_subject', `[fallback] ${formType} lead from icareaircare.com`);
      fsForm.set('request_id', reqId);
      await fetch(`https://formsubmit.co/ajax/${fallbackEmail}`, { method: 'POST', body: fsForm });
      console.log(JSON.stringify({ level: 'info', request_id: reqId, msg: 'formsubmit_fallback_sent' }));
    } catch {
      console.log(JSON.stringify({ level: 'error', request_id: reqId, msg: 'formsubmit_fallback_failed' }));
    }
  }

  // Where to send the user after submit — honor the form's _next if present
  // and same-origin, otherwise the default thank-you page.
  let redirectTo = `${origin}/thank-you/?ref=${encodeURIComponent(formType)}`;
  if (raw._next) {
    try {
      const u = new URL(raw._next, origin);
      if (u.origin === origin) redirectTo = u.toString();
    } catch { /* ignore */ }
  }

  return Response.redirect(redirectTo, 303);
};
