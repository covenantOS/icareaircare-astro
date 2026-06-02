# Draft reply to Tim — 2026-06-01

Subject: **Re: Dashboard — found your hours bug (fixed), built the call-by-call view, and I think I know why revenue doesn't match HCP**

---

Tim,

Great batch of questions — a couple of these were genuinely important. All fixed and live now. Walking through them in your order:

**1. If I edit a job in HCP and resync, does the app update?**

Yes. When you change a job in Housecall Pro — retag it, fix the tech, adjust the invoice — and then hit "Sync now," the app re-pulls that job and overwrites its old copy: job type, revenue, who's assigned, tags, all of it. So the workflow we talked about (retag a converted diagnostic as "Install" in HCP → resync → it moves to the Install bucket in the app) works exactly like you'd hope. One caveat: the sync looks back about 90 days, so editing a very old job won't re-pull it — but anything recent will.

**2. Can I move/reclassify a tech if he gets promoted?**

Yes — new this week. Open any tech's scorecard and you'll see a **"Band"** dropdown right under their name. Switch them between Service tech / Install tech / Install helper / Office / Owner. The moment you change it, the app re-grades them against the right peer group (service techs vs service techs, etc.). So when a helper gets bumped to install tech, just flip the dropdown.

**3. The hours upload wiping the previous tech — that was a real bug. Fixed.**

You found a legitimate data-loss bug, and you diagnosed it perfectly. Here's what was happening: when you uploaded a second tech's hours, the app was clearing *everyone's* hours for that date range before adding the new ones — so the first tech's hours vanished. That's fixed now. You can upload one tech at a time and they'll stack up correctly, or do them all in one CSV — either way works. Re-uploading the same tech still cleanly replaces just his numbers. **Worth re-uploading the ones you already did, since the earlier ones got wiped.**

**4. Seeing the actual calls a tech is credited for — and why revenue doesn't match HCP.**

This is the big one, and I built exactly what you asked for. On any tech's scorecard:
- The **Jobs** and **Revenue** cards are now clickable.
- There's a row of buttons — **All jobs / Tune-ups / Diagnostics / Estimates / Installs / IAQ** — and clicking any of them opens a list of *every call that tech is credited for*, with the customer name, the job type, whether it sold, the **full ticket**, and **the portion credited to that tech**.
- There's a **Copy CSV** button so you can pull the list into a spreadsheet and lay it next to your HCP report line by line.

**And while building it, I think I found why your numbers don't match HCP.** Here's a real example from the app right now — Erick, last 30 days:
- The full value of every job he touched: **$53,546**
- What the dashboard credits him: **$31,809**
- The difference — **$21,736 — went to his co-techs on shared jobs.**

That's the key thing: **when two techs are on one job, the dashboard splits that job's revenue between them** (so the shop total stays right and nobody's double-counted). If HCP's report instead gives the *whole* ticket to one tech — or to whoever's marked the seller — your per-tech numbers will be higher than ours, and the gap will be exactly the shared-job revenue. The new drill-down shows both numbers side by side (full ticket vs credited share) so you can see precisely where every dollar goes.

That tees up the sit-down perfectly. If you pull a tech's "by job" report out of HCP for a given month, and I open that same tech's drill-down for the same month, we can walk down the two lists together and reconcile every line — and decide whether you want shared jobs **split** (current) or **fully credited to the lead/seller**. That's a real choice and I can build it either way once we've looked at a few together.

One more thing the drill-down already surfaced: Erick has a **$9,270 job tagged "Estimate"** that's split 4 ways. A $9k estimate is almost certainly a sold install that's mis-tagged in HCP — exactly the kind of thing the call-by-call view is built to catch. Worth a look when we sit down.

**I'm ready whenever you are for that sit-down — and honestly the new drill-down + CSV export is the perfect prep. Pick a tech and a month, grab the HCP report, and we'll reconcile it together.**

Thanks Tim — keep the bugs and questions coming, this is exactly how it gets sharp.

Talk soon,
Will
