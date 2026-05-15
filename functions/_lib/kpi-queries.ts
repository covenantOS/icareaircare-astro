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
  role_band: 'service' | 'install' | 'helper' | 'office' | 'owner' | 'other';  // Tim-configurable role band
  is_owner: boolean;          // true if role looks like owner/admin
  jobs: number;
  shared_jobs: number;        // jobs where this tech was NOT primary (multi-tech credit)
  tune_ups: number;
  diagnostics: number;
  estimates: number;
  closed_jobs: number;
  close_rate_pct: number;
  avg_ticket: number;
  revenue: number;             // existing equal-split revenue across assigned techs
  sales_rev: number;           // role-aware: revenue from jobs you sold (Option A from Tim feedback 2026-05-14)
  install_rev: number;         // role-aware: revenue from jobs you physically performed
  callbacks: number;
  callback_rate_pct: number;
  reviews_generated: number;       // Google reviews attributed to this tech in window
  review_rate_pct: number;          // reviews_generated / jobs * 100
  // From the Time Tracking CSV upload (Tim's Path A). NULL/0 until Tim
  // drags a CSV in. Once present, rev_per_hour becomes the headline
  // "is this tech making money for the company" metric.
  hours_total: number;
  hours_on_job: number;
  rev_per_hour: number;             // revenue / hours_total (0 if hours_total is 0)
}

// Role-band classifier — uses KV-configurable per-tech overrides first
// (Tim's labels), then falls back to HCP role string heuristics.
export type RoleBand = 'service' | 'install' | 'helper' | 'office' | 'owner' | 'other';
export function classifyRole(roleString: string | null, techHcpId: string, overrides: Record<string, RoleBand> | null): RoleBand {
  if (overrides && overrides[techHcpId]) return overrides[techHcpId];
  const r = (roleString || '').toLowerCase();
  if (!r) return 'other';
  if (/owner|admin/.test(r)) return 'owner';
  if (/csr|dispatch|office|sales/.test(r)) return 'office';
  if (/helper|apprentice/.test(r)) return 'helper';
  if (/install/.test(r)) return 'install';
  if (/tech|service/.test(r)) return 'service';
  return 'other';
}

// (Legacy regex — kept for reference; replaced by classifyRole + KV role overrides.)
// const NON_FIELD_ROLE_RE = /owner|admin|office|csr|dispatch|sales/i;

export async function computeByTech(
  db: D1Database,
  window: DateWindow,
  roleOverrides?: Record<string, RoleBand>,
): Promise<TechRow[]> {
  const { from, to } = window;
  // Multi-tech credit (2026-05-11): each tech in `all_tech_hcp_ids` gets
  // a "you worked on this" credit. Revenue is split equally among assigned
  // techs (so shop totals stay correct — no double-counting). Jobs/types/
  // closes/callbacks count once per assigned tech. Avg ticket = revenue
  // share / job count (each tech's "average dollar per job you touched").
  //
  // Fallback: if all_tech_hcp_ids is NULL or "[]", we credit primary_tech.
  // That keeps older single-tech data working without re-sync.
  //
  // Tim flagged on 2026-05-09: Erick had 11 jobs on the dashboard but
  // worked on 13 (2 were multi-tech). Kleber's installs were attributed
  // to the installer (Cesar/Daniel) so he saw zero — same root cause.
  // This fixes the "jobs you worked on" count; "sales credit" still
  // needs a separate sold_by mechanism (pending tag convention).
  const res = await db
    .prepare(
      `WITH tech_jobs AS (
         SELECT
           j.hcp_id AS job_id,
           j.completed_at, j.job_type, j.is_sold, j.is_callback,
           j.invoice_total_cents,
           j.primary_tech_hcp_id,
           COALESCE(je.value, j.primary_tech_hcp_id) AS tech_id,
           CASE
             WHEN json_valid(j.all_tech_hcp_ids) AND json_array_length(j.all_tech_hcp_ids) > 0
               THEN 1.0 / json_array_length(j.all_tech_hcp_ids)
             ELSE 1.0
           END AS share
         FROM jobs j
         LEFT JOIN json_each(CASE WHEN json_valid(j.all_tech_hcp_ids) THEN j.all_tech_hcp_ids ELSE '[]' END) je
         WHERE j.completed_at >= ? AND j.completed_at <= ?
       )
       SELECT
         tj.tech_id AS tech_id,
         COALESCE(t.first_name || ' ' || t.last_name, tj.tech_id, 'Unassigned') AS tech_name,
         t.role AS role,
         COUNT(*) AS jobs,
         SUM(CASE WHEN tj.job_type = 'tune_up' THEN 1 ELSE 0 END) AS tune_ups,
         SUM(CASE WHEN tj.job_type = 'diagnostic' THEN 1 ELSE 0 END) AS diagnostics,
         SUM(CASE WHEN tj.job_type = 'estimate' THEN 1 ELSE 0 END) AS estimates,
         SUM(CASE WHEN tj.is_sold = 1 THEN 1 ELSE 0 END) AS closed_jobs,
         AVG(tj.invoice_total_cents * tj.share) AS avg_cents,
         COALESCE(SUM(tj.invoice_total_cents * tj.share), 0) AS revenue_cents,
         SUM(CASE WHEN tj.is_callback = 1 THEN 1 ELSE 0 END) AS callbacks,
         SUM(CASE WHEN tj.tech_id != tj.primary_tech_hcp_id THEN 1 ELSE 0 END) AS shared_jobs
       FROM tech_jobs tj
       LEFT JOIN techs t ON t.hcp_id = tj.tech_id
       WHERE tj.tech_id IS NOT NULL
       GROUP BY tj.tech_id
       ORDER BY revenue_cents DESC`,
    )
    .bind(from, to)
    .all<{
      tech_id: string; tech_name: string; role: string | null; jobs: number;
      tune_ups: number; diagnostics: number; estimates: number;
      closed_jobs: number; avg_cents: number;
      revenue_cents: number; callbacks: number; shared_jobs: number;
    }>();

  // Per-tech review counts (Google reviews attributed via name match, posted in window)
  const reviewRes = await db
    .prepare(
      `SELECT attributed_tech_hcp_id AS tech_id, COUNT(*) AS n
       FROM reviews
       WHERE attributed_tech_hcp_id IS NOT NULL
         AND posted_at IS NOT NULL
         AND posted_at >= ? AND posted_at <= ?
       GROUP BY attributed_tech_hcp_id`,
    )
    .bind(from, to)
    .all<{ tech_id: string; n: number }>();
  const reviewsByTech = new Map<string, number>();
  for (const r of reviewRes.results || []) reviewsByTech.set(r.tech_id, r.n);

  // Hours from the most recent CSV upload, summed across the window.
  // Falls back to zeros if Tim hasn't uploaded anything yet (which is
  // the case until path A is set up). Uses YYYY-MM-DD comparison against
  // the window's local-date range — fine for hours data which is daily.
  const fromDate = (from || '').slice(0, 10);
  const toDate   = (to   || '').slice(0, 10);
  let hoursByTech = new Map<string, { total: number; onJob: number }>();
  try {
    const hRes = await db
      .prepare(
        `SELECT tech_hcp_id, COALESCE(SUM(total_hours), 0) AS total, COALESCE(SUM(on_job_hours), 0) AS on_job
         FROM tech_hours
         WHERE tech_hcp_id IS NOT NULL AND work_date >= ? AND work_date <= ?
         GROUP BY tech_hcp_id`,
      )
      .bind(fromDate, toDate)
      .all<{ tech_hcp_id: string; total: number; on_job: number }>();
    for (const r of hRes.results || []) {
      hoursByTech.set(r.tech_hcp_id, { total: r.total || 0, onJob: r.on_job || 0 });
    }
  } catch {
    // tech_hours table may not exist yet on fresh deploys — silently skip.
    hoursByTech = new Map();
  }

  // ─── SALES vs INSTALL revenue split (per Tim's Option A, 2026-05-14) ───
  // For install jobs: if both a service-band tech AND an install-band tech
  // are assigned, the service-band tech gets sales_rev, the install-band
  // tech gets install_rev. For all other job types: whichever tech(s) are
  // assigned get BOTH sales_rev and install_rev for their share (they
  // sold AND did the work).
  //
  // Sum across techs: total sales_rev = total install_rev = shop revenue.
  // No double-counting; just two cuts of the same dollar.
  const techMetaRes = await db
    .prepare(`SELECT hcp_id, role FROM techs`)
    .all<{ hcp_id: string; role: string | null }>();
  const techBand = new Map<string, RoleBand>();
  for (const t of techMetaRes.results || []) {
    techBand.set(t.hcp_id, classifyRole(t.role, t.hcp_id, roleOverrides || null));
  }
  // Pull job-level rows for the window. We'll loop once and accumulate.
  const jobsRes = await db
    .prepare(
      `SELECT hcp_id AS job_id, job_type, primary_tech_hcp_id, all_tech_hcp_ids, invoice_total_cents
       FROM jobs
       WHERE completed_at >= ? AND completed_at <= ?`,
    )
    .bind(from, to)
    .all<{
      job_id: string; job_type: string | null;
      primary_tech_hcp_id: string | null; all_tech_hcp_ids: string | null;
      invoice_total_cents: number | null;
    }>();

  const salesCents = new Map<string, number>();
  const installCents = new Map<string, number>();
  const SALES_BANDS = new Set<RoleBand>(['service', 'owner']);
  const INSTALL_BANDS = new Set<RoleBand>(['install', 'helper']);

  for (const j of jobsRes.results || []) {
    const total = j.invoice_total_cents || 0;
    if (!total) continue;
    let assigned: string[] = [];
    try {
      const parsed = j.all_tech_hcp_ids ? JSON.parse(j.all_tech_hcp_ids) : [];
      if (Array.isArray(parsed)) assigned = parsed.filter((x): x is string => typeof x === 'string');
    } catch { /* leave empty */ }
    if (assigned.length === 0 && j.primary_tech_hcp_id) assigned = [j.primary_tech_hcp_id];
    if (assigned.length === 0) continue;

    const jobType = j.job_type || 'other';

    if (jobType === 'install') {
      const installers = assigned.filter(id => INSTALL_BANDS.has(techBand.get(id) || 'other'));
      const sellers    = assigned.filter(id => SALES_BANDS.has(techBand.get(id) || 'other'));

      if (installers.length && sellers.length) {
        // Pure Option A: split full revenue per role.
        for (const id of installers) {
          installCents.set(id, (installCents.get(id) || 0) + total / installers.length);
        }
        for (const id of sellers) {
          salesCents.set(id, (salesCents.get(id) || 0) + total / sellers.length);
        }
      } else {
        // No role separation on this install — credit everyone for both.
        for (const id of assigned) {
          installCents.set(id, (installCents.get(id) || 0) + total / assigned.length);
          salesCents.set(id, (salesCents.get(id) || 0) + total / assigned.length);
        }
      }
    } else if (jobType === 'estimate') {
      // Estimates are pure sales activity — no install work yet.
      for (const id of assigned) {
        salesCents.set(id, (salesCents.get(id) || 0) + total / assigned.length);
      }
    } else {
      // Tune-ups, diagnostics, IAQ, etc. — tech did both (sale + work).
      for (const id of assigned) {
        salesCents.set(id, (salesCents.get(id) || 0) + total / assigned.length);
        installCents.set(id, (installCents.get(id) || 0) + total / assigned.length);
      }
    }
  }

  return (res.results || []).map((r) => {
    const role = (r.role || '').trim() || null;
    const reviewsGen = reviewsByTech.get(r.tech_id) || 0;
    const band = classifyRole(role, r.tech_id, roleOverrides || null);
    return {
      tech_id: r.tech_id || 'unassigned',
      tech_name: r.tech_name || 'Unassigned',
      role,
      role_band: band,
      is_owner: band === 'owner' || band === 'office',
      jobs: r.jobs || 0,
      shared_jobs: r.shared_jobs || 0,
      tune_ups: r.tune_ups || 0,
      diagnostics: r.diagnostics || 0,
      estimates: r.estimates || 0,
      closed_jobs: r.closed_jobs || 0,
      close_rate_pct: r.jobs > 0 ? round((r.closed_jobs / r.jobs) * 100, 1) : 0,
      avg_ticket: round((r.avg_cents || 0) / 100, 2),
      revenue: round((r.revenue_cents || 0) / 100, 2),
      sales_rev: round((salesCents.get(r.tech_id) || 0) / 100, 2),
      install_rev: round((installCents.get(r.tech_id) || 0) / 100, 2),
      callbacks: r.callbacks || 0,
      callback_rate_pct: r.jobs > 0 ? round((r.callbacks / r.jobs) * 100, 2) : 0,
      reviews_generated: reviewsGen,
      review_rate_pct: r.jobs > 0 ? round((reviewsGen / r.jobs) * 100, 1) : 0,
      hours_total: round(hoursByTech.get(r.tech_id)?.total || 0, 2),
      hours_on_job: round(hoursByTech.get(r.tech_id)?.onJob || 0, 2),
      rev_per_hour: ((hoursByTech.get(r.tech_id)?.total || 0) > 0)
        ? round(((r.revenue_cents || 0) / 100) / (hoursByTech.get(r.tech_id)!.total), 2)
        : 0,
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
