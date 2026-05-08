// Sync Housecall Pro → D1.
//
// Default endpoint shape assumed (matches the working pattern in
// functions/api/book.ts which has shipped to production):
//   - Auth: `Authorization: Token ${HCP_API_KEY}`
//   - Base: https://api.housecallpro.com  (no /v1 prefix)
//
// If the smoke test (functions/api/admin/smoke.ts) reveals that resource
// endpoints (jobs/customers/employees/invoices) require /v1 instead of root,
// override per-endpoint via the ENDPOINT_PATHS map below.
//
// Pagination strategy: many HCP responses paginate via either `next_page_url`
// in the body or `page`/`page_size` query params. We try both. Page sizes
// default to 100 (HCP allows up to 500). We cap total pages per resource
// at MAX_PAGES to bound a single sync run.

import { hcpFetch, type HcpEnv } from './hcp';

export interface SyncEnv extends HcpEnv {
  DB: D1Database;
  KPI_CONFIG?: KVNamespace;
}

export interface SyncOptions {
  trigger: 'manual' | 'cron' | 'webhook';
  daysBack?: number;             // default 30
  endpoints?: Array<'employees' | 'customers' | 'jobs' | 'invoices'>;
  maxPagesPerEndpoint?: number;  // default 20 (= up to 2000 records / endpoint)
}

export interface SyncResult {
  run_id: number;
  trigger: string;
  started_at: string;
  finished_at: string;
  duration_ms: number;
  success: boolean;
  techs_synced: number;
  customers_synced: number;
  jobs_synced: number;
  invoices_synced: number;
  api_calls: number;
  errors: string[];
  notes: string[];
}

// Endpoint path map — change here if /v1 is needed for some/all of these.
// Smoke test will tell us which to use.
const ENDPOINT_PATHS = {
  employees: '/employees',
  customers: '/customers',
  jobs: '/jobs',
  invoices: '/invoices',
};

const PAGE_SIZE = 100;

// ─────────────────────────────────────────────────────────────────
// Paginate any HCP list endpoint. Tries `next_page_url` first, falls
// back to page/page_size query params.
// ─────────────────────────────────────────────────────────────────
async function* paginate<T = Record<string, unknown>>(
  env: HcpEnv,
  path: string,
  baseQuery: Record<string, string | number | undefined>,
  maxPages: number,
  apiCallCounter: { count: number },
): AsyncGenerator<{ items: T[]; pageNum: number }, void, void> {
  let page = 1;
  let nextUrl: string | null = null;

  while (page <= maxPages) {
    apiCallCounter.count++;
    const r = nextUrl
      ? await hcpFetch<unknown>(env, { path: new URL(nextUrl).pathname + new URL(nextUrl).search })
      : await hcpFetch<unknown>(env, {
          path,
          query: { ...baseQuery, page, page_size: PAGE_SIZE },
        });

    if (!r.ok) {
      throw new Error(`HCP ${path} page ${page} failed: ${r.status} ${r.error || ''}`);
    }

    const body = r.data as Record<string, unknown> | unknown[];
    let items: T[] = [];

    // HCP responses typically wrap arrays under a key matching the resource
    // (e.g. body.jobs, body.customers). Detect by trying common keys, then
    // fall back to top-level array.
    if (Array.isArray(body)) {
      items = body as T[];
    } else if (body && typeof body === 'object') {
      const keys = ['jobs', 'customers', 'employees', 'invoices', 'data', 'results', 'items'];
      for (const k of keys) {
        const v = (body as Record<string, unknown>)[k];
        if (Array.isArray(v)) {
          items = v as T[];
          break;
        }
      }
      // Capture next_page_url if present
      const npu =
        (body as Record<string, unknown>).next_page_url ||
        (body as Record<string, unknown>).next ||
        null;
      nextUrl = typeof npu === 'string' ? npu : null;
    }

    yield { items, pageNum: page };

    if (items.length === 0 || items.length < PAGE_SIZE) break;
    if (!nextUrl) page++;
  }
}

// ─────────────────────────────────────────────────────────────────
// Field extraction helpers — be defensive; HCP shapes can drift
// ─────────────────────────────────────────────────────────────────

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.length) return v;
    if (typeof v === 'number') return String(v);
  }
  return undefined;
}

function pickNum(obj: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v.length) {
      const n = Number(v);
      if (!isNaN(n)) return n;
    }
  }
  return undefined;
}

function dollarsToCents(n: number | undefined): number | undefined {
  if (n === undefined || n === null) return undefined;
  // HCP API typically returns money as decimal dollars (e.g. 175.50)
  // OR as cents (e.g. 17550). Heuristic: if absolute value < 100000 and
  // has fractional part → dollars; else cents.
  // Defensive default: assume dollars and convert to cents.
  return Math.round(n * 100);
}

function normalizeJobType(raw: string | undefined): string {
  if (!raw) return 'other';
  const t = raw.toLowerCase();
  if (/tune.?up|maintenance|seasonal|precision/i.test(t)) return 'tune_up';
  if (/diagnostic|service.?call|repair|trouble/i.test(t)) return 'diagnostic';
  if (/estimate|proposal|quote|sales.?call|comfort/i.test(t)) return 'estimate';
  if (/install|new.?system|replacement/i.test(t)) return 'install';
  if (/duct|iaq|air.?quality|uv/i.test(t)) return 'iaq';
  return 'other';
}

function extractPrimaryTech(job: Record<string, unknown>): { primary: string | undefined; all: string[] } {
  // HCP can express assigned employees as `assigned_employees` (array of objects),
  // `assigned_employees_ids` (array of strings), or single `employee_id`.
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
  if (Array.isArray(aei)) {
    for (const id of aei) if (typeof id === 'string') all.push(id);
  }
  const emp = pickStr(job, 'employee_id', 'primary_employee_id');
  if (emp && !all.includes(emp)) all.unshift(emp);
  return { primary: all[0], all: [...new Set(all)] };
}

// ─────────────────────────────────────────────────────────────────
// Per-resource sync functions
// ─────────────────────────────────────────────────────────────────

async function syncEmployees(env: SyncEnv, maxPages: number, apiCalls: { count: number }): Promise<number> {
  let count = 0;
  const synced_at = new Date().toISOString();
  const batch: D1PreparedStatement[] = [];

  for await (const { items } of paginate<Record<string, unknown>>(
    env,
    ENDPOINT_PATHS.employees,
    {},
    maxPages,
    apiCalls,
  )) {
    for (const e of items) {
      const id = pickStr(e, 'id', 'employee_id');
      if (!id) continue;
      const role = pickStr(e, 'role', 'job_title') || '';
      const isFieldTech =
        /tech|technician|installer|comfort/i.test(role) || !pickStr(e, 'role') ? 1 : 0;
      const isActive =
        e.deactivated_at || e.deleted_at || e.is_active === false ? 0 : 1;
      batch.push(
        env.DB.prepare(
          `INSERT INTO techs (hcp_id, first_name, last_name, role, is_field_tech, is_active, email, mobile_number, hired_at, _raw_json, synced_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(hcp_id) DO UPDATE SET
             first_name=excluded.first_name,
             last_name=excluded.last_name,
             role=excluded.role,
             is_field_tech=excluded.is_field_tech,
             is_active=excluded.is_active,
             email=excluded.email,
             mobile_number=excluded.mobile_number,
             _raw_json=excluded._raw_json,
             synced_at=excluded.synced_at`,
        ).bind(
          id,
          pickStr(e, 'first_name') || null,
          pickStr(e, 'last_name') || null,
          role || null,
          isFieldTech,
          isActive,
          pickStr(e, 'email') || null,
          pickStr(e, 'mobile_number', 'phone') || null,
          pickStr(e, 'hired_at', 'created_at') || null,
          JSON.stringify(e),
          synced_at,
        ),
      );
      count++;
    }
  }

  if (batch.length) await env.DB.batch(batch);
  return count;
}

async function syncCustomers(env: SyncEnv, maxPages: number, apiCalls: { count: number }): Promise<number> {
  let count = 0;
  const synced_at = new Date().toISOString();

  for await (const { items } of paginate<Record<string, unknown>>(
    env,
    ENDPOINT_PATHS.customers,
    {},
    maxPages,
    apiCalls,
  )) {
    const batch: D1PreparedStatement[] = [];
    for (const c of items) {
      const id = pickStr(c, 'id');
      if (!id) continue;
      const addresses = (c.addresses as Array<Record<string, unknown>>) || [];
      const primary = addresses[0] || {};
      const tags = (c.tags as unknown[]) || [];
      const isMember = tags.some(
        (t) =>
          typeof t === 'string' && /member|care.?plan|service.?plan|maintenance/i.test(t),
      ) ||
      (c.is_member === true) ||
      !!c.service_plan
        ? 1
        : 0;
      batch.push(
        env.DB.prepare(
          `INSERT INTO customers (hcp_id, first_name, last_name, company, email, mobile_number, home_number, zip, city, state, customer_type, is_member, member_plan, hcp_created_at, _raw_json, synced_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(hcp_id) DO UPDATE SET
             first_name=excluded.first_name,
             last_name=excluded.last_name,
             company=excluded.company,
             email=excluded.email,
             mobile_number=excluded.mobile_number,
             home_number=excluded.home_number,
             zip=excluded.zip,
             city=excluded.city,
             state=excluded.state,
             customer_type=excluded.customer_type,
             is_member=excluded.is_member,
             member_plan=excluded.member_plan,
             _raw_json=excluded._raw_json,
             synced_at=excluded.synced_at`,
        ).bind(
          id,
          pickStr(c, 'first_name') || null,
          pickStr(c, 'last_name') || null,
          pickStr(c, 'company') || null,
          pickStr(c, 'email') || null,
          pickStr(c, 'mobile_number', 'phone') || null,
          pickStr(c, 'home_number') || null,
          pickStr(primary as Record<string, unknown>, 'zip', 'postal_code') || null,
          pickStr(primary as Record<string, unknown>, 'city') || null,
          pickStr(primary as Record<string, unknown>, 'state') || null,
          pickStr(c, 'customer_type', 'type') || null,
          isMember,
          pickStr(c, 'service_plan_name', 'member_plan') || null,
          pickStr(c, 'created_at', 'hcp_created_at') || null,
          JSON.stringify(c),
          synced_at,
        ),
      );
      count++;
    }
    if (batch.length) await env.DB.batch(batch);
  }

  return count;
}

async function syncJobs(
  env: SyncEnv,
  daysBack: number,
  maxPages: number,
  apiCalls: { count: number },
  thresholds: KpiThresholds,
): Promise<number> {
  let count = 0;
  const synced_at = new Date().toISOString();
  const since = new Date(Date.now() - daysBack * 86400_000).toISOString();

  for await (const { items } of paginate<Record<string, unknown>>(
    env,
    ENDPOINT_PATHS.jobs,
    {
      // HCP supports a few date filters — try `scheduled_start_min` and
      // `updated_at_min`. Whichever HCP honors will narrow the sync.
      scheduled_start_min: since,
      updated_at_min: since,
    },
    maxPages,
    apiCalls,
  )) {
    const batch: D1PreparedStatement[] = [];
    for (const j of items) {
      const id = pickStr(j, 'id');
      if (!id) continue;
      const customerId =
        pickStr(j, 'customer_id') ||
        pickStr((j.customer as Record<string, unknown>) || {}, 'id');
      const { primary, all } = extractPrimaryTech(j);
      // HCP's job_type can live in several places — check job_fields, work_status, tags, business_unit, description.
      const rawType =
        pickStr(j, 'job_type', 'type', 'work_status') ||
        pickStr((j.job_fields as Record<string, unknown>) || {}, 'job_type') ||
        pickStr((j.business_unit as Record<string, unknown>) || {}, 'name') ||
        (Array.isArray(j.tags)
          ? (j.tags as unknown[]).find((t) => typeof t === 'string') as string
          : undefined) ||
        pickStr(j, 'description');
      const jobType = normalizeJobType(rawType);
      const status =
        pickStr(j, 'work_status', 'status') ||
        (j.completed_at ? 'completed' : 'scheduled');
      const isCallback =
        (j.callback === true) ||
        ((j.job_fields as Record<string, unknown>)?.callback === true) ||
        false;

      const invoiceTotal =
        pickNum(j, 'total_amount', 'invoice_total') ||
        pickNum((j.invoice as Record<string, unknown>) || {}, 'total', 'total_amount');
      const invoiceSubtotal =
        pickNum(j, 'subtotal', 'sales_total') ||
        pickNum((j.invoice as Record<string, unknown>) || {}, 'subtotal');
      const invoiceDiscount =
        pickNum(j, 'discount_total', 'discount') ||
        pickNum((j.invoice as Record<string, unknown>) || {}, 'discount_total', 'discount');
      const invoiceTax = pickNum(j, 'tax_total', 'tax') ||
        pickNum((j.invoice as Record<string, unknown>) || {}, 'tax_total', 'tax');
      const invoicePaid = pickNum(j, 'paid_amount') ||
        pickNum((j.invoice as Record<string, unknown>) || {}, 'paid_amount');

      const totalCents = dollarsToCents(invoiceTotal);
      const soldThresholdCents = (thresholds.sold[jobType] || thresholds.sold.default) * 100;
      const minTicketCents = (thresholds.minTicket[jobType] || thresholds.minTicket.default) * 100;
      const isSold = totalCents !== undefined ? (totalCents >= soldThresholdCents ? 1 : 0) : null;
      const meetsMin = totalCents !== undefined ? (totalCents >= minTicketCents ? 1 : 0) : null;

      batch.push(
        env.DB.prepare(
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
          id,
          customerId || null,
          primary || null,
          JSON.stringify(all),
          jobType,
          rawType || null,
          status,
          isCallback ? 1 : 0,
          pickStr(j, 'scheduled_start') || null,
          pickStr(j, 'scheduled_end') || null,
          pickStr(j, 'completed_at', 'work_finished_at') || null,
          totalCents ?? null,
          dollarsToCents(invoiceSubtotal) ?? null,
          dollarsToCents(invoiceDiscount) ?? null,
          dollarsToCents(invoiceTax) ?? null,
          dollarsToCents(invoicePaid) ?? null,
          isSold,
          meetsMin,
          pickStr(j, 'invoice_id') || pickStr((j.invoice as Record<string, unknown>) || {}, 'id') || null,
          JSON.stringify(j),
          synced_at,
        ),
      );
      count++;
    }
    if (batch.length) await env.DB.batch(batch);
  }

  return count;
}

// ─────────────────────────────────────────────────────────────────
// Thresholds — read from KV with fallback defaults
// ─────────────────────────────────────────────────────────────────

export interface KpiThresholds {
  sold: Record<string, number>;       // dollars; default key holds catch-all
  minTicket: Record<string, number>;
}

const DEFAULT_THRESHOLDS: KpiThresholds = {
  sold: { default: 110, tune_up: 110, diagnostic: 110, estimate: 110 },
  minTicket: { default: 175, tune_up: 175, diagnostic: 275, estimate: 175 },
};

async function readThresholds(env: SyncEnv): Promise<KpiThresholds> {
  if (!env.KPI_CONFIG) return DEFAULT_THRESHOLDS;
  try {
    const v = await env.KPI_CONFIG.get('thresholds', 'json');
    if (v && typeof v === 'object') {
      return { ...DEFAULT_THRESHOLDS, ...(v as Partial<KpiThresholds>) };
    }
  } catch {
    /* fall through */
  }
  return DEFAULT_THRESHOLDS;
}

// ─────────────────────────────────────────────────────────────────
// Top-level run() — used by /api/sync/run and the cron Worker
// ─────────────────────────────────────────────────────────────────

export async function runSync(env: SyncEnv, opts: SyncOptions): Promise<SyncResult> {
  const started_at = new Date().toISOString();
  const apiCalls = { count: 0 };
  const errors: string[] = [];
  const notes: string[] = [];

  const endpoints = opts.endpoints || ['employees', 'customers', 'jobs'];
  const maxPages = opts.maxPagesPerEndpoint || 20;
  const daysBack = opts.daysBack ?? 30;
  const thresholds = await readThresholds(env);

  // Insert run row up-front so we can correlate errors mid-run
  const runIns = await env.DB.prepare(
    `INSERT INTO sync_runs (trigger, started_at) VALUES (?, ?)`,
  )
    .bind(opts.trigger, started_at)
    .run();
  const run_id = (runIns.meta?.last_row_id as number) || 0;

  let techs_synced = 0;
  let customers_synced = 0;
  let jobs_synced = 0;
  let invoices_synced = 0;

  if (endpoints.includes('employees')) {
    try {
      techs_synced = await syncEmployees(env, maxPages, apiCalls);
      notes.push(`employees: ${techs_synced}`);
    } catch (e) {
      errors.push(`employees: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  if (endpoints.includes('customers')) {
    try {
      customers_synced = await syncCustomers(env, maxPages, apiCalls);
      notes.push(`customers: ${customers_synced}`);
    } catch (e) {
      errors.push(`customers: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  if (endpoints.includes('jobs')) {
    try {
      jobs_synced = await syncJobs(env, daysBack, maxPages, apiCalls, thresholds);
      notes.push(`jobs (last ${daysBack}d): ${jobs_synced}`);
    } catch (e) {
      errors.push(`jobs: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Derived: backfill customers.first_job_at / last_job_at / total_jobs / lifetime_value_cents
  try {
    await env.DB.exec(
      `UPDATE customers SET
        first_job_at = (SELECT MIN(completed_at) FROM jobs WHERE jobs.customer_hcp_id = customers.hcp_id AND completed_at IS NOT NULL),
        last_job_at  = (SELECT MAX(completed_at) FROM jobs WHERE jobs.customer_hcp_id = customers.hcp_id AND completed_at IS NOT NULL),
        total_jobs   = COALESCE((SELECT COUNT(*)       FROM jobs WHERE jobs.customer_hcp_id = customers.hcp_id), 0),
        lifetime_value_cents = COALESCE((SELECT SUM(invoice_total_cents) FROM jobs WHERE jobs.customer_hcp_id = customers.hcp_id), 0)`,
    );
    notes.push('customer rollups updated');
  } catch (e) {
    errors.push(`customer rollups: ${e instanceof Error ? e.message : String(e)}`);
  }

  const finished_at = new Date().toISOString();
  const success = errors.length === 0;
  const duration_ms = Date.parse(finished_at) - Date.parse(started_at);

  await env.DB.prepare(
    `UPDATE sync_runs SET finished_at = ?, success = ?, jobs_synced = ?, customers_synced = ?, techs_synced = ?, invoices_synced = ?, api_calls = ?, error_message = ?, notes = ? WHERE id = ?`,
  )
    .bind(
      finished_at,
      success ? 1 : 0,
      jobs_synced,
      customers_synced,
      techs_synced,
      invoices_synced,
      apiCalls.count,
      errors.length ? errors.join('\n').slice(0, 1000) : null,
      notes.join('; ').slice(0, 1000),
      run_id,
    )
    .run();

  return {
    run_id,
    trigger: opts.trigger,
    started_at,
    finished_at,
    duration_ms,
    success,
    techs_synced,
    customers_synced,
    jobs_synced,
    invoices_synced,
    api_calls: apiCalls.count,
    errors,
    notes,
  };
}
