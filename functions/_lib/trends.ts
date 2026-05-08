// Time-series queries for sparklines + the trend page.
// Each returns N weekly buckets ending at the current week.

export interface WeeklyPoint {
  week_start: string;        // ISO date for Monday of that week
  jobs: number;
  closed_jobs: number;
  close_rate_pct: number;
  avg_ticket: number;
  revenue: number;
  callbacks: number;
  callback_rate_pct: number;
  new_customers: number;
}

function startOfWeekMonday(d: Date): Date {
  const day = d.getUTCDay();             // 0=Sun, 1=Mon
  const diff = (day + 6) % 7;            // Mon=0, Tue=1, ... Sun=6
  const r = new Date(d.getTime());
  r.setUTCDate(r.getUTCDate() - diff);
  r.setUTCHours(0, 0, 0, 0);
  return r;
}

export async function weeklyTrend(db: D1Database, weeks = 12): Promise<WeeklyPoint[]> {
  const now = new Date();
  const thisMonday = startOfWeekMonday(now);
  // Build the bucket boundaries
  const buckets: Array<{ start: string; end: string; idx: number }> = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(thisMonday.getTime() - i * 7 * 86400_000);
    const end = new Date(start.getTime() + 7 * 86400_000);
    buckets.push({ start: start.toISOString(), end: end.toISOString(), idx: weeks - 1 - i });
  }

  const minStart = buckets[0].start;
  const maxEnd = buckets[buckets.length - 1].end;

  // Pull all jobs in the window once, then aggregate client-side — saves SQL roundtrips.
  const res = await db
    .prepare(
      `SELECT completed_at, is_sold, is_callback, invoice_total_cents
       FROM jobs
       WHERE completed_at IS NOT NULL AND completed_at >= ? AND completed_at < ?`,
    )
    .bind(minStart, maxEnd)
    .all<{ completed_at: string; is_sold: number | null; is_callback: number; invoice_total_cents: number | null }>();

  const points: WeeklyPoint[] = buckets.map((b) => ({
    week_start: b.start.slice(0, 10),
    jobs: 0, closed_jobs: 0, close_rate_pct: 0, avg_ticket: 0,
    revenue: 0, callbacks: 0, callback_rate_pct: 0, new_customers: 0,
  }));

  const ticketSum: number[] = new Array(weeks).fill(0);
  const ticketCount: number[] = new Array(weeks).fill(0);

  for (const r of res.results || []) {
    const t = Date.parse(r.completed_at);
    const idx = buckets.findIndex((b) => t >= Date.parse(b.start) && t < Date.parse(b.end));
    if (idx < 0) continue;
    const p = points[idx];
    p.jobs++;
    if (r.is_sold === 1) p.closed_jobs++;
    if (r.is_callback === 1) p.callbacks++;
    if (r.invoice_total_cents !== null && r.invoice_total_cents !== undefined) {
      const c = r.invoice_total_cents;
      p.revenue += c / 100;
      ticketSum[idx] += c;
      ticketCount[idx]++;
    }
  }

  // Customers with first_job_at in each bucket
  const cRes = await db
    .prepare(
      `SELECT first_job_at FROM customers
       WHERE first_job_at IS NOT NULL AND first_job_at >= ? AND first_job_at < ?`,
    )
    .bind(minStart, maxEnd)
    .all<{ first_job_at: string }>();
  for (const c of cRes.results || []) {
    const t = Date.parse(c.first_job_at);
    const idx = buckets.findIndex((b) => t >= Date.parse(b.start) && t < Date.parse(b.end));
    if (idx >= 0) points[idx].new_customers++;
  }

  for (let i = 0; i < weeks; i++) {
    const p = points[i];
    p.close_rate_pct = p.jobs > 0 ? Math.round((p.closed_jobs / p.jobs) * 1000) / 10 : 0;
    p.callback_rate_pct = p.jobs > 0 ? Math.round((p.callbacks / p.jobs) * 1000) / 10 : 0;
    p.avg_ticket = ticketCount[i] > 0 ? Math.round((ticketSum[i] / ticketCount[i]) / 100 * 100) / 100 : 0;
    p.revenue = Math.round(p.revenue * 100) / 100;
  }

  return points;
}

// Per-tech weekly trend (revenue + close rate)
export async function weeklyTrendByTech(db: D1Database, techHcpId: string, weeks = 12): Promise<WeeklyPoint[]> {
  const now = new Date();
  const thisMonday = startOfWeekMonday(now);
  const buckets: Array<{ start: string; end: string }> = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(thisMonday.getTime() - i * 7 * 86400_000);
    const end = new Date(start.getTime() + 7 * 86400_000);
    buckets.push({ start: start.toISOString(), end: end.toISOString() });
  }
  const minStart = buckets[0].start;
  const maxEnd = buckets[buckets.length - 1].end;
  const res = await db
    .prepare(
      `SELECT completed_at, is_sold, is_callback, invoice_total_cents
       FROM jobs
       WHERE completed_at IS NOT NULL AND completed_at >= ? AND completed_at < ?
         AND primary_tech_hcp_id = ?`,
    )
    .bind(minStart, maxEnd, techHcpId)
    .all<{ completed_at: string; is_sold: number | null; is_callback: number; invoice_total_cents: number | null }>();

  const points: WeeklyPoint[] = buckets.map((b) => ({
    week_start: b.start.slice(0, 10),
    jobs: 0, closed_jobs: 0, close_rate_pct: 0, avg_ticket: 0,
    revenue: 0, callbacks: 0, callback_rate_pct: 0, new_customers: 0,
  }));
  const ticketSum: number[] = new Array(weeks).fill(0);
  const ticketCount: number[] = new Array(weeks).fill(0);

  for (const r of res.results || []) {
    const t = Date.parse(r.completed_at);
    const idx = buckets.findIndex((b) => t >= Date.parse(b.start) && t < Date.parse(b.end));
    if (idx < 0) continue;
    const p = points[idx];
    p.jobs++;
    if (r.is_sold === 1) p.closed_jobs++;
    if (r.is_callback === 1) p.callbacks++;
    if (r.invoice_total_cents !== null && r.invoice_total_cents !== undefined) {
      p.revenue += r.invoice_total_cents / 100;
      ticketSum[idx] += r.invoice_total_cents;
      ticketCount[idx]++;
    }
  }
  for (let i = 0; i < weeks; i++) {
    const p = points[i];
    p.close_rate_pct = p.jobs > 0 ? Math.round((p.closed_jobs / p.jobs) * 1000) / 10 : 0;
    p.callback_rate_pct = p.jobs > 0 ? Math.round((p.callbacks / p.jobs) * 1000) / 10 : 0;
    p.avg_ticket = ticketCount[i] > 0 ? Math.round((ticketSum[i] / ticketCount[i]) / 100 * 100) / 100 : 0;
    p.revenue = Math.round(p.revenue * 100) / 100;
  }
  return points;
}
