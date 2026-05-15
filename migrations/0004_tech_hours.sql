-- I Care Air Care KPI dashboard — tech_hours table
-- Stores per-tech, per-day hours data imported from HCP's Time Tracking
-- CSV export (Tim's path A choice on 2026-05-14). HCP's public API does
-- not expose timecards, so this is the only path to real clock-in/out
-- numbers. Drag-and-drop upload through /admin endpoint.
--
-- Design:
--   - hcp_id is the foreign key to techs (best-effort match by name at
--     ingest time; stored as `tech_name_csv` if no match).
--   - work_date is YYYY-MM-DD local; clock_in / clock_out are ISO timestamps
--     when the CSV provides them, NULL otherwise.
--   - on_job_hours captures the portion of total_hours spent on jobs
--     (some HCP exports distinguish this; others only give total).
--   - break_hours subtracted from total before computing utilization.
--   - upload_batch_id groups rows from the same CSV file so we can replay
--     or replace an upload cleanly.
--   - Conflict resolution: an upsert on (tech_hcp_id, work_date) — most
--     recent upload wins. Unmatched tech rows keep accumulating until a
--     name match is established, at which point we can re-key.
--   - _raw_row stores the entire CSV row as JSON so we can debug parser
--     misses without re-uploading.

CREATE TABLE IF NOT EXISTS tech_hours (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  tech_hcp_id     TEXT,                  -- matched against techs(hcp_id); NULL if name didn't match
  tech_name_csv   TEXT NOT NULL,          -- raw name string from CSV
  work_date       TEXT NOT NULL,          -- YYYY-MM-DD (local)
  clock_in        TEXT,                   -- ISO timestamp if available
  clock_out       TEXT,                   -- ISO timestamp if available
  total_hours     REAL NOT NULL,          -- decimal hours worked
  on_job_hours    REAL,                   -- hours specifically on jobs (if CSV provides)
  break_hours     REAL,                   -- unpaid break time (if CSV provides)
  source          TEXT NOT NULL DEFAULT 'csv_upload',
  upload_batch_id TEXT NOT NULL,          -- groups rows from one upload
  uploaded_at     TEXT NOT NULL,
  _raw_row        TEXT                    -- full CSV row as JSON
);

CREATE INDEX IF NOT EXISTS idx_tech_hours_tech_date ON tech_hours(tech_hcp_id, work_date);
CREATE INDEX IF NOT EXISTS idx_tech_hours_date ON tech_hours(work_date);
CREATE INDEX IF NOT EXISTS idx_tech_hours_batch ON tech_hours(upload_batch_id);
-- Each (tech_hcp_id, work_date) appears at most once after dedup. We don't
-- enforce uniqueness at the DB level because unmatched rows (NULL hcp_id)
-- need to coexist — the upload endpoint handles dedup application-side.

-- Track CSV upload runs for observability and replay.
CREATE TABLE IF NOT EXISTS hours_upload_runs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id        TEXT NOT NULL UNIQUE,
  uploaded_at     TEXT NOT NULL,
  uploaded_by     TEXT,                   -- principal from auth (admin_secret or CF Access email)
  filename        TEXT,
  total_rows      INTEGER NOT NULL DEFAULT 0,
  matched_rows    INTEGER NOT NULL DEFAULT 0,
  unmatched_rows  INTEGER NOT NULL DEFAULT 0,
  date_min        TEXT,
  date_max        TEXT,
  notes           TEXT,                   -- parser hints, column mappings, any errors
  raw_header      TEXT                    -- the header row as seen in the CSV
);

CREATE INDEX IF NOT EXISTS idx_hours_runs_recent ON hours_upload_runs(uploaded_at DESC);
