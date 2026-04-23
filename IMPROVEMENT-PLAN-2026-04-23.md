# I Care Air Care — Master Improvement Plan

**Date:** 2026-04-23
**Site audited:** icareaircare.com (live Astro rebuild)
**Inputs:** SE Ranking audit (Apr 23), in-repo audits (Apr 20–21), backlink/GEO/keyword sub-audits (Apr 23)
**Baseline health:** SE Ranking **90/100** · 197 issues (151 notices, 46 warnings, 0 errors) · 61 pages crawled · 700 backlinks / 154 referring domains / DT 23

---

## TL;DR — What to do first

The site is in good shape. The rebuild already shipped strong foundations (sitemap-index, llms.txt, llms-full.txt, AI-crawler-allowed robots.txt, RSS feed, rich @graph schema, 52 canonical URLs). SE Ranking's 197 issues are **all P2 or lower** — no critical errors. The biggest remaining levers are:

1. **Thin blog bodies** (25 of 29 posts under 500 words) — rewrites will unlock 30 pages of indexable content and move cluster rankings from position 20–40 into the top 10.
2. **Fix 3 redirect chains + 3 stub pages** — these are the only items SE Ranking flagged that Google will actually penalize.
3. **Alt text + long titles/descriptions** — mechanical cleanup across ~50 files, one-afternoon job.
4. **Four local link acquisitions** (Chamber, Pasco EDC, ACCA, manufacturer dealer pages) — will move Domain Trust 23 → 30+.
5. **Keyword gap fills** — build Service×Location pages for Land O Lakes, Zephyrhills, Lutz (already have areas; missing dedicated service pages like "mini-split install Zephyrhills").

Everything else is polish.

---

## Part 1 — SE Ranking Audit (Apr 23) Interpreted

### 1A. What SE Ranking flagged — severity mapped

| Sev | SE Ranking Issue | Count | Interpretation |
|-----|------------------|------:|----------------|
| 🔴 | — | 0 | No errors |
| 🟠 | 3XX HTTP status code | 3 | Real — internal links still point at redirected URLs (easy fix) |
| 🟠 | Internal links to 3XX redirect pages | 3 | Same 3 pages, different framing |
| 🟡 | Alt text missing | 39 | 30 already fixed in rebuild; 9 new to clean up |
| 🟡 | Title too long | 21 | 9 new titles on area/service pages over ~60 chars |
| 🟡 | Description too long | 12 | Same files, overshooting ~160 chars |
| 🟡 | One inbound internal link | 6 | Orphan-adjacent pages (see §2B) |
| 🟡 | XML sitemap missing | 1 | **False positive.** `/sitemap-index.xml` returns 200. SE Ranking checked `/sitemap.xml`. Either rename the exposure or ignore. |
| 🔵 | Internal links missing anchor | 56 | Mostly logo/icon links; audit each one |
| 🔵 | External links missing anchor | 56 | Same pattern — icon-only social/directory links |

### 1B. Domain + indexability snapshot

- **Indexable:** 58 / 61 (95.1%) — healthy
- **Not indexable:** 3 pages (non-200 status) — these are the redirected URLs above
- **Robots meta tags:** 61 / 61 pages have no robots meta — correct (default index,follow applies)
- **Link attributes:** 8.6% external dofollow / 91.4% internal dofollow, 0% nofollow — clean profile
- **Domain expiration:** 2026-11-22 — renew before Q4

### 1C. What SE Ranking DOES NOT see that matters

SE Ranking is a shallow crawler. It doesn't detect:
- Thin body content masked by layout chrome (see Part 2)
- Schema that's present but structurally suboptimal (see Part 3)
- Missing E-E-A-T signals (author Person schema on non-blog pages)
- AI citation readiness (llms.txt quality, Quick Answer blocks)
- Backlink gap vs competitors

Those are covered below.

---

## Part 2 — Content Depth & Linking

### 2A. Thin blog bodies — the single biggest win

From `AUDIT-2026-THIN-CONTENT-AND-LINKING.md`: **25 of 29 blog posts are under 500 words.** Four are critical stubs:

| Slug | Body words | Headings |
|------|-----------:|---------:|
| `ac-not-cooling-wesley-chapel` | 171 | 0 |
| `new-construction-hvac-guide-for-epperson-mirada-homeowners` | 191 | 0 |
| `air-filter-change-frequency` | 185 | 2 |
| `what-does-a-residential-preventive-hvac-maintenance-visit-include-in-wesley-chapel-fl` | 279 | 7 (headline salad) |

**Plan:** rewrite every flagged post to the template established in `AUDIT-2026-THIN-CONTENT-AND-LINKING.md` Part 1C:
- 900 body words minimum
- H2 "Why this happens in [location]" / "Step-by-step" / "When to call a licensed tech" / "How much does this cost" / "FAQs"
- Insert one customer mini-story per post ("How we fixed this for [Name] in [Neighborhood]")
- Inline one internal link to matching service-area page
- Add "Last updated: YYYY-MM-DD" + Tim Hawk byline + Person schema author
- Dollar ranges on every cost-related post

### 2B. Orphan and dead-end pages

From AUDIT-2026: internal linking is lopsided.

**Pages with ≤2 inbound links (need inbound):**
- `/emergency-ac-repair-wesley-chapel/` (high-intent, only 1 inbound)
- `/why-homeowners-need-reliable-air-conditioning-repair-in-tampa/`
- `/how-to-lower-cooling-bills-in-wesley-chapel-without-overworking-your-ac/`
- `/ac-repair-wesley-chapel-fl/`
- `/air-filter-change-frequency/`
- `/ac-maintenance-tips/`
- `/careers/` (0 inbound — add from Footer + About)

**Pages with ≥30 inbound, ≤1 outbound (need outbound):**
- `/book/` (104 inbound, 0 outbound — acceptable for conversion terminus)
- `/contact/` (30 inbound, ≤1 outbound — add "While you wait: read our service area guides" block)

### 2C. Redirect hygiene (SE Ranking's 3XX findings)

Three URLs are 301-redirected but still internally linked:

| Redirect source | Link destination fix |
|-----------------|---------------------|
| `/air-duct-cleaning-in-wesley-chapel-fl-what-you-need-to-know/` | → `/air-duct-cleaning-wesley-chapel/` |
| `/emergency-ac-repair-wesley-chapel-fl/` | → `/emergency-ac-repair-wesley-chapel/` |
| `/ac-not-cooling-solutions/` | → `/ac-not-cooling-wesley-chapel/` |

**Action:** grep `src/` and `src/lib/blog-bodies.ts` for these slugs in any `href=` and update to destination.

---

## Part 3 — Technical SEO

### 3A. From the in-repo AUDIT-REPORT.md (already known, re-prioritized)

Cross-referenced against current live state. Items still outstanding:

| P | Item | File | Notes |
|---|------|------|-------|
| 🔴 | Form redirect goes to `/contact/#thanks` with no anchor/success message | `MultiStepForm.astro`, `LeadForm.astro`, `contact.astro` | Either add `id="thanks"` section or redirect to `/thank-you/` |
| 🔴 | Privacy Policy + Terms of Use pages missing | `src/pages/` | Footer links 404; CCPA/GDPR exposure |
| 🔴 | Three service-area page stubs (new-tampa, odessa, zephyrhills) | per AUDIT-REPORT.md §2 | Per `AUDIT-2026-THIN-CONTENT-AND-LINKING.md` these now clear 2,500 words — **re-verify; if content shipped, close ticket** |
| 🟠 | Blog Article schema `author: Organization` → should be `Person` (Tim Hawk) | `src/pages/[slug].astro:111` | EEAT upgrade for 29 blog posts |
| 🟠 | Aside `<h2>` competes with article headings | `src/pages/[slug].astro:92,100` | Change "Need help with this?" and "Popular next steps" to `<h3>` |
| 🟠 | No `Review` schema anywhere | Area pages carry 3 verbatim reviews each | Wrap in `Review` items nested in LocalBusiness `@graph` |
| 🟠 | `openingHoursSpecification` missing from LocalBusiness schema | `src/components/Schema.astro` | Use `SITE.hoursStructured` |
| 🟠 | `/services/` hero CTA mismatch | `src/pages/services/index.astro` | "Request a Quote" points to `/service-areas/` — fix to `/contact/` |
| 🟡 | County pages use `areaServed '@type': 'City'` | `src/layouts/ServiceAreaLayout.astro:264` | Change to `AdministrativeArea` for Pasco/Hillsborough/Polk |
| 🟡 | Double `.webp.webp` extensions in 2 blog posts | `src/lib/blog.ts:162,372` | Verify files on disk; fix if broken |
| 🟡 | Three blog posts share the same install photo | `src/lib/blog.ts` | De-duplicate featured images |
| 🟡 | LeadForm has duplicate address fields | `src/components/LeadForm.astro:51` | Remove the "search address" field |
| 🟡 | Landmark heading fragment ends "...we serve around" without cityName | `src/layouts/ServiceAreaLayout.astro:193` | Interpolate `{cityName}` |
| 🟡 | ServiceGrid alt text uses service name only | `src/components/ServiceGrid.astro:38` | Replace with image-content descriptions |
| 🟡 | Blog post hero images all get default team-photo alt text | `src/pages/[slug].astro` | Pass per-post `imageAlt` |
| 🟢 | Title/Description overlength (SE Ranking: 21 titles + 12 descriptions) | Various | Batch tighten to ≤60 chars / ≤155 chars |
| 🟢 | "sixteen years" sentence-case typos | `src/pages/about-us.astro:95,165` | Capitalize first letter |
| 🟢 | `_redirects` fragment-stripped by Netlify | `public/_redirects:1-2` | Our-team fragment won't preserve |

### 3B. What's already solid (don't re-touch)

- ✅ `sitemap-index.xml` auto-generated by `@astrojs/sitemap`, 52 URLs, excludes utility pages
- ✅ `robots.txt` explicitly allows GPTBot, ClaudeBot, Google-Extended, PerplexityBot + all standard crawlers
- ✅ `llms.txt` + `llms-full.txt` published, UTF-8, permissive CORS
- ✅ RSS 2.0 feed at `/rss.xml` with 27 posts + `<link rel="alternate">` discovery tag
- ✅ Canonical tags from `Astro.url.pathname` + SITE.url
- ✅ WebSite schema in homepage `@graph`
- ✅ `_headers` security posture (HSTS, nosniff, frame-ancestors, Permissions-Policy)
- ✅ Legacy WordPress date-permalink redirects in `_redirects`

---

## Part 4 — E-E-A-T & Schema

### 4A. Strong existing signals
- Tim Hawk named + credentials (CAC1816515, EPA 608 Universal) across pages
- 700+ Google reviews · 4.9★ · physical address (not PO Box)
- `Person` schema for Tim in home page @graph
- Verbatim customer reviews on area pages

### 4B. Gaps to close

| P | Item | Action |
|---|------|--------|
| 🟠 | Blog `author` = Organization | Change to `Person` w/ `jobTitle`, `sameAs` LinkedIn if exists |
| 🟠 | `ReviewStrip` carousel uses editorial summaries, not verbatim | Replace with 5 real customer quotes + names |
| 🟡 | No named individuals in "The Install Crew / Service Team / Office" on About | Name at least 1 individual per group (privacy-permitting) |
| 🟡 | NADCA + "70% installed wrong" claims have no citation URL | Add `<cite>` links to primary sources |
| 🟡 | `Offer`/`LoanOrCredit` schema missing on `/financing/` | Add Synchrony partner schema + application link |
| 🟢 | No `sameAs` Facebook/Yelp/BBB in LocalBusiness schema | Add whatever directory profiles exist |
| 🟢 | No NADCA member badge on air duct page | Either add badge or soften language |

### 4C. Quick Answer blocks for AI citation

Every service and service-area page should open with a ≤167-word self-contained paragraph answering the literal page query. Template:

```
## What does [service] cost in [location], FL?

Most [service] calls in [location] run $X–$Y for parts and labor.
[One specific stat]. [Second stat]. I Care Air Care (license CAC1816515)
offers [warranty]. Tim Hawk's team services [location] from their
Foamflower Boulevard shop and typically arrives within 60–90 minutes of
your call. For an exact quote, call (813) 395-2324 or book online.
```

This is the format AI Overviews / ChatGPT cite most. The `/services/ac-repair-tampa/` page partially does this — extend to all 17 service/area pages.

---

## Part 5 — Keyword Strategy (provisional — DataForSEO not live)

*Note: DataForSEO MCP wasn't connected during this audit. Figures below are directional; re-run with live data before committing content budget.*

### 5A. Current rankings (from RANKED-URLS-AUDIT-2026-04-21.md — confirmed)

- 100 keyword rankings across 21 URLs
- Homepage owns brand query "i care air care" (#1)
- **Odessa page** carries 18 "urgent / 24-hour AC repair" rankings — biggest single concentration
- **Zephyrhills page** has 14 keywords at ranks 22–29 — ripe for a push into top 10
- Most rankings cluster at positions 20–40 → **promotion is higher-value than net-new keywords**

### 5B. Highest-value promotion candidates

| Page | Current top kw | Rank | Volume | Action |
|------|---------------|-----:|-------:|--------|
| `/service-areas/odessa-emergency-ac-repair/` | "urgent ac" | 14 | 880 | Push to #5 — rewrite Quick Answer block, add 2 more verbatim reviews, add `Review` schema |
| `/service-areas/air-conditioning-repair-zephyrhills-fl-i-care-air-care/` | "ac repair in zephyrhills fl" | 22 | 170 | Verify rewrite per CLAUDE.md todo; add named neighborhoods |
| `/services/air-duct-cleaning-tampa/` | "air care services" | 11 | 480 | Expand "What's in our process" with H2 + 3 H3s |
| `/ac-repair-wesley-chapel-fl/` | "wesley chapel ac repair" | 35 | 480 | Tighten title, add Quick Answer, add 3 FAQs |
| `/service-areas/wesley-chapel-ac-repair/` | "complete care air" | 24 | — | Primary money page; add "average call time" + pricing block |

### 5C. Gap keywords to target (provisional list)

| # | Keyword | Est Vol | Est KD | Current page | New page needed? |
|---|---------|--------:|-------:|--------------|------------------|
| 1 | ductless mini split installation tampa | 200–400 | 30–40 | — | Yes — `/services/mini-split-installation-tampa/` |
| 2 | heat pump repair tampa | 150–300 | 30–40 | — | Yes — `/services/heat-pump-repair-tampa/` |
| 3 | commercial hvac tampa | 200–400 | 35–45 | — | Maybe — B2B vertical |
| 4 | indoor air quality tampa | 150–300 | 25–35 | — | Yes — `/services/indoor-air-quality-tampa/` |
| 5 | uv light air purifier installation | 100–200 | 20–30 | — | Subsection of IAQ page |
| 6 | ac maintenance plan tampa | 100–200 | 25–35 | Partial | Expand existing page |
| 7 | hvac financing tampa | 100–200 | 25–35 | `/financing/` | Add Synchrony widget |
| 8 | ac not cooling troubleshoot | 500–1000 | 30–40 | Partial blog | Rewrite flagship blog |
| 9 | ac replacement cost florida | 300–600 | 35–45 | — | Yes — blog with cost table |
| 10 | ac repair new tampa | 100–200 | 25–35 | Stub — needs rebuild | Per existing CLAUDE.md todo |

### 5D. Service × location matrix gaps

9 areas × 8 services = 72 possible pages. Most thin if built all. Build **only these 8 high-intent combinations**:

1. `/services/air-duct-cleaning-wesley-chapel/`
2. `/services/hvac-installation-land-o-lakes/`
3. `/services/ac-maintenance-wesley-chapel/`
4. `/services/emergency-ac-repair-zephyrhills/`
5. `/services/hvac-installation-pasco-county/`
6. `/services/ac-repair-new-tampa/`
7. `/services/heating-services-wesley-chapel/`
8. `/services/ac-repair-lutz/`

Each with Manual-J numbers, local HOA specifics, neighborhood list, 3 local reviews, area-specific pricing.

---

## Part 6 — Backlinks

Current: 700 backlinks, 154 referring domains, Domain Trust 23. Healthy for a local contractor; low vs franchise competitors (ARS, Cool Today sit at DT 40–60+).

### 6A. Critical acquisitions (within 30 days)

| Target | Why | Cost | Path |
|--------|-----|------|------|
| Wesley Chapel Chamber of Commerce | DA 40+, local trust signal | ~$300/yr | Apply for membership |
| Pasco EDC / Pasco County business directory | Government TLD adjacency | Free | Submit vendor listing |
| ACCA (acca.org) member directory | DA 60+, industry authority | ~$500/yr | Full ACCA membership |
| Florida HVACR Association | State-level trade body | Membership fee | State application |

### 6B. High-priority (within 60 days)

- Carrier / Trane / Lennox dealer locator pages (DA 60–80) — contact distributor rep
- Angi / HomeAdvisor profile — verify canonical URL is `https://www.icareaircare.com/` with exact NAP
- NextDoor Business Page (hyper-local referral traffic)
- Tampa Bay Times local business pitch (DA 80+)

### 6C. Medium-term

- Local HOA newsletter sponsorships (Wiregrass Ranch, Meadow Pointe, Tampa Palms)
- Manufacturer dealer enrollment (requires Carrier/Trane relationship verification)

### 6D. Risk items

- SE Ranking shows `Backlinks 700 ▲1 · Referring domains 154 ▲1` — very slow growth. Acquisitions plan above should produce +8–12 new referring domains within 90 days.
- No evidence of spam link risk at 4.5:1 link-to-domain ratio. **Do not disavow** without Moz Spam Score >70 confirmation.
- When requesting links, specify **geo-modified anchor text** ("Wesley Chapel HVAC contractor") not brand — brand anchor pool is already saturated.

---

## Part 7 — GEO / AI Search Readiness

### 7A. What's already in place (confirmed)

- ✅ robots.txt explicitly allows GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot, anthropic-ai, PerplexityBot, Perplexity-User, Google-Extended, Applebot-Extended, CCBot, Bytespider, Amazonbot, Meta-ExternalAgent, cohere-ai, Diffbot
- ✅ `/llms.txt` + `/llms-full.txt` live, UTF-8, CORS-permissive
- ✅ Rich `@graph` schema (LocalBusiness + Person + WebSite)
- ✅ Astro SSG output = fully server-rendered HTML (no JS-dependent content blocked from crawlers)
- ✅ Named expert (Tim Hawk) with credentials schema

### 7B. What's missing

| P | Item | Action |
|---|------|--------|
| 🟠 | No "Last updated" dates visible on content pages | Add `dateModified` to template + visible "Updated: YYYY-MM-DD" line |
| 🟠 | No Quick Answer block pattern on most pages | Apply template from §4C to every service + area page |
| 🟡 | No YouTube channel | Highest-correlation AI citation signal (0.737). Even 3 phone-shot videos with Tim would create a citable entity |
| 🟡 | No VideoObject schema | Depends on YouTube content existing first |
| 🟡 | No `SpeakableSpecification` for voice assistants | Easy add to homepage + service pages |
| 🟢 | No Reddit / community answer presence | r/tampa, r/WesleyChapel expert-response presence over 60 days |

### 7C. Platform scores (estimated)

| Platform | Score | Top fix |
|----------|-------|---------|
| Google AI Overviews | 70 | Add Quick Answer blocks + `dateModified` |
| ChatGPT Browse | 70 | Same |
| Perplexity | 80 | FAQ blocks already present; push `llms.txt` |
| Bing Copilot | 65 | Submit sitemap to Bing Webmaster Tools (if not done) |

---

## Part 8 — Prioritized Punch List

### Week 1 — Quick wins (estimated 1–2 days of focused work)

1. Fix 3 redirect-chain internal links (grep `air-duct-cleaning-in-wesley-chapel-fl-what-you-need-to-know`, `emergency-ac-repair-wesley-chapel-fl`, `ac-not-cooling-solutions` → update href)
2. Fix form success state — add `id="thanks"` section to `/contact/` or create `/thank-you/` page
3. Create `/privacy-policy/` and `/terms-of-use/` pages (footer links 404 today)
4. Change blog `author` from `Organization` to `Person (Tim Hawk)` in `src/pages/[slug].astro`
5. Change `<h2>` in blog post asides to `<h3>`
6. Fix `/services/` hero CTA href
7. Fix `ServiceAreaLayout` landmark heading cityName interpolation
8. Capitalize "sixteen" on about-us lines 95 + 165
9. Batch tighten 21 long titles + 12 long descriptions (use a helper script)
10. Verify `.webp.webp` extensions — rename files or update paths

### Week 2 — Schema & EEAT

11. Add `openingHoursSpecification` to LocalBusiness schema from `SITE.hoursStructured`
12. Change county pages `areaServed '@type'` from `City` to `AdministrativeArea`
13. Add `Review` items to LocalBusiness `@graph` for the 3 verbatim reviews on each area page
14. Add `dateModified` to all pages + visible "Updated:" line
15. Add `SpeakableSpecification` to homepage + service pages
16. Remove LeadForm duplicate address fields
17. Fix `ServiceGrid` alt text + blog post per-image alt text

### Week 3–4 — Content depth (biggest ROI)

18. Rewrite 4 critical-stub blog posts (ac-not-cooling-wesley-chapel, air-filter-change-frequency, new-construction-hvac-guide, preventive-maintenance-visit) to 900+ words with template
19. Rewrite remaining 21 thin blog posts at rate of 3/week
20. Add Quick Answer block to every service + service-area page
21. Strengthen `/reviews/` with 10–15 verbatim customer quotes + names + neighborhood
22. Strengthen `/careers/` with salary ranges + simple apply form
23. Strengthen `/financing/` with Synchrony online application link + `Offer` schema

### Month 2 — New pages & backlinks

24. Build `/services/mini-split-installation-tampa/`, `/services/heat-pump-repair-tampa/`, `/services/indoor-air-quality-tampa/`
25. Build 3 highest-value Service×Location pages (air-duct-cleaning-wesley-chapel, hvac-installation-land-o-lakes, emergency-ac-repair-zephyrhills)
26. Apply to Wesley Chapel Chamber + Pasco EDC + ACCA + FL HVACR Association
27. Claim/verify Angi + HomeAdvisor + NextDoor profiles with exact NAP
28. Contact Carrier/Trane/Lennox distributor about dealer locator enrollment

### Month 3 — Ambient authority

29. Produce 3 YouTube videos (Tim, phone-shot, 3–5 min each): "Why Is My AC Blowing Warm Air in Florida," "AC Repair Cost in Tampa Bay," "How to Choose an HVAC Contractor"
30. Add VideoObject schema to About page + embed on relevant service pages
31. Claim Reddit expert presence in r/tampa, r/WesleyChapel (reputation, not spam)
32. Pitch Tampa Bay Times local business feature

---

## Part 9 — Measurement

### KPIs to track (weekly)

| Metric | Source | Today | 90-day target |
|--------|--------|------:|--------------:|
| SE Ranking health score | SE Ranking | 90 | 95 |
| Issue count | SE Ranking | 197 | <75 |
| Domain Trust | SE Ranking | 23 | 30 |
| Referring domains | SE Ranking | 154 | 175 |
| Ranked keywords (top 10) | DataForSEO | ~5 | 15+ |
| Ranked keywords (top 20) | DataForSEO | ~20 | 40+ |
| AI Overview citations | Manual check | Unknown | Baseline + 5/month |
| GBP call actions | GBP Insights | baseline | +20% |
| Form submissions | FormSubmit log | baseline | +30% |

### Audit cadence

- **Monthly:** re-run SE Ranking audit (compare issue deltas)
- **Monthly:** GSC Coverage + Core Web Vitals check
- **Quarterly:** DataForSEO ranked-kws + competitor intersection
- **Quarterly:** Moz / DataForSEO backlink Spam Score pull
- **Annually:** Full E-E-A-T + content depth audit (re-run `AUDIT-2026-THIN-CONTENT-AND-LINKING.md` script)

---

## Appendix — Files & locations

| File | Purpose |
|------|---------|
| `AUDIT-REPORT.md` | Apr 20 — full repo audit (still authoritative for schema + codebase issues) |
| `AUDIT-2026-THIN-CONTENT-AND-LINKING.md` | Apr 21 — deep content/linking audit (thin-blog punch list) |
| `FULL-SEO-CRO-AUDIT.md` | Apr 21 — full SEO+CRO audit with remediation templates |
| `RANKED-URLS-AUDIT-2026-04-21.md` | Apr 21 — 100 ranked keywords / 21 URLs snapshot |
| `SEO-STRATEGY-2026.md` | Apr 21 — what's shipped + future-consideration list |
| `CODEX-REVIEW-REPORT.md` | Apr 21 — code-review angle |
| `IMPROVEMENT-PLAN-2026-04-23.md` | **This file** — consolidated action plan |

---

*Generated 2026-04-23 from: SE Ranking audit PDF, existing in-repo audits, backlink sub-audit, GEO sub-audit, keyword sub-audit, live site probes. DataForSEO MCP was not connected during the keyword analysis — re-run that section with live data before committing content budget.*
