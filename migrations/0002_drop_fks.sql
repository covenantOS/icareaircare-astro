-- Drop foreign-key constraints on jobs (sync may insert jobs before
-- referenced customers/techs are paginated in). Dashboard queries use
-- LEFT JOIN so missing references render as 'Unassigned' instead of
-- failing inserts. The natural keys (hcp_id) are still indexed.
--
-- SQLite doesn't have ALTER TABLE DROP CONSTRAINT — recreate the table.
-- Safe because the first sync failed and `jobs` is empty.

DROP INDEX IF EXISTS idx_jobs_completed_at;
DROP INDEX IF EXISTS idx_jobs_scheduled_start;
DROP INDEX IF EXISTS idx_jobs_tech_completed;
DROP INDEX IF EXISTS idx_jobs_type_completed;
DROP INDEX IF EXISTS idx_jobs_customer;
DROP TABLE IF EXISTS jobs;

CREATE TABLE jobs (
  hcp_id              TEXT PRIMARY KEY,
  customer_hcp_id     TEXT,
  primary_tech_hcp_id TEXT,
  all_tech_hcp_ids    TEXT,
  job_type            TEXT,
  job_type_raw        TEXT,
  status              TEXT,
  is_callback         INTEGER NOT NULL DEFAULT 0,
  scheduled_start     TEXT,
  scheduled_end       TEXT,
  completed_at        TEXT,
  invoice_total_cents     INTEGER,
  invoice_subtotal_cents  INTEGER,
  invoice_discount_cents  INTEGER,
  invoice_tax_cents       INTEGER,
  invoice_paid_cents      INTEGER,
  is_sold             INTEGER,
  meets_min_ticket    INTEGER,
  invoice_hcp_id      TEXT,
  _raw_json           TEXT,
  synced_at           TEXT NOT NULL
);

CREATE INDEX idx_jobs_completed_at ON jobs(completed_at);
CREATE INDEX idx_jobs_scheduled_start ON jobs(scheduled_start);
CREATE INDEX idx_jobs_tech_completed ON jobs(primary_tech_hcp_id, completed_at);
CREATE INDEX idx_jobs_type_completed ON jobs(job_type, completed_at);
CREATE INDEX idx_jobs_customer ON jobs(customer_hcp_id);
