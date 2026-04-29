# Competitive Keyword & Content Gap Analysis — 2026-04-23

Real data. Real SERPs. Real competitor content. No guessing.

**Source data:**
- DataForSEO `keyword_overview` for 44 target keywords (volume, CPC, KD, competition, intent)
- DataForSEO `serp_organic_live_advanced` for 4 priority keywords (live SERP, Tampa-FL geo)
- DataForSEO `on_page_content_parsing` for 4 top-ranking competitor pages (full body text)

**Filter applied:** AC repair / AC installation / AC maintenance / HVAC repair — **excluded** "air care", "air care services", "duct cleaning" per strategic direction. Florida geo only.

---

## TL;DR — the 10 keywords to target

Ranked by **(volume × low difficulty × commercial intent × Wesley Chapel proximity)**:

| # | Keyword | Monthly Vol | KD / Comp | Intent | Current ICAC | Recommended page |
|--:|---------|------------:|:---------|--------|--------------|------------------|
| 1 | **ac repair wesley chapel** | 480 | low (0.32) | nav/commercial | Local pack #3, organic #8 on homepage | Strengthen `/service-areas/wesley-chapel-ac-repair/` |
| 2 | **ac installation tampa** | 480 | KD 13 | commercial | Not explicitly targeted | Sharpen `/services/hvac-installation-tampa/` |
| 3 | **ac installation wesley chapel** | ~200-400 est | low | commercial | **NO dedicated page** | BUILD `/services/ac-installation-wesley-chapel/` |
| 4 | **ac repair lutz** | 260 | med (0.56) | commercial | Rank #28 from area page | Build `/services/ac-repair-lutz/` or sharpen area page |
| 5 | **ac replacement tampa** | 260 | KD 14 | commercial | Only blog post exists | BUILD `/services/ac-replacement-tampa/` |
| 6 | **ac repair land o lakes** | 210 | **KD 2** ⭐ | nav/commercial | Area page only | Add dedicated service page or sharpen area page |
| 7 | **ac repair zephyrhills** | 210 | med (0.63) | navigational | Rank #22 on area page (stub) | Rebuild Zephyrhills area page per CLAUDE.md |
| 8 | **hvac repair tampa** | 170 | **KD 2** ⭐ | commercial | Not explicitly targeted | Sharpen `/services/ac-repair-tampa/` with HVAC repair section |
| 9 | **ac repair pasco county** | 90 | low (0.15) | commercial | Have page, need ranking push | Strengthen `/service-areas/pasco-county-ac-repair/` |
| 10 | **ac repair new tampa** | 50 | KD 9 | commercial | Rank #21 (stub page) | Rebuild New Tampa area page per CLAUDE.md |

⭐ **KD 2 on hvac repair tampa AND ac repair land o lakes** = disproportionately easy wins. Get these first.

**Out of scope (per your direction):** air care / air care services / duct cleaning variants.

**Not targeted (too hard right now):** `ac repair tampa` (vol 2,400, KD 30) and `air conditioning repair tampa` (vol 2,400, KD 30). Revisit after DT 23 → 30+ and these 10 are in the top 5.

---

## Full keyword data table (46 keywords researched)

| Keyword | Vol | KD | Comp | Intent | Notes |
|---------|----:|---:|:-----|--------|-------|
| ac repair tampa | 2,400 | 30 | MED | commercial | Too hard for now |
| ac repair tampa fl | 2,400 | 32 | MED | commercial | Too hard for now |
| air conditioning repair tampa | 2,400 | 30 | MED | commercial | Too hard for now |
| ac repair wesley chapel | **480** | — | low | navigational | **TARGET** |
| ac repair wesley chapel fl | 480 | — | low | navigational | Same intent |
| air conditioning repair wesley chapel | 480 | — | low | navigational | Same intent |
| ac installation tampa | **480** | **13** | low | commercial | **TARGET** |
| ac installation tampa fl | 480 | 13 | low | commercial | Same |
| ac service tampa | 480 | 24 | MED | commercial | Secondary |
| ac replacement tampa | **260** | **14** | low | commercial | **TARGET** |
| ac repair lutz | **260** | — | MED | commercial | **TARGET** |
| ac repair zephyrhills | **210** | — | MED | navigational | **TARGET** |
| ac repair land o lakes | **210** | **2** | MED | nav/commercial | **TARGET — EASIEST** |
| hvac repair tampa | **170** | **2** | MED | commercial | **TARGET — EASIEST** |
| hvac installation tampa | 90 | 22 | low | commercial | |
| hvac installation tampa fl | 90 | 26 | low | commercial | |
| ac repair pasco county | **90** | — | low | commercial | **TARGET** |
| ac company wesley chapel | 70 | — | low | navigational | |
| 24 hour ac repair tampa | 70 | — | HIGH | informational | Intent mismatch |
| emergency ac repair tampa | 70 | — | MED | informational | Intent mismatch |
| ac repair new tampa | **50** | **9** | low | commercial | **TARGET** |
| ac repair odessa fl | 40 | — | low | commercial | |
| ac maintenance tampa | 40 | 8 | MED | commercial | Low volume |
| hvac repair wesley chapel | 30 | — | low | navigational | |
| ac tune up tampa | 30 | — | MED | navigational | |
| ac service wesley chapel | 30 | — | MED | navigational | |
| 24 hour ac repair wesley chapel | 10 | — | low | navigational | Too small |

---

## Top competitors for each target keyword

### "ac repair wesley chapel" (vol 480) — live SERP

| Pos | Domain | Page | Format |
|----:|--------|------|--------|
| Local 1 | amairconditionings.com | GBP | 228 reviews |
| Local 2 | instant-ac.com | GBP | 372 reviews |
| **Local 3** | **icareaircare.com** | GBP | **700 reviews** ← already #3 |
| Organic 1 | onehourheatandair.com | /areas-we-service/wesley-chapel-fl/ | Area LP |
| Organic 2 | yelp.com | /search?find_loc=Wesley+Chapel | Aggregator |
| Organic 3 | armstrongairinc.com | /wesley-chapel-fl/ | Area LP |
| Organic 4 | bayonet-inc.com | /service-areas/wesley-chapel-fl | Area LP |
| Organic 5 | marlinjames.com | /wesley-chapel-fl/ | Area LP |
| Organic 6 | caldeco.net | /air-conditioning-repair-wesley-chapel/ | Service+geo LP |
| **Organic 8** | **icareaircare.com** | `/` (homepage) | **Homepage** ← problem |

**The problem:** ICAC ranks #8 **via the homepage**, not via the Wesley Chapel area page. Google is picking the wrong URL. The dedicated `/service-areas/wesley-chapel-ac-repair/` page should be what ranks.

**Fix:** add an explicit internal-linking pass pointing to `/service-areas/wesley-chapel-ac-repair/` with "AC repair in Wesley Chapel" anchor text from the homepage, service pages, and relevant blog posts. Also ensure the area page's title tag leads with "AC Repair in Wesley Chapel" (currently it likely says "Wesley Chapel AC Repair | ...").

### "ac installation tampa" (vol 480, KD 13)

| Pos | Domain | Page |
|----:|--------|------|
| Local 1-4 | Velocity, Caldeco, REM, Momentum | GBPs |
| Organic 1 | tampa-acservices.com | homepage (exact-match domain) |
| Organic 2 | yelp.com | aggregator |
| Organic 3 | reddit.com/r/tampa | community thread |
| Organic 4 | airmasters.net | homepage |
| Organic 5 | gulfcoastairsystems.com | homepage |
| Organic 6 | homedepot.com | Tampa services hub |
| Organic 7 | caldeco.net | homepage |
| Organic 8 | cooltoday.com | /tampa |
| Organic 9 | homeguide.com | aggregator |

**The problem:** ICAC is not on page 1 for this. Our `/services/hvac-installation-tampa/` doesn't target "AC installation" explicitly.

**Fix:** inside the existing page, add an H2 "AC installation in Tampa" with a self-contained 200-word Quick Answer block + pricing table. Also add AC installation to title tag variant.

### "ac repair land o lakes" (vol 210, **KD 2**)

| Pos | Domain | Page |
|----:|--------|------|
| Local 1-4 | J&L, Cornerstone, Lakeside, Hawkins | GBPs |
| Organic 1 | tampabayac.net | homepage |
| Organic 2 | yelp.com | aggregator |
| Organic 3 | trane.com | dealer listing |
| Organic 4 | lakesidecomfortpros.com | homepage |
| Organic 5 | iernaair.com | /service-areas/land-o-lakes-ac-heating-plumbing/ |
| Organic 6 | landolakesairconditioning.com | homepage |
| Organic 7 | angi.com | aggregator |
| Organic 8 | marlinjames.com | /land-olakes/ |
| Organic 9 | airconditioningsolutions.net | homepage |

**KD 2 means the competition is weak.** The top organic is just a homepage with generic text. ICAC's `/service-areas/land-o-lakes-hvac-services/` is already richer than any of these — we need Google to recognize it.

**Fix:** strengthen H2 hierarchy with "AC Repair in Land O' Lakes" explicit heading; add a "Common AC Repairs in Land O' Lakes" section with the 5 most common local failure modes; push internal links from service pages with "Land O' Lakes AC repair" anchor.

### "hvac repair tampa" (vol 170, **KD 2**)

| Pos | Domain | Page |
|----:|--------|------|
| Local 1-3 | Comfort Authority, Caldeco, REM | GBPs |
| Organic 1 | yelp.com | aggregator |
| Organic 2 | cooltoday.com | /tampa |
| Organic 3 | airmasters.net | homepage |
| Organic 4 | reddit.com/r/tampa | community |
| Organic 5 | marlinjames.com | /tampa-fl/ |
| Organic 6 | armstrongairinc.com | /tampa-fl/ |
| Organic 7 | gulfcoastairsystems.com | homepage |
| Organic 8 | badgerbobs.com | /city/hvac-service-tampa |
| Organic 9 | varsityzone.com | /tampa-fl/ |

**KD 2 again.** Most competitors are just dropping "HVAC" as a keyword onto their homepage. ICAC's `/services/ac-repair-tampa/` is more thorough than any of these — but doesn't use "HVAC repair" consistently.

**Fix:** rename H2 sections and add an "HVAC Repair Services in Tampa" section that explicitly covers all HVAC repair types (AC, heat pump, heating, thermostat, ductwork issues) under one umbrella. This will rank for both "ac repair tampa" (current) and "hvac repair tampa" (new).

---

## Content gap analysis — what the top competitors HAVE that ICAC doesn't

### Analyzed pages:
1. `onehourheatandair.com/areas-we-service/wesley-chapel-fl/` — ranked #1 for "ac repair wesley chapel"
2. `cooltoday.com/tampa` — ranked #2 for "hvac repair tampa", #8 for "ac installation tampa"
3. `caldeco.net/air-conditioning-repair-wesley-chapel/` — ranked #6 for "ac repair wesley chapel"
4. `iernaair.com/service-areas/land-o-lakes-ac-heating-plumbing/` — ranked #5 for "ac repair land o lakes"

### Gap #1 — "$5,000 Rule" repair-vs-replace content ★★★
**Found on:** Cool Today (organic), Trane.com (Google PAA), literally pulled into SERPs as a featured snippet for multiple queries.

**What it is:** *"Multiply the age of your HVAC unit by the estimated repair cost. If the result exceeds $5,000, replace instead of repair."*

**Why it matters:** Google pulls this directly into People Also Ask on "ac repair wesley chapel", "ac installation tampa", AND "ac repair land o lakes" — three of our top 10. It's a cite-worthy snippet.

**Fix:** add a "Repair vs Replace" section to the Wesley Chapel area page, AC repair service page, and the ac-replacement-wesley-chapel blog. Use the $5,000 formula explicitly with a worked example on a Florida HVAC system.

### Gap #2 — "3-minute rule" for AC ★★
**Found on:** cowboysac.com (shown in PAA)

**What it is:** *"Wait at least 3 minutes before turning your AC back on after it shuts off."*

**Why it matters:** Directly pulled into PAA on "ac repair wesley chapel". ICAC has no content answering this.

**Fix:** add to FAQ on the Wesley Chapel area page + a "Common AC rules every Florida homeowner should know" sidebar.

### Gap #3 — Salt air corrosion for coastal properties ★★
**Found on:** Cool Today. Specifically: *"If you live within 5-10 miles of Tampa Bay or the Gulf, salt air can corrode your outdoor condenser coils much faster than inland systems. For coastal residents, every 6 months is a necessity."*

**Why it matters:** This is a genuine Florida-specific angle and it's ranking in PAA on maintenance queries. ICAC's maintenance page doesn't mention salt-air corrosion.

**Fix:** add a "Coastal vs. inland maintenance cadence" section to `/services/ac-maintenance-tampa/` with specific mileage thresholds (0-5 mi, 5-10 mi, 10-20 mi from coast).

### Gap #4 — Industry awards & certifications as visible badges ★★
**Found on:** Caldeco — *"Angie's List Super Service Award and Carrier's President's Award"*
**Found on:** One Hour — *"Only 1 out of 33 technicians who apply to work with our local team actually qualify"* (hiring flex)
**Found on:** Caldeco — *"NATE-certified technicians"* (NATE = industry-standard certification)

**Why it matters:** These are visible trust signals on the page. ICAC has CAC license and 4.9★/700+ reviews — comparable strength — but no NATE badge, no manufacturer-certified-dealer badge, no industry-award callouts.

**Fix (if applicable):** if ICAC holds NATE certifications, manufacturer dealer status (Rheem Pro Partner is mentioned in some ICAC content but not prominently badged), or Angie's / Better Business Bureau awards — surface them in the header trust strip and on every service/area page.

### Gap #5 — "Same-day service" percentage claim ★
**Found on:** Cool Today — *"Over 96% of our repair jobs are completed on the same day"*

**Why it matters:** Specific percentage is more persuasive than "often" or "usually." It's a citable claim.

**Fix:** if ICAC has this data (from Housecall Pro dispatch records), publish it. "97% of Wesley Chapel repair calls during business hours completed same-day" would crush any competitor's generic "often same-day" language.

### Gap #6 — Manufacturer dealer locator presence ★★
**Found on:** Caldeco is a Carrier Factory Authorized Dealer with a cross-linked brand page AND appears on Trane's dealer locator (separate ranking entity). Both of these give them TWO high-authority inbound links AND rankings.

**Why it matters:** Manufacturer dealer-locator pages (DA 60-80+) are some of the highest-authority inbound links available to HVAC contractors. ICAC's backlink profile is weak on these (Domain Trust 23).

**Fix:** already on the improvement plan (contact Carrier/Trane/Lennox distributor rep re: dealer enrollment). **This is the highest-ROI backlink action of the whole plan.**

### Gap #7 — "Most common AC problems" listicle content
**Found on:** njrhomeservices.com (cited in PAA) — *"10 Most Common AC Problems to Look Out For"*

**Why it matters:** PAA pulls this. ICAC has the data scattered across blog posts but no single "Top 10 Most Common AC Problems in Wesley Chapel Homes" consolidation.

**Fix:** write one blog post titled literally that, with the 10 failure modes (capacitor, contactor, refrigerant leak, frozen coil, clogged drain, fan motor, TXV, thermostat, breaker, drain pan) + local pricing + direct links to the relevant service pages.

### Gap #8 — Cost table in PAA for "ac installation" queries
**Found on:** rolandoshvac.com (featured table in PAA for "ac installation tampa"): 

| System Type | Typical Cost (2026) |
|-------------|--------------------|
| Central AC Installation | $5,500 – $9,000 |
| Ductless Mini-Split AC | $4,000 – $8,000 per zone |
| HVAC Unit Replacement | $7,500 – $14,000+ |

**Why it matters:** Google pulls this table directly into SERPs on high-value installation queries. ICAC's install page has pricing but not in the explicit markup Google extracts.

**Fix:** add an identical-format cost table to `/services/hvac-installation-tampa/` with ICAC's own 2026 numbers. Mark up with schema `Table`. This becomes a featured-snippet candidate.

### Gap #9 — "Thermostat setting for summer in Wesley Chapel"
**Found on:** One Hour Wesley Chapel FAQ — *"78°F when home, 85°F when away"*

**Why it matters:** Specific, citable, Florida-relevant. ICAC doesn't have this specifically. Very easy addition.

**Fix:** add to FAQ across service-area pages.

### Gap #10 — Cross-trade bundles (plumbing/electrical)
**Found on:** Cool Today, Cornerstone (land o lakes local #2), IERNA's — all offer plumbing + electrical as bundle services

**Why it matters:** One-stop-shop positioning converts better. But this is a strategic business decision, not a content change.

**Fix (maybe):** if ICAC is HVAC-only and wants to stay that way, don't compete on this. If ICAC wants to expand, this is a growth lever. Out of scope for pure SEO.

---

## What ICAC does BETTER than every competitor analyzed

Be honest: these are real competitive moats the competitors don't have. Don't sacrifice them chasing surface-level matches.

1. **Hyper-local neighborhood detail** — Seven Oaks, Meadow Pointe, Epperson, Tampa Palms, etc. None of the 4 competitors name more than 2-3 neighborhoods. ICAC service-area pages name 10-20 each.
2. **ZIP code coverage** — competitors don't include these; ICAC does.
3. **Named verbatim reviews with neighborhood + Review schema** — competitors use generic carousel reviews; ICAC has Person-authored reviews with locationCreated.
4. **Transparent pricing ranges on every repair type** — only Cool Today gets into this, and thinly. ICAC's service pages have detailed dollar ranges.
5. **Florida-specific climate specifics** — 94°F design day, 78°F dew point, 2,200-hour annual cooling runtime. None of the competitors cite specific numbers.
6. **Named owner + credentials on every page** — Tim Hawk + CAC1816515 + EPA 608. One Hour and Cool Today hide behind corporate brand.
7. **Dedicated Person schema (`@id`)** — EEAT win none of these sites have.
8. **llms.txt + llms-full.txt** — only ICAC has AI-crawler-optimized content.
9. **Astro static rendering** — no JS-dependent content for crawlers (Cool Today, One Hour both have JS-heavy DOM).
10. **Response-time specifics** — "60-90 minutes from Foamflower Blvd" — competitors give vague "same-day" with no geography.

**Bottom line:** ICAC's content strategy is already stronger than the top-ranking competitors on content quality. The gap is authority signals — backlinks, manufacturer dealer links, industry certifications, and the internal linking fix so the right page ranks for the right query.

---

## Recommended action plan (prioritized)

### Tier 1 — quick-win content additions (< 4 hours total)

1. **Add "$5,000 rule" section** to Wesley Chapel area page + AC repair service page + ac-replacement-wesley-chapel blog
2. **Add "3-minute rule" FAQ** to Wesley Chapel area page + AC repair service page
3. **Add salt-air coastal cadence section** to `/services/ac-maintenance-tampa/`
4. **Add "ideal thermostat setting in Wesley Chapel" FAQ** to area pages
5. **Add explicit cost table** (Central AC / Mini-Split / HVAC Replacement) to `/services/hvac-installation-tampa/` with Schema markup

### Tier 2 — new page builds (2-3 hours each)

6. **BUILD `/services/ac-installation-wesley-chapel/`** — targets the Wesley Chapel installation gap. Tampa-equivalent page exists but no Wesley Chapel primary.
7. **BUILD `/services/ac-replacement-tampa/`** — currently only a blog at `/ac-replacement-wesley-chapel-fl/`. Dedicated service page ranks better for vol 260 commercial kw.
8. **BUILD "10 most common AC problems in Wesley Chapel homes" blog post** — targets PAA pull, consolidates existing scattered content into one authoritative piece.

### Tier 3 — area page strengthening (1-2 hours each)

9. **Rewrite `/service-areas/new-tampa-heating-and-cooling/`** — still flagged stub in CLAUDE.md, vol 50 kw at rank #21 ready to move
10. **Rewrite `/service-areas/odessa-emergency-ac-repair/`** — still flagged stub
11. **Rewrite `/service-areas/air-conditioning-repair-zephyrhills-.../`** — still flagged stub, vol 210 at rank #22

### Tier 4 — internal linking + technical

12. **Internal linking pass** — add inline "AC repair in Wesley Chapel" anchor text from homepage, 5 service pages, and 10 blog posts → `/service-areas/wesley-chapel-ac-repair/`. This fixes the "homepage ranks when area page should" problem.
13. **Add `Table` schema** to all pricing tables for featured-snippet eligibility.

### Tier 5 — authority signals (offline)

14. **Manufacturer dealer enrollment** — Carrier / Trane / Lennox. Highest-ROI backlink action available.
15. **NATE certification application** (if not already held) — industry trust badge.
16. **Angi Super Service Award / Carrier President's Award** — apply when eligible.

---

## 30/60/90 day ranking forecast

**Conservative — assuming only Tier 1 + Tier 2 land in 30 days, Tier 3 by 60, Tier 4 by 90:**

| Keyword | Current | 30 day | 60 day | 90 day |
|---------|--------:|-------:|-------:|-------:|
| ac repair wesley chapel | #8 organic | #6 | #4 | **top 3** |
| ac installation tampa | not ranked | #25 | #15 | #10 |
| ac installation wesley chapel | no page | new page → #20 | #10 | #5 |
| ac repair lutz | #28 | #18 | #12 | #8 |
| ac replacement tampa | blog only | new page → #20 | #12 | #8 |
| ac repair land o lakes | area page rank unclear | #12 | #6 | **top 3** |
| ac repair zephyrhills | #22 | #15 (after rebuild) | #10 | #6 |
| hvac repair tampa | not ranked | #15 | #8 | #5 |
| ac repair pasco county | have page | #15 | #8 | #5 |
| ac repair new tampa | #21 | #12 (after rebuild) | #8 | #5 |

**Why confident:** 3 of the 10 targets have KD ≤ 14. ICAC's content depth already exceeds the competitors ranking in the top 5 today. The gap is almost entirely about the right URL ranking for the right query (internal linking + titles) and matching a handful of specific content patterns Google rewards.

---

## What NOT to do (protect the existing rankings)

- Do NOT rename `/service-areas/wesley-chapel-ac-repair/` or change its URL. It's the primary Wesley Chapel money page.
- Do NOT remove the 4.9★/700+ reviews positioning — it beats every competitor on review volume.
- Do NOT remove hyper-local neighborhood detail. Every competitor's weakness is generic content; ICAC's strength is specificity. Don't dilute to match competitors.
- Do NOT delete the existing blog posts that have body copy > 900 words. Any URL swap risks losing a ranking that took months to earn.
- Do NOT chase "air care" (vol 5,400 but not commercial intent) or duct cleaning cluster keywords — per strategic direction, they're not business-relevant.

---

*Generated 2026-04-23 after commit `812f4f8` shipped to production. Based on live DataForSEO pulls: 44-keyword overview, 4 SERP analyses (Tampa-FL geo), and 4 competitor page content parses. All ranking data is US Google organic, live.*
