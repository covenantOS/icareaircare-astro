// Cloudflare Pages Function — POST /api/book
// Accepts booking form submissions from /book/ and creates a lead in Housecall Pro.
// API key stored as env var HCP_API_KEY in Cloudflare Pages → Settings → Environment Variables.

interface Env {
  HCP_API_KEY: string;
  HCP_API_BASE?: string;
  LC_BOOKING_WEBHOOK?: string;
}

const DEFAULT_BOOKING_WEBHOOK =
  'https://services.leadconnectorhq.com/hooks/9z6AJkL0xkPy2TPVG0J3/webhook-trigger/JpX53sPd20rcb3QFxQ3m';

interface BookingPayload {
  zip?: string;
  category?: 'hvac' | 'basic';
  service?: string;
  answers?: Record<string, string>;
  name?: string;
  phone?: string;
  email?: string;
  address?: {
    street?: string;
    unit?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  window?: {
    date?: string;   // ISO 'YYYY-MM-DD' from calendar picker
    slot?: string;   // e.g. '2pm–4pm'
    label?: string;  // e.g. 'Wednesday, Apr 22 · 2pm–4pm'
  };
  notes?: string;
  consent?: boolean;
}

const SERVICE_LABELS: Record<string, string> = {
  'diagnostic': 'Diagnostic — something is not right',
  'care-plan-tuneup': 'Care Plan Member Tune-Up',
  'tuneup': 'Standard Tune-Up',
  'estimate': 'Estimate / New System',
  'duct': 'Air Duct Cleaning',
  'thermostat': 'Thermostat Installation',
  'iaq': 'Indoor Air Quality',
  'other': 'Other / Not Sure',
};

const VALID_SERVICES = new Set(Object.keys(SERVICE_LABELS));
const VALID_CATEGORIES = new Set(['hvac', 'basic']);

function splitName(name: string) {
  const parts = name.trim().split(/\s+/);
  const first_name = parts[0] || '';
  const last_name = parts.slice(1).join(' ') || '';
  return { first_name, last_name };
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}

function validate(b: BookingPayload): string | null {
  if (!b.name || b.name.trim().length < 2) return 'Please enter your full name.';
  if (!b.phone || b.phone.replace(/\D/g, '').length < 10) return 'Please enter a valid 10-digit phone number.';
  if (!b.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)) return 'Please enter a valid email address.';
  if (!b.address?.street || !b.address?.city || !b.address?.zip) return 'Please complete the service address.';
  if (!/^\d{5}(-\d{4})?$/.test(b.address.zip.trim())) return 'Please enter a valid 5-digit ZIP code.';
  if (b.address.state && b.address.state.trim().length !== 2) return 'Please use a 2-letter state code.';
  if (!b.consent) return 'Please agree to be contacted before we can book this.';
  if (!b.service || !VALID_SERVICES.has(b.service)) return 'Please pick a service type.';
  if (b.category && !VALID_CATEGORIES.has(b.category)) return 'Invalid service category.';
  if (!b.window?.date) return 'Please pick a date.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.window.date)) return 'Invalid date format.';
  if (!b.window?.slot) return 'Please pick an arrival window.';
  return null;
}

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders },
  });
}

function buildNote(b: BookingPayload): string {
  const svc = SERVICE_LABELS[b.service || ''] || b.service || 'Not specified';
  const catLabel = b.category === 'hvac' ? 'Heating & Air Conditioning' : b.category === 'basic' ? 'Basic Services' : '';

  const lines: string[] = [];
  lines.push(`Service requested: ${svc}`);
  if (catLabel) lines.push(`Category: ${catLabel}`);

  // Appointment window — front-end sends { date, slot, label }
  if (b.window?.label) {
    lines.push(`Requested appointment: ${b.window.label}`);
  } else if (b.window?.date || b.window?.slot) {
    lines.push(`Requested appointment: ${[b.window.date, b.window.slot].filter(Boolean).join(' · ')}`);
  }

  const answerEntries = Object.entries(b.answers || {}).filter(([, v]) => v);
  if (answerEntries.length) {
    lines.push('');
    lines.push('Customer notes:');
    for (const [q, a] of answerEntries) {
      lines.push(`  • ${q}: ${a}`);
    }
  }

  if (b.notes && b.notes.trim()) {
    lines.push('');
    lines.push(`Additional: ${b.notes.trim()}`);
  }

  lines.push('');
  lines.push('— Submitted via icareaircare.com online booking');
  return lines.join('\n');
}

// Stateless short request-id so we can correlate client error reports with function logs
// without exposing PII. crypto.randomUUID is available in the Workers runtime.
function makeRequestId(): string {
  try {
    return (globalThis.crypto as Crypto | undefined)?.randomUUID?.().slice(0, 8) || Math.random().toString(36).slice(2, 10);
  } catch {
    return Math.random().toString(36).slice(2, 10);
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const reqId = makeRequestId();

  if (!env.HCP_API_KEY) {
    return json({
      error: 'Booking is temporarily unavailable online. Please call (813) 395-2324 and we will get you on the schedule.',
      request_id: reqId,
    }, 503);
  }

  let data: BookingPayload;
  try {
    data = (await request.json()) as BookingPayload;
  } catch {
    return json({ error: 'Invalid booking data.', request_id: reqId }, 400);
  }

  const vErr = validate(data);
  if (vErr) return json({ error: vErr, request_id: reqId }, 400);

  const { first_name, last_name } = splitName(data.name!);
  const mobile = normalizePhone(data.phone!);
  const note = buildNote(data);

  // Fire-and-forget: mirror every booking to LeadConnector (CRM) in parallel with
  // the HCP call. Booking still succeeds if the webhook is down; failures are logged
  // server-side with the request_id for correlation.
  const lcBookingWebhook = env.LC_BOOKING_WEBHOOK || DEFAULT_BOOKING_WEBHOOK;
  const lcPayload = {
    first_name,
    last_name,
    full_name: data.name,
    email: (data.email || '').trim().toLowerCase(),
    phone: mobile,
    address1: data.address!.street,
    address2: data.address!.unit || '',
    city: data.address!.city,
    state: data.address!.state || 'FL',
    postal_code: data.address!.zip,
    country: 'US',
    service: data.service,
    service_category: data.category,
    requested_date: data.window?.date || null,
    requested_slot: data.window?.slot || null,
    requested_label: data.window?.label || null,
    answers: data.answers || {},
    source: 'icareaircare.com',
    form_type: 'booking',
    tags: ['website-lead', 'form:booking'],
    submitted_at: new Date().toISOString(),
    user_agent: request.headers.get('user-agent') || null,
    referer: request.headers.get('referer') || null,
    request_id: reqId,
    note,
  };
  const lcPromise = fetch(lcBookingWebhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(lcPayload),
  }).then(r => {
    console.log(JSON.stringify({
      level: r.ok ? 'info' : 'warn',
      request_id: reqId,
      msg: r.ok ? 'lc_booking_webhook_ok' : 'lc_booking_webhook_failed',
      status: r.status,
    }));
  }).catch(err => {
    console.log(JSON.stringify({
      level: 'error', request_id: reqId, msg: 'lc_booking_webhook_error',
      error: err instanceof Error ? err.message : String(err),
    }));
  });

  // Housecall Pro Create Lead payload.
  // Per HCP docs: nested `customer` (with `addresses[]`), lead-level `note` (singular),
  // and `lead_source`. We also include `notes` as a hedge against schema drift — HCP
  // ignores unknown fields, and keeping both keeps the request forward-compatible.
  const hcpPayload: Record<string, unknown> = {
    customer: {
      first_name,
      last_name,
      email: data.email,
      mobile_number: mobile,
      home_number: null,
      notifications_enabled: true,
      addresses: [
        {
          street: data.address!.street,
          street_line_2: data.address!.unit || '',
          city: data.address!.city,
          state: data.address!.state || 'FL',
          zip: data.address!.zip,
          country: 'US',
          type: 'service',
        },
      ],
    },
    note,
    notes: note,
    lead_source: 'Website (icareaircare.com)',
  };

  // HCP public API base — NO /v1 prefix (confirmed by probing).
  const base = env.HCP_API_BASE || 'https://api.housecallpro.com';

  try {
    // Per HCP API docs: auth uses `Token {api-key}`, not `Bearer`.
    const res = await fetch(`${base}/leads`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${env.HCP_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(hcpPayload),
    });

    const text = await res.text();
    let parsed: any = null;
    try { parsed = text ? JSON.parse(text) : null; } catch { /* leave null */ }

    if (!res.ok) {
      // Log full details server-side (visible in Cloudflare Pages → Functions → Logs).
      // NEVER echo payload or HCP body to the browser — it contains PII.
      console.log(JSON.stringify({
        level: 'error',
        request_id: reqId,
        hcp_status: res.status,
        hcp_body: text.slice(0, 1500),
        endpoint: `${base}/leads`,
      }));

      let friendly = `We got your request but could not auto-schedule. Someone from our team will call you shortly at the number you provided. Or call (813) 395-2324 to confirm now.`;
      if (res.status === 401 || res.status === 403) {
        friendly = `Booking is temporarily unavailable. Please call (813) 395-2324 and we will get you on the schedule right away.`;
      } else if (res.status === 422 || res.status === 400) {
        friendly = `We got most of your request but our schedule system flagged a field. Someone will call you shortly to finish booking, or call (813) 395-2324 now.`;
      } else if (res.status === 429) {
        friendly = `A lot of people are booking right now. Give us a moment and try again, or call (813) 395-2324.`;
      }

      return json({ error: friendly, request_id: reqId }, 502);
    }

    console.log(JSON.stringify({
      level: 'info',
      request_id: reqId,
      hcp_status: res.status,
      lead_id: parsed?.id || parsed?.lead?.id || null,
    }));

    // Wait for LC webhook to finish so Cloudflare doesn't kill the promise on function exit
    await lcPromise;

    return json({
      success: true,
      lead_id: parsed?.id || parsed?.lead?.id || null,
      request_id: reqId,
    });
  } catch (err: unknown) {
    // If HCP threw, still try to capture the lead in LC so it isn't lost
    try { await lcPromise; } catch { /* already logged */ }
    console.log(JSON.stringify({
      level: 'error',
      request_id: reqId,
      type: 'fetch_error',
      message: err instanceof Error ? err.message : String(err),
    }));
    return json({
      error: `We could not reach our scheduling system. Please call (813) 395-2324 or try again in a moment.`,
      request_id: reqId,
    }, 502);
  }
};

// NOTE: No catch-all onRequest export — Cloudflare Pages Functions' method-specific
// exports (onRequestPost) handle routing. A duplicate onRequest could shadow POST
// handling depending on runtime semantics.
