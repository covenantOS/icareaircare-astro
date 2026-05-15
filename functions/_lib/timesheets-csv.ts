// Parser for HCP's Time Tracking CSV export.
//
// HCP's UI lets you export a Time Tracking report as CSV. The column
// layout varies by report type and which custom columns the shop adds,
// so this parser is intentionally permissive — it identifies columns by
// substring match against a vocabulary, not by exact name.
//
// Verified vocabulary (drawn from HCP exports + their help docs):
//   Employee     -> 'employee', 'tech', 'name', 'staff'
//   Date         -> 'date'
//   Clock In     -> 'in', 'start', 'clock in'
//   Clock Out    -> 'out', 'end', 'clock out'
//   Total Hours  -> 'total', 'hours worked', 'duration', 'hours'
//   On Job Hours -> 'on job', 'billable', 'job hours'
//   Break        -> 'break', 'lunch', 'unpaid'
//
// Output: an array of normalized rows ready for D1 upsert plus a parse
// report (matched/unmatched columns, total rows, date range, any
// per-row errors). Caller is responsible for matching `name` -> hcp_id.

export interface ParsedHoursRow {
  raw: Record<string, string>;
  employee_name: string | null;
  work_date: string | null;        // YYYY-MM-DD
  clock_in: string | null;          // ISO timestamp if reconstructible
  clock_out: string | null;         // ISO timestamp if reconstructible
  total_hours: number | null;
  on_job_hours: number | null;
  break_hours: number | null;
  row_index: number;                // 1-based, for error reporting
  errors: string[];
}

export interface ParseReport {
  header_raw: string[];
  column_mapping: {
    employee: number | null;
    date: number | null;
    clock_in: number | null;
    clock_out: number | null;
    total_hours: number | null;
    on_job_hours: number | null;
    break_hours: number | null;
  };
  unmapped_columns: string[];
  rows: ParsedHoursRow[];
  total_rows: number;
  rows_with_errors: number;
  date_min: string | null;
  date_max: string | null;
  notes: string[];
}

// Tiny CSV parser. Handles quoted cells, escaped quotes ("a ""b"" c"),
// CRLF/LF line endings. Doesn't support multi-line quoted cells (HCP
// exports don't use them in practice, and proper streaming parsing in
// Workers is overkill for the size of these files).
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  // Normalize line endings before splitting.
  const src = text.replace(/\r\n?/g, '\n');
  let i = 0;
  let row: string[] = [];
  let cell = '';
  let inQuote = false;
  while (i < src.length) {
    const ch = src[i];
    if (inQuote) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cell += '"'; i += 2; continue; } // escaped quote
        inQuote = false; i++; continue;
      }
      cell += ch; i++; continue;
    }
    if (ch === '"') { inQuote = true; i++; continue; }
    if (ch === ',') { row.push(cell); cell = ''; i++; continue; }
    if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; i++; continue; }
    cell += ch; i++;
  }
  // Trailing cell / row
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  // Drop fully-empty trailing rows
  while (rows.length && rows[rows.length - 1].every(c => c.trim() === '')) rows.pop();
  return rows;
}

const COL_VOCAB = {
  employee: ['employee', 'tech', 'name', 'staff', 'worker', 'first', 'last'],
  date: ['date', 'day'],
  clock_in: ['in', 'start'],
  clock_out: ['out', 'end', 'finish'],
  total_hours: ['total', 'hours worked', 'duration', 'total hours', 'hours'],
  on_job_hours: ['on job', 'billable', 'job hours', 'on-job'],
  break_hours: ['break', 'lunch', 'unpaid'],
};

function matchHeader(header: string[]): ParseReport['column_mapping'] & { unmapped: string[] } {
  const lower = header.map(h => (h || '').toLowerCase().trim());
  const mapping = {
    employee: null as number | null,
    date: null as number | null,
    clock_in: null as number | null,
    clock_out: null as number | null,
    total_hours: null as number | null,
    on_job_hours: null as number | null,
    break_hours: null as number | null,
  };
  // Specific-match passes — pick the column with the strongest match.
  // We prefer "total hours" over "hours" alone, so check multi-word
  // entries before single-word fallbacks.
  function pickBest(field: keyof typeof COL_VOCAB) {
    const terms = COL_VOCAB[field];
    // Longer terms first (more specific)
    const sorted = [...terms].sort((a, b) => b.length - a.length);
    for (const t of sorted) {
      for (let i = 0; i < lower.length; i++) {
        if (mapping[field as keyof typeof mapping] != null) break;
        // Avoid double-assigning a column to two fields
        const taken = Object.values(mapping).some(v => v === i);
        if (taken) continue;
        if (lower[i].includes(t)) { mapping[field as keyof typeof mapping] = i; break; }
      }
      if (mapping[field as keyof typeof mapping] != null) break;
    }
  }
  // Date / clock_in / clock_out / total_hours / on_job_hours / break_hours / employee
  // Specific fields first so generic "hours" doesn't gobble the on-job column.
  pickBest('on_job_hours');
  pickBest('break_hours');
  pickBest('total_hours');
  pickBest('clock_in');
  pickBest('clock_out');
  pickBest('date');
  pickBest('employee');

  const assigned = new Set(Object.values(mapping).filter((v): v is number => typeof v === 'number'));
  const unmapped = header.filter((_, i) => !assigned.has(i));
  return { ...mapping, unmapped };
}

// Parse a date cell — accepts ISO, MM/DD/YYYY, M/D/YY, "May 12, 2026".
// Returns YYYY-MM-DD or null.
export function parseDate(s: string): string | null {
  if (!s) return null;
  const t = s.trim();
  if (!t) return null;
  // ISO (YYYY-MM-DD with optional time)
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  // MM/DD/YYYY or MM/DD/YY
  m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) {
    let y = parseInt(m[3], 10);
    if (y < 100) y += y < 50 ? 2000 : 1900;     // 2-digit year heuristic
    return `${y}-${String(parseInt(m[1])).padStart(2,'0')}-${String(parseInt(m[2])).padStart(2,'0')}`;
  }
  // Fallback: Date.parse handles "May 12 2026" etc.
  const parsed = Date.parse(t);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  return null;
}

// Parse an hours cell — accepts "8.5", "8h 30m", "8:30", "8.5 hours".
// Returns decimal hours or null.
export function parseHours(s: string): number | null {
  if (!s) return null;
  const t = s.trim().toLowerCase();
  if (!t) return null;
  // Plain decimal: "8.5", "8.5 hours", "8h"
  let m = t.match(/^(\d+(?:\.\d+)?)\s*h?(?:ours?)?$/);
  if (m) return parseFloat(m[1]);
  // HH:MM format
  m = t.match(/^(\d+):(\d{1,2})/);
  if (m) return parseInt(m[1], 10) + parseInt(m[2], 10) / 60;
  // "8h 30m" / "8 hr 30 min"
  m = t.match(/(\d+)\s*h(?:r|ours?)?\s*(?:(\d+)\s*m(?:in)?)?/);
  if (m) return parseInt(m[1], 10) + (m[2] ? parseInt(m[2], 10) / 60 : 0);
  return null;
}

// Parse a time cell within a date context — returns ISO timestamp.
// Accepts "8:30 AM", "20:15", or full ISO/timestamp strings.
export function parseTimeOnDate(timeCell: string, dateYmd: string | null): string | null {
  if (!timeCell || !dateYmd) return null;
  const t = timeCell.trim();
  if (!t) return null;
  // Full ISO/timestamp
  if (/^\d{4}-\d{2}-\d{2}[ T]/.test(t)) {
    const parsed = Date.parse(t);
    return isNaN(parsed) ? null : new Date(parsed).toISOString();
  }
  // 12-hour with AM/PM
  let m = t.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (m) {
    let h = parseInt(m[1], 10);
    const mins = parseInt(m[2], 10);
    const ampm = m[3].toLowerCase();
    if (ampm === 'pm' && h < 12) h += 12;
    if (ampm === 'am' && h === 12) h = 0;
    return `${dateYmd}T${String(h).padStart(2,'0')}:${String(mins).padStart(2,'0')}:00`;
  }
  // 24-hour
  m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (m) return `${dateYmd}T${String(parseInt(m[1])).padStart(2,'0')}:${m[2]}:00`;
  return null;
}

export function parseTimesheetsCsv(text: string): ParseReport {
  const cells = parseCsv(text);
  if (cells.length === 0) {
    return {
      header_raw: [], column_mapping: { employee: null, date: null, clock_in: null, clock_out: null, total_hours: null, on_job_hours: null, break_hours: null },
      unmapped_columns: [], rows: [], total_rows: 0, rows_with_errors: 0,
      date_min: null, date_max: null, notes: ['Empty file'],
    };
  }
  const header = cells[0];
  const m = matchHeader(header);
  const dataRows = cells.slice(1).filter(r => r.some(c => c.trim() !== ''));

  const notes: string[] = [];
  if (m.employee == null) notes.push('No "Employee" / "Name" column detected — every row will be unmatched.');
  if (m.date == null) notes.push('No "Date" column detected — rows will be skipped.');
  if (m.total_hours == null) notes.push('No "Total Hours" column detected — rows will be skipped.');

  const parsedRows: ParsedHoursRow[] = [];
  let withErrors = 0;
  let dMin: string | null = null;
  let dMax: string | null = null;

  dataRows.forEach((cellsArr, idx) => {
    const errors: string[] = [];
    const raw: Record<string, string> = {};
    header.forEach((h, i) => { raw[h || `col_${i}`] = cellsArr[i] || ''; });

    const employee_name = m.employee != null ? (cellsArr[m.employee] || '').trim() : null;
    const date = m.date != null ? parseDate(cellsArr[m.date] || '') : null;
    const total_hours = m.total_hours != null ? parseHours(cellsArr[m.total_hours] || '') : null;
    const on_job_hours = m.on_job_hours != null ? parseHours(cellsArr[m.on_job_hours] || '') : null;
    const break_hours = m.break_hours != null ? parseHours(cellsArr[m.break_hours] || '') : null;
    const clock_in = m.clock_in != null ? parseTimeOnDate(cellsArr[m.clock_in] || '', date) : null;
    const clock_out = m.clock_out != null ? parseTimeOnDate(cellsArr[m.clock_out] || '', date) : null;

    if (!employee_name) errors.push('missing employee name');
    if (!date) errors.push('missing or unparseable date');
    if (total_hours == null) errors.push('missing or unparseable total hours');

    if (date) {
      if (!dMin || date < dMin) dMin = date;
      if (!dMax || date > dMax) dMax = date;
    }
    if (errors.length) withErrors++;

    parsedRows.push({
      raw, employee_name, work_date: date,
      clock_in, clock_out,
      total_hours, on_job_hours, break_hours,
      row_index: idx + 2,                          // header is row 1
      errors,
    });
  });

  return {
    header_raw: header,
    column_mapping: {
      employee: m.employee, date: m.date,
      clock_in: m.clock_in, clock_out: m.clock_out,
      total_hours: m.total_hours, on_job_hours: m.on_job_hours, break_hours: m.break_hours,
    },
    unmapped_columns: m.unmapped,
    rows: parsedRows,
    total_rows: parsedRows.length,
    rows_with_errors: withErrors,
    date_min: dMin, date_max: dMax,
    notes,
  };
}

// Match an employee name from the CSV against the techs table.
// Strategy: try exact "First Last" first, then case-insensitive,
// then first-name only (uniqueness check), then last-name only.
export function matchEmployee(
  csvName: string,
  techs: Array<{ hcp_id: string; first_name: string | null; last_name: string | null }>,
): string | null {
  const clean = csvName.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!clean) return null;
  const candidates = techs.map(t => ({
    hcp_id: t.hcp_id,
    full: `${t.first_name || ''} ${t.last_name || ''}`.trim().toLowerCase(),
    first: (t.first_name || '').toLowerCase(),
    last: (t.last_name || '').toLowerCase(),
  })).filter(c => c.full);

  // 1) Exact full-name match
  const exact = candidates.find(c => c.full === clean);
  if (exact) return exact.hcp_id;

  // 2) "Last, First" pattern
  const commaSplit = clean.split(',').map(s => s.trim());
  if (commaSplit.length === 2) {
    const flipped = `${commaSplit[1]} ${commaSplit[0]}`;
    const m = candidates.find(c => c.full === flipped);
    if (m) return m.hcp_id;
  }

  // 3) Substring containment (CSV name contains tech's full name or vice versa)
  const contains = candidates.find(c => clean.includes(c.full) || c.full.includes(clean));
  if (contains) return contains.hcp_id;

  // 4) First-name match if unique
  const firstMatches = candidates.filter(c => c.first && clean.startsWith(c.first));
  if (firstMatches.length === 1) return firstMatches[0].hcp_id;

  // 5) Last-name match if unique
  const lastMatches = candidates.filter(c => c.last && clean.endsWith(c.last));
  if (lastMatches.length === 1) return lastMatches[0].hcp_id;

  return null;
}
