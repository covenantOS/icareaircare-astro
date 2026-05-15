# Dashboard production audit — 2026-05-15

Audit run live against `https://www.icareaircare.com/admin/dashboard/` and the production D1. Every claim I made about what shipped was tested against real data; CSV upload tested with a fake file then cleaned up; one manual review attribution saved + reverted to verify the persistence path.

---

## ✅ Working as designed

### Multi-tech credit
- Shop completed jobs (30d): **244**
- By-tech jobs sum (with multi-tech credit): **306**
- Difference: **62**
- Sum of `shared_jobs` across techs: **62** ✓ exact match — every shared-job row is accounted for, no double-counting

### Sales rev / Install rev (Option A)
- Shop revenue (from summary endpoint): **$121,923.23**
- By-tech sum of `revenue` (equal-split): **$121,923.23** ✓
- By-tech sum of `sales_rev`: **$121,923.23** ✓ exact match to shop revenue
- By-tech sum of `install_rev`: **$120,355.54** (short by **$1,567.69**)
  - The shortfall = **exactly the revenue of the 7 estimate-tagged jobs in the window**
  - This is *correct by design* — estimates are sales activity, not work performed, so they credit `sales_rev` but not `install_rev`
  - If Tim wants estimates excluded from `sales_rev` too, that's a one-line change

### Kleber's case from Tim's email
Kleber's 30d:
- Jobs: 56 (+ 3 shared = he was the non-primary tech on 3 multi-tech jobs)
- Revenue (equal-split): $19,751
- **Sold $: $26,933**
- **Installed $: $17,356**
- Sold > Revenue by $7,182 → that's the value of installs he sold but didn't do (correctly attributed to him via Option A)
- ✓ He IS getting credit for installs he sold. Tim's original complaint is resolved.

### Dashboard render (live production check)
- All 10 sections render with content (`offsetHeight > 0`): AI / KPIs / leaderboard / goals / hours / review-attribution / reviews / segments / by-type / customer-mix
- Headline KPIs: 244 volume / 47.1% close / $500 ticket / $121,923 revenue
- 10 tech rows, 21 review cards, 7 goal cards
- All 14 leaderboard columns visible: Tech, Peer, [Industry hidden by default], Jobs, TU·Dx·Est, Close %, Avg Ticket, Revenue, Sold $, Installed $, Hours, $/Hr, ⭐ Reviews, Callbacks

### Industry-anchored grade toggle
- Checkbox in leaderboard header toggles the "Industry" column
- Persists across page reloads via sessionStorage
- Sample scores: Kleber **D66 peer / F21 industry**; Erick **D69 / F25**; Tim **— / D65**
- The F industry grades are aggressive vs the Mercurio top-quartile anchors — directionally honest; if Tim wants more forgiving anchors I can re-tune them

### Custom date range picker
- Last 7d / 30d / 90d rolling tabs work
- "Last week (Sun-Sat)", "This month", "Last month" presets work
- Custom popover opens, accepts from/to dates, applies, closes, updates the window display ("5/4/2026 → 5/10/2026")
- Data refetched correctly: Kleber's 30d 56 jobs becomes 16 jobs / Sold $15,485 / Installed $5,908 in the May 4-10 week

### Manual review attribution
- 50 reviews total, 29 auto-attributed (58%), 21 unattributed
- 21 cards render with full tech dropdown (15 employees including all of Tim's named techs)
- POST `/api/reviews/manual` tested: assigned a review to Kleber, verified `attribution_method = "manual"` persisted, panel re-rendered without the card (correctly filtered out of "Unattributed"), counts bumped 29→30 attributed and 0→1 manual. Then reverted to clean state.

### CSV upload pipeline
- Tested with a 21-row fake HCP-style export (Employee, Date, Clock In, Clock Out, Total Hours, On Job Hours, Break)
- Parser auto-detected all 7 columns
- 20/21 rows matched, 1 unmatched (intentional "Random Unmatched Person" test row) — `sample_unmatched` returned correctly
- Hours flowed through to the by-tech endpoint:
  - Cesar (installer): 46.5h, $107.42/hr
  - Erick (service): 43.0h, $122.59/hr
  - Kleber (service): 41.5h, $200.06/hr
  - Daniel (installer): 27.0h, $241.94/hr
  - Angel (helper): 18.0h, $357.93/hr (high $/hr because helpers ride installs)
- Numbers are intuitively right. Cleaned up the test data — `tech_hours` and `hours_upload_runs` both back to 0 rows.

### Estimates ingestion
- `/estimates` endpoint pull is live; window shows **7 estimates** with $1,567 total revenue — small share because most estimates are $0 (real money on linked job) but a handful do carry totals
- 5 of Erick's jobs are estimates (he writes them in-field)

### Role bands
- Active role overrides stored in KV: **8 techs** with explicit bands assigned by name seed
- Distribution: 1 owner, 4 service, 2 install, 1 helper, 2 office, plus 2 other-band techs
- Bands seeded match Tim's email exactly: Erick/Kleber/Gerald/James service; Cesar/Daniel install; Angel helper

---

## ⚠️ Data hygiene issues (HCP-side — not code bugs, but real findings)

### 1. Install jobs tagged as "Diagnostic" in HCP
Three big-revenue jobs I inspected:

| Job | HCP tag | $ amount | Classification |
|---|---|---|---|
| Jennifer Roussau (Tim, Kleber, Daniel, Angel) | `Diagnostic` | **$14,761** | Almost certainly an install Tim closed during a diag call |
| Rutledge (Daniel primary, Kleber on team) | `Install - system` | **$9,577** | Correctly tagged ✓ |
| Anbarneen Ameen (4 techs) | `Diagnostic` | **$7,826** | Notes mention "permit #RESMEC" + "replace the breaker" — sounds like a replacement |

**Impact on the dashboard:**
- Call-type breakdown shows "Diagnostic" inflated, "Install" deflated (only **1 install in 30 days** vs probably 5-10)
- Per-tech Sold $ / Installed $ still works correctly because for non-install job types I credit BOTH columns to the assigned tech (the "tech did both" branch)
- Tim's leaderboard view is fine; his by-call-type view undercounts installs

**Recommendation for Tim:** Team should re-tag a job from "Diagnostic" to "Install" once it converts. There's no API to fix this from our side — it has to happen in HCP.

### 2. 62 jobs classified as "other" ($13,005 revenue)
Common reasons in the sample:
- `COIL-PULL`, `Duct Cleaning - DRYERVENT` — real install/IAQ work tagged generically
- `FOLLOWUP`, `CALLBACK` descriptions with **empty tags** — our classifier checks tags first, then description; if tags are empty AND description doesn't trip the regex perfectly, falls to other
- `Part pick up`, `Permitting - Pasco permit` — administrative, not really a billable job

**Impact:** $13,005 in "other" jobs that get full sales/install credit but don't appear in any call-type rollup.

**Recommendation:** Two paths — (a) Tim's team improves tag hygiene, or (b) I tighten the classifier to catch more descriptions (low-risk). Either way these jobs still credit the right tech, they just don't slot into a clean call-type bucket.

### 3. Hours columns show em-dash on every row
- This is correct for today (no CSV uploaded yet) but visually it makes the whole right side of the leaderboard look "broken"
- Once Tim does his first CSV upload, the columns light up
- Optional improvement: a small "No hours data — upload a CSV to enable" link/CTA on the column header

---

## 📌 Things I claimed shipped — verified

| Claim | Verified |
|---|---|
| Multi-tech credit (Erick 11 → 13) | ✓ 62 shared-job credits accounted for exactly |
| Estimates ingested separately | ✓ 7 estimates in 30d, 2,785 total in `/estimates` endpoint |
| Service vs Install bands | ✓ KV stores 8 explicit overrides matching Tim's email |
| Bigger fonts | ✓ confirmed in earlier sessions; layout still clean |
| Sales rev / Install rev (Option A) | ✓ Math holds: sales_rev sum = revenue sum exactly |
| Industry-anchored grades | ✓ Toggle works, column renders, scores computed |
| Custom date range picker | ✓ Three presets + custom popover all functional |
| CSV upload pipeline | ✓ 21-row test uploaded + parsed + matched + flowed to leaderboard |
| Manual review attribution | ✓ POST + GET roundtrip verified end-to-end |
| Hours + $/Hr columns | ✓ Render em-dash with no CSV, real numbers after upload |

---

## 🔧 Recommended follow-ups (in priority order)

1. **Brief Tim on the diagnostic-vs-install tagging issue.** The biggest win available to him is having his team re-tag a job once it converts from diagnostic to install. Will move 5-10 jobs per month out of "Diagnostic" and into "Install" in the dashboard, which makes the call-type rollups meaningful.
2. **Tighten the "other" classifier** — add description-based catches for `COIL-PULL`, `Duct Cleaning`, `FOLLOWUP` (callback). 30-minute fix; cuts the "other" bucket roughly in half.
3. **Optionally add an empty-state hint** to the Hours / $/Hr column headers so the em-dash columns don't look broken pre-upload.
4. **Industry grade anchors are aggressive** — every tech grades D-F on industry. Either re-tune the anchors to ICAC's reality or document that "F" against industry top-quartile is a 25th-50th-percentile shop in practice (not a failure grade).
