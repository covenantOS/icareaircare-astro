// Reusable D1 queries that compute KPIs from the synced jobs/customers/techs
// tables. All queries take a date window (ISO timestamps) so they can be
// driven by URL params (?from=2026-04-01&to=2026-05-08).
//
// Money is returned as DOLLARS (number) to keep the dashboard payload simple,
// converted from cents at query time.

export interface DateWindow {
  from: string; // ISO
  to: string;   // ISO
}

export interface KpiSummary {
  window: DateWindow;
  call_volume: {
    tune_up: number;
    diagnostic: number;
    estimate: number;
    install: number;
    other: number;
    total: number;
  };
  close_rate: {
    overall_pct: number;
    by_type: Record<string, { closed: number; total: number; pct: number }>;
  };
  average_ticket: {
    overall: number;
    by_type: Record<string, number>;
  };
  revenue: {
    total: number;
    by_type: Record<string, number>;
    by_tech: Array<{ tech_id: string; tech_name: string; revenue: number; jobs: number }>;
  };
  customer_type: {
    new_customers: number;
    existing_customers: number;
    member_customers: number;
  };
  callbacks: {
    total: number;
    rate_pct: number;
    by_tech: Array<{ tech_id: string; tech_name: string; callbacks: number; total_jobs: number; rate_pct: number }>;
  };
  totals: {
    completed_jobs: number;
    sold_jobs: number;
    invoiced_total: number;
  };
}

export async function computeSummary(db: D1Database, window: DateWindow): Promise<KpiSummary> {
  const { from, to } = window;

  // Call volume by job type
  const cvRes = await db
    .prepare(
      `SELECT job_type, COUNT(*) AS n
       FROM jobs
       WHERE completed_at >= ? AND completed_at <= ?
       GROUP BY job_type`,
    )
    .bind(from, to)
    .all<{ job_type: string; n: number }>();
  const callVolume = { tune_up: 0, diagnostic: 0, estimate: 0, install: 0, other: 0, total: 0 };
  for (const row of cvRes.results || []) {
    const k = (row.job_type || 'other') as keyof typeof callVolume;
    if (k in callVolume) (callVolume as Record<string, number>)[k] = row.n;
    else callVolume.other += row.n;
    callVolume.total += row.n;
  }

  // Close rate by type and overall
  const closeRes = await db
    .prepare(
      `SELECT job_type,
              SUM(CASE WHEN is_sold = 1 THEN 1 ELSE 0 END) AS closed,
              COUNT(*) AS total
       FROM jobs
       WHERE completed_at >= ? AND completed_at <= ?
       GROUP BY job_type`,
    )
    .bind(from, to)
    .all<{ job_type: string; closed: number; total: number }>();
  const byTypeClose: Record<string, { closed: number; total: number; pct: number }> = {};
  let allClosed = 0;
  let allTotal = 0;
  for (const r of closeRes.results || []) {
    const pct = r.total > 0 ? (r.closed / r.total) * 100 : 0;
    byTypeClose[r.job_type || 'other'] = { closed: r.closed, total: r.total, pct: round(pct, 1) };
    allClosed += r.closed;
    allTotal += r.total;
  }
  const overallPct = allTotal > 0 ? (allClosed / allTotal) * 100 : 0;

  // Average ticket by type and overall
  const tktRes = await db
    .prepare(
      `SELECT job_type,
              AVG(invoice_total_cents) AS avg_cents,
              COUNT(invoice_total_cents) AS n
       FROM jobs
       WHERE completed_at >= ? AND completed_at <= ? AND invoice_total_cents IS NOT NULL
       GROUP BY job_type`,
    )
    .bind(from, to)
    .all<{ job_type: string; avg_cents: number; n: number }>();
  const byTypeTicket: Record<string, number> = {};
  let totalTicketCents = 0;
  let totalTicketRows = 0;
  for (const r of tktRes.results || []) {
    byTypeTicket[r.job_type || 'other'] = round((r.avg_cents || 0) / 100, 2);
    totalTicketCents += (r.avg_cents || 0) * r.n;
    totalTicketRows += r.n;
  }
  const overallTicket = totalTicketRows > 0 ? totalTicketCents / totalTicketRows / 100 : 0;

  // Revenue by type and by tech
  const revTypeRes = await db
    .prepare(
      `SELECT job_type, COALESCE(SUM(invoice_total_cents), 0) AS total_cents
       FROM jobs
       WHERE completed_at >= ? AND completed_at <= ?
       GROUP BY job_type`,
    )
    .bind(from, to)
    .all<{ job_type: string; total_cents: number }>();
  const byTypeRev: Record<string, number> = {};
  let totalRev = 0;
  for (const r of revTypeRes.results || []) {
    byTypeRev[r.job_type || 'other'] = round((r.total_cents || 0) / 100, 2);
    totalRev += r.total_cents || 0;
  }

  const revTechRes = await db
    .prepare(
      `SELECT
         j.primary_tech_hcp_id AS tech_id,
         COALESCE(t.first_name || ' ' || t.last_name, j.primary_tech_hcp_id, 'Unassigned') AS tech_name,
         COALESCE(SUM(j.invoice_total_cents), 0) AS total_cents,
         COUNT(*) AS jobs
       FROM jobs j
       LEFT JOIN techs t ON t.hcp_id = j.primary_tech_hcp_id
       WHERE j.completed_at >= ? AND j.completed_at <= ?
       GROUP BY j.primary_tech_hcp_id
       ORDER BY total_cents DESC`,
    )
    .bind(from, to)
    .all<{ tech_id: string; tech_name: string; total_cents: number; jobs: number }>();

  // Customer type breakdown — based on jobs in window
  const ctRes = await db
    .prepare(
      `SELECT
         SUM(CASE WHEN c.first_job_at >= ? AND c.first_job_at <= ? THEN 1 ELSE 0 END) AS new_customers,
         SUM(CASE WHEN c.first_job_at < ? THEN 1 ELSE 0 END) AS existing_customers,
         SUM(CASE WHEN c.is_member = 1 THEN 1 ELSE 0 END) AS member_customers
       FROM customers c
       WHERE EXISTS (
         SELECT 1 FROM jobs j WHERE j.customer_hcp_id = c.hcp_id AND j.completed_at >= ? AND j.completed_at <= ?
       )`,
    )
    .bind(from, to, from, from, to)
    .first<{ new_customers: number; existing_customers: number; member_customers: number }>();

  // Callbacks
  const cbAll = await db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN is_callback = 1 THEN 1 ELSE 0 END), 0) AS callbacks,
         COUNT(*) AS total
       FROM jobs
       WHERE completed_at >= ? AND completed_at <= ?`,
    )
    .bind(from, to)
    .first<{ callbacks: number; total: number }>();
  const cbByTech = await db
    .prepare(
      `SELECT
         j.primary_tech_hcp_id AS tech_id,
         COALESCE(t.first_name || ' ' || t.last_name, j.primary_tech_hcp_id, 'Unassigned') AS tech_name,
         COALESCE(SUM(CASE WHEN j.is_callback = 1 THEN 1 ELSE 0 END), 0) AS callbacks,
         COUNT(*) AS total_jobs
       FROM jobs j
       LEFT JOIN techs t ON t.hcp_id = j.primary_tech_hcp_id
       WHERE j.completed_at >= ? AND j.completed_at <= ?
       GROUP BY j.primary_tech_hcp_id
       HAVING COUNT(*) > 0
       ORDER BY callbacks DESC`,
    )
    .bind(from, to)
    .all<{ tech_id: string; tech_name: string; callbacks: number; total_jobs: number }>();

  // Totals
  const totalsRes = await db
    .prepare(
      `SELECT
         COUNT(*) AS completed_jobs,
         SUM(CASE WHEN is_sold = 1 THEN 1 ELSE 0 END) AS sold_jobs,
         COALESCE(SUM(invoice_total_cents), 0) AS invoiced_cents
       FROM jobs
       WHERE completed_at >= ? AND completed_at <= ?`,
    )
    .bind(from, to)
    .first<{ completed_jobs: number; sold_jobs: number; invoiced_cents: number }>();

  return {
    window,
    call_volume: callVolume,
    close_rate: { overall_pct: round(overallPct, 1), by_type: byTypeClose },
    average_ticket: { overall: round(overallTicket, 2), by_type: byTypeTicket },
    revenue: {
      total: round(totalRev / 100, 2),
      by_type: byTypeRev,
      by_tech: (revTechRes.results || []).map((r) => ({
        tech_id: r.tech_id || 'unassigned',
        tech_name: r.tech_name || 'Unassigned',
        revenue: round((r.total_cents || 0) / 100, 2),
        jobs: r.jobs || 0,
      })),
    },
    customer_type: {
      new_customers: ctRes?.new_customers || 0,
      existing_customers: ctRes?.existing_customers || 0,
      member_customers: ctRes?.member_customers || 0,
    },
    callbacks: {
      total: cbAll?.callbacks || 0,
      rate_pct: cbAll && cbAll.total > 0 ? round((cbAll.callbacks / cbAll.total) * 100, 2) : 0,
      by_tech: (cbByTech.results || []).map((r) => ({
        tech_id: r.tech_id || 'unassigned',
        tech_name: r.tech_name || 'Unassigned',
        callbacks: r.callbacks || 0,
        total_jobs: r.total_jobs || 0,
        rate_pct: r.total_jobs > 0 ? round((r.callbacks / r.total_jobs) * 100, 2) : 0,
      })),
    },
    totals: {
      completed_jobs: totalsRes?.completed_jobs || 0,
      sold_jobs: totalsRes?.sold_jobs || 0,
      invoiced_total: round((totalsRes?.invoiced_cents || 0) / 100, 2),
    },
  };
}

// By-tech detail: per-tech KPIs across the window. Used for the leaderboard.
export interface TechRow {
  tech_id: string;
  tech_name: string;
  role: string | null;        // HCP role string — used to flag owner/CSR
  is_owner: boolean;          // true if role looks like owner/admin
  jobs: number;
  tune_ups: number;
  diagnostics: number;
  estimates: number;
  closed_jobs: number;
  close_rate_pct: number;
  avg_ticket: number;
  revenue: number;
  callbacks: number;
  callback_rate_pct: number;
}

// Roles we consider "non-field" — owner/admin/office staff. These show up
// as assigned to jobs in HCP because the office staff books them, but they
// don't deserve to be ranked alongside actual field techs.
const NON_FIELD_ROLE_RE = /owner|admin|office|csr|dispatch|sales/i;

export async function computeByTech(db: D1Database, window: DateWindow): Promise<TechRow[]> {
  const { from, to } = window;
  const res = await db
    .prepare(
      `SELECT
         j.primary_tech_hcp_id AS tech_id,
         COALESCE(t.first_name || ' ' || t.last_name, j.primary_tech_hcp_id, 'Unassigned') AS tech_name,
         t.role AS role,
         COUNT(*) AS jobs,
         SUM(CASE WHEN j.job_type = 'tune_up' THEN 1 ELSE 0 END) AS tune_ups,
         SUM(CASE WHEN j.job_type = 'diagnostic' THEN 1 ELSE 0 END) AS diagnostics,
         SUM(CASE WHEN j.job_type = 'estimate' THEN 1 ELSE 0 END) AS estimates,
         SUM(CASE WHEN j.is_sold = 1 THEN 1 ELSE 0 END) AS closed_jobs,
         AVG(j.invoice_total_cents) AS avg_cents,
         COALESCE(SUM(j.invoice_total_cents), 0) AS revenue_cents,
         SUM(CASE WHEN j.is_callback = 1 THEN 1 ELSE 0 END) AS callbacks
       FROM jobs j
       LEFT JOIN techs t ON t.hcp_id = j.primary_tech_hcp_id
       WHERE j.completed_at >= ? AND j.completed_at <= ?
       GROUP BY j.primary_tech_hcp_id
       ORDER BY revenue_cents DESC`,
    )
    .bind(from, to)
    .all<{
      tech_id: string; tech_name: string; role: string | null; jobs: number;
      tune_ups: number; diagnostics: number; estimates: number;
      closed_jobs: number; avg_cents: number;
      revenue_cents: number; callbacks: number;
    }>();
  return (res.results || []).map((r) => {
    const role = (r.role || '').trim() || null;
    return {
      tech_id: r.tech_id || 'unassigned',
      tech_name: r.tech_name || 'Unassigned',
      role,
      is_owner: role ? NON_FIELD_ROLE_RE.test(role) : false,
      jobs: r.jobs || 0,
      tune_ups: r.tune_ups || 0,
      diagnostics: r.diagnostics || 0,
      estimates: r.estimates || 0,
      closed_jobs: r.closed_jobs || 0,
      close_rate_pct: r.jobs > 0 ? round((r.closed_jobs / r.jobs) * 100, 1) : 0,
      avg_ticket: round((r.avg_cents || 0) / 100, 2),
      revenue: round((r.revenue_cents || 0) / 100, 2),
      callbacks: r.callbacks || 0,
      callback_rate_pct: r.jobs > 0 ? round((r.callbacks / r.jobs) * 100, 2) : 0,
    };
  });
}

export async function getLastSync(db: D1Database) {
  return await db
    .prepare(
      `SELECT id, trigger, started_at, finished_at, success, jobs_synced, customers_synced, techs_synced, api_calls, error_message, notes
       FROM sync_runs
       ORDER BY id DESC
       LIMIT 1`,
    )
    .first();
}

function round(n: number, decimals = 0): number {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}
