// POST /api/webhooks/hcp — receive Housecall Pro webhook events.
//
// Phase 6. HCP fires webhooks on resource changes (job.created, job.updated,
// job.completed, customer.created, customer.updated, employee.created/updated,
// invoice.created/updated/paid, etc.). We:
//   1. Authenticate the request (shared-secret URL param OR optional HMAC).
//   2. Persist the raw payload into webhook_events for audit / replay.
//   3. Re-fetch the affected resource from HCP (the payload often contains
//      only the ID + event type — pulling the full record keeps our D1
//      copy in sync with whatever fields HCP has set).
//   4. Upsert into D1 using the same shape as the periodic sync.
//   5. Return 202 quickly so HCP doesn't time out and replay.
//
// Setup at HCP: subscribe the production URL with `?key=<WEBHOOK_SECRET>`
// appended OR pass an `X-Webhook-Secret` header. Optional HMAC validation
// is wired in if `HCP_WEBHOOK_SECRET` is set as a hex secret and HCP signs
// with `X-Hcp-Signature: sha256=<hex>`. (HCP's signing scheme as of mid-2026
// is documented on their developer portal; this implementation matches the
// SHA-256 HMAC pattern.)

import { jsonResponse } from '../../_lib/auth';
import { hcpFetch, type HcpEnv } from '../../_lib/hcp';

interface Env extends HcpEnv {
  DB: D1Database;
  KPI_CONFIG?: KVNamespace;
  HCP_WEBHOOK_SECRET?: string;       // Shared-secret value (also accepted as URL ?key= or X-Webhook-Secret)
  HCP_WEBHOOK_HMAC_KEY?: string;     // Optional: hex HMAC key if HCP signs payloads with X-Hcp-Signature
}

interface HcpEvent {
  id?: string;
  event?: string;        // e.g. "job.completed", "customer.updated"
  type?: string;         // alt naming
  timestamp?: string;
  data?: { id?: string; type?: string } & Record<string, unknown>;
  resource_id?: string;  // alt shape some HCP webhooks use
  [key: string]: unknown;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const received_at = new Date().toISOString();

  // 1. Auth — shared secret. Skip noisy 401 logs by checking key/header before parsing body.
  const authResult = await checkAuth(request, env);
  if (!authResult.ok) {
    return jsonResponse({ error: authResult.error }, authResult.status);
  }

  // 2. Parse + persist
  const rawText = await request.text();
  let event: HcpEvent = {};
  try { event = rawText ? (JSON.parse(rawText) as HcpEvent) : {}; }
  catch {
    // Still log it so we can see what HCP sent
    await safeInsert(env.DB, received_at, 'unknown.parse_error', null, rawText, 'JSON parse failed');
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const eventType = String(event.event || event.type || 'unknown');
  const resourceId =
    (event.data && typeof event.data === 'object' && (event.data as Record<string, unknown>).id) as string | undefined ||
    (event.resource_id as string | undefined) ||
    (event.id as string | undefined) ||
    null;

  // Insert into webhook_events for audit. Keep payload trimmed to 64 KB so
  // a malicious sender can't fill our D1.
  const insertedId = await safeInsert(env.DB, received_at, eventType, resourceId, rawText.slice(0, 65536), null);

  // 3. Best-effort: re-fetch + upsert the resource. Don't block on this —
  // if HCP times out our subrequest we still ack the webhook.
  let processed_ok = false;
  let process_error: string | null = null;
  try {
    if (resourceId && env.HCP_API_KEY) {
      await applyEvent(env, eventType, resourceId, event);
      processed_ok = true;
    } else if (!env.HCP_API_KEY) {
      process_error = 'HCP_API_KEY not configured — event logged but resource not refreshed';
    } else {
      process_error = 'no resource id in payload';
    }
  } catch (e) {
    process_error = e instanceof Error ? e.message : String(e);
  }

  // 4. Mark the event row processed (or with error)
  if (insertedId) {
    try {
      await env.DB.prepare(
        `UPDATE webhook_events SET processed = ?, processed_at = ?, error = ? WHERE id = ?`,
      ).bind(processed_ok ? 1 : 0, new Date().toISOString(), process_error, insertedId).run();
    } catch { /* observability only — don't fail the ack */ }
  }

  return jsonResponse({
    ok: true,
    event_id: insertedId,
    event_type: eventType,
    resource_id: resourceId,
    processed: processed_ok,
    error: process_error,
  }, processed_ok ? 200 : 202);
};

// Some HCP webhook flows include a verification handshake on the GET. Reply 200.
export const onRequestGet: PagesFunction<Env> = async ({ request }) => {
  const url = new URL(request.url);
  const challenge = url.searchParams.get('challenge') || url.searchParams.get('hub.challenge');
  if (challenge) return new Response(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  return jsonResponse({ ok: true, message: 'HCP webhook receiver ready. POST events here.' });
};

// ─── Auth helpers ───────────────────────────────────────────────────
async function checkAuth(
  request: Request,
  env: Env,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  if (!env.HCP_WEBHOOK_SECRET && !env.HCP_WEBHOOK_HMAC_KEY) {
    return { ok: false, status: 503, error: 'Webhook secret not configured. Set HCP_WEBHOOK_SECRET (shared) or HCP_WEBHOOK_HMAC_KEY (HMAC).' };
  }
  // 1. Shared secret (?key= or header)
  if (env.HCP_WEBHOOK_SECRET) {
    const url = new URL(request.url);
    const provided =
      url.searchParams.get('key') ||
      request.headers.get('x-webhook-secret') ||
      request.headers.get('x-hcp-secret') ||
      '';
    if (provided && provided === env.HCP_WEBHOOK_SECRET) return { ok: true };
  }
  // 2. HMAC signature (clone the body to verify without consuming it)
  if (env.HCP_WEBHOOK_HMAC_KEY) {
    const sigHeader = request.headers.get('x-hcp-signature') || request.headers.get('x-signature') || '';
    if (sigHeader) {
      const cloned = request.clone();
      const body = await cloned.text();
      const ok = await verifyHmac(env.HCP_WEBHOOK_HMAC_KEY, body, sigHeader);
      if (ok) return { ok: true };
    }
  }
  return { ok: false, status: 401, error: 'Webhook auth failed' };
}

async function verifyHmac(hexKey: string, body: string, sigHeader: string): Promise<boolean> {
  try {
    const expected = sigHeader.replace(/^sha256=/i, '').toLowerCase();
    const keyBytes = hexToBytes(hexKey);
    const cryptoKey = await crypto.subtle.importKey('raw', keyBytes as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(body));
    const got = bytesToHex(new Uint8Array(sig));
    // constant-time compare
    if (got.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ expected.charCodeAt(i);
    return diff === 0;
  } catch { return false; }
}
function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/[^0-9a-f]/gi, '');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16);
  return out;
}
function bytesToHex(b: Uint8Array): string {
  let s = '';
  for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, '0');
  return s;
}

// ─── DB helpers ─────────────────────────────────────────────────────
async function safeInsert(
  db: D1Database, received_at: string, eventType: string, resourceId: string | null,
  payloadJson: string, errorNote: string | null,
): Promise<number | null> {
  try {
    const r = await db.prepare(
      `INSERT INTO webhook_events (received_at, event_type, hcp_id, payload_json, processed, error) VALUES (?, ?, ?, ?, 0, ?)`,
    ).bind(received_at, eventType, resourceId, payloadJson, errorNote).run();
    return (r.meta?.last_row_id as number) || null;
  } catch (e) {
    console.error('webhook insert failed', e);
    return null;
  }
}

// ─── Event application ──────────────────────────────────────────────
// Re-fetch from HCP and upsert. Keeps the same field shape as functions/_lib/sync.ts
// so dashboard queries stay consistent.
async function applyEvent(env: Env, eventType: string, resourceId: string, _raw: HcpEvent): Promise<void> {
  const t = eventType.toLowerCase();
  // Resource is encoded in the prefix: 'job.', 'customer.', 'employee.', 'invoice.'
  if (t.startsWith('job.')) {
    return upsertJobFromHcp(env, resourceId);
  }
  if (t.startsWith('customer.')) {
    return upsertCustomerFromHcp(env, resourceId);
  }
  if (t.startsWith('employee.')) {
    return upsertTechFromHcp(env, resourceId);
  }
  if (t.startsWith('invoice.')) {
    // We don't store invoices separately yet (jobs.invoice_*_cents inline).
    // If the invoice is paid, find the job and re-fetch it so totals refresh.
    const inv = await hcpFetch<Record<string, unknown>>(env, { path: `/invoices/${encodeURIComponent(resourceId)}` });
    if (!inv.ok || !inv.data) return;
    const jobId = (inv.data.job_id as string) || (((inv.data.job as Record<string, unknown> | undefined) || {}).id as string | undefined);
    if (jobId) return upsertJobFromHcp(env, jobId);
    return;
  }
  // Unknown — already logged, nothing else to do
}

async function upsertJobFromHcp(env: Env, jobId: string): Promise<void> {
  const r = await hcpFetch<Record<string, unknown>>(env, { path: `/jobs/${encodeURIComponent(jobId)}` });
  if (!r.ok || !r.data) throw new Error(`HCP /jobs/${jobId}: ${r.status} ${r.error || ''}`);
  const j = r.data;
  const synced_at = new Date().toISOString();

  // Mirror sync.ts logic — kept inline here to avoid coupling. Job-type
  // detection prioritizes tags, then description, then structured fields.
  const schedule = (j.schedule as Record<string, unknown>) || {};
  const workTs = (j.work_timestamps as Record<string, unknown>) || {};
  const customerId = strField(j, 'customer_id') || strField((j.customer as Record<string, unknown>) || {}, 'id');
  const tech = extractPrimaryTech(j);

  const tags = (j.tags as unknown[]) || [];
  const tagStr = tags.filter((x): x is string => typeof x === 'string').join(',');
  const desc = strField(j, 'description') || '';
  const jobType = normalizeJobType(tagStr) !== 'other'
    ? normalizeJobType(tagStr)
    : (normalizeJobType(desc) !== 'other'
      ? normalizeJobType(desc)
      : normalizeJobType(strField(j, 'job_type', 'type') || ''));

  const status = strField(j, 'work_status', 'status') || 'unknown';
  const isCallback = (tags.some(t => typeof t === 'string' && /callback|warranty|recall/i.test(t)) || j.callback === true) ? 1 : 0;
  const totalCents  = numField(j, 'total_amount', 'invoice_total');
  const subCents    = numField(j, 'subtotal', 'sales_total');
  const discCents   = numField(j, 'discount_total', 'discount');
  const taxCents    = numField(j, 'tax_total', 'tax');
  const outCents    = numField(j, 'outstanding_balance');
  const paidCents   = totalCents != null && outCents != null ? Math.max(0, totalCents - outCents) : numField(j, 'paid_amount');

  // Threshold lookup — use defaults if KV not loaded; webhook hot path
  // keeps it simple (sync.ts re-applies thresholds in batch periodically).
  const thresholds = await readThresholds(env);
  const soldCents = (thresholds.sold[jobType] || thresholds.sold.default || 110) * 100;
  const minCents  = (thresholds.minTicket[jobType] || thresholds.minTicket.default || 175) * 100;
  const isSold = totalCents != null ? (totalCents >= soldCents ? 1 : 0) : null;
  const meetsMin = totalCents != null ? (totalCents >= minCents ? 1 : 0) : null;

  const scheduledStart = strField(schedule, 'scheduled_start') || strField(j, 'scheduled_start');
  const scheduledEnd   = strField(schedule, 'scheduled_end') || strField(j, 'scheduled_end');
  const completedAt    = strField(workTs, 'completed_at') || strField(j, 'completed_at', 'work_finished_at');

  await env.DB.prepare(
    `INSERT INTO jobs (hcp_id, customer_hcp_id, primary_tech_hcp_id, all_tech_hcp_ids, job_type, job_type_raw, status, is_callback,
                       scheduled_start, scheduled_end, completed_at,
                       invoice_total_cents, invoice_subtotal_cents, invoice_discount_cents, invoice_tax_cents, invoice_paid_cents,
                       is_sold, meets_min_ticket, invoice_hcp_id, _raw_json, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(hcp_id) DO UPDATE SET
       customer_hcp_id=excluded.customer_hcp_id,
       primary_tech_hcp_id=excluded.primary_tech_hcp_id,
       all_tech_hcp_ids=excluded.all_tech_hcp_ids,
       job_type=excluded.job_type,
       job_type_raw=excluded.job_type_raw,
       status=excluded.status,
       is_callback=excluded.is_callback,
       scheduled_start=excluded.scheduled_start,
       scheduled_end=excluded.scheduled_end,
       completed_at=excluded.completed_at,
       invoice_total_cents=excluded.invoice_total_cents,
       invoice_subtotal_cents=excluded.invoice_subtotal_cents,
       invoice_discount_cents=excluded.invoice_discount_cents,
       invoice_tax_cents=excluded.invoice_tax_cents,
       invoice_paid_cents=excluded.invoice_paid_cents,
       is_sold=excluded.is_sold,
       meets_min_ticket=excluded.meets_min_ticket,
       invoice_hcp_id=excluded.invoice_hcp_id,
       _raw_json=excluded._raw_json,
       synced_at=excluded.synced_at`,
  ).bind(
    jobId, customerId || null, tech.primary || null, JSON.stringify(tech.all),
    jobType || 'other', `tag:${tagStr}|desc:${desc}`.slice(0, 200), status, isCallback,
    scheduledStart || null, scheduledEnd || null, completedAt || null,
    totalCents ?? null, subCents ?? null, discCents ?? null, taxCents ?? null, paidCents ?? null,
    isSold, meetsMin,
    strField(j, 'invoice_id') || strField((j.invoice as Record<string, unknown>) || {}, 'id') || null,
    JSON.stringify(j), synced_at,
  ).run();
}

async function upsertCustomerFromHcp(env: Env, customerId: string): Promise<void> {
  const r = await hcpFetch<Record<string, unknown>>(env, { path: `/customers/${encodeURIComponent(customerId)}` });
  if (!r.ok || !r.data) throw new Error(`HCP /customers/${customerId}: ${r.status} ${r.error || ''}`);
  const c = r.data;
  const synced_at = new Date().toISOString();
  const addresses = (c.addresses as Array<Record<string, unknown>>) || [];
  const primary = addresses[0] || {};
  const tags = (c.tags as unknown[]) || [];
  const isMember = tags.some(t => typeof t === 'string' && /member|care.?plan|service.?plan|maintenance/i.test(t)) || c.is_member === true || !!c.service_plan ? 1 : 0;
  await env.DB.prepare(
    `INSERT INTO customers (hcp_id, first_name, last_name, company, email, mobile_number, home_number, zip, city, state, customer_type, is_member, member_plan, hcp_created_at, _raw_json, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(hcp_id) DO UPDATE SET
       first_name=excluded.first_name, last_name=excluded.last_name, company=excluded.company,
       email=excluded.email, mobile_number=excluded.mobile_number, home_number=excluded.home_number,
       zip=excluded.zip, city=excluded.city, state=excluded.state,
       customer_type=excluded.customer_type, is_member=excluded.is_member, member_plan=excluded.member_plan,
       _raw_json=excluded._raw_json, synced_at=excluded.synced_at`,
  ).bind(
    customerId,
    strField(c, 'first_name') || null,
    strField(c, 'last_name') || null,
    strField(c, 'company') || null,
    strField(c, 'email') || null,
    strField(c, 'mobile_number', 'phone') || null,
    strField(c, 'home_number') || null,
    strField(primary, 'zip', 'postal_code') || null,
    strField(primary, 'city') || null,
    strField(primary, 'state') || null,
    strField(c, 'customer_type', 'type') || null,
    isMember,
    strField(c, 'service_plan_name', 'member_plan') || null,
    strField(c, 'created_at', 'hcp_created_at') || null,
    JSON.stringify(c),
    synced_at,
  ).run();
}

async function upsertTechFromHcp(env: Env, employeeId: string): Promise<void> {
  const r = await hcpFetch<Record<string, unknown>>(env, { path: `/employees/${encodeURIComponent(employeeId)}` });
  if (!r.ok || !r.data) throw new Error(`HCP /employees/${employeeId}: ${r.status} ${r.error || ''}`);
  const e = r.data;
  const synced_at = new Date().toISOString();
  const role = strField(e, 'role', 'job_title') || '';
  const isFieldTech = /tech|technician|installer|comfort/i.test(role) || !strField(e, 'role') ? 1 : 0;
  const isActive = e.deactivated_at || e.deleted_at || e.is_active === false ? 0 : 1;
  await env.DB.prepare(
    `INSERT INTO techs (hcp_id, first_name, last_name, role, is_field_tech, is_active, email, mobile_number, hired_at, _raw_json, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(hcp_id) DO UPDATE SET
       first_name=excluded.first_name, last_name=excluded.last_name, role=excluded.role,
       is_field_tech=excluded.is_field_tech, is_active=excluded.is_active, email=excluded.email,
       mobile_number=excluded.mobile_number, _raw_json=excluded._raw_json, synced_at=excluded.synced_at`,
  ).bind(
    employeeId,
    strField(e, 'first_name') || null,
    strField(e, 'last_name') || null,
    role || null,
    isFieldTech, isActive,
    strField(e, 'email') || null,
    strField(e, 'mobile_number', 'phone') || null,
    strField(e, 'hired_at', 'created_at') || null,
    JSON.stringify(e), synced_at,
  ).run();
}

// ─── Tiny utilities (kept inline so this endpoint has zero coupling to sync.ts) ───
function strField(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.length) return v;
    if (typeof v === 'number') return String(v);
  }
  return undefined;
}
function numField(obj: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'number') return Math.round(v);
    if (typeof v === 'string' && v.length) {
      const n = Number(v);
      if (!isNaN(n)) return Math.round(n);
    }
  }
  return undefined;
}
function normalizeJobType(raw: string): string {
  // Keep in sync with functions/_lib/sync.ts normalizeJobType.
  if (!raw) return 'other';
  const t = raw.toLowerCase();
  if (/tune.?up|maintenance|seasonal|precision|pm visit|ac inspection|maint\b/.test(t)) return 'tune_up';
  if (/install|new.?system|replacement|change.?out|changeout|coil.?pull|condenser.?(swap|change)|system.?swap|equipment/.test(t)) return 'install';
  if (/estimate|proposal|quote|sales.?call|comfort.?advisor|est-rep|consult/.test(t)) return 'estimate';
  if (/diagnostic|service.?call|\brepair\b|trouble|no.?cool|warm.?air|leak|callback|call.?back|warranty|recall|follow.?up|followup|revisit|visit #|compressor|capacitor|contactor|motor|blower|condenser|evaporator|refrigerant|freon|breaker|fan/.test(t)) return 'diagnostic';
  if (/duct|iaq|air.?quality|uv\b|filter|thermostat|insulation|dryer.?vent|purifier|dehumidifier|air.?scrubber|reme/.test(t)) return 'iaq';
  if (/permit|inspection|part.?(pick|pickup|up)|pick.?up|office|warehouse|drop.?off|supply|will.?call|return/.test(t)) return 'admin';
  return 'other';
}
function extractPrimaryTech(job: Record<string, unknown>): { primary: string | undefined; all: string[] } {
  const all: string[] = [];
  const ae = job.assigned_employees;
  if (Array.isArray(ae)) {
    for (const e of ae) {
      if (typeof e === 'string') all.push(e);
      else if (e && typeof e === 'object') {
        const id = (e as Record<string, unknown>).id;
        if (typeof id === 'string') all.push(id);
      }
    }
  }
  const aei = job.assigned_employee_ids;
  if (Array.isArray(aei)) for (const id of aei) if (typeof id === 'string') all.push(id);
  const emp = strField(job, 'employee_id', 'primary_employee_id');
  if (emp && !all.includes(emp)) all.unshift(emp);
  return { primary: all[0], all: [...new Set(all)] };
}

interface Thresholds { sold: Record<string, number>; minTicket: Record<string, number>; }
async function readThresholds(env: Env): Promise<Thresholds> {
  const def: Thresholds = {
    sold: { default: 110, tune_up: 110, diagnostic: 110, estimate: 110 },
    minTicket: { default: 175, tune_up: 175, diagnostic: 275, estimate: 175 },
  };
  if (!env.KPI_CONFIG) return def;
  try {
    const v = await env.KPI_CONFIG.get('thresholds', 'json');
    if (v && typeof v === 'object') return { ...def, ...(v as Partial<Thresholds>) };
  } catch { /* fall through */ }
  return def;
}
