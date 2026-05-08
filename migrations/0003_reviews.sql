-- Reviews table — stores Google reviews fetched via DataForSEO.
-- Refreshed via /api/reviews/sync on demand and via cron nightly.

CREATE TABLE IF NOT EXISTS reviews (
  review_id      TEXT PRIMARY KEY,
  source         TEXT NOT NULL DEFAULT 'google',
  reviewer_name  TEXT,
  rating         INTEGER,
  text           TEXT,
  posted_at      TEXT,
  response_text  TEXT,
  response_at    TEXT,
  reviewer_url   TEXT,
  -- Tech attribution: when a tagged review-request link was clicked within
  -- a window before this review landed, we set this. Null if no match.
  attributed_tech_hcp_id TEXT,
  attribution_method TEXT,        -- 'tagged_link' | 'manual' | etc.
  raw_json       TEXT,
  fetched_at     TEXT NOT NULL,
  synced_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reviews_posted_at ON reviews(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_attributed_tech ON reviews(attributed_tech_hcp_id);

-- Summary snapshots — capture the aggregate state at each sync so we can
-- track how the rating + count evolves over time.
CREATE TABLE IF NOT EXISTS review_summary_snapshots (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  fetched_at     TEXT NOT NULL,
  rating_avg     REAL,
  rating_count   INTEGER,
  count_5        INTEGER,
  count_4        INTEGER,
  count_3        INTEGER,
  count_2        INTEGER,
  count_1        INTEGER,
  response_rate_pct REAL,
  business_name  TEXT,
  business_address TEXT,
  cid            TEXT,
  cost_usd       REAL,
  duration_ms    INTEGER
);

CREATE INDEX IF NOT EXISTS idx_review_snapshots_fetched ON review_summary_snapshots(fetched_at DESC);

-- Tagged review-request links — when a tech sends a "leave us a review"
-- email/SMS, we generate a unique short link that records the click.
-- Used for per-tech attribution.
CREATE TABLE IF NOT EXISTS review_request_clicks (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  tech_hcp_id    TEXT,
  customer_hcp_id TEXT,
  job_hcp_id     TEXT,
  clicked_at     TEXT NOT NULL,
  user_agent     TEXT,
  ip_hash        TEXT
);

CREATE INDEX IF NOT EXISTS idx_review_clicks_tech_time ON review_request_clicks(tech_hcp_id, clicked_at DESC);
