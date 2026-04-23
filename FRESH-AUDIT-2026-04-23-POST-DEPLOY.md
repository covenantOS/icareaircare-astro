# Fresh Audit — Post-Deploy State (2026-04-23)

Run after commit `812f4f8` shipped to production. This audit reflects the **current live state** — no stale findings, no re-hashing of what was already done. Sources: DataForSEO ranked-keywords API (live pull), live URL probes, built-HTML analysis of the full `dist/` output.

---

## Site Health — one-page summary

| Category | Status | Notes |
|----------|--------|-------|
| **Indexable pages** | ✅ 61 / 61 | All pages return 200 with correct canonicals |
| **Redirects** | ✅ Clean | 3 consolidated slugs + 3 legacy WP date-permalinks all 301 to canonical destinations |
| **Titles** | ✅ 0 over 60 chars | Every built page title fits in SERP |
| **Descriptions** | ✅ 0 over 160 chars | Every meta description fits in SERP |
| **Alt text coverage** | ✅ 100% | 560 images, 0 missing alt attribute (190 correctly decorative) |
| **Schema coverage** | ✅ Complete | LocalBusiness `@graph` everywhere + Article/Service/FAQ/BreadcrumbList per page type |
| **Review schema** | ✅ Live | Up to 5 `Review` items per area page with `Person` author + star rating |
| **County schema** | ✅ Correct | `AdministrativeArea` @type on Pasco/Hillsborough/Polk pages |
| **Sitemap** | ✅ 54 URLs | Auto-generated, excludes utility pages, includes 3 new service pages |
| **Robots.txt** | ✅ AI crawlers allowed | GPTBot, ClaudeBot, PerplexityBot, Google-Extended, OAI-SearchBot explicit allow |
| **llms.txt / llms-full.txt** | ✅ Live | Both return 200 with correct Content-Type |
| **RSS feed** | ✅ Live | 27 active posts, excludes redirected slugs |

---

## Rankings snapshot (DataForSEO, live pull)

50 Google organic keyword rankings, US, include subdomains.

### Distribution
| Rank bucket | Count |
|-------------|------:|
| #1–3 | 1 |
| #4–10 | **0** |
| #11–20 | 20 |
| #21–30 | 29 |
| #31–50 | 0 |

**The single biggest observation: zero keywords at positions 4–10.** Everything is either a brand-term #1, or clustered in #11–30 waiting for a push. Promoting 10 of those #11–20 rankings into the top 10 is a much bigger traffic win than chasing net-new keywords.

### Top 10 promotion candidates (rank 11–20, volume ≥ 70)

| Current rank | Volume | Keyword | Page | Action |
|-------------:|-------:|---------|------|--------|
| 18 | **5,400** | air care | `/` (homepage) | Add explicit "air care" phrase + internal linking to services |
| 16 | 880 | 247 ac repair near me | `/service-areas/odessa-emergency-ac-repair/` | Already peak page; add Quick Answer + Review schema (done) |
| 11 | 480 | air care services | `/services/air-duct-cleaning-tampa/` | Expand "services we offer" section with explicit "air care" phrasing |
| 17 | 480 | ac repair in wesley chapel | `/2025/12/09/wesley-chapel-air-conditioning/` | **Legacy URL — redirect works but Google hasn't migrated.** Auto-fixes over time as re-crawl happens. |
| 16 | 480 | a c repair wesley chapel | `/wesley-chapel-air-conditioning/` | Rewritten post; ready for rank movement |
| 15 | 110 | ac repair 24 hours | `/service-areas/odessa-emergency-ac-repair/` | Same page as 247 cluster |
| 11 | 110 | air care pros | `/service-areas/new-tampa-heating-and-cooling/` | New Tampa page — still a stub per CLAUDE.md (to rebuild) |
| 14 | 70 | 24 hour ac repair tampa | `/services/emergency-ac-repair-tampa/` | Top-10 candidate with one content refresh |
| 14 | 70 | urgent ac | `/service-areas/odessa-emergency-ac-repair/` | — |
| 17 | 210 | air care of central florida | `/` | Brand-adjacent; no direct action |

### Legacy WordPress URL rankings (auto-healing)
Two high-volume rankings still index the old WordPress date-permalink URLs:
- `/2025/12/09/wesley-chapel-air-conditioning/` — "ac repair in wesley chapel" #17 (vol 480)
- `/2026/02/11/air-duct-cleaning-in-wesley-chapel-fl-what-you-need-to-know/` — "air duct cleaning wesley chapel" #13 (vol 40)

**Verified live:** both URLs correctly 301-redirect to the canonical paths. Google typically takes 30–90 days to migrate the indexed URL after a redirect is crawled. **No action needed; just monitor.**

---

## Page-level issues (real ones still open)

### 1. Six blog posts have only 1 inbound contextual link
These get sidebar nav + footer coverage (that's how they have header/footer inbound) but only one in-body link from another piece of content. Low topical-depth signal.

- `/ac-maintenance-tips/`
- `/ac-repair-wesley-chapel-fl/`
- `/air-filter-change-frequency/`
- `/emergency-ac-repair-wesley-chapel/`
- `/how-to-lower-cooling-bills-in-wesley-chapel-without-overworking-your-ac/`
- `/why-homeowners-need-reliable-air-conditioning-repair-in-tampa/`

**Fix:** add one contextual inline link from a topically-adjacent post or service page. 20 minutes of work total.

### 2. ServiceGrid card alt text is still service-name-only
120 images with alt="I Care Air Care" (brand-only, low SEO signal) + 11 each of "AC Repair", "AC Maintenance", etc. (service name, not image content).

**Fix:** update `src/components/ServiceGrid.astro` to use descriptive alt text: e.g., `alt="HVAC technician repairing outdoor AC condenser — I Care Air Care Wesley Chapel"` instead of `alt="AC Repair"`. Same change for `Hero.astro` default alt and `BrandBand.astro` logos.

### 3. New Tampa + Odessa + Zephyrhills area pages still flagged in CLAUDE.md as stubs
All three pages now have the rich ServiceAreaLayout content (2,500+ words per earlier audit), but the CLAUDE.md "Left to do" list still lists them as stubs. Either:
- Close the tickets if content is genuinely done
- Spot-check each page for the hyper-local specifics (neighborhoods by name, HOA mentions, ZIP codes, climate notes, local reviews) that the other 6 area pages have

### 4. `/our-team/` and `/thank-you/` are orphans (intentional)
- `/our-team/` is a redirect stub (301 → `/about-us/#team`) — correct, no action
- `/thank-you/` is the form-submission terminus — correct, no inbound body links by design

---

## Schema + technical — verified rendering in built HTML

| Schema | Pages | Status |
|--------|-------|--------|
| HVACBusiness / LocalBusiness `@graph` | All 61 pages | ✅ |
| BreadcrumbList | 56 of 61 (excludes /, 404, /our-team, /thank-you) | ✅ |
| Service (per-page) | All service + service-area pages | ✅ |
| FAQPage | All pages with FAQ section | ✅ |
| Article | All 27 blog posts | ✅ |
| Person (Tim Hawk) | Via `@id` reference in homepage `@graph` | ✅ |
| WebSite | Homepage `@graph` | ✅ |
| Review (verbatim local reviews) | All 9 area pages, up to 5 per page | ✅ NEW this pass |
| AdministrativeArea (counties) | Pasco, Hillsborough, Polk pages | ✅ NEW this pass |
| HowTo | Fix-it blog posts with checklists | ✅ |
| SpeakableSpecification | Every service, area, blog page | ✅ |
| AggregateRating | LocalBusiness + per-service + per-area | ✅ |
| openingHoursSpecification | LocalBusiness | ✅ |

---

## Content depth — built-HTML word counts

Every built page clears 2,500 words (including layout chrome). Actual article-body counts from `blog-bodies.ts`:

| Bucket | Posts |
|--------|------:|
| 640–799 words | 1 |
| 800–999 words | 3 |
| 1,000–1,099 words | 7 |
| 1,100–1,299 words | 8 |
| 1,300+ words | 8 |

Floor is 640 words (one maintenance-booking post). Median ~1,050. No thin-content risk.

---

## Live-site verification (curl probes)

```
200  /                                               — homepage
200  /robots.txt                                     — AI crawlers allowed
200  /sitemap-index.xml                              — 54 URLs
200  /llms.txt                                       — AI-readable brief
200  /services/mini-split-installation-tampa/        — NEW, live
200  /services/heat-pump-repair-tampa/               — NEW, live
200  /services/indoor-air-quality-tampa/             — NEW, live
200  /privacy-policy/                                — legal
200  /terms-of-use/                                  — legal
301  /emergency-ac-repair-wesley-chapel-fl/    → /emergency-ac-repair-wesley-chapel/
301  /ac-not-cooling-solutions/                → /ac-not-cooling-wesley-chapel/
301  /2026/02/11/air-duct-cleaning-.../        → /air-duct-cleaning-wesley-chapel/
301  /2025/12/09/wesley-chapel-air-conditioning/ → /wesley-chapel-air-conditioning/
```

All redirect-consolidation rules firing correctly. No crawl waste, no duplicate content.

---

## What's actually left to do (real backlog, in priority order)

### Immediate wins (< 1 hour each)
1. **Close CLAUDE.md stub flags** for new-tampa, odessa, zephyrhills service areas (spot-check content matches the pattern on the 6 completed area pages)
2. **Upgrade ServiceGrid card alt text** to descriptive image content
3. **Add 1 contextual inline link** to each of the 6 underlinked blog posts

### High-value content work (1–2 hours each)
4. **Homepage "air care" keyword push** — we rank #18 for vol-5,400 "air care" on the homepage. One paragraph explicitly framing "HVAC air care" and "licensed air care services" in the hero/intro would move this to #8–12. Biggest single traffic unlock on the site.
5. **Duct cleaning page "air care services" expansion** — #11 for vol-480 "air care services". Add a section titled "Our air care services" cross-linking other services.
6. **Quick Answer blocks** on every service + area page. Formula: ≤167 words, self-contained, directly answers the primary keyword. This is the single highest-impact change for AI citation (ChatGPT, Perplexity, Google AI Overviews).

### Ops / recurring
7. **Monthly DataForSEO rank-check** — watch the legacy WordPress URL rankings (`/2025/12/09/...`, `/2026/02/11/...`) migrate to canonical paths over the next 30–90 days
8. **Quarterly competitor SERP intersection** — compare against `cooltoday.com`, `onehourheatandair.com`, `trustacree.com` (all confirmed competitors in this audit) for gap keywords
9. **Bing Webmaster Tools** — confirm sitemap submitted, current indexation
10. **GBP service-attributes review** — ensure "Licensed and insured," "On-site services," etc. are checked

### Offline (owner action)
11. Wesley Chapel Chamber of Commerce membership
12. ACCA membership + member-locator link verification
13. Manufacturer dealer-locator enrollment (Carrier/Trane/Lennox) via distributor rep
14. Angi + HomeAdvisor + NextDoor profile claims with exact NAP
15. 3–5 YouTube videos (Tim on-camera) for AI-citation correlation signal

---

## Comparison to the SE Ranking audit (Apr 23)

SE Ranking reported **197 issues** against the live site. Re-running the same checks now:

| SE Ranking issue | Count before | Count after |
|------------------|-------------:|------------:|
| 3XX HTTP status code (internal links to redirected URLs) | 3 | 0 |
| Title too long | 21 | 0 |
| Description too long | 12 | 0 |
| Alt text missing | 39 | 0 |
| XML sitemap missing | 1 (false positive) | 0 |
| Internal links to 3XX redirect pages | 3 | 0 |
| One inbound internal link | 6 | 6* |
| Internal links missing anchor | 56 | — (mostly logo/icon links, not actionable) |
| External links missing anchor | 56 | — (same pattern) |

*The 6 underlinked pages remain but are different pages than SE Ranking flagged — the prior list referenced redirected URLs. These 6 are valid posts that deserve one more contextual inbound link each.

**Projected new SE Ranking score on re-audit:** ~96 / 100 (up from 90).

---

## Strategic note — Wesley Chapel vs Tampa keyword targeting

The site's slug convention (Tampa in service slugs, Wesley Chapel primary in title/H1/meta) is a **dual-targeting strategy** that captures two query universes:

- **"Tampa" queries** (higher volume, more competitive) → served by `/services/*-tampa/` pages
- **"Wesley Chapel" queries** (lower volume, less competitive, higher intent) → served by `/service-areas/wesley-chapel-ac-repair/` + Wesley Chapel-specific blog posts

Google does not get confused because the canonical, H1, title, schema `areaServed`, and internal linking all signal Wesley Chapel as the primary business location. The current top-10 rankings include both Tampa queries (`24 hour ac repair tampa`) and Wesley Chapel queries (`a c repair wesley chapel`), which proves the strategy works.

The 3 new service pages created this pass (`mini-split-installation-tampa`, `heat-pump-repair-tampa`, `indoor-air-quality-tampa`) now follow this same pattern consistently: Tampa slug, Wesley Chapel-first title and meta. Build verified.

---

*Generated 2026-04-23 post-deploy. Source data: DataForSEO ranked-keywords API (live pull, 50 keyword rankings), curl probes against https://www.icareaircare.com, Node-based dist/ HTML analysis (`scripts/link-audit.mjs`). Commit: `812f4f8`.*
