-- I Care Air Care KPI dashboard — initial schema
-- D1 (SQLite). Run via: wrangler d1 execute icareaircare-kpis --remote --file=migrations/0001_init.sql
--
-- Design notes:
-- 1. Every row from HCP gets a `_raw_json` column with the full upstream response.
--    Forward-compat: if HCP adds a field we want later, we don't have to re-sync everything.
-- 2. `hcp_id` is HCP's UUID. We use it as our natural key (PRIMARY KEY) for upsert simplicity.
-- 3. Timestamps stored as ISO-8601 strings (TEXT). SQLite handles them fine for range queries.
-- 4. Tech assignment on a job: we denormalize `primary_tech_hcp_id` for fast queries.
--    Multi-tech split rules can be implemented client-side from the raw JSON if Tim wants.
-- 5. Money stored as INTEGER cents. Avoids float drift on aggregates.

-- ─────────────────────────────────────────────────────────────────
-- TECHS (employees from HCP /employees)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE techs (
  hcp_id          TEXT PRIMARY KEY,
  first_name      TEXT,
  last_name       TEXT,
  role            TEXT,             -- HCP role string ('field tech', 'csr', etc.)
  is_field_tech   INTEGER NOT NULL DEFAULT 1,  -- 1 if we count them in tech KPIs
  is_active       INTEGER NOT NULL DEFAULT 1,
  email           TEXT,
  mobile_number   TEXT,
  hired_at        TEXT,
  _raw_json       TEXT,
  synced_at       TEXT NOT NULL
);

-- ─────────────────────────────────────────────────────────────────
-- CUSTOMERS (HCP /customers)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE customers (
  hcp_id          TEXT PRIMARY KEY,
  first_name      TEXT,
  last_name       TEXT,
  company         TEXT,
  email           TEXT,
  mobile_number   TEXT,
  home_number     TEXT,
  zip             TEXT,
  city            TEXT,
  state           TEXT,
  customer_type   TEXT,              -- 'residential' / 'commercial' / 'contractor'
  is_member       INTEGER NOT NULL DEFAULT 0,  -- care plan / service plan member
  member_plan     TEXT,                          -- plan name if applicable
  hcp_created_at  TEXT,                          -- when customer record was created in HCP
  first_job_at    TEXT,                          -- earliest job date — derived
  last_job_at     TEXT,                          -- latest completed job date — derived
  total_jobs      INTEGER NOT NULL DEFAULT 0,
  lifetime_value_cents INTEGER NOT NULL DEFAULT 0,
  _raw_json       TEXT,
  synced_at       TEXT NOT NULL
);

CREATE INDEX idx_customers_last_job ON customers(last_job_at);
CREATE INDEX idx_customers_member ON customers(is_member);

-- ─────────────────────────────────────────────────────────────────
-- JOBS (HCP /jobs) — the core KPI fact table
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE jobs (
  hcp_id              TEXT PRIMARY KEY,
  customer_hcp_id     TEXT REFERENCES customers(hcp_id),
  primary_tech_hcp_id TEXT REFERENCES techs(hcp_id),
  all_tech_hcp_ids    TEXT,           -- JSON array of all assigned employee ids
  job_type            TEXT,           -- normalized: 'tune_up' | 'diagnostic' | 'estimate' | 'install' | 'other'
  job_type_raw        TEXT,           -- HCP's raw job_type / business_unit / tags string for audit
  status              TEXT,           -- 'scheduled' | 'in progress' | 'completed' | 'canceled' | etc.
  is_callback         INTEGER NOT NULL DEFAULT 0,
  scheduled_start     TEXT,
  scheduled_end       TEXT,
  completed_at        TEXT,
  -- Money — invoice totals in CENTS (integer, no float)
  invoice_total_cents     INTEGER,    -- discounts APPLIED — Tim's "revenue"
  invoice_subtotal_cents  INTEGER,    -- discounts NOT applied — Tim's "sales"
  invoice_discount_cents  INTEGER,
  invoice_tax_cents       INTEGER,
  invoice_paid_cents      INTEGER,
  -- Derived KPI flags (computed at sync time using current config)
  is_sold             INTEGER,        -- 1 if invoice_total_cents >= sold_threshold for this call type
  meets_min_ticket    INTEGER,        -- 1 if invoice_total_cents >= min_ticket for this call type
  -- HCP linking
  invoice_hcp_id      TEXT,
  _raw_json           TEXT,
  synced_at           TEXT NOT NULL
);

CREATE INDEX idx_jobs_completed_at ON jobs(completed_at);
CREATE INDEX idx_jobs_scheduled_start ON jobs(scheduled_start);
CREATE INDEX idx_jobs_tech_completed ON jobs(primary_tech_hcp_id, completed_at);
CREATE INDEX idx_jobs_type_completed ON jobs(job_type, completed_at);
CREATE INDEX idx_jobs_customer ON jobs(customer_hcp_id);

-- ─────────────────────────────────────────────────────────────────
-- INVOICES (HCP /invoices) — kept separate so we can reconcile
-- jobs ←→ invoices (a job can have multiple invoices; an invoice
-- can sometimes span jobs). Phase-1 mostly uses jobs.invoice_*_cents
-- inline, but having raw invoices lets us audit later.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE invoices (
  hcp_id          TEXT PRIMARY KEY,
  job_hcp_id      TEXT,
  customer_hcp_id TEXT,
  total_cents     INTEGER,
  subtotal_cents  INTEGER,
  discount_cents  INTEGER,
  tax_cents       INTEGER,
  paid_cents      INTEGER,
  status          TEXT,                  -- 'draft' | 'sent' | 'paid' | 'voided'
  hcp_created_at  TEXT,
  hcp_paid_at     TEXT,
  _raw_json       TEXT,
  synced_at       TEXT NOT NULL
);

CREATE INDEX idx_invoices_job ON invoices(job_hcp_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_hcp_id);

-- ─────────────────────────────────────────────────────────────────
-- SYNC RUNS — observability for the cron Worker
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE sync_runs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  trigger         TEXT NOT NULL,        -- 'cron' | 'manual' | 'webhook'
  started_at      TEXT NOT NULL,
  finished_at     TEXT,
  success         INTEGER,              -- 1 ok, 0 failed, NULL in-flight
  jobs_synced     INTEGER DEFAULT 0,
  customers_synced INTEGER DEFAULT 0,
  techs_synced    INTEGER DEFAULT 0,
  invoices_synced INTEGER DEFAULT 0,
  api_calls       INTEGER DEFAULT 0,
  error_message   TEXT,
  notes           TEXT
);

CREATE INDEX idx_sync_runs_started ON sync_runs(started_at DESC);

-- ─────────────────────────────────────────────────────────────────
-- WEBHOOK EVENTS — raw inbox for HCP webhooks (process out-of-band)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE webhook_events (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  received_at     TEXT NOT NULL,
  event_type      TEXT,
  hcp_id          TEXT,                 -- ID of the affected resource
  payload_json    TEXT NOT NULL,
  processed       INTEGER NOT NULL DEFAULT 0,
  processed_at    TEXT,
  error           TEXT
);

CREATE INDEX idx_webhook_events_unprocessed ON webhook_events(processed, received_at);
