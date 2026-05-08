// DataForSEO REST API client for Google Reviews.
//
// Endpoint:  POST https://api.dataforseo.com/v3/business_data/google/reviews/live/advanced
// Auth:      HTTP Basic with login:password (Will's account: will@servicelinepro.com)
// Cost:      ~$0.001 per 100 reviews fetched
//
// We hit it nightly via cron + on-demand from the dashboard. Results stored
// in D1 (reviews table) so the dashboard reads from D1, not from DataForSEO
// every load.

export interface DataForSEOEnv {
  DATAFORSEO_LOGIN: string;
  DATAFORSEO_PASSWORD: string;
}

export interface ReviewRow {
  review_id: string;
  reviewer_name: string | null;
  rating: number | null;          // 1-5
  text: string | null;
  posted_at: string | null;       // ISO
  response_text: string | null;
  response_at: string | null;
  reviewer_url: string | null;
  source: string;                 // 'google'
  raw_json: string;
}

export interface ReviewSummary {
  rating_avg: number | null;
  rating_count: number;
  count_5: number;
  count_4: number;
  count_3: number;
  count_2: number;
  count_1: number;
  response_rate_pct: number;
  business_name: string;
  business_address: string | null;
  cid: string | null;
  fetched_at: string;
}

function basicAuth(env: DataForSEOEnv): string {
  // btoa is available in Workers runtime.
  const raw = `${env.DATAFORSEO_LOGIN}:${env.DATAFORSEO_PASSWORD}`;
  return 'Basic ' + btoa(raw);
}

export interface FetchReviewsParams {
  // One of these two:
  keyword?: string;          // e.g. "I Care Air Care Wesley Chapel FL"
  cid?: string;              // Google place CID if we already know it
  location_code?: number;    // DataForSEO location code (Wesley Chapel ≈ 9007173)
  language_code?: string;    // 'en'
  depth?: number;            // up to 4490, default 100
  sort_by?: 'newest' | 'oldest' | 'highest_rating' | 'lowest_rating';
}

export interface FetchReviewsResult {
  ok: boolean;
  status: number;
  duration_ms: number;
  cost_usd?: number;
  summary?: ReviewSummary;
  reviews?: ReviewRow[];
  error?: string;
  raw?: unknown;
}

export async function fetchGoogleReviews(env: DataForSEOEnv, params: FetchReviewsParams): Promise<FetchReviewsResult> {
  const start = Date.now();
  if (!env.DATAFORSEO_LOGIN || !env.DATAFORSEO_PASSWORD) {
    return { ok: false, status: 0, duration_ms: 0, error: 'DataForSEO credentials not configured' };
  }

  const body = [{
    keyword: params.keyword,
    cid: params.cid,
    location_code: params.location_code ?? 9007173,
    language_code: params.language_code ?? 'en',
    depth: params.depth ?? 100,
    sort_by: params.sort_by ?? 'newest',
  }];
  // Strip undefined fields so DataForSEO doesn't reject the JSON.
  for (const k of Object.keys(body[0]) as Array<keyof typeof body[0]>) {
    if (body[0][k] === undefined) delete body[0][k];
  }

  try {
    const res = await fetch('https://api.dataforseo.com/v3/business_data/google/reviews/live/advanced', {
      method: 'POST',
      headers: {
        'Authorization': basicAuth(env),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let parsed: Record<string, unknown> | null = null;
    try { parsed = text ? JSON.parse(text) : null; } catch { /* leave null */ }
    const duration_ms = Date.now() - start;
    if (!res.ok) {
      return { ok: false, status: res.status, duration_ms, error: text.slice(0, 500), raw: parsed };
    }

    // Response shape:
    // {
    //   tasks: [{
    //     status_code, status_message, cost,
    //     result: [{
    //       reviews_count, rating: { value, votes_count, rating_max },
    //       title, place_id, cid, address, ...
    //       items: [{ type: 'google_reviews_search', ...review }]
    //     }]
    //   }]
    // }
    const tasks = (parsed?.tasks as Array<Record<string, unknown>>) || [];
    const task = tasks[0];
    if (!task) {
      return { ok: false, status: res.status, duration_ms, error: 'No task in response', raw: parsed };
    }
    const taskStatus = (task.status_code as number) || 0;
    if (taskStatus !== 20000) {
      return {
        ok: false, status: res.status, duration_ms,
        error: `DataForSEO task ${taskStatus}: ${(task.status_message as string) || 'unknown'}`,
        raw: parsed,
      };
    }
    const cost = (task.cost as number) || 0;
    const results = (task.result as Array<Record<string, unknown>>) || [];
    const r0 = results[0] || {};
    const items = (r0.items as Array<Record<string, unknown>>) || [];
    const rating = (r0.rating as { value: number; votes_count: number; rating_max: number }) || null;

    // Compute rating distribution from the items we got back. We don't always
    // get every review (depth caps it). The total count comes from rating.votes_count.
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let withResponse = 0;
    const reviews: ReviewRow[] = items.map((it) => {
      const stars = (it.rating as { value: number } | undefined)?.value;
      if (stars && stars >= 1 && stars <= 5) {
        counts[stars as 1 | 2 | 3 | 4 | 5]++;
      }
      const owner = (it.owner_answer as { text?: string; timestamp?: string } | undefined);
      if (owner && owner.text) withResponse++;
      const profile = (it.profile_name as string) || (it.user_profile as { profile_name?: string } | undefined)?.profile_name || null;
      const profileUrl = (it.profile_url as string) || (it.user_profile as { profile_url?: string } | undefined)?.profile_url || null;
      return {
        review_id: (it.review_id as string) || (it.review_url as string) || `${(r0.cid as string) || 'unknown'}_${(it.timestamp as string) || Math.random()}`,
        reviewer_name: profile,
        rating: stars ?? null,
        text: (it.review_text as string) || null,
        posted_at: (it.timestamp as string) || null,
        response_text: owner?.text ?? null,
        response_at: owner?.timestamp ?? null,
        reviewer_url: profileUrl,
        source: 'google',
        raw_json: JSON.stringify(it),
      };
    });

    const summary: ReviewSummary = {
      rating_avg: rating?.value ?? null,
      rating_count: rating?.votes_count ?? items.length,
      count_5: counts[5],
      count_4: counts[4],
      count_3: counts[3],
      count_2: counts[2],
      count_1: counts[1],
      response_rate_pct: items.length > 0 ? Math.round((withResponse / items.length) * 1000) / 10 : 0,
      business_name: (r0.title as string) || params.keyword || 'I Care Air Care',
      business_address: (r0.address as string) || null,
      cid: (r0.cid as string) || null,
      fetched_at: new Date().toISOString(),
    };

    return { ok: true, status: res.status, duration_ms, cost_usd: cost, summary, reviews };
  } catch (err) {
    return {
      ok: false, status: 0, duration_ms: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
