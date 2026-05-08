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

  // Pass 1: name match (reviewer name → HCP customer → most recent job → primary tech)
  const namePass = await attributeReviews(env.DB, { reattribute });
  // Pass 2: text scan — for reviews still unattributed, look for tech first
  // names mentioned in the review text. This catches "Kleber was wonderful"
  // even when the reviewer's name doesn't map to a customer.
  const textPass = await attributeReviewsByText(env.DB);

  return jsonResponse({
    pass_1_name_match: namePass,
    pass_2_text_match: textPass,
    total_attributed: namePass.attributed + textPass.newly_attributed,
  });
};

export const onRequestGet = handler;
export const onRequestPost = handler;
