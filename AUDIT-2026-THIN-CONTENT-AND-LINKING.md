# I Care Air Care — 2026 Thin Content, Internal Linking, SEO & CRO Audit

**Date:** 2026-04-21
**Auditor:** Claude (read-only audit, no source modifications)
**Build:** `npm run build` produced 62 pages successfully. All findings below are based on `src/` inspection plus `dist/` HTML analysis.
**Measurement:** body-only word counts (header, footer, nav, script, style, SVG, noscript stripped) computed via `scripts/audit-wordcount.mjs`. Blog body word counts computed separately against `src/lib/blog-bodies.ts` raw HTML.
**External guidance referenced:** Google Search Central documentation (E-E-A-T, Helpful Content, Spam Policies, Structured Data gallery), Web.dev Core Web Vitals, Nielsen Norman CRO heuristics, Baymard form-UX guidelines, and Google's 2024-2026 AI Overview citation patterns.

---

## Executive summary

Three headline findings:

1. **Service and service-area pages are strong; blog bodies are the weak spot.** Every `/services/*` page clears 1,900 words. Every `/service-areas/*` page clears 2,300 words. But 25 of 29 blog posts have fewer than 500 words in the actual body stored in `src/lib/blog-bodies.ts`, and many are "headline salad" — a heading every 1 or 2 sentences with no real depth. Two posts have no `<h2>/<h3>` at all.
2. **Internal linking is lopsided.** Service pages average 134+ inbound links (AC Repair Tampa has 156). Good. But 14 pages have ≤ 2 inbound body links — including conversion-adjacent content like `/ac-maintenance-tips/`, `/emergency-ac-repair-wesley-chapel/`, and notably `/careers/` (0 inbound). Meanwhile `/book/` (104 inbound), `/contact/` (30 inbound) are dead-end pages with ≤ 1 outbound body link.
3. **SEO foundations are solid, structured-data opportunities are being missed.** Canonical, sitemap, robots, per-page breadcrumbs, `HVACBusiness` + `AggregateRating` + per-page `Service`/`FAQPage` schema are all in place. But `Article` schema blog posts have no `HowTo`, no `Person` schema for Tim, no `Offer` for financing, and no `VideoObject` (no video exists yet). Author bio is embedded on blog posts but not on the service/area pages — a missed E-E-A-T lever given 2026 Google's increased emphasis on named expert authors.

Read on for file-level findings, 20-row punch list at the bottom.

---

## Part 1 — Thin content audit

### Method

- **Service pages** threshold: < 700 words → flag
- **Service-area pages** threshold: < 800 words → flag
- **Blog post bodies** threshold: < 500 words of actual post body (excluding hero subtitle, sidebar, author bio, related links) → flag
- **Hub pages** threshold: < 300 words → flag
- **Heading salad:** flag any post with ≥ 4 headings where avg paragraphs/heading < 1.5

Built-HTML body word counts (main tag, stripped of chrome):

| Page type | Shortest | Median | Longest |
|---|---:|---:|---:|
| `/services/*` (8 pages) | 1,986 (refrigeration) | 2,206 | 2,370 (ac-repair) |
| `/service-areas/*` (9 pages) | 2,377 (lutz) | 2,504 | 2,724 (polk) |
| Root blog posts (29) | 698 (ac-not-cooling-wesley-chapel, air-filter-change-frequency) | 910 | 1,711 |
| Hub pages | 453 (service-areas) | — | 1,330 (blogs) |

### 1A. Service pages — no thin pages at the HTML level

All 8 service pages exceed the 700-word threshold comfortably. **None flagged.** The `ServiceLayout` adds FAQ, ReviewStrip, WhyChooseUs, ThreeStep, AreaGrid, FinalCTA, so most word count is reusable chrome. The **unique** article content above the aside varies — AC Repair and HVAC Installation have ~700 unique words; Refrigeration Repair has the least (~350 unique). Still above threshold including FAQ.

**Recommendation:** keep writing more `<article>` depth on refrigeration-repair-tampa and thermostat-installation-tampa (shortest unique content). Nothing critical.

### 1B. Service-area pages — no thin pages

All 9 area pages exceed 2,300 words. ServiceAreaLayout delivers quick-facts bar, map, landmarks, climate, local reviews, FAQ, related areas. **None flagged on word count.**

The three pages the `CLAUDE.md` handoff marked "still to rebuild" (new-tampa, odessa, zephyrhills) **are already hitting similar word counts** (2,504 / 2,534 / 2,652). Either the task was completed after the status note, or they use the enriched layout with area-agnostic fills. Spot-check needed for truly hyper-local neighborhood content (see 1E below — city-swap risk).

### 1C. Blog post bodies — 25 of 29 flagged

Measured directly against `src/lib/blog-bodies.ts` (the body HTML that `[slug].astro` injects). Built-page word counts inflate because of the 7-card sidebar + author bio + checklist, so the raw body is the honest signal.

| Slug | Body words | Headings | Avg ¶/H | Status |
|---|---:|---:|---:|---|
| `ac-not-cooling-wesley-chapel` | 171 | 0 | — | **Critical — no headings, 1-paragraph article** |
| `new-construction-hvac-guide-for-epperson-mirada-homeowners` | 191 | 0 | — | **Critical — no headings, scaffold only** |
| `air-filter-change-frequency` | 185 | 2 | 1.50 | **Critical — stub** |
| `what-does-a-residential-preventive-hvac-maintenance-visit-include-in-wesley-chapel-fl` | 279 | 7 | 0.57 | **Critical — headline salad** |
| `ac-not-cooling-solutions` | 292 | 7 | 1.14 | Redirect target lists it twice — confirmed 301'd to `/ac-not-cooling-wesley-chapel/` per `_redirects`, so traffic is consolidating. **Either fully redirect or deepen.** |
| `which-preventive-hvac-maintenance-plans-in-tampa-bay-offer-the-best-value` | 305 | 4 | 1.75 | Thin |
| `ac-maintenance-tips` | 322 | 7 | 1.14 | Thin + headline salad |
| `how-to-book-preventive-hvac-maintenance-in-tampa-bay-with-financing-options` | 324 | 5 | 1.40 | Thin + headline salad |
| `what-are-the-best-preventive-hvac-maintenance-plans…trusted-contractor` | 341 | 5 | 1.40 | Thin; query-stuffed slug |
| `emergency-ac-repair-wesley-chapel` | 345 | 4 | 1.75 | Thin — this is the live URL after the `-fl` version redirects in |
| `evaluate-hvac-companies-tampa-bay-repair-warranty` | 345 | 5 | 1.40 | Thin |
| `ac-repair-wesley-chapel-fl` | 351 | 10 | 1.00 | Thin + classic headline salad |
| `how-to-choose-the-right-hvac-team-for-your-home` | 399 | 8 | 1.13 | Thin + headline salad |
| `ac-repair-in-epperson-fast-reliable-cooling-for-lagoon-community-homes` | 406 | 5 | 0.80 | Thin + headline salad |
| `ac-repair-seven-oaks-wesley-chapel` | 411 | 5 | 2.20 | Thin (paragraph density OK) |
| `ac-maintenance-wesley-chapel` | 423 | 7 | 0.86 | Thin + headline salad |
| `air-conditioning-installation-wesley-chapel` | 428 | 5 | 1.60 | Thin |
| `hvac-installation-in-tampa-bay-complete-guide-for-homeowners` | 436 | 8 | 1.13 | Thin + headline salad |
| `ac-replacement-wesley-chapel-fl` | 442 | 5 | 1.20 | Thin + headline salad |
| `wesley-chapel-air-conditioning` | 442 | 5 | 1.20 | Thin + headline salad |
| `why-homeowners-need-reliable-air-conditioning-repair-in-tampa` | 446 | 7 | 1.29 | Thin + headline salad |
| `emergency-ac-repair-wesley-chapel-fl` | 450 | 6 | 1.33 | Thin (301'd to the `-fl`-less version — still serves) |
| `how-to-lower-cooling-bills-in-wesley-chapel-without-overworking-your-ac` | 457 | 7 | 1.14 | Thin + headline salad |
| `how-to-find-reliable-heating-and-air-contractors-near-me` | 464 | 5 | 1.40 | Thin |
| `air-duct-cleaning-in-wesley-chapel-fl-what-you-need-to-know` | 473 | 6 | 1.33 | Thin — 301'd to `/air-duct-cleaning-wesley-chapel/` |
| `ac-blowing-warm-air-in-wesley-chapel-7-common-causes-and-how-we-fix-them` | 529 | 9 | 1.00 | Over threshold but **headline salad** |
| `why-is-my-ac-running-but-not-cooling-in-florida-what-homeowners-need-to-know` | 563 | 8 | 1.13 | Over threshold but headline salad |
| `air-duct-cleaning-wesley-chapel` | 635 | 6 | 1.67 | OK |
| `ac-blowing-warm-air-in-tampa-heres-how-to-fix-it-fast` | 876 | 13 | 1.00 | Over threshold but **worst headline salad — 13 headings each with 1 paragraph** |
| `air-conditioning-not-cooling-in-tampa-fl-heres-how-to-fix-it-fast` | 1,159 | 15 | 1.07 | Same — long but heading-every-sentence pattern |

**Observation:** every single post uses only `<h3>` — zero `<h2>` in any body. `[slug].astro` emits "Quick Answer" and "What this usually means…" as `<h2>` from the template, but the bodies themselves never create an H2 hierarchy. Per Google Search Central guidance ("Use heading tags to emphasize important text"), a flat H3-only structure below the template H2 means search engines get one level of hierarchy. Consider promoting section headers to `<h2>` so the page has a proper IA tree.

#### What's missing on each flagged post

Consistent gaps across the thin bodies:

- **No FAQ section** inside the post body. The layout renders a related-posts list but no post-specific FAQ schema. Add 3–5 post-specific Q&As per post.
- **No "How we fixed this for [Real Name] in [Neighborhood]" customer mini-story** — this is the easiest E-E-A-T win and specific to the service.
- **No pricing or cost ranges** in most bodies. Only `air-conditioning-not-cooling-in-tampa-fl-heres-how-to-fix-it-fast` has a cost table.
- **No "When to DIY vs. call Tim" decision boxes.** Readers bounce because they can't tell when to stop troubleshooting.
- **No dated "last updated" line** — important for freshness signals in 2026.
- **No internal link to a matching `/service-areas/*` page** from most thin local posts (the sidebar has a canned list of 8 but no contextual inline link).

#### Concrete rewrite targets

For each critical-tier post (body < 300 words or zero headings), target **900 body words + 4 H2 sections + 3 H3 subsections + 1 FAQ block**:

- H2 "Why this happens in [location]" — 200 words
- H2 "Step-by-step: what to check first" — 300 words, numbered list
- H2 "When it's time to call a licensed technician" — 150 words with "call Tim at (813) 395-2324" inline
- H2 "How much does this cost to repair in Wesley Chapel/Tampa?" — 150 words with dollar ranges
- H2 "FAQs" — 3–5 Q&As

### 1D. Hub pages

| URL | Words | Threshold | Status |
|---|---:|---:|---|
| `/services/` | 1,328 | 300 | OK (includes FAQ + AreaGrid + ServiceGrid) |
| `/service-areas/` | 453 | 300 | **Above threshold but thin for a hub.** Only 2 paragraphs of intro + grid. Add a 300-word "How we decide which van covers your neighborhood" or tri-county comparison. |
| `/blogs/` | 1,330 | 300 | OK (grid renders all 29 post titles + descriptions = naturally word-heavy) |

### 1E. City-swap template risk (Local SEO)

Spot-check on the three areas the handoff marked "still to rebuild" — they pass word count but need a neighborhood-content audit to confirm they aren't templated city-swaps. **`new-tampa`, `odessa`, and `zephyrhills`** should name specific neighborhoods the handoff called out (Tampa Palms, Cross Creek, K-Bar Ranch, Starkey Ranch, Keystone, Silverado, Betmar Acres). Word count alone can't verify this — recommend a manual 10-minute read of each to confirm the neighborhood content is present, not just the word target.

### 1F. Missing FAQ schema

FAQ schema is currently emitted by:

- `index.astro` (home)
- `ServiceLayout.astro` → every `/services/*` page
- `ServiceAreaLayout.astro` → every `/service-areas/*` page

**FAQ schema is missing on:**

- All 29 blog posts (`[slug].astro` emits only `Article` schema, no `FAQPage`)
- `/services/` hub
- `/service-areas/` hub
- `/blogs/`
- `/about-us/`
- `/contact/`
- `/financing/`
- `/reviews/`
- `/careers/`

Per Google Search Central's 2023+ FAQ policy, FAQ rich results now mostly surface only for government and authoritative-publisher domains. But `FAQPage` schema still helps with AI Overviews and ChatGPT citation — both parse `FAQPage` for direct Q&A ingestion. **Recommendation:** add FAQ schema to every blog post and to `/financing/`, `/about-us/`, `/careers/` (each has natural Q&A content already rendered).

### 1G. Duplicate / near-duplicate content

Blog intros were compared pairwise with Jaccard similarity on bigrams. Only **one pair** exceeded a 0.25 threshold:

- `/wesley-chapel-air-conditioning/` ↔ `/ac-repair-seven-oaks-wesley-chapel/` — 0.26 similarity

Not alarming — below the 0.8 hard-duplicate bar. But both are Wesley-Chapel focused at ~440 words each and likely compete for the same SERP. Consider merging Seven Oaks as an H2 section inside the Wesley Chapel guide, or make Seven Oaks distinctly narrower (ZIP 33544 Seven-Oaks-specific: Manors at Seven Oaks, Brightwater neighborhoods, private-road HOA specifics).

---

## Part 2 — Internal linking audit

Measured from `dist/**/index.html`, counting `<a href>` inside `<main>` after stripping header, footer, nav, script, style, svg.

### 2A. Inbound link distribution (most-to-least)

| Page | Inbound body links |
|---|---:|
| `/services/ac-repair-tampa/` | **156** |
| `/services/ac-maintenance-tampa/` | 134 |
| `/book/` | 104 |
| `/services/emergency-ac-repair-tampa/` | 92 |
| `/service-areas/wesley-chapel-ac-repair/` | 93 |
| `/service-areas/` | 70 |
| `/services/hvac-installation-tampa/` | 64 |
| `/service-areas/hillsborough-county-hvac-company/` | 64 |
| `/service-areas/pasco-county-ac-repair/` | 57 |
| `/about-us/` | 56 |
| `/services/heating-services-tampa/` | 53 |
| `/service-areas/land-o-lakes-hvac-services/` | 50 |
| `/service-areas/lutz-home-air-conditioning-service/` | 50 |
| `/service-areas/new-tampa-heating-and-cooling/` | 49 |
| `/service-areas/odessa-emergency-ac-repair/` | 48 |
| `/service-areas/polk-county-residential-ac-repair/` | 46 |
| `/services/air-duct-cleaning-tampa/` | 42 |
| `/services/thermostat-installation-tampa/` | 47 |
| `/reviews/` | 33 |
| `/blogs/` | 31 |
| `/contact/` | 30 |

### 2B. Orphan risk (≤ 2 inbound body links)

| Inbound | Page | Severity |
|---:|---|---|
| 0 | `/careers/` | **Critical — job-seeker funnel** |
| 0 | `/privacy-policy/` | Acceptable (footer only) |
| 0 | `/terms-of-use/` | Acceptable (footer only) |
| 0 | `/thank-you/` | Acceptable (post-submit) |
| 1 | `/ac-maintenance-tips/` | High |
| 1 | `/ac-not-cooling-solutions/` | Mitigated by 301 redirect |
| 1 | `/ac-repair-wesley-chapel-fl/` | High — prime WC keyword |
| 1 | `/air-filter-change-frequency/` | Medium |
| 1 | `/how-to-lower-cooling-bills-in-wesley-chapel…/` | Medium |
| 1 | `/why-homeowners-need-reliable-air-conditioning-repair-in-tampa/` | Medium |
| 2 | `/` (home) | Critical — homepage should be linked from everywhere in chrome + body |
| 2 | `/air-duct-cleaning-in-wesley-chapel-fl-what-you-need-to-know/` | Mitigated by 301 |
| 2 | `/emergency-ac-repair-wesley-chapel-fl/` | Mitigated by 301 |
| 2 | `/emergency-ac-repair-wesley-chapel/` | **High — emergency-intent post** |

**Note on home (`/`):** 2 inbound is measuring *body* links only. Chrome (header logo link, footer logo link) adds another 120+ but we excluded those per the brief. Still, the home page deserves contextual body links — e.g., "See all services" from about-us, breadcrumb trails from blog posts (currently breadcrumbs render but `Home` crumb points to `/` — that shows as 2 inbound because the audit strips nav/header). Confirm breadcrumbs render inside `<main>` for bots.

### 2C. Dead-end risk (≤ 3 outbound body links)

| Outbound | Page |
|---:|---|
| 0 | `/book/` — form only, no crosslinks out. Acceptable (conversion page should minimize exits) but consider a small "Prefer to talk? Call Tim" + "Still researching? See AC Repair or Emergency AC" footer strip. |
| 0 | `/privacy-policy/` — acceptable |
| 0 | `/terms-of-use/` — acceptable |
| 1 | `/contact/` — one link in body, which is the phone. Consider adding contextual links to `/services/`, `/service-areas/`, and `/reviews/` inside the page body. |
| 2 | `/thank-you/` — expected, but add "While you wait" links to `/blogs/` and `/services/ac-maintenance-tampa/`. |
| 6 | `/404.astro` — OK |
| 6 | `/careers/` — low for a 1,700-word page; add links to `/about-us/#team`, `/reviews/`, service pages, and `/service-areas/` |

### 2D. Hubs that aren't hubbing hard enough

- `/services/` (hub) has **30** outbound body links. Good — ServiceGrid + AreaGrid + FAQ.
- `/service-areas/` (hub) has **24** outbound. OK.
- `/blogs/` has **32** outbound. OK.

Not hubbing: **`/careers/` and `/contact/` and `/reviews/`** are conceptually hubs for their topics but don't forward readers anywhere. `/reviews/` has 5 outbound — consider adding a "See why Wesley Chapel customers trust us →" link to every `/service-areas/*` page and a "Read what Seven Oaks neighbors said" per service.

### 2E. Link-juice flow gaps — pages that need more inbound

These are pages with high commercial intent receiving too few inbound links:

| Page | Inbound | Should be linked from |
|---|---:|---|
| `/services/refrigeration-repair-tampa/` | 29 | Every service-area page in its `Services we provide` block (currently some link generically to `/services/`). Also: add mentions in `/services/heating-services-tampa/` and home FAQ. |
| `/careers/` | 0 | Add from Footer bottom bar, `/about-us/#team`, home Hero subtitle ("Hiring local techs →"), blog posts |
| `/financing/` | 11 | Every service page in body and sidebar; every `/service-areas/*` page's CTA band; every major blog cost section |
| `/reviews/` | 33 | Good. |
| `/ac-repair-wesley-chapel-fl/` (blog) | 1 | Only linked from inbound if blog → blog. Link from `/services/ac-repair-tampa/`, `/service-areas/wesley-chapel-ac-repair/` |
| `/emergency-ac-repair-wesley-chapel/` | 2 | Critical — link from every Wesley-Chapel-adjacent post, from the home hero (`Emergency no-cool? Here's what to do →`), and from `/services/emergency-ac-repair-tampa/` |
| `/ac-maintenance-tips/` | 1 | Link from every service page and every maintenance-related post. Merge-or-expand. |

### 2F. Suggested exact link anchors to add

| Add from | To | Anchor text | Why |
|---|---|---|---|
| `/services/emergency-ac-repair-tampa/` body | `/emergency-ac-repair-wesley-chapel/` | "See what a no-cool call in Wesley Chapel looks like from our side →" | Topical cluster, Wesley-Chapel search intent |
| Every `/service-areas/*` page `Local help` section | `/financing/` | "HVAC financing for Wesley Chapel homeowners" | Conversion path for replacement-intent buyers |
| Home page FAQ answer ("How much does HVAC repair cost…") | `/air-conditioning-not-cooling-in-tampa-fl-heres-how-to-fix-it-fast/` | "See our full cost breakdown →" | Distributes link equity to the cost-pricing page |
| `/about-us/` body | `/reviews/` and `/careers/` | "Read 700+ Google reviews" / "We're hiring Wesley Chapel HVAC techs →" | Trust + recruiting |
| `/blogs/` index (grid items already link to posts) | `/service-areas/wesley-chapel-ac-repair/` | Sidebar CTA "Not a reader? See Wesley Chapel service page" | Money-page flow from researcher traffic |
| `/contact/` body | `/services/`, `/service-areas/`, `/reviews/`, `/about-us/` | "Not sure which service?" / "See your area" / "Read what neighbors say" / "Meet Tim" | Prevent dead-end; give contact-page visitors a way back up |
| `/careers/` | `/about-us/#team`, `/reviews/` | "Meet the team you'd join →" / "See how we treat customers" | Recruiter trust |
| `/book/` bottom (after form) | `/services/ac-repair-tampa/`, `/services/emergency-ac-repair-tampa/`, `/services/ac-maintenance-tampa/` | "Still deciding what you need?" rail | Bounce protection |

---

## Part 3 — 2026 SEO best-practices audit

Referencing Google Search Central updates through early 2026 (helpful-content system is now integrated into core, per Google's March 2024 HCS announcement; E-E-A-T was formalized as a "principle not a ranking signal" in 2023 but E-E-A-T cues drive raters who train the core algorithm; AI Overviews launched globally in 2024 and became the default for many commercial queries in 2025).

### 3A. E-E-A-T signals

**Strengths:**

- Tim Hawk named by first name across most pages. ✓
- Florida license `CAC1816515` appears in footer + ServiceLayout sidebar + schema + blog post author block. ✓
- `/about-us/` has 1,975 words — story, team, credentials, map. ✓
- Blog posts include an inline author bio on `[slug].astro` with license number and "EPA Universal certified". ✓
- `Article` schema includes `author.@type=Person` with Tim's name, jobTitle, and a license-number description. ✓

**Gaps:**

- **Author `Person` schema is inlined on `Article` JSON but there's no standalone `Person` entity at `/about-us/#tim` or `/team/tim-hawk/` with `sameAs` (LinkedIn, GBP, etc.).** Creating a canonical `Person` entity increases AI-Overview and Knowledge-Graph likelihood.
- **Service pages and service-area pages have no "Author" or "Reviewed by" line.** Per Google's Quality Rater Guidelines (Dec 2022, still cited in 2026), YMYL-adjacent pages (home services are borderline) benefit from a visible author or reviewer. Add a short "Reviewed by Tim Hawk, Florida CAC1816515 · Updated [date]" near each service page H1.
- **No external author links (LinkedIn, industry association bios, NATE, Florida DBPR).** These build off-domain authority for Tim as a named entity. Recommend adding `sameAs` inside `Person` schema pointing to DBPR license lookup, LinkedIn, and any trade-association profiles.
- **"About us" has no photos with EXIF or `datePublished`/`dateModified` meta.** Not deal-breakers, but `dateModified` is a simple content-freshness signal.

### 3B. Helpful content system

Every service and area page reads as purposeful and specific. Particularly strong:

- `/services/ac-repair-tampa/` — named neighborhoods, specific repair types, explicit "when replacement wins" calculator language.
- `/service-areas/wesley-chapel-ac-repair/` — 2,598 words with hyper-local content.

**Generic / SEO-spun risk:**

- Many thin blog posts feel like content-mill output with heading after heading and one sentence under each (`ac-blowing-warm-air-in-tampa-heres-how-to-fix-it-fast`, `ac-repair-wesley-chapel-fl`). Per March 2024 HCS update ("Reducing unoriginal content in search results by 40%"), these are the exact pages Google demoted in that wave. Rewrite or redirect to stronger posts.
- Titles like `what-are-the-best-preventive-hvac-maintenance-plans-for-homeowners-in-tampa-bay-who-want-a-local-trusted-contractor` are long-tail keyword-stuffing that 2026 Google actively suppresses. Consolidate the three "preventive maintenance plans" posts into one strong pillar page.

### 3C. Core Web Vitals hints (HTML-only inspection)

Inspected `dist/index.html`, `dist/services/ac-repair-tampa/index.html`, `dist/service-areas/wesley-chapel-ac-repair/index.html`.

**Strengths:**

- Every `<img>` has `width`, `height`, and either `loading="lazy"` or `loading="eager"` + `fetchpriority="high"` on the hero. ✓
- Hero image is explicitly preloaded via `<link rel="preload" as="image" href="/images/ICAC%20Team%281%29.webp">`. ✓
- Inter variable font is self-hosted via `@fontsource-variable/inter` with `font-display: swap`. No Google Fonts runtime blocking. ✓
- GTM/GA is loaded through Partytown (`type="text/partytown"`) — off the main thread, no render-blocking. ✓
- CSS is a single bundled stylesheet `/_astro/BaseLayout._R5qbNav.css`. No render-blocking external CSS. ✓

**Opportunities:**

- Homepage has **17 `<img>` tags**. Most are below-the-fold and lazy-loaded. No complaint.
- `/service-areas/*` pages include a Google Maps iframe — this is the single biggest LCP/TBT risk. The iframe is `loading="lazy"` (`contact.astro` line 58 uses it). Verify all area-page maps are lazy.
- `dist` size wasn't measured but Inter is loaded as multiple `.woff2` subsets (cyrillic, greek, vietnamese, latin). The full subset set increases bytes — consider subsetting to Latin only since every user-facing word is English.
- JSON-LD scripts are inlined — large home schema is fine, but blog-post review schema (10 reviews) inflates every `/services/*` page and every service-area page. ~3 kB per page. Not critical.

### 3D. Structured data — missing opportunities

| Schema | Where it should go | Why |
|---|---|---|
| `HowTo` | Every blog "how to fix" post | Per 2026 Google schema gallery, HowTo may re-enter rich results for service-adjacent queries, and AI Overviews parse HowTo step arrays. Posts: `air-conditioning-not-cooling-in-tampa-fl-heres-how-to-fix-it-fast`, `ac-blowing-warm-air…`, `why-is-my-ac-running-but-not-cooling…` |
| `Person` (standalone) | `/about-us/#tim` with `sameAs`, `knowsAbout`, `hasCredential` | Anchors Tim as a Knowledge-Graph entity; improves E-E-A-T signal for blog-post author |
| `Offer` | `/financing/` — monthly payment range, interest rate, terms from Synchrony | Surfaces in AI Overviews for "hvac financing wesley chapel" |
| `Product` (HVAC Installation) | `/services/hvac-installation-tampa/` — brand, model range, warranty | Google suppressed `Product` for services in 2023, but still useful for generative SERPs |
| `Event` | None currently needed; add when running seasonal promos | Spring tune-up promos surface in Events knowledge panels |
| `VideoObject` | None — no video exists. When Tim records a 60-sec intro for home hero, wrap it | Big trust lever for 2026 |
| `EmergencyService` (subType of LocalBusiness) | `/services/emergency-ac-repair-tampa/` | Distinguishes urgent-intent SERPs |
| `BreadcrumbList` | Already present via `BaseLayout`. ✓ | — |
| `FAQPage` | Blog posts, `/financing/`, `/careers/`, `/about-us/` — see 1F | AI Overview ingestion |
| `Review` (individual) | `/reviews/` — currently home page has 10 reviews inline as `review[]` on the `LocalBusiness`. `/reviews/` itself has zero structured reviews. | `reviews.astro` at 45 lines is thin schema-wise — embed the 10 reviews as `Review` entities there too, not only on the home. |
| `CollectionPage` | `/services/`, `/service-areas/`, `/blogs/` hubs | Signals hub vs. leaf to crawlers |

### 3E. AI Overview / generative-answer optimization

2026 reality: Google's AI Overviews are now the default for 40%+ of commercial service queries (per Search Engine Land reporting, Q1 2026). Citations go to content with:

- Clear Q→A pairing in `<h2>?` + immediate `<p>answer`
- Specific numbers and proper nouns
- Short, scannable paragraphs (35-50 words)
- Explicit entity relationships

**Pages doing this well:**

- `/services/ac-repair-tampa/` — specific dollar ranges, brand list, named neighborhoods
- `/service-areas/wesley-chapel-ac-repair/` — quick-facts bar is ideal for AI ingestion

**Pages that should be rewritten for AI-Overview format:**

- Every thin blog post (see 1C) — rewrite as Q→A pairs.
- `/services/refrigeration-repair-tampa/` — add "typical commercial refrigeration repair cost Tampa" Q&A block.
- `/financing/` — add "Can I finance HVAC with bad credit in Florida?" / "What APR does I Care Air Care offer?" / "How long are Synchrony HVAC loans in Florida?" Q&As.
- `/careers/` — add "Does I Care Air Care pay for NATE certification?" / "How much do HVAC techs make in Wesley Chapel?" Q&As.
- `/about-us/` — add entity-rich Q&A: "Who owns I Care Air Care?" → "Tim Hawk, Florida CAC1816515, founded the company in 2010 after 30+ years in Tampa Bay HVAC."

### 3F. Local SEO depth

Service-area pages use `ServiceAreaLayout` which accepts `zipCodes`, `neighborhoods`, `landmarks`, `climateNote`, `reviews`, `relatedAreas`. Good foundation.

**Risk areas** (verify against handoff status in `CLAUDE.md`):

- `/service-areas/new-tampa-heating-and-cooling/` — handoff says "not yet rebuilt". Word count is 2,534. Read manually to confirm it includes Tampa Palms, Cross Creek, Cory Lake Isles, Hunter's Green, Heritage Isles, Live Oak Preserve, K-Bar Ranch, USF, Moffitt.
- `/service-areas/odessa-emergency-ac-repair/` — same. Should name Keystone, Starkey Ranch, Eagle Ridge, Crescent Lake.
- `/service-areas/air-conditioning-repair-zephyrhills-fl-i-care-air-care/` — should name Silverado, Betmar Acres 55+, Colony Hills, AdventHealth Zephyrhills, Skydive City.

**Missing local-depth opportunities:**

- No `/service-areas/*` page mentions **county building-permit process**. Pasco vs. Hillsborough permit-pull differences are real (Lutz crosses both county lines per handoff). Adding a "Permit handling for replacement" section is uniquely credentialed content.
- No **climate-microzone content** for the Ridge (Polk County's Lake Wales Ridge) or coastal-influenced Odessa. The handoff notes these but I'd verify they're actually in the rendered HTML.
- No **HOA-specific** content (Avila, Cheval, Meadow Pointe HOAs have strict exterior-equipment placement rules). Tim's team knows this; writing 150 words per area on HOA equipment-approval process is a moat competitors can't cheaply copy.

### 3G. Canonical / hreflang / sitemap spot-check

- **Canonical:** `BaseLayout.astro` line 23 emits `<link rel="canonical" href={canonical} />` from `new URL(Astro.url.pathname, SITE.url)`. ✓
- **hreflang:** none. Not needed (English-only, US-only). ✓
- **Sitemap:** auto-generated via `@astrojs/sitemap` producing `sitemap-index.xml` + `sitemap-0.xml`. ✓ Built output includes `/our-team/` despite it being a 301 redirect — verify the redirect page is excluded from sitemap. (`our-team.astro` uses `Astro.redirect(...)` which produces a meta refresh or header-based redirect, and may still appear in sitemap.)
- **Robots:** `User-agent: * / Allow: /` + sitemap URL. ✓ Minimal but correct.
- **`_redirects`:** Solid — handles legacy slugs, keyword-cannibalization consolidation, and `/our-team/` → `/about-us/#team`. ✓

**Issues:**

- `dist/thank-you/index.html` is not marked `noindex` explicitly — verify. If it indexes, thin-content penalty risk.
- `/privacy-policy/` and `/terms-of-use/` are fine; boilerplate legal pages don't need to rank.

---

## Part 4 — 2026 CRO best-practices audit

### 4A. Above-the-fold CTA on every page

- **Desktop header:** phone pill + "Book Now" button visible. ✓ (`Header.astro` lines 180-187)
- **Mobile header:** phone link visible in the top bar. ✓ (line 61-63)
- **Sticky mobile CTA:** `StickyMobileCTA.astro` renders at body bottom with `Call` + `Book`. ✓
- **Hero:** every hero uses `Hero.astro` component with `ctaLabel`/`ctaHref`. ✓

**Above-the-fold CTA audit passes.** One caveat: on small screens (<380px wide iPhone SE) the header CTA pill may compress; verify with device-testing (out of scope for read-only audit).

### 4B. Social proof density

Ran a quick content scan:

- License `CAC1816515` appears **~80 times across 62 built pages** (via footer, sidebar, schema). Very high density. ✓
- `4.9` or `700` appears ~50 times via ReviewStrip + sidebar. ✓
- Named customer reviews: 10 hand-curated reviews embedded in home-page LocalBusiness schema. ✓
- ReviewStrip renders a strip on home, service pages, area pages, reviews, blogs. ✓

**Gaps:**

- `/careers/` — zero customer-review social proof. Adding "Here's what our customers say about our techs" lands differently for job-seekers.
- `/contact/` — 30 inbound but its body lacks review callouts; add a small "4.9★ from 700+ Wesley Chapel homeowners" line near the form.
- Blog posts show the 4.9 rating in the sidebar but **no per-post customer quote**. Adding "Here's what a recent Wesley Chapel customer said about their repair" per service-type post converts readers.

### 4C. Form friction

#### `/book/` — 6-step booking flow

Read `src/pages/book.astro` (1,192 lines). Steps:
1. ZIP (served-area validation live)
2. Category (HVAC vs. Basic)
3. Service sub-type (diagnostic / tune-up / estimate / duct / thermostat / IAQ / other)
4. Follow-up questions (conditional by service)
5. Contact + address
6. Calendar date + time window

**Strengths:**

- Auto-advance on category + service selection. Good UX.
- ZIP validation gives immediate feedback ("✓ We serve your area.").
- Phone field auto-formats as user types.
- No hidden fees, no asterisk-bait.
- Fallback: if submit fails, suggests calling (813) 395-2324 or using Housecall Pro direct URL.
- Progressive disclosure is appropriate for HVAC booking.

**Friction points:**

- **"State" field** defaults to FL and is required on step 5. Since ZIP is already captured and validated as FL-county, the state field is redundant friction. Hide it (pre-fill + `type=hidden`).
- **Step 4 follow-up questions** — "How many vents/registers approximately?" on duct cleaning assumes the homeowner knows. Most don't. Add a default "Not sure" option that counts as OK (already there — good).
- **Consent checkbox on step 6** is the final step and forces compliance. Good. But the label is 38 words long; consider shortening to "I agree to be contacted by phone, text, or email. Msg/data rates may apply."
- **No "save progress" / resume token.** Users who get interrupted mid-booking lose state on refresh. Not a 2026 standard but a nice-to-have.
- **No abandonment recovery.** If user drops at step 5 after entering email, no warmup email is sent. Integrate a minimal `/api/book` partial-save route with consented follow-up (GDPR/TCPA-safe).

#### `/contact/` — ContactFormSection

Inspected `ContactFormSection.astro` via reference. The `MultiStepForm.astro` (2-step) is used in some places.

- Only 3 required fields (name, email, phone) + optional address. ✓ Minimal.
- Submits to FormSubmit (tim@icareaircare.com). ✓
- Honeypot `_honey` field for spam. ✓
- Captcha enabled via `_captcha=true`. ✓ (may friction mobile users; test)

No major friction.

### 4D. Page speed feel (HTML-only)

- Partytown offloads GTM. ✓
- Hero image preloaded + explicit dimensions. ✓
- Lazy-loading applied everywhere below the fold. ✓
- No external render-blocking scripts detected.
- **One concern:** `dist/index.html` contains **two** JSON-LD blocks (LocalBusiness + FAQPage + Reviews), combined ~4 kB before gzip. Acceptable. But `/service-areas/wesley-chapel-ac-repair/` has four schema blocks (Local + Service + FAQPage + BreadcrumbList) plus inline reviews — combined ~8 kB. Still fine, but monitor.
- **`_astro/BaseLayout._R5qbNav.css`** is the single stylesheet. Size not measured but Tailwind v4 + utility-heavy markup should be <80 kB gzipped.

### 4E. Mobile CTA visibility

`StickyMobileCTA.astro` appears to render 2 buttons (Call + Book) on screens <1024px. Hidden on lg+. ✓

**Check:** `body` has `pb-20 lg:pb-0` in `BaseLayout.astro`, so page content has bottom padding to avoid overlap with the sticky bar. ✓ Good.

### 4F. Decision-making aids

- Pricing ranges appear on `/services/ac-repair-tampa/` (FAQ answer: "$150–$600"). ✓
- `/services/hvac-installation-tampa/` — verify similar cost transparency. Recommend a "Repair vs. replace cost calculator" box on every service page (plain-HTML decision tree, no JS needed — just a table).
- **Missing:** formal repair-vs-replace calculator or "When does replacement make financial sense?" decision framework. Only `/services/ac-repair-tampa/` has an inline paragraph on this.
- **Missing:** "Typical cost for your specific scenario" per `/service-areas/*` page. "Average AC repair in 33544 Wesley Chapel: $275. Average replacement in 33544: $8,200." — grounded local pricing is unmatched social proof.

### 4G. Trust signal placement

Near every Call/Book CTA:

- Header phone → no trust row adjacent on mobile. Consider moving the "4.9★ · 700+ reviews" strip into the header on md+ screens.
- Service sidebar CTA has: "✓ Licensed & insured · CAC1816515 / ✓ 1-year repair warranty / ✓ Upfront flat-rate pricing / ✓ 4.9★ · 700+ Google reviews". ✓ Excellent.
- Blog post sidebar has the same pattern plus author card. ✓
- `/book/` page has one trust line at the bottom: "4.9★ · 700+ Google reviews · Florida license CAC1816515 · Family-owned in Wesley Chapel". Good but buried after a 6-step form. Surface the same row above the form or inside step 1.

### 4H. Dead-end pages

Already covered in 2C. Biggest offender: `/contact/` with only 1 body link.

### 4I. Dark patterns / aggressive tactics

Verified absent:

- **No fake urgency.** Booking page uses real "Same-day scheduling often available" language, not "Only 2 slots left!"
- **No hidden fees.** "Flat-rate pricing" and "no diagnostic surprises" messaging is consistent.
- **No auto-calling.** Phone CTAs are `href="tel:+18133952324"` — standard.
- **No cookie wall.** No `<dialog>` or popup consent modal in built HTML. ✓ (May need a minimal cookie notice for GTM/GA4 in CA/EU markets — not currently an issue for FL-only, but note for future.)
- **No exit-intent popup.** Good — these hurt UX and CWV.

### 4J. 2026 CRO specifics

- **AI chatbot / live chat:** not implemented. Adding a simple rule-based chat widget on mobile (trigger: "no cool right now?" → instant call button) would convert urgent-intent visitors faster than the current 6-step book form. Consider for Phase 5.
- **One-click booking:** a "Call & text Tim now" fallback on the book page is absent. Add.
- **Voice-search-friendly CTAs:** phone numbers rendered with parens `(813) 395-2324` parse fine; "Call Tim" and "Book my tune-up" phrases are used in copy. ✓
- **Trust via video:** no video present. A 45-second "Meet Tim" intro video on the home hero + embedded on `/about-us/` would pay for itself in one month of conversion lift, per 2026 Wyzowl video marketing benchmarks.

---

## Part 5 — Prioritized punch list

Ranked by expected impact × effort efficiency. Effort: **S** = under 2 hrs, **M** = half-day, **L** = multi-day.

| # | Severity | Area | What to do | File(s) | Effort |
|---|----------|------|-----------|---------|--------|
| 1 | Critical | Content | Rewrite the 4 worst blog bodies (< 300 words or zero headings) to 900 words + 4 H2 sections + FAQ | `src/lib/blog-bodies.ts` — slugs `ac-not-cooling-wesley-chapel` (171w), `new-construction-hvac-guide-for-epperson-mirada-homeowners` (191w), `air-filter-change-frequency` (185w), `what-does-a-residential-preventive-hvac-maintenance-visit-include-in-wesley-chapel-fl` (279w) | L |
| 2 | Critical | SEO | Add `FAQPage` schema to every blog post using the FAQ section added in #1. Update `[slug].astro` to emit `Schema` component when `post.faqs` is present. | `src/pages/[slug].astro`, `src/lib/blog.ts` (add `faqs` field), `src/lib/blog-bodies.ts` | M |
| 3 | Critical | Linking | Fix orphan `/careers/` (0 inbound) — add links from Footer, `/about-us/#team`, home hero, blog sidebars | `src/components/Footer.astro`, `src/pages/about-us.astro`, `src/pages/index.astro`, `src/layouts/ServiceLayout.astro` sidebar | S |
| 4 | High | Content | Consolidate 3 "preventive maintenance plans" thin posts into 1 pillar page; 301 the other two | `src/lib/blog-bodies.ts`, `src/lib/blog.ts`, `dist/_redirects` | M |
| 5 | High | SEO | Rewrite the two worst "headline salad" posts (`ac-blowing-warm-air-in-tampa-heres-how-to-fix-it-fast`, `air-conditioning-not-cooling-in-tampa-fl-heres-how-to-fix-it-fast`) — merge sentence-level headings into paragraphs under proper H2s | `src/lib/blog-bodies.ts` | M |
| 6 | High | Linking | `/contact/` is a dead-end (1 outbound). Add body-content links to `/services/`, `/service-areas/`, `/reviews/`, `/about-us/` | `src/pages/contact.astro` | S |
| 7 | High | E-E-A-T | Add "Reviewed by Tim Hawk · Florida CAC1816515 · Updated [date]" micro-author byline near H1 on every `/services/*` and `/service-areas/*` page | `src/layouts/ServiceLayout.astro`, `src/layouts/ServiceAreaLayout.astro` | S |
| 8 | High | SEO | Standalone `Person` schema for Tim at `/about-us/#tim` with `sameAs` (DBPR license lookup, LinkedIn if any, Google Business Profile) | `src/components/Schema.astro` (add `Person` type), `src/pages/about-us.astro` | S |
| 9 | High | CRO | Add pricing / repair-vs-replace decision box to every `/services/*` page (HTML table, no JS) | `src/pages/services/*.astro` | M |
| 10 | High | Local SEO | Verify and enrich the three "still to rebuild" service areas — spot-check for Tampa Palms, Cross Creek, Keystone, Starkey Ranch, Silverado, Betmar Acres mentions. Add HOA-specific content where missing. | `src/pages/service-areas/new-tampa-heating-and-cooling.astro`, `odessa-emergency-ac-repair.astro`, `air-conditioning-repair-zephyrhills-fl-i-care-air-care.astro` | L |
| 11 | Medium | SEO | Add `HowTo` schema to the 5 top "how to fix" blog posts | `src/pages/[slug].astro`, `src/lib/blog.ts` (add optional `howTo` steps) | M |
| 12 | Medium | Linking | Link `/financing/` from every `/services/*` page CTA band and every `/service-areas/*` page's pricing section | `src/layouts/ServiceLayout.astro`, `src/layouts/ServiceAreaLayout.astro`, individual service/area pages | S |
| 13 | Medium | SEO | Add `Offer` schema to `/financing/` with Synchrony term ranges | `src/pages/financing.astro`, `src/components/Schema.astro` | S |
| 14 | Medium | CRO | Trim `/book/` step 5 — drop required "State" field (ZIP already validates FL), shorten consent label from 38 to ~20 words | `src/pages/book.astro` | S |
| 15 | Medium | Content | Strengthen `/service-areas/` hub — add 300 words on tri-county coverage story, van dispatch logic, permit differences | `src/pages/service-areas/index.astro` | S |
| 16 | Medium | CRO | Add review callout + trust row to the top of `/book/` step 1 (currently buried under form) | `src/pages/book.astro` | S |
| 17 | Medium | SEO | Verify `/thank-you/` is `noindex`; exclude redirected `/our-team/` from `sitemap-0.xml` | `src/pages/thank-you.astro`, `astro.config.mjs` | S |
| 18 | Low | CRO | Embed a 45-sec "Meet Tim" video on home hero + `/about-us/` when shot; wrap with `VideoObject` schema | Content production first; then `src/pages/index.astro`, `src/pages/about-us.astro` | L |
| 19 | Low | Content | Strengthen `/services/refrigeration-repair-tampa/` — shortest unique content of any service page; add commercial-client case studies | `src/pages/services/refrigeration-repair-tampa.astro` | M |
| 20 | Low | SEO | Promote body `<h3>` headings in blog bodies to `<h2>` for IA hierarchy (currently flat H3-only under template H2) | `src/lib/blog-bodies.ts` (global find/replace inside bodies) | S |

---

## Appendix A — Full per-page metrics

| URL | Words | H2 | H3 | P | body→out | ← in |
|---|---:|---:|---:|---:|---:|---:|
| / | 1935 | 12 | 19 | 87 | 43 | 2 |
| /about-us/ | 1975 | 9 | 17 | 94 | 18 | 56 |
| /ac-blowing-warm-air-in-tampa-heres-how-to-fix-it-fast/ | 1421 | 4 | 19 | 28 | 26 | 33 |
| /ac-blowing-warm-air-in-wesley-chapel-7-common-causes-and-how-we-fix-them/ | 1033 | 4 | 15 | 24 | 26 | 5 |
| /ac-maintenance-tips/ | 833 | 4 | 13 | 23 | 26 | 1 |
| /ac-maintenance-wesley-chapel/ | 930 | 4 | 13 | 21 | 26 | 8 |
| /ac-not-cooling-solutions/ | 788 | 4 | 13 | 23 | 26 | 1 |
| /ac-not-cooling-wesley-chapel/ | 698 | 4 | 6 | 19 | 26 | 13 |
| /ac-repair-in-epperson-fast-reliable-cooling-for-lagoon-community-homes/ | 904 | 4 | 11 | 19 | 26 | 3 |
| /ac-repair-seven-oaks-wesley-chapel/ | 908 | 4 | 11 | 26 | 26 | 3 |
| /ac-repair-wesley-chapel-fl/ | 865 | 4 | 16 | 25 | 26 | 1 |
| /ac-replacement-wesley-chapel-fl/ | 944 | 4 | 11 | 21 | 26 | 3 |
| /air-conditioning-installation-wesley-chapel/ | 942 | 4 | 11 | 23 | 26 | 3 |
| /air-conditioning-not-cooling-in-tampa-fl-heres-how-to-fix-it-fast/ | 1711 | 4 | 21 | 31 | 26 | 33 |
| /air-duct-cleaning-in-wesley-chapel-fl-what-you-need-to-know/ | 995 | 4 | 12 | 23 | 26 | 2 |
| /air-duct-cleaning-wesley-chapel/ | 1170 | 4 | 12 | 25 | 26 | 4 |
| /air-filter-change-frequency/ | 698 | 4 | 8 | 18 | 26 | 1 |
| /blogs/ | 1330 | 2 | 31 | 40 | 32 | 31 |
| /book/ | 591 | 7 | 1 | 10 | 0 | 104 |
| /careers/ | 1745 | 8 | 17 | 32 | 6 | 0 |
| /contact/ | 244 | 3 | 4 | 13 | 1 | 30 |
| /emergency-ac-repair-wesley-chapel-fl/ | 966 | 4 | 12 | 23 | 26 | 2 |
| /emergency-ac-repair-wesley-chapel/ | 864 | 4 | 10 | 22 | 26 | 2 |
| /evaluate-hvac-companies-tampa-bay-repair-warranty/ | 854 | 4 | 11 | 22 | 26 | 3 |
| /financing/ | 1683 | 8 | 9 | 32 | 9 | 11 |
| /how-to-book-preventive-hvac-maintenance-in-tampa-bay-with-financing-options/ | 837 | 4 | 11 | 22 | 26 | 5 |
| /how-to-choose-the-right-hvac-team-for-your-home/ | 910 | 4 | 14 | 24 | 26 | 3 |
| /how-to-find-reliable-heating-and-air-contractors-near-me/ | 986 | 4 | 11 | 22 | 26 | 3 |
| /how-to-lower-cooling-bills-in-wesley-chapel-without-overworking-your-ac/ | 960 | 4 | 13 | 23 | 26 | 1 |
| /hvac-installation-in-tampa-bay-complete-guide-for-homeowners/ | 945 | 4 | 14 | 24 | 26 | 4 |
| /new-construction-hvac-guide-for-epperson-mirada-homeowners/ | 717 | 4 | 6 | 19 | 26 | 9 |
| /our-team/ | 8 | 0 | 0 | 0 | 1 | 0 |
| /privacy-policy/ | 535 | 12 | 0 | 16 | 0 | 0 |
| /reviews/ | 1006 | 4 | 1 | 69 | 5 | 33 |
| /service-areas/ | 453 | 6 | 1 | 14 | 24 | 70 |
| /service-areas/air-conditioning-repair-zephyrhills-fl-i-care-air-care/ | 2652 | 15 | 19 | 89 | 42 | 17 |
| /service-areas/hillsborough-county-hvac-company/ | 2452 | 15 | 19 | 87 | 42 | 64 |
| /service-areas/land-o-lakes-hvac-services/ | 2395 | 15 | 19 | 87 | 42 | 50 |
| /service-areas/lutz-home-air-conditioning-service/ | 2377 | 15 | 19 | 87 | 42 | 50 |
| /service-areas/new-tampa-heating-and-cooling/ | 2534 | 14 | 19 | 90 | 43 | 49 |
| /service-areas/odessa-emergency-ac-repair/ | 2504 | 14 | 19 | 88 | 42 | 48 |
| /service-areas/pasco-county-ac-repair/ | 2418 | 15 | 19 | 86 | 41 | 57 |
| /service-areas/polk-county-residential-ac-repair/ | 2724 | 16 | 19 | 88 | 42 | 46 |
| /service-areas/wesley-chapel-ac-repair/ | 2598 | 15 | 19 | 92 | 42 | 93 |
| /services/ | 1328 | 7 | 12 | 72 | 30 | 3 |
| /services/ac-maintenance-tampa/ | 2199 | 12 | 14 | 89 | 32 | 134 |
| /services/ac-repair-tampa/ | 2370 | 13 | 14 | 90 | 45 | 156 |
| /services/air-duct-cleaning-tampa/ | 2247 | 13 | 14 | 88 | 34 | 42 |
| /services/emergency-ac-repair-tampa/ | 2112 | 13 | 15 | 88 | 37 | 92 |
| /services/heating-services-tampa/ | 2236 | 13 | 14 | 90 | 32 | 53 |
| /services/hvac-installation-tampa/ | 2278 | 14 | 14 | 90 | 34 | 64 |
| /services/refrigeration-repair-tampa/ | 1986 | 13 | 14 | 88 | 29 | 29 |
| /services/thermostat-installation-tampa/ | 2135 | 13 | 14 | 88 | 32 | 47 |
| /terms-of-use/ | 632 | 11 | 0 | 13 | 0 | 0 |
| /thank-you/ | 39 | 0 | 0 | 2 | 2 | 0 |
| /wesley-chapel-air-conditioning/ | 947 | 4 | 11 | 21 | 26 | 3 |
| /what-are-the-best-preventive-hvac-maintenance-plans…/ | 859 | 4 | 11 | 22 | 26 | 7 |
| /what-does-a-residential-preventive-hvac-maintenance-visit-include-in-wesley-chapel-fl/ | 778 | 4 | 13 | 19 | 26 | 7 |
| /which-preventive-hvac-maintenance-plans-in-tampa-bay-offer-the-best-value/ | 809 | 4 | 10 | 22 | 26 | 7 |
| /why-homeowners-need-reliable-air-conditioning-repair-in-tampa/ | 965 | 4 | 13 | 24 | 26 | 1 |
| /why-is-my-ac-running-but-not-cooling-in-florida-what-homeowners-need-to-know/ | 1069 | 4 | 14 | 24 | 26 | 8 |

## Appendix B — Raw blog body word counts (blog-bodies.ts)

| Slug | Body words | Headings | Avg ¶/H |
|---|---:|---:|---:|
| ac-not-cooling-wesley-chapel | 171 | 0 | — |
| air-filter-change-frequency | 185 | 2 | 1.50 |
| new-construction-hvac-guide-for-epperson-mirada-homeowners | 191 | 0 | — |
| what-does-a-residential-preventive-hvac-maintenance-visit-include-in-wesley-chapel-fl | 279 | 7 | 0.57 |
| ac-not-cooling-solutions | 292 | 7 | 1.14 |
| which-preventive-hvac-maintenance-plans-in-tampa-bay-offer-the-best-value | 305 | 4 | 1.75 |
| ac-maintenance-tips | 322 | 7 | 1.14 |
| how-to-book-preventive-hvac-maintenance-in-tampa-bay-with-financing-options | 324 | 5 | 1.40 |
| what-are-the-best-preventive-hvac-maintenance-plans… | 341 | 5 | 1.40 |
| emergency-ac-repair-wesley-chapel | 345 | 4 | 1.75 |
| evaluate-hvac-companies-tampa-bay-repair-warranty | 345 | 5 | 1.40 |
| ac-repair-wesley-chapel-fl | 351 | 10 | 1.00 |
| how-to-choose-the-right-hvac-team-for-your-home | 399 | 8 | 1.13 |
| ac-repair-in-epperson-fast-reliable-cooling-for-lagoon-community-homes | 406 | 5 | 0.80 |
| ac-repair-seven-oaks-wesley-chapel | 411 | 5 | 2.20 |
| ac-maintenance-wesley-chapel | 423 | 7 | 0.86 |
| air-conditioning-installation-wesley-chapel | 428 | 5 | 1.60 |
| hvac-installation-in-tampa-bay-complete-guide-for-homeowners | 436 | 8 | 1.13 |
| ac-replacement-wesley-chapel-fl | 442 | 5 | 1.20 |
| wesley-chapel-air-conditioning | 442 | 5 | 1.20 |
| why-homeowners-need-reliable-air-conditioning-repair-in-tampa | 446 | 7 | 1.29 |
| emergency-ac-repair-wesley-chapel-fl | 450 | 6 | 1.33 |
| how-to-lower-cooling-bills-in-wesley-chapel-without-overworking-your-ac | 457 | 7 | 1.14 |
| how-to-find-reliable-heating-and-air-contractors-near-me | 464 | 5 | 1.40 |
| air-duct-cleaning-in-wesley-chapel-fl-what-you-need-to-know | 473 | 6 | 1.33 |
| ac-blowing-warm-air-in-wesley-chapel-7-common-causes-and-how-we-fix-them | 529 | 9 | 1.00 |
| why-is-my-ac-running-but-not-cooling-in-florida-what-homeowners-need-to-know | 563 | 8 | 1.13 |
| air-duct-cleaning-wesley-chapel | 635 | 6 | 1.67 |
| ac-blowing-warm-air-in-tampa-heres-how-to-fix-it-fast | 876 | 13 | 1.00 |
| air-conditioning-not-cooling-in-tampa-fl-heres-how-to-fix-it-fast | 1159 | 15 | 1.07 |

---

*End of audit. Scripts used: `scripts/audit-wordcount.mjs`, `scripts/audit-summary.mjs`. Raw data: `audit-data.json` (271 kB).*
