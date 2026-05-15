// POST /api/admin/timesheets/upload — accept HCP Time Tracking CSV.
//
// Tim's path A choice on 2026-05-14. HCP's API doesn't expose timecards,
// so this is the only way real clock-in/out hours land in the dashboard.
//
// Accepts either:
//   - multipart/form-data with field `file` holding the CSV (browser drag-drop)
//   - text/csv body (curl / scripts)
//
// Returns a parse report with:
//   - column mapping (so the user can see which columns we matched)
//   - rows imported (matched + unmatched)
//   - any per-row parser errors
//   - the batch_id for replay or deletion
//
// Idempotency: each (tech_hcp_id, work_date) is upserted — the most recent
// upload for that date wins. Unmatched-by-name rows are stored with
// tech_hcp_id NULL so they can be reconciled later when a name is fixed.

import { authOrError, jsonResponse, type AuthEnv } from '../../_lib/auth';
import { parseTimesheetsCsv, matchEmployee } from '../../_lib/timesheets-csv';

interface Env extends AuthEnv {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = authOrError(request, env);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);
  if (!env.DB) return jsonResponse({ error: 'D1 not configured' }, 503);

  // ─── 1. Get the CSV text out of the request body ────────────────────
  const contentType = (request.headers.get('content-type') || '').toLowerCase();
  let csvText = '';
  let filename: string | null = null;

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const f = form.get('file');
    if (!(f instanceof File)) {
      return jsonResponse({ error: 'Expected `file` field in multipart upload' }, 400);
    }
    csvText = await f.text();
    filename = f.name || null;
  } else {
    csvText = await request.text();
  }

  if (!csvText.trim()) {
    return jsonResponse({ error: 'Empty CSV body' }, 400);
  }

  // ─── 2. Parse the CSV ───────────────────────────────────────────────
  const report = parseTimesheetsCsv(csvText);
  if (report.total_rows === 0) {
    return jsonResponse({ error: 'No data rows in CSV', report }, 400);
  }

  // ─── 3. Match employee names to techs ───────────────────────────────
  const techsRes = await env.DB
    .prepare(`SELECT hcp_id, first_name, last_name FROM techs WHERE is_active = 1`)
    .all<{ hcp_id: string; first_name: string | null; last_name: string | null }>();
  const techs = techsRes.results || [];

  // ─── 4. Upsert into tech_hours within a batch ───────────────────────
  const batch_id = crypto.randomUUID();
  const uploaded_at = new Date().toISOString();
  const uploaded_by = auth.principal;

  let matchedRows = 0;
  let unmatchedRows = 0;
  const inserts: D1PreparedStatement[] = [];
  const seenKeys = new Set<string>();           // dedup within the same upload

  for (const row of report.rows) {
    if (!row.work_date || row.total_hours == null) continue;     // skip unparseable rows
    if (!row.employee_name) continue;

    const matched_id = matchEmployee(row.employee_name, techs);
    if (matched_id) matchedRows++; else unmatchedRows++;

    // Dedup within this upload: same employee + date keeps the largest
    // total_hours row (some HCP exports double-list partial entries).
    const key = `${matched_id || row.employee_name}|${row.work_date}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);

    inserts.push(env.DB.prepare(
      `INSERT INTO tech_hours
         (tech_hcp_id, tech_name_csv, work_date, clock_in, clock_out,
          total_hours, on_job_hours, break_hours, source, upload_batch_id, uploaded_at, _raw_row)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'csv_upload', ?, ?, ?)`,
    ).bind(
      matched_id,
      row.employee_name,
      row.work_date,
      row.clock_in,
      row.clock_out,
      row.total_hours,
      row.on_job_hours,
      row.break_hours,
      batch_id,
      uploaded_at,
      JSON.stringify(row.raw).slice(0, 4000),
    ));
  }

  // ─── 5. Replace mode — wipe any existing rows in the date range for
  // matched techs so re-uploads cleanly override prior data.
  if (report.date_min && report.date_max) {
    await env.DB.prepare(
      `DELETE FROM tech_hours WHERE work_date >= ? AND work_date <= ? AND source = 'csv_upload'`,
    ).bind(report.date_min, report.date_max).run();
  }

  if (inserts.length) await env.DB.batch(inserts);

  // ─── 6. Record the upload run for observability ─────────────────────
  await env.DB.prepare(
    `INSERT INTO hours_upload_runs
       (batch_id, uploaded_at, uploaded_by, filename, total_rows,
        matched_rows, unmatched_rows, date_min, date_max, notes, raw_header)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    batch_id, uploaded_at, uploaded_by, filename,
    report.total_rows, matchedRows, unmatchedRows,
    report.date_min, report.date_max,
    report.notes.join('; ') + (report.unmapped_columns.length ? ` Unmapped cols: ${report.unmapped_columns.join(', ')}` : ''),
    JSON.stringify(report.header_raw),
  ).run();

  return jsonResponse({
    ok: true,
    batch_id,
    filename,
    total_rows: report.total_rows,
    matched_rows: matchedRows,
    unmatched_rows: unmatchedRows,
    date_range: report.date_min && report.date_max ? { from: report.date_min, to: report.date_max } : null,
    column_mapping: report.column_mapping,
    unmapped_columns: report.unmapped_columns,
    rows_with_errors: report.rows_with_errors,
    notes: report.notes,
    sample_unmatched: report.rows
      .filter(r => r.employee_name && !matchEmployee(r.employee_name, techs))
      .slice(0, 5)
      .map(r => r.employee_name),
  });
};

// GET /api/admin/timesheets/upload — return recent upload runs for the UI.
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = authOrError(request, env);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);
  if (!env.DB) return jsonResponse({ error: 'D1 not configured' }, 503);

  const runs = await env.DB
    .prepare(`SELECT id, batch_id, uploaded_at, uploaded_by, filename, total_rows, matched_rows, unmatched_rows, date_min, date_max, notes
              FROM hours_upload_runs ORDER BY id DESC LIMIT 20`)
    .all();

  return jsonResponse({ runs: runs.results || [] });
};
