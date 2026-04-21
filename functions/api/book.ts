// Cloudflare Pages Function — POST /api/book
// Accepts booking form submissions from /book/ and creates a lead in Housecall Pro.
// API key stored as env var HCP_API_KEY (set via: wrangler pages secret put HCP_API_KEY --project-name=icareaircare-astro)

interface Env {
  HCP_API_KEY: string;
  HCP_API_BASE?: string; // override for testing, default below
}

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
    when?: string;
    time?: string;
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

const WINDOW_WHEN_LABELS: Record<string, string> = {
  'asap': 'ASAP — earliest available',
  'today': 'Today if possible',
  'tomorrow': 'Tomorrow',
  'this-week': 'Sometime this week',
};

const WINDOW_TIME_LABELS: Record<string, string> = {
  'morning': 'Morning (8am–12pm)',
  'afternoon': 'Afternoon (12pm–4pm)',
  'any': 'Any time',
};

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
  if (!b.consent) return 'Please agree to be contacted before we can book this.';
  if (!b.service) return 'Please pick a service type.';
  return null;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function buildNote(b: BookingPayload): string {
  const svc = SERVICE_LABELS[b.service || ''] || b.service || 'Not specified';
  const whenLbl = WINDOW_WHEN_LABELS[b.window?.when || ''] || b.window?.when || '';
  const timeLbl = WINDOW_TIME_LABELS[b.window?.time || ''] || b.window?.time || '';

  const lines: string[] = [];
  lines.push(`Service requested: ${svc}`);
  if (b.category) lines.push(`Category: ${b.category === 'hvac' ? 'Heating & Air Conditioning' : 'Basic Services'}`);
  if (whenLbl) lines.push(`Preferred day: ${whenLbl}`);
  if (timeLbl) lines.push(`Preferred time: ${timeLbl}`);

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

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.HCP_API_KEY) {
    return json({
      error: 'Booking is temporarily unavailable online. Please call (813) 395-2324 and we will get you on the schedule.',
    }, 503);
  }

  let data: BookingPayload;
  try {
    data = (await request.json()) as BookingPayload;
  } catch {
    return json({ error: 'Invalid booking data.' }, 400);
  }

  const vErr = validate(data);
  if (vErr) return json({ error: vErr }, 400);

  const { first_name, last_name } = splitName(data.name!);
  const mobile = normalizePhone(data.phone!);
  const note = buildNote(data);

  // Housecall Pro Create Lead payload.
  // HCP requires a nested `customer` object. The address lives inside the
  // customer as an `addresses` array (HCP's customer model allows multiple).
  // Lead-level fields: notes, lead_source.
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
    notes: note,
    lead_source: 'Website (icareaircare.com)',
  };

  // HCP public API — NO /v1 prefix. Confirmed by probing: /customers and /leads return 401 (valid route),
  // while /v1/customers and /v1/leads return 404. Docs/tutorials that cite /v1 are wrong.
  const base = env.HCP_API_BASE || 'https://api.housecallpro.com';

  try {
    const res = await fetch(`${base}/leads`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.HCP_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(hcpPayload),
    });

    const text = await res.text();
    let parsed: any = null;
    try { parsed = text ? JSON.parse(text) : null; } catch { /* leave null */ }

    if (!res.ok) {
      console.log('[HCP] lead creation failed', {
        status: res.status,
        bodySnippet: text.slice(0, 1200),
      });
      // Friendlier message per status
      let friendly = `We got your request but could not auto-schedule. Someone from our team will call you shortly at the number you provided. Or call (813) 395-2324 to confirm now.`;
      if (res.status === 401) {
        friendly = `Booking is temporarily unavailable (auth issue). Please call (813) 395-2324 and we will get you on the schedule.`;
      } else if (res.status === 422) {
        friendly = `We got most of your request but our schedule system flagged a field. Someone will call you shortly to finish booking. Or call (813) 395-2324 now.`;
      }
      return json({
        error: friendly,
        debug: {
          hcp_status: res.status,
          hcp_body: text.slice(0, 1400),
          endpoint: `${base}/leads`,
          payload_sent: hcpPayload,
        },
      }, 502);
    }

    return json({
      success: true,
      lead_id: parsed?.id || parsed?.lead?.id || null,
    });
  } catch (err: unknown) {
    console.log('[HCP] fetch error', err);
    return json({
      error: `We could not reach our scheduling system. Please call (813) 395-2324 or try again in a moment.`,
    }, 502);
  }
};

// Reject everything that is not POST so the endpoint does not leak anything.
export const onRequest: PagesFunction<Env> = async ({ request }) => {
  if (request.method === 'POST') {
    // onRequestPost handles this; this catch-all is only for non-POST.
    return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
  }
  return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
};
