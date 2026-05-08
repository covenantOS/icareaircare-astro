// Attribute Google reviews to HCP techs via name matching.
//
// Algorithm:
//   1. For each review with reviewer_name and no attribution yet:
//        - Normalize reviewer_name (lowercase, trim, strip punctuation).
//        - Find HCP customers whose normalized full name matches.
//   2. If 1 match → use that customer.
//      If multiple → prefer the customer whose most recent completed job
//        is closest (and earlier than) the review's posted_at.
//      If 0 → try first-name-only match (lower confidence).
//   3. Find the customer's most recent completed HCP job before the review
//      posted_at (within 60 days).
//   4. Attribute review to that job's primary_tech_hcp_id with the
//      method label ('name_match' | 'first_name_match').
//
// Targets ~90% accuracy on reviewers who use their HCP-on-file name.
// Misses (acceptable): nicknames, spouses, name variants Google shows
// differently than what's in HCP.

export interface AttributionResult {
  considered: number;
  attributed: number;
  no_name: number;
  no_match: number;
  no_recent_job: number;
  ambiguous_resolved: number;
  details: Array<{
    review_id: string;
    reviewer: string;
    matched_customer: string | null;
    method: string | null;
    tech: string | null;
    job: string | null;
    confidence: 'high' | 'medium' | 'low' | null;
  }>;
}

function normalize(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/[._,'"`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitName(s: string): { first: string; last: string; full: string } {
  const n = normalize(s);
  const parts = n.split(' ').filter(Boolean);
  if (parts.length === 0) return { first: '', last: '', full: '' };
  if (parts.length === 1) return { first: parts[0], last: '', full: parts[0] };
  return {
    first: parts[0],
    last: parts[parts.length - 1],
    full: n,
  };
}

export async function attributeReviews(db: D1Database, opts?: { reattribute?: boolean }): Promise<AttributionResult> {
  const reattribute = opts?.reattribute === true;
  const result: AttributionResult = {
    considered: 0, attributed: 0, no_name: 0, no_match: 0,
    no_recent_job: 0, ambiguous_resolved: 0, details: [],
  };

  // Load reviews to attribute
  const where = reattribute
    ? `reviewer_name IS NOT NULL`
    : `reviewer_name IS NOT NULL AND attributed_tech_hcp_id IS NULL`;
  const reviews = await db
    .prepare(`SELECT review_id, reviewer_name, posted_at FROM reviews WHERE ${where} ORDER BY posted_at DESC LIMIT 1000`)
    .all<{ review_id: string; reviewer_name: string; posted_at: string | null }>();

  // Pre-load all customers with names. ICAC has ~3,160 with first_name; a
  // single fetch is cheaper than per-review lookups.
  const customers = await db
    .prepare(`SELECT hcp_id, first_name, last_name FROM customers WHERE first_name IS NOT NULL OR last_name IS NOT NULL`)
    .all<{ hcp_id: string; first_name: string | null; last_name: string | null }>();
  const byFull = new Map<string, string[]>();
  const byFirst = new Map<string, string[]>();
  for (const c of customers.results || []) {
    const full = normalize(`${c.first_name || ''} ${c.last_name || ''}`);
    if (full) {
      const list = byFull.get(full) || [];
      list.push(c.hcp_id);
      byFull.set(full, list);
    }
    const first = normalize(c.first_name || '');
    if (first) {
      const list = byFirst.get(first) || [];
      list.push(c.hcp_id);
      byFirst.set(first, list);
    }
  }

  const writes: D1PreparedStatement[] = [];

  for (const r of reviews.results || []) {
    result.considered++;
    if (!r.reviewer_name) { result.no_name++; continue; }

    const name = splitName(r.reviewer_name);
    if (!name.full) { result.no_name++; continue; }

    let candidates = byFull.get(name.full) || [];
    let method: string = 'name_match';
    let confidence: 'high' | 'medium' | 'low' = 'high';

    if (candidates.length === 0 && name.first) {
      // Fallback: first-name-only. Lower confidence — many duplicates likely.
      candidates = byFirst.get(name.first) || [];
      method = 'first_name_match';
      confidence = 'low';
    }

    if (candidates.length === 0) {
      result.no_match++;
      result.details.push({ review_id: r.review_id, reviewer: r.reviewer_name, matched_customer: null, method: null, tech: null, job: null, confidence: null });
      continue;
    }

    // For each candidate, find their most-recent completed job before the
    // review's posted_at (or any most-recent job if posted_at unknown).
    const reviewIso = r.posted_at || new Date().toISOString();
    const reviewMs = Date.parse(reviewIso);
    let bestCustomer: string | null = null;
    let bestJob: string | null = null;
    let bestTech: string | null = null;
    let bestDeltaMs = Infinity;

    for (const cid of candidates) {
      const job = await db
        .prepare(
          `SELECT hcp_id, primary_tech_hcp_id, completed_at, scheduled_start
           FROM jobs
           WHERE customer_hcp_id = ?
             AND primary_tech_hcp_id IS NOT NULL
             AND ((completed_at IS NOT NULL AND completed_at <= ?) OR (scheduled_start IS NOT NULL AND scheduled_start <= ?))
           ORDER BY COALESCE(completed_at, scheduled_start) DESC
           LIMIT 1`,
        )
        .bind(cid, reviewIso, reviewIso)
        .first<{ hcp_id: string; primary_tech_hcp_id: string; completed_at: string | null; scheduled_start: string | null }>();
      if (!job) continue;
      const jobAt = Date.parse((job.completed_at || job.scheduled_start) as string);
      if (isNaN(jobAt)) continue;
      const delta = Math.abs(reviewMs - jobAt);
      // Skip if the job is more than 90 days before the review — too far for
      // confident attribution.
      if (delta > 90 * 86400_000) continue;
      if (delta < bestDeltaMs) {
        bestDeltaMs = delta;
        bestCustomer = cid;
        bestJob = job.hcp_id;
        bestTech = job.primary_tech_hcp_id;
      }
    }

    if (!bestTech) {
      result.no_recent_job++;
      result.details.push({ review_id: r.review_id, reviewer: r.reviewer_name, matched_customer: null, method: null, tech: null, job: null, confidence: null });
      continue;
    }

    // If we narrowed multiple candidates to one via job-date proximity, that's
    // medium confidence even if the name match was high.
    if (candidates.length > 1 && method === 'name_match') {
      result.ambiguous_resolved++;
      confidence = 'medium';
    }

    writes.push(
      db.prepare(
        `UPDATE reviews
         SET attributed_tech_hcp_id = ?, attribution_method = ?
         WHERE review_id = ?`,
      ).bind(bestTech, `${method}:${confidence}`, r.review_id),
    );
    result.attributed++;
    result.details.push({
      review_id: r.review_id,
      reviewer: r.reviewer_name,
      matched_customer: bestCustomer,
      method,
      tech: bestTech,
      job: bestJob,
      confidence,
    });
  }

  if (writes.length) await db.batch(writes);
  return result;
}

// SECOND-PASS attribution: many reviewers don't have an exact HCP customer
// name match, but they NAME the tech in the review text ("Kleber was wonderful",
// "Tim came out today and..."). Scan unattributed reviews for tech first names.
// This often catches what name-matching missed.
//
// Confidence: high if ONE tech's first name appears, medium if MULTIPLE techs
// match (we pick the longest/most-specific name).
export interface TextAttributionResult {
  considered: number;
  newly_attributed: number;
  ambiguous: number;
  details: Array<{ review_id: string; tech: string; first_name: string }>;
}

export async function attributeReviewsByText(db: D1Database): Promise<TextAttributionResult> {
  const result: TextAttributionResult = { considered: 0, newly_attributed: 0, ambiguous: 0, details: [] };

  // Load techs with first names (active field techs preferred but include all
  // since older reviews may name retired techs)
  const techs = await db
    .prepare(`SELECT hcp_id, first_name FROM techs WHERE first_name IS NOT NULL AND length(first_name) >= 3`)
    .all<{ hcp_id: string; first_name: string }>();
  const techList = (techs.results || []).map((t) => ({
    hcp_id: t.hcp_id,
    first_name: t.first_name,
    re: new RegExp(`\\b${t.first_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'),
  }));
  if (!techList.length) return result;

  // Walk all unattributed reviews with text
  const reviews = await db
    .prepare(
      `SELECT review_id, text FROM reviews
       WHERE attributed_tech_hcp_id IS NULL AND text IS NOT NULL AND length(text) > 10`,
    )
    .all<{ review_id: string; text: string }>();

  const writes: D1PreparedStatement[] = [];
  for (const r of reviews.results || []) {
    result.considered++;
    const matches = techList.filter((t) => t.re.test(r.text));
    if (matches.length === 0) continue;
    // Pick the most specific match (longest first name) to disambiguate
    // common-name overlaps. If still ambiguous, pick first.
    matches.sort((a, b) => b.first_name.length - a.first_name.length);
    const best = matches[0];
    const ambiguous = matches.length > 1;
    if (ambiguous) result.ambiguous++;
    writes.push(
      db.prepare(
        `UPDATE reviews SET attributed_tech_hcp_id = ?, attribution_method = ? WHERE review_id = ?`,
      ).bind(best.hcp_id, ambiguous ? 'text_match:medium' : 'text_match:high', r.review_id),
    );
    result.newly_attributed++;
    result.details.push({ review_id: r.review_id, tech: best.hcp_id, first_name: best.first_name });
  }
  if (writes.length) await db.batch(writes);
  return result;
}
