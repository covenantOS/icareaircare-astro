// POST /api/reviews/attribute?key=<ADMIN_SECRET>[&reattribute=1]
//
// Walk the reviews table and attribute each review to an HCP tech via
// reviewer-name → customer-name → most-recent-job → primary_tech matching.
//
// Default: only attributes reviews that don't have an attribution yet.
// ?reattribute=1 re-runs against ALL reviews (e.g. after we improved the
// matcher or after a fresh customer sync).

import { authOrError, jsonResponse, type AuthEnv } from '../../_lib/auth';
import { attributeReviews, attributeReviewsByText } from '../../_lib/review-attribution';

interface Env extends AuthEnv {
  DB: D1Database;
}

const handler: PagesFunction<Env> = async ({ request, env }) => {
  const auth = authOrError(request, env);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);
  if (!env.DB) return jsonResponse({ error: 'D1 not configured' }, 503);

  const url = new URL(request.url);
  const reattribute = url.searchParams.get('reattribute') === '1';

  // Pass 1 — NAME match (reviewer name → HCP customer → most recent job → tech).
  // Useful when the review text doesn't name the tech.
  const namePass = await attributeReviews(env.DB, { reattribute });

  // Pass 2 — TEXT match. Now allowed to OVERRIDE pass-1 attributions when
  // pass 1 was low-confidence (first_name_match) and the review text clearly
  // names a different tech. Catches cases like:
  //   - Customer X had a recent job with tech A, but the review says "Kleber
  //     came out and was great" — should attribute to Kleber, not A.
  //   - Reviewer is named in review text mentioning a specific tech — text wins.
  const textPass = await attributeReviewsByText(env.DB, { override: true });

  // Recount attributed reviews after both passes
  const totalRow = await env.DB
    .prepare(`SELECT COUNT(*) AS n FROM reviews WHERE attributed_tech_hcp_id IS NOT NULL`)
    .first<{ n: number }>();

  return jsonResponse({
    pass_1_name_match: namePass,
    pass_2_text_match: textPass,
    total_attributed_after_both_passes: totalRow?.n || 0,
  });
};

export const onRequestGet = handler;
export const onRequestPost = handler;
