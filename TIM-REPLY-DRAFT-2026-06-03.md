# Draft reply to Tim — 2026-06-03

Subject: **Re: Lina job fixed + here's how I set up sales-vs-installer credit (take a look)**

---

Tim,

Both things you raised are sorted — and the install-credit question is exactly the right one. Details:

**The Lina job — fixed. It shows as an install now.**

Good catch, and it was a real bug on my end (two, actually):
1. When you reclassified it, the old **"Estimate" tag was still on the job** alongside the new "Install - system" tag. My code was reading tags in order and stopping at the first one it recognized — so "Estimate" won before it ever got to "Install - system." I changed it so **install always beats a leftover estimate tag** (if the work got installed, it's an install, period).
2. You also set the job *type* to "Install" in HCP the right way — but my code was looking in the wrong spot for that field and missing it. Fixed; now I read HCP's job type first, since that's the most reliable signal of what you intend.

So **yes — it tracks your "Install - system" tag now**, and it also respects the HCP job type when you set it. Either one will land the job in the install bucket. I re-synced and Lina is now an install (the by-call-type count went from 1 install to 4 — a few others had the same stale-tag problem and corrected themselves).

Heads up: on the next full sync, any other jobs sitting with an old "Estimate" tag that were really installs/tune-ups will reclassify too — so your estimate count will drop and installs/tune-ups will rise. That's correct, just don't be surprised by the shift.

**Sales vs installer credit — I built it the way you leaned, take a look:**

Your instinct was right, and it solves the double-counting worry cleanly. Here's how it now works:

- **The salesperson gets 100% of the sale.** Erick sold Lina's $9,270, so the full $9,270 lands in Erick's "Sold $." No splitting. Across the shop, Erick's now showing **$52,328 sold** in the last 30 days.
- **The installer gets a separate "installed" credit that does NOT touch the money totals.** Cesar shows **$41,896 across 4 installs** under "Installed" — that's an operational number (how much he's installing), deliberately kept out of the sales totals so it never double-counts.
- I confirmed the math: total Sold across all techs equals the shop's total revenue to the dollar ($148,103). So crediting the seller the full amount didn't inflate anything — which was your main concern.

That's your "give the installer credit but not toward money totals" idea, built. Erick's sales are whole; Cesar's install volume is visible; the shop total is untouched.

**The one open piece — telling the lead installer apart from the others.**

On Lina there were four guys: Erick (sold), Cesar (lead install), Daniel (future installer learning), Paul (helper). Right now Erick correctly gets the sale, and **everyone who worked the install gets install credit** — which means Cesar shows it, but so do Daniel and Paul. Cesar's number is right; the issue is Daniel and Paul ride along on it too.

To single out **just the lead** (Cesar) the way you want, I need one signal from HCP. Easiest options:
- **(a)** Set the lead installer as the *primary* tech on the install job in HCP, or
- **(b)** A tag like `Lead installer` on the person who led it, or
- **(c)** Your "points" idea — lead gets the install value, the others get a participation count (Daniel "assisted 4 installs", Paul "helped on 4") so you still see who's developing, without it muddying the lead's number.

I lean (c) combined with (a) — but this is a perfect thing to settle at lunch Monday. Tell me which feels right and I'll wire it.

Everything above is live now — pull up Erick and Cesar and you'll see it. **See you Monday** — I'll bring the laptop and we'll lock down the lead-installer piece + walk a couple techs' numbers against HCP.

Thanks Tim,
Will
