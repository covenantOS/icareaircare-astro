# Tim meeting prep — 1:30 PM, May 8 2026

**Where we left off:** dashboard live at https://www.icareaircare.com/admin/dashboard/ (PIN `258025`). Just shipped: Goal-progress widget, AI chat ("Ask the dashboard"), HCP webhooks endpoint, control-center sticky nav. **Demo path: dashboard → click Kleber → show his AI coaching briefing.** That's the wow moment.

---

## 5-minute opening — what to walk Tim through

1. **Open the dashboard.** Sticky nav at top — six section pills (AI / KPIs / Techs / Goals / Reviews / Segs). Click "Sync" — watch it pull HCP in three phases (employees, customers, jobs, ~30s total).

2. **AI Insights panel.** Read the headline. Point out the data-quality note callout — that's the AI flagging "only 4 estimates in 30 days" as an HCP tagging issue, not a real performance gap.

3. **Tech leaderboard.** Sorted by Formula A score. Owner/CSR in their own band; under-5-jobs techs in "Low volume" so we don't grade Tim against Erick.

4. **Click into Kleber.** Show the per-tech AI coaching briefing — strengths, concerns, specific Google review snippets quoting him, coaching actions with dollar value estimates, vs-peers grid.

5. **Goal Progress (NEW).** Scroll to the goals section. Shop rollup card: 1/5 on track today (or wherever it lands). Per-tech cards ranked by avg progress. Color-coded bars. Tim sees instantly: "Kleber 110%, James 48% — most upside."

6. **Ask the dashboard (NEW).** Hit the 💬 button bottom-right. Type: *"Which techs are below the close-rate goal?"* MiniMax answers using live HCP data, no canned answers.

---

## Tags Tim/team must adopt in HCP

The dashboard derives almost everything from HCP tags. To unlock the metrics that are currently dark we need:

| Tag | When to add | Unlocks |
|---|---|---|
| `Callback` | At job creation for any return/warranty visit | Real callback rate per tech (currently low because the tag isn't applied consistently) |
| `Membership Pitch` | At job close when a plan was offered but not sold | Membership conversion % — currently 0 in Formula A weight because we have no signal |
| `Estimate` job type | For replacement / advisor consultations | Estimate close rate (currently only 4 estimates in 30d → AI flagged as hygiene issue, not pipeline) |

These are the only three. If Tim agrees, he can roll them out by next Monday and the dashboard will retro-light those metrics on the next sync.

---

## Decisions Tim needs to make

### 1. HCP plan
Confirm **MAX at $299/mo**. Add **Campaigns add-on (~$80/mo)** — that unlocks the 1-yr-dormant tune-up reminder we want to hook the "Members renewing soon" / "Dormant 12+mo" segments into. Without Campaigns, the dashboard shows the lists; with it, HCP fires the emails/SMS automatically.

### 2. Hours / utilization data — pick path
Utilization is **10% of the score weight** today and unmeasured. Options:

- **Path A (recommended) — Weekly Timesheets CSV email.** Tim sets a recurring HCP export to a dedicated inbox; we ingest each Monday. Most accurate. Zero ongoing work for him.
- **Path B — Webhook timestamp proxy.** We compute "billable hours" from `work_timestamps.on_my_way_at` → `completed_at` per job. Less accurate (doesn't capture shop time, drive time gaps, lunch). Already half-built — webhooks endpoint shipped today.
- **Path C — Skip.** Keep utilization at 10% weight unmeasured; redistribute later if Tim doesn't care.

### 3. Threshold confirmation
Currently in Settings drawer:
- Sold threshold: **$110** (job is "sold" if invoice ≥ $110)
- Tune-up min ticket: **$175** (flag tune-ups below in red)
- Diagnostic min ticket: **$275** (flag diags below in red)

Tim adjusts these in Settings → Thresholds if shop targets differ. Live preview shows how grades shift.

### 4. Goal targets (NEW today)
Defaults shipped:
- Revenue/tech/month: $15,000
- Close rate: 55%
- Avg ticket: $400
- Callback rate (max): 3%
- Reviews per 100 jobs: 15

These drive the new Goal Progress widget. Sliders in Settings → Performance Goals.

---

## 8 questions for Tim

1. **Owner role rule** — should your own jobs ever appear in the field-tech leaderboard, or always stay in the Owner/Office band?
2. **Multi-tech credit** — when 2 techs are on a job, is it primary 100%, equal split, or lead-only on the score?
3. **Score formula priorities** — current weights (close 25 / rev 20 / ticket 15 / callback 10 / utilization 10 / membership 10 / reviews 5 / volume 5). Right for ICAC, or do you want to lean more service vs install?
4. **Dormant trigger window** — 1 year, 9 months, 18 months? Drives the "Dormant 12+mo" segment + Campaigns trigger.
5. **Review text override** — when a Google review says "Kleber" but the reviewer maps to a customer whose last job was someone else's, do we trust the text? (Current: yes, text wins.)
6. **Tech self-visibility** — should each tech get their own dashboard view (only their numbers), or is this owner-only?
7. **Alert thresholds** — what triggers an email/SMS to you? (e.g. "any tech under D for 7 days," "callback rate spike >5%," "any 1★ review").
8. **Goal cadence** — weekly per tech, monthly per tech, or shop rollup only?

---

## What's shipping today (in production now)

| Phase | Status | What it does |
|---|---|---|
| Phase 8 — Goal Progress | LIVE | Per-tech progress bars vs shop goals, color-coded, sorted by avg progress |
| Phase 4 — AI Chat | LIVE | Ask the dashboard anything — pulls HCP+D1 context server-side, MiniMax answers |
| Phase 6 — HCP webhooks | LIVE (endpoint) | `/api/webhooks/hcp` receives events, upserts to D1 in real-time. **Tim/we still need to register the webhook URL in HCP settings.** |
| Nav redesign | LIVE | Sticky control-center nav, scroll-spy section pills, control buttons (Ask / Settings / Sync / Out) |

To activate webhooks: in HCP → Settings → Webhooks, point to `https://www.icareaircare.com/api/webhooks/hcp?key=<HCP_WEBHOOK_SECRET>`. We need to set that secret as a Pages secret (`wrangler pages secret put HCP_WEBHOOK_SECRET`) and give the same value to HCP. Five-minute config job after the meeting.

---

## What's queued (Tim doesn't need to know unless he asks)

- Customer drill-down pages (Phase 11)
- Geospatial heatmap (Phase 12)
- Auto-campaign reporting (Phase 9, next week)
- Weekly digest email (Phase 10, next week)

## What's de-prioritized

- Phase 5 hours/utilization — pending Tim's path A/B/C decision above
- Phase 7 multi-year sync — 90 days is enough for now
- Phases 13/14/15 — not needed
