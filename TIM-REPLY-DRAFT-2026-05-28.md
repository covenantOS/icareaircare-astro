# Draft reply to Tim — 2026-05-28

Subject: **Re: Dashboard feedback — fixes are live, answers to your questions, one thing I need from you**

---

Tim,

This made my week — genuinely. Hearing the TV ad and the chat bot are driving calls, and that the difference is *trying things* instead of making excuses, is exactly why we do this. Thank you. Let's keep it rolling.

Worked through your whole list. Most of it is fixed and live now — **click "Sync now" once when you get a chance** (a couple of these only take full effect after a fresh sync, noted below).

## Fixed and live

**The timesheet upload that "did nothing."** I found the problem: the file you dropped in almost certainly came out of Housecall Pro as **Excel**, and the dashboard only reads **CSV** — but it failed silently instead of telling you. Now:
- If you drop an Excel or PDF, it says so in plain English and tells you to choose "Export to CSV" in HCP.
- On success you get a big green banner showing how many rows matched, which columns it read, and any names it couldn't match.
- There's a "Remove" button on each upload so you can undo a bad one.

**To get hours working:** in HCP, run the Time Tracking report → **Export to CSV** (not Excel) → drag that .csv onto the Hours box. The Hours and $/Hr columns on the leaderboard will light up.

**Customer names on the tech page.** The "Top jobs by ticket" table now shows the **customer name** (with the job number as a small line underneath) instead of just the job number.

**Custom date range on the tech scorecard.** The window selector now has This month, Last month, and a Custom from/to range — same idea as the main dashboard. Pick a range and the whole scorecard + AI coaching update to match. (You asked whether it could be custom OR match the main screen — went with custom, which covers both.)

**1-page printable scorecard.** There's a "🖨 Print / PDF" button on each tech page. It lays out the stats + AI coaching cleanly on one page with a header (tech name, date range, print date). Use your browser's "Save as PDF" to keep a copy.

**Fewer jobs in "Other."** I taught the classifier a lot more of your real job descriptions — coil pulls, callbacks, follow-ups, dryer-vent, permits, part pickups, etc. Permits/pickups/office runs now go into a new **"Admin"** bucket (non-billable visits) so they stop muddying "Other." **This only re-tags jobs on the next sync**, so after you hit "Sync now" the Other number should drop noticeably. (More on the remaining Other below.)

**Removing techs who left.** When HCP marks an employee inactive/deleted, our next sync flags them, and they drop off the leaderboard automatically once they have no jobs left in the date window you're viewing. If one still shows (because they did work earlier in the window), they now get a red **"former"** badge so you know. Nothing for you to do — it's automatic.

## Answers to your questions

**"Completed" or "scheduled" date?** Everything counts off the **job-completed date**. A job that's scheduled but not yet marked complete in HCP won't count toward a tech until it's completed. (This matters for the install question below.)

**The install/sales issue — Jennifer vs Kirschner.** I dug into both jobs. Here's what's happening:
- **Kirschner** is tagged **"Install - system"** in HCP, so it correctly shows as an install and splits to the install crew.
- **Jennifer Roussau's job is tagged "Diagnostic" in HCP** (not Install), even though it was a ~$14.7k replacement. So the dashboard files it under Diagnostic, not Install — which is why it didn't show in the install call-type count, and why the sales/install split didn't behave like an install.

This is the #1 thing on your side that'll sharpen the numbers: **when a diagnostic turns into an install/replacement, change the job's tag (or type) to Install in HCP.** Do that and it'll land in the right bucket, credit the installer correctly, and — combined with the next point — credit the salesperson.

**Why sales credit still isn't landing on the salesman.** Two things have to be true for an install's sale to credit Kleber (or whoever sold it):
1. The job is classified as an **Install** (see Jennifer above), and
2. The **salesperson is added as an assigned employee on that install job** in HCP (alongside the install crew).

If only Cesar/Daniel are on the install in HCP, the dashboard only knows the installers — it has no way to see who sold it. So the move is: on every install, assign **both** the installer(s) **and** the person who sold it. Then "Sold $" credits the seller and "Installed $" credits the crew. I know that's a workflow change — tell me if it's a pain and we'll find a lighter way.

**Call volume math.** You nailed a real flaw. Right now the per-day figure is roughly total jobs ÷ active techs, which is unfair to install crews (2 techs on 1 big job all day vs. a service tech doing 4 stops). I'd like your help defining "a fair day" for an install tech vs a service tech — once I know that, I'll split the per-day math by role so it's accurate. Send me how you think about it.

**Callbacks — by job type or tags?** By **tags**. Any job whose tags include callback / warranty / recall is counted as a callback against that tech. So the callback number is only as good as the tagging — if a callback isn't tagged, we don't see it.

**What's in "Other"?** Before this week: IAQ/duct jobs, permits, part pickups, follow-ups, callbacks with empty tags, and anything whose description didn't match a known pattern. After the classifier update + your next sync, most of those move into Tune-up / Diagnostic / IAQ / Install / Admin. Whatever's *still* in Other after that is genuinely miscellaneous — send me a few examples and I'll teach it those too.

## The one thing I need from you

**Care plans / maintenance agreements — yes, we can absolutely track these per tech, and your tag system is exactly how.** Send me the **exact list of tags** you use for care plans — both the "customer IS a member" tag and, if you have one, the "tech SOLD a new care plan on this visit" tag. With those I'll add a "Care plans sold" column to each tech's scorecard so you can see who's actually signing people up. (Right now I only detect "Care plan member - YES" generically — I need your real tags to do it properly.)

## Quick recap of what to do on your end
1. **Click "Sync now"** — activates the better job classification (shrinks "Other") and refreshes everything.
2. **Re-export Time Tracking as CSV** (not Excel) and drop it on the Hours box.
3. **Tag converted installs as "Install"** in HCP, and **add the salesperson as an assigned employee** on install jobs.
4. **Send me your care-plan tag list.**

Everything else is done. Thanks again, Tim — this is fun to build because you actually use it and tell me what's real.

Talk soon,
Will
