// Customer segments — actionable lists for re-engagement and renewal campaigns.
// Each returns up to N customers sorted by lifetime value descending.

export interface SegmentRow {
  hcp_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  zip: string | null;
  city: string | null;
  is_member: number;
  member_plan: string | null;
  total_jobs: number;
  lifetime_value: number;
  last_job_at: string | null;
  days_since_last_job: number | null;
}

function rowToSegment(r: Record<string, unknown>): SegmentRow {
  const last = (r.last_job_at as string) || null;
  const days = last ? Math.floor((Date.now() - Date.parse(last)) / 86400_000) : null;
  // Display name fallback chain: First+Last → Company → email-username →
  // phone digits → trimmed hcp_id. Some HCP customer records are leads
  // where the name was never captured; we should still show something
  // human-readable.
  const fnln = [r.first_name, r.last_name].filter(Boolean).join(' ').trim();
  const email = (r.email as string) || '';
  const phone = (r.mobile_number as string) || (r.home_number as string) || '';
  const emailUser = email.includes('@') ? email.split('@')[0] : '';
  const fallbackId = String(r.hcp_id || '').replace(/^cus_/, '').slice(0, 8);
  const name = fnln || (r.company as string) || emailUser || phone || fallbackId;
  return {
    hcp_id: r.hcp_id as string,
    name,
    email: email || null,
    phone: phone || null,
    zip: (r.zip as string) || null,
    city: (r.city as string) || null,
    is_member: (r.is_member as number) || 0,
    member_plan: (r.member_plan as string) || null,
    total_jobs: (r.total_jobs as number) || 0,
    lifetime_value: Math.round(((r.lifetime_value_cents as number) || 0) / 100 * 100) / 100,
    last_job_at: last,
    days_since_last_job: days,
  };
}

// Customers Tim hasn't seen in 1+ year (still inside HCP's 3-yr marketing cap).
// Definition: customer has been known to HCP for >365 days AND has no
// completed-OR-scheduled job in our DB within the last year. Requires
// email or phone so the list is actionable. Sorted by lifetime value.
export async function dormant12mo(db: D1Database, limit = 100): Promise<SegmentRow[]> {
  const now = new Date();
  const oneYrAgo = new Date(now.getTime() - 365 * 86400_000).toISOString();
  const threeYrAgo = new Date(now.getTime() - 1095 * 86400_000).toISOString();
  const res = await db
    .prepare(
      `SELECT hcp_id, first_name, last_name, company, email, mobile_number, home_number, zip, city,
              is_member, member_plan, total_jobs, lifetime_value_cents, last_job_at, hcp_created_at
       FROM customers
       WHERE (email IS NOT NULL OR mobile_number IS NOT NULL)
         AND hcp_created_at IS NOT NULL
         AND hcp_created_at < ?
         AND hcp_created_at > ?
         AND NOT EXISTS (
           SELECT 1 FROM jobs j
           WHERE j.customer_hcp_id = customers.hcp_id
             AND (
               (j.completed_at IS NOT NULL AND j.completed_at >= ?)
               OR (j.scheduled_start IS NOT NULL AND j.scheduled_start >= ?)
             )
         )
       ORDER BY
         CASE WHEN lifetime_value_cents > 0 THEN 0 ELSE 1 END,
         lifetime_value_cents DESC,
         total_jobs DESC,
         hcp_created_at DESC
       LIMIT ?`,
    )
    .bind(oneYrAgo, threeYrAgo, oneYrAgo, oneYrAgo, limit)
    .all<Record<string, unknown>>();
  return (res.results || []).map(rowToSegment);
}

// Members whose last service was 11-13 months ago (likely up for renewal).
// Falls back to "any member without a service in the last 60 days" if the
// 11-13 month window has no hits — covers shallow sync windows.
export async function membersRenewingSoon(db: D1Database, limit = 100): Promise<SegmentRow[]> {
  const now = new Date();
  const elevenMo = new Date(now.getTime() - 330 * 86400_000).toISOString();
  const thirteenMo = new Date(now.getTime() - 395 * 86400_000).toISOString();
  const sixtyD = new Date(now.getTime() - 60 * 86400_000).toISOString();
  const primary = await db
    .prepare(
      `SELECT hcp_id, first_name, last_name, company, email, mobile_number, home_number, zip, city,
              is_member, member_plan, total_jobs, lifetime_value_cents, last_job_at
       FROM customers
       WHERE is_member = 1
         AND last_job_at IS NOT NULL
         AND last_job_at < ?
         AND last_job_at > ?
       ORDER BY lifetime_value_cents DESC
       LIMIT ?`,
    )
    .bind(elevenMo, thirteenMo, limit)
    .all<Record<string, unknown>>();
  if ((primary.results || []).length > 0) {
    return (primary.results || []).map(rowToSegment);
  }
  // Fallback: members not seen in 60+ days (any older). Useful while the
  // sync window is still building out historical data.
  const fallback = await db
    .prepare(
      `SELECT hcp_id, first_name, last_name, company, email, mobile_number, home_number, zip, city,
              is_member, member_plan, total_jobs, lifetime_value_cents, last_job_at
       FROM customers
       WHERE is_member = 1
         AND (last_job_at IS NULL OR last_job_at < ?)
       ORDER BY lifetime_value_cents DESC
       LIMIT ?`,
    )
    .bind(sixtyD, limit)
    .all<Record<string, unknown>>();
  return (fallback.results || []).map(rowToSegment);
}

// Top-N customers by lifetime value — VIP list.
export async function topByLtv(db: D1Database, limit = 50): Promise<SegmentRow[]> {
  const res = await db
    .prepare(
      `SELECT hcp_id, first_name, last_name, company, email, mobile_number, home_number, zip, city,
              is_member, member_plan, total_jobs, lifetime_value_cents, last_job_at
       FROM customers
       WHERE lifetime_value_cents > 0
       ORDER BY lifetime_value_cents DESC
       LIMIT ?`,
    )
    .bind(limit)
    .all<Record<string, unknown>>();
  return (res.results || []).map(rowToSegment);
}

// New customers — first job in last 30 days.
export async function newCustomers(db: D1Database, days = 30, limit = 100): Promise<SegmentRow[]> {
  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const res = await db
    .prepare(
      `SELECT hcp_id, first_name, last_name, company, email, mobile_number, home_number, zip, city,
              is_member, member_plan, total_jobs, lifetime_value_cents, last_job_at
       FROM customers
       WHERE first_job_at IS NOT NULL AND first_job_at >= ?
       ORDER BY first_job_at DESC
       LIMIT ?`,
    )
    .bind(since, limit)
    .all<Record<string, unknown>>();
  return (res.results || []).map(rowToSegment);
}
