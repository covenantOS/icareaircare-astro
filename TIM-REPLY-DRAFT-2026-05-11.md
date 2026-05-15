# Final draft reply to Tim — 2026-05-11 (rev 3, fully researched)

Subject: **Re: Dashboard feedback — what's fixed, what HCP supports, what we have to work around**

---

Tim,

Good catches — these were all real issues. Pushed fixes this morning; click "Sync now" once when you get a chance and you'll see the difference.

Before I sent this reply I went into HCP's actual API and inspected a real job, a real estimate, and the line-items endpoint, so my answers below are from looking at the data — not from guessing. Two of my earlier ideas turned out to be wrong; I'll flag those as I go.

---

**What's fixed and live right now:**

**1. Multi-tech credit.** The "Erick 11 vs 13" bug — the dashboard was only crediting the *primary* tech HCP picks on each job, so any job where Erick was the second tech vanished from his count. Now every assigned tech gets credit. Revenue is split equally between assigned techs so the shop total stays right (a $5K two-tech install = $2,500 to each on the leaderboard, $5K to the shop total). You'll see a small "+2 shared" hint next to job counts so it's obvious which were multi-tech.

**2. Estimates.** You were right — most ICAC estimates live at HCP's separate `/estimates` endpoint (~2,785 records). The sync was only pulling `/jobs`. It now pulls both, so estimate counts will jump from "4 in 30 days" to whatever's actually being done after next sync.

**3. Service vs Install bands.** Leaderboard splits into Service techs (Erick, Kleber, Gerald, James), Install techs (Cesar, Daniel), Install helpers (Angel — Paul once he's added), and Owner/Office. Each band ranks against itself only. I seeded the labels from your email; I'll add a toggle in Settings so you can re-band anyone yourself.

**4. Bigger fonts.** Bumped ~12-15% across the board. Tell me where if anything's still hard to read.

---

**Kleber's install case — what I found in HCP**

This is the most important thing in this email. After fix #1 above, Kleber still won't show on his installs because *he wasn't on the job in HCP* — only Cesar/Daniel were assigned to do the work. That's a sales-credit problem, not a multi-tech problem.

Here's what I confirmed by inspecting the actual API:

- **HCP's UI has a "Sold By" field on each line item.** You can set it manually in the job details and HCP's own Commissions Report uses it.
- **The public API does NOT expose Sold By.** I pulled the `/jobs/{id}/line_items` endpoint and the response includes `name`, `unit_price`, `kind`, `quantity`, `service_item_id`, `duration_in_minutes`… and nothing about who sold it. The field is UI-only. So even if your team is religiously setting Sold By in HCP today, the dashboard cannot read it.
- **Jobs do carry an `original_estimate_id`** that points back to the estimate they came from, but it's HCP's internal estimate-option ID — those return 404 on the public `/estimates/{id}` endpoint. Only standalone estimates (the `/estimates` list with `csr_` IDs, which our sync now pulls) carry the salesperson cleanly. So estimate→job walk works for *some* installs but not all.

So we need a convention the dashboard can actually see. Two clean options — both easy to teach the team:

**Option A — Add the salesperson as a second assigned employee on the install job.** When Kleber sells an install, when CSR books the install for Cesar, they also assign Kleber to the job. Cesar = installer, Kleber = sales. The dashboard reads `assigned_employees` (which we already do) and splits credit by role band. No new fields, no new tags. Uses HCP's existing multi-tech assignment.

**Option B — Tag the install job at close.** Team adds a tag like `Sold by Kleber` (or just `Sold by KT`) when closing the install. Dashboard reads the tag. Slightly more friction at close, but more flexible if the salesperson isn't a current HCP employee.

I lean Option A — it's one click during scheduling and matches your existing workflow. If you go that route I'll split the leaderboard into "Sales rev" and "Install rev" columns automatically, no further setup needed. **Which do you want?**

---

**HCP and time tracking — what I confirmed**

You mentioned the guys are clocking in/out in HCP. I probed every plausible API endpoint — `/timecards`, `/timesheets`, `/time_entries`, `/employee_hours`, `/timeclocks`, etc. **All return 404. HCP does not expose clock-in/out data through their public API at all.** The data exists in HCP's UI (and in their Commissions Report and Payroll views), but it's locked inside.

Two real paths forward:

- **Path A (recommended):** HCP can email a weekly Time Tracking CSV to a shared inbox. I auto-ingest it Monday morning. We get true clock-in/out, drive time, on-job time, idle gaps — all the way to revenue-per-hour-worked per tech. Most accurate. Zero ongoing work for you after setup.
- **Path B (fallback):** I compute time from each job's own `work_timestamps` — `on_my_way_at` → `started_at` → `completed_at`. We already pull these. Less accurate (misses shop time, lunch, drive between unscheduled stops) but works with no HCP-side config.

My pick is A. If you want me to write the steps to set up the weekly Time Tracking export, I will.

---

**The two remaining decisions I need from you:**

**Q1 — Industry-anchored grades?**

Right now grades are peer-relative: Erick at 53% close rate gets a B because he's beating the median of *your* service techs. You said you wanted industry averages — if I switch, his 53% reads as a D against the industry's 67-75% top quartile. Honest but harsh.

My pitch: **show both side-by-side.** Peer score (inside ICAC) and Industry score (vs the rest of the world) on each tech row, both visible. Yes/no?

**Q2 — Reviews check workflow?**

We pull all 706 Google reviews and try to attribute reviewer-name → HCP customer → most-recent-job → tech. About 60% attribute cleanly. For the other 40%, do you want a small review-attribution screen where unattributed reviews show with a dropdown for you to pick the tech, or leave those alone?

---

**Where I'm at on your 8-step plan:**

1. ✅ **Jobs assigned to correct techs** — fixed today via multi-tech credit (this is the "ones they did" piece)
2. ✅ **Correct job types** — much better with `/estimates` ingested; still relies on team using Callback / Membership Pitch consistently
3. ⏳ **Sales revenue to who sold it** — needs your Option A vs B decision above. This is the Kleber case.
4. ⏳ **Work commission to who did the job** — falls out of #3 once Option A or B is picked
5. ⏳ **Reviews input/check** — Q2 above
6. ⏳ **Tech hours / drive time / revenue per hour** — Path A or B above (HCP has no time API, confirmed)
7. ⏳ **Each tech's total sales** — one-column add once #3 is decided
8. ⏳ **Industry-anchored grades** — Q1 above

Three decisions on the table: A-vs-B for sales credit, Path-A-vs-B for hours, and the two yes/no questions. Once those land I can finish the remaining items by end of next week.

Talk soon,

Will
