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
  return {
    hcp_id: r.hcp_id as string,
    name:
      [r.first_name, r.last_name].filter(Boolean).join(' ').trim() ||
      (r.company as string) ||
      (r.hcp_id as string),
    email: (r.email as string) || null,
    phone: (r.mobile_number as string) || (r.home_number as string) || null,
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

// Customers whose last completed job is >= 365 days ago AND < 1095 days
// (HCP's 3-year cap on marketing sends). Sorted by lifetime value desc.
export async function dormant12mo(db: D1Database, limit = 100): Promise<SegmentRow[]> {
  const now = new Date();
  const oneYrAgo = new Date(now.getTime() - 365 * 86400_000).toISOString();
  const threeYrAgo = new Date(now.getTime() - 1095 * 86400_000).toISOString();
  const res = await db
    .prepare(
      `SELECT hcp_id, first_name, last_name, company, email, mobile_number, home_number, zip, city,
              is_member, member_plan, total_jobs, lifetime_value_cents, last_job_at
       FROM customers
       WHERE last_job_at IS NOT NULL
         AND last_job_at < ?
         AND last_job_at > ?
         AND email IS NOT NULL
       ORDER BY lifetime_value_cents DESC
       LIMIT ?`,
    )
    .bind(oneYrAgo, threeYrAgo, limit)
    .all<Record<string, unknown>>();
  return (res.results || []).map(rowToSegment);
}

// Members whose last service was 11-13 months ago (likely up for renewal).
// Without a real "renewal_due_at" field from HCP, we proxy on annual plans
// by service cadence — most plans renew on the anniversary of the last
// service window.
export async function membersRenewingSoon(db: D1Database, limit = 100): Promise<SegmentRow[]> {
  const now = new Date();
  const elevenMo = new Date(now.getTime() - 330 * 86400_000).toISOString();
  const thirteenMo = new Date(now.getTime() - 395 * 86400_000).toISOString();
  const res = await db
    .prepare(
      `SELECT hcp_id, first_name, last_name, company, email, mobile_number, home_number, zip, city,
              is_member, member_plan, total_jobs, lifetime_value_cents, last_job_at
       FROM customers
       WHERE is_member = 1
         AND last_job_at < ?
         AND last_job_at > ?
       ORDER BY lifetime_value_cents DESC
       LIMIT ?`,
    )
    .bind(elevenMo, thirteenMo, limit)
    .all<Record<string, unknown>>();
  return (res.results || []).map(rowToSegment);
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
