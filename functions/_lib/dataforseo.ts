// DataForSEO REST API client for Google Reviews.
//
// IMPORTANT: DataForSEO does NOT have a "live" endpoint for Google reviews —
// only the async task pattern. Workflow:
//   1. POST /v3/business_data/google/reviews/task_post   (~$0.00075/task)
//   2. Wait 30-90 seconds while DataForSEO scrapes Google
//   3. GET  /v3/business_data/google/reviews/task_get/advanced/{id}
// Tasks stay available for 7 days; we cache the latest result in D1 so the
// dashboard reads from D1 (free, fast) and only re-syncs on demand or cron.
//
// Auth: HTTP Basic with login:password (Will's account: will@servicelinepro.com)

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
  keyword?: string;          // e.g. "I Care Air Care Wesley Chapel FL"
  cid?: string;              // Google place CID if we already know it
  location_name?: string;    // e.g. "Wesley Chapel,Florida,United States"
  location_code?: number;    // optional DataForSEO numeric location code
  language_name?: string;    // 'English' (DataForSEO prefers name over code for this endpoint)
  depth?: number;            // up to 4490, default 50
  sort_by?: 'newest' | 'oldest' | 'highest_rating' | 'lowest_rating';
  max_wait_ms?: number;      // how long to poll task_get before giving up; default 35s
  poll_interval_ms?: number; // default 4000ms
}

export interface FetchReviewsResult {
  ok: boolean;
  status: number;
  duration_ms: number;
  cost_usd?: number;
  task_id?: string;
  pending?: boolean;         // true if we ran out of poll budget — caller can retry later
  summary?: ReviewSummary;
  reviews?: ReviewRow[];
  error?: string;
  raw?: unknown;
}

async function dfsPost(env: DataForSEOEnv, path: string, body: unknown): Promise<{ ok: boolean; status: number; data: Record<string, unknown> | null; text: string }> {
  const res = await fetch(`https://api.dataforseo.com${path}`, {
    method: 'POST',
    headers: {
      'Authorization': basicAuth(env),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: Record<string, unknown> | null = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* keep null */ }
  return { ok: res.ok, status: res.status, data, text };
}

async function dfsGet(env: DataForSEOEnv, path: string): Promise<{ ok: boolean; status: number; data: Record<string, unknown> | null; text: string }> {
  const res = await fetch(`https://api.dataforseo.com${path}`, {
    headers: { 'Authorization': basicAuth(env) },
  });
  const text = await res.text();
  let data: Record<string, unknown> | null = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* keep null */ }
  return { ok: res.ok, status: res.status, data, text };
}

function parseTaskResult(parsed: Record<string, unknown> | null, duration_ms: number): {
  ok: boolean;
  cost: number;
  summary?: ReviewSummary;
  reviews?: ReviewRow[];
  error?: string;
} {
  const tasks = (parsed?.tasks as Array<Record<string, unknown>>) || [];
  const task = tasks[0];
  if (!task) return { ok: false, cost: 0, error: 'No task in response' };
  const taskStatus = (task.status_code as number) || 0;
  if (taskStatus !== 20000) {
    return { ok: false, cost: (task.cost as number) || 0, error: `DataForSEO task ${taskStatus}: ${(task.status_message as string) || 'unknown'}` };
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
      business_name: (r0.title as string) || 'I Care Air Care',
      business_address: (r0.address as string) || null,
      cid: (r0.cid as string) || null,
      fetched_at: new Date().toISOString(),
    };
    return { ok: true, cost, summary, reviews };
}

// Submit task + poll task_get until reviews are ready (or we hit max_wait_ms).
export async function fetchGoogleReviews(env: DataForSEOEnv, params: FetchReviewsParams): Promise<FetchReviewsResult> {
  const start = Date.now();
  if (!env.DATAFORSEO_LOGIN || !env.DATAFORSEO_PASSWORD) {
    return { ok: false, status: 0, duration_ms: 0, error: 'DataForSEO credentials not configured' };
  }

  // 1. Submit task
  const taskBody: Record<string, unknown> = {
    keyword: params.keyword,
    cid: params.cid,
    location_name: params.location_name,
    location_code: params.location_code,
    language_name: params.language_name ?? 'English',
    depth: params.depth ?? 50,
    sort_by: params.sort_by ?? 'newest',
  };
  for (const k of Object.keys(taskBody)) {
    if (taskBody[k] === undefined || taskBody[k] === null) delete taskBody[k];
  }

  const post = await dfsPost(env, '/v3/business_data/google/reviews/task_post', [taskBody]);
  if (!post.ok) {
    return { ok: false, status: post.status, duration_ms: Date.now() - start, error: post.text.slice(0, 500), raw: post.data };
  }
  const tasksTopLevel = (post.data?.status_code as number) || 0;
  if (tasksTopLevel !== 20000) {
    return { ok: false, status: post.status, duration_ms: Date.now() - start, error: post.text.slice(0, 500), raw: post.data };
  }
  const tasks = (post.data?.tasks as Array<Record<string, unknown>>) || [];
  const task = tasks[0];
  if (!task) return { ok: false, status: post.status, duration_ms: Date.now() - start, error: 'No task in task_post response', raw: post.data };
  const taskStatusCode = (task.status_code as number) || 0;
  if (taskStatusCode !== 20100) {
    return { ok: false, status: post.status, duration_ms: Date.now() - start, error: `task_post: ${taskStatusCode} ${(task.status_message as string) || ''}`, raw: post.data };
  }
  const taskId = task.id as string;
  const submitCost = (task.cost as number) || 0;

  // 2. Poll task_get/advanced/{id}
  const maxWait = params.max_wait_ms ?? 35000;
  const interval = params.poll_interval_ms ?? 4000;
  const deadline = Date.now() + maxWait;
  let lastError = '';

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, interval));
    const got = await dfsGet(env, `/v3/business_data/google/reviews/task_get/advanced/${taskId}`);
    if (!got.ok) {
      lastError = got.text.slice(0, 300);
      continue;
    }
    const topStatus = (got.data?.status_code as number) || 0;
    const taskList = (got.data?.tasks as Array<Record<string, unknown>>) || [];
    const t = taskList[0];
    const tStatus = (t?.status_code as number) || 0;
    // 40601 = "Task In Queue"; 40602 = "Task Handed"; 20000 = Ok / done
    if (tStatus === 20000 && t?.result) {
      const parsed = parseTaskResult(got.data, Date.now() - start);
      if (parsed.ok) {
        return {
          ok: true, status: 200, duration_ms: Date.now() - start, task_id: taskId,
          cost_usd: submitCost + parsed.cost,
          summary: parsed.summary, reviews: parsed.reviews,
        };
      }
      return {
        ok: false, status: 200, duration_ms: Date.now() - start, task_id: taskId,
        error: parsed.error || 'parse failed', raw: got.data,
      };
    }
    if (topStatus !== 20000) {
      lastError = (got.data?.status_message as string) || '';
    }
  }

  return {
    ok: false, status: 0, duration_ms: Date.now() - start, task_id: taskId, pending: true,
    error: `Task not ready within ${maxWait}ms. ${lastError}. Retry in ~60 seconds.`,
  };
}

// Read a previously-submitted task by ID — used by the dashboard to retrieve
// a result that was still pending on the previous sync attempt.
export async function getReviewsTask(env: DataForSEOEnv, taskId: string): Promise<FetchReviewsResult> {
  const start = Date.now();
  const got = await dfsGet(env, `/v3/business_data/google/reviews/task_get/advanced/${taskId}`);
  if (!got.ok) {
    return { ok: false, status: got.status, duration_ms: Date.now() - start, error: got.text.slice(0, 500), task_id: taskId };
  }
  const taskList = (got.data?.tasks as Array<Record<string, unknown>>) || [];
  const t = taskList[0];
  const tStatus = (t?.status_code as number) || 0;
  if (tStatus !== 20000 || !t?.result) {
    return { ok: false, status: got.status, duration_ms: Date.now() - start, error: `Task ${tStatus} ${(t?.status_message as string) || ''}`, task_id: taskId, pending: true };
  }
  const parsed = parseTaskResult(got.data, Date.now() - start);
  if (parsed.ok) {
    return { ok: true, status: 200, duration_ms: Date.now() - start, task_id: taskId, cost_usd: parsed.cost, summary: parsed.summary, reviews: parsed.reviews };
  }
  return { ok: false, status: 200, duration_ms: Date.now() - start, error: parsed.error, task_id: taskId, raw: got.data };
}
