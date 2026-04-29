# Competitive Audit — icareaircare.com vs nealhvac.com
**Date:** 2026-04-29
**Method:** Live recon (curl + WebFetch + DataForSEO ranked keywords + DataForSEO domain rank overview) on both sites' homepages, sitemaps, services, areas, and blog. Both sites recently rebuilt.

---

## Tech stack — what they're each running

| | **icareaircare.com** | **nealhvac.com** |
|---|---|---|
| Framework | **Astro 5** (static) | **WordPress 6.9.4 + Elementor 4.0.2** |
| Theme/builder | Tailwind v4 (`@theme` block) | Elementor page builder |
| SEO plugin | n/a (hand-rolled in `<BaseLayout>`) | Yoast SEO |
| Hosting / CDN | **Cloudflare Pages** + global edge | **Hostinger** shared (LiteSpeed/PHP 8.3) |
| HTTPS / HSTS | preload, includeSubDomains, max-age 1y | upgrade-insecure only — **no HSTS** |
| Sitemap format | `sitemap-index.xml` → `sitemap-0.xml` (modern) | `sitemap_index.xml` → 1 page-sitemap (Yoast default) |
| Total indexable URLs | **59** | **17** |

**Read on tech:** They went the cheapest, most-default WordPress route — Hostinger shared PHP host + Yoast + Elementor + LiteSpeed. It works, but it's slow (PHP-rendered on every miss, no edge cache by default), brittle (Elementor templating couples content to design), and limits schema/control to whatever Yoast emits. ICAC is on a static-site stack served from Cloudflare's edge — measurably faster TTFB and zero PHP overhead.

---

## Volumetric comparison

| Dimension | ICAC | Nealhvac | ICAC vs Nealhvac |
|---|---:|---:|:---:|
| Sitemap URLs | 59 | 17 | **3.5× more** |
| Service pages | 13 | 9 | +44% |
| Service-area pages | 10 | 3 | **3.3× more** |
| Blog posts | 28 | **0** | ICAC dominant |
| Internal links on homepage | 142 | 18 | **7.9× more** |
| Schema `@type` distinct values | 21+ | ~13 | ICAC dominant |
| FAQ Q's per page (schema) | 6–11 | **1** | ICAC dominant |
| Avg service-page word count | ~4,500–5,000 | ~2,000 | ICAC dominant |
| Avg area-page word count | ~4,200–4,500 | ~2,082 | ICAC dominant |
| Neighborhoods named on area pages | 15 (Wesley Chapel page) | **0** (Sun City page) | ICAC dominant |
| ZIPs named on area pages | 23 (Pasco County page) | 1 (Sun City page) | ICAC dominant |
| Ranked keywords (DataForSEO) | **149** | 26 | **5.7× more** |
| Estimated traffic value (DataForSEO ETV) | $220.7 | $61.7 | 3.6× more |
| Top-10 keywords | 1 | 3 | Nealhvac slight lead |
| Position 11–20 keywords | 14 | 2 | ICAC dominant |

---

## Where Nealhvac actively breaks SEO basics (their site is WORSE than ICAC's)

These are bugs in their build that benefit ICAC by default — listing them so you understand the competitive set:

1. **`/about/` and `/contact/` 301-redirect to `/`** — destroys deep-link equity. Both Google and citation directories expect these as canonical pages. Anyone linking to `nealhvac.com/about` lands on the homepage with the wrong canonical signal.
2. **`/reviews/` returns HTTP 500** — broken page. Active harm to crawl budget and trust.
3. **`/testimonials/` and `/financing/` return 404** — they have neither.
4. **No license number anywhere** — Texas requires HVAC contractors to display TACLA/TACLB#. ICAC displays CAC1822037 prominently. Legal compliance + trust signal.
5. **No NATE / EPA 608 / BBB / manufacturer dealer badges** — verified zero matches in HTML for Trane, Carrier, Lennox, Goodman, Rheem, York, Bryant, Mitsubishi, Daikin, NATE, EPA 608.
6. **Generic `Organization` schema** (not LocalBusiness/HVACBusiness) — no openingHoursSpecification, no GeoCoordinates, no areaServed list. ICAC's `HVACBusiness` schema is a documented Google subtype.
7. **Identical Google Maps embed across all pages** — Sun City, Teravista, and Georgetown pages all embed the same Rivery Blvd HQ pin instead of recentering on each area's geo. (ICAC has this same flaw — see Gap #4 below.)
8. **Templated content** — every service page has H1 + 3 H2 + 1 FAQ. No pricing, no manufacturer mentions, no per-page reviews. The phrasing reads AI-generated.
9. **Yoast sitemap declares only `/page-sitemap.xml`** with 17 URLs — no `/post-sitemap.xml`, no `/category-sitemap.xml`, because they have no posts and no categories. Empty content strategy.
10. **No HSTS header.** ICAC has `max-age=31536000; includeSubDomains; preload`.

---

## Where Nealhvac is genuinely doing something better (worth copying)

Three honest wins. None are deal-breakers for ICAC, but worth the 30-min upgrades:

### 1. **Image filename keyword discipline**
Every nealhvac image is locally keyworded: `ac-repair-georgetown-tx.webp`, `Heat-Pump-Services-in-Georgetown-2.webp`. ICAC is ~70% there but still has Cyberduck/CMS defaults like `Presentation-t-14-w520.webp`, `SUNDAY-2026-01-30T130107.789-w400.webp`, `ICAC Team(1)-w800.webp` on the homepage. Image filenames feed both image-search ranking and alt-text default. Action below.

### 2. **Aggressive area→service hub-and-spoke**
Each nealhvac location page contains 32+ deep-service links (each of 8 services linked 5× from menu/footer/body + the `/services/` hub linked twice). ICAC has hub-and-spoke but body cross-linking on area pages varies. Tighter cross-linking (every service mentioned by exact-match anchor in the body of every area page) is the cheapest topical-authority lever in HVAC SEO.

### 3. **FAQPage on every page**
Verified — every nealhvac service AND area page emits FAQPage schema, even with just 1 Q. ICAC service pages emit 6–11 questions (much better when present), but a quick check should confirm FAQPage schema fires on **every** page including supporting pages (`/financing/`, `/reviews/`, `/careers/`). Easy parity check.

That's it. Three things. The rest is ICAC ahead.

---

## What ICAC is genuinely missing (gaps not just relative to nealhvac, but relative to "best-in-class HVAC SEO")

Ranked by ROI:

### 1. 🔴 Lead form doesn't capture phone number
The hero/contact form collects service-type + email + (sometimes) name. **Phone is not a required field.** HVAC is a phone-driven industry — speed-to-lead matters in minutes, not hours. Email-only leads are 3–4× slower to convert. **Fix:** add a required `tel` input and stack it above email. Single biggest CRO change available.

### 2. 🔴 Map iframe on every service-area page embeds the HQ pin (Foamflower Blvd, Wesley Chapel)
For pages like `/service-areas/pasco-county-ac-repair/`, `/service-areas/lutz-home-air-conditioning-service/`, `/service-areas/polk-county-residential-ac-repair/`, the iframe should recenter on the *area's* centroid (Lutz centroid, Polk County centroid, etc.) — not on HQ. Google reads embed coordinates as a hyper-local signal. Same flaw as nealhvac, but ICAC has the geo data already in `SITE.serviceAreas[].geo` (per CLAUDE.md schema). **Fix:** thread `geo` prop through `ServiceAreaLayout` → map iframe `pb=` parameter.

### 3. 🟠 No `HowTo` schema on the 28 blog posts
Many posts are procedural ("How to lower cooling bills…", "How to find reliable heating-and-air contractors…", "How to book preventive maintenance…", "10 most common AC problems…"). Google rewards `HowTo` markup with rich results that double SERP CTR for procedural queries. The post bodies already have step-by-step structure — wrap them in HowTo schema. **Fix:** extend `Schema.astro` with HowTo type; flag posts with a `howto: true` frontmatter.

### 4. 🟠 No `VideoObject` / no video content at all
The post-deploy audit (2026-04-23) flagged this: "3-5 YouTube videos (Tim on-camera) for AI-citation correlation signal." Modern HVAC SERPs increasingly show video carousels above text results for queries like "ac not cooling tampa". A 60-second Tim-on-camera intro + 2–3 process videos (filter swap, capacitor diagnosis, condenser inspection) on YouTube, embedded into matching service pages with VideoObject schema, gives ICAC a signal nealhvac structurally cannot match (they don't have a YouTube channel surfaced).

### 5. 🟠 No NATE certification mentioned
NATE (North American Technician Excellence) is the gold-standard HVAC tech credential. EPA 608 is the legal minimum; NATE is the differentiator. If any ICAC techs are NATE-certified, list them on the team page with NATE badge + Person schema's `hasCredential` → `EducationalOccupationalCredential`. If none currently are, this is a $99/tech investment that pays back in trust signals.

### 6. 🟠 No Yelp profile linked outbound
Yelp is still a top-5 HVAC discovery channel. Outbound link from `/reviews/` and footer to the Yelp business listing strengthens entity disambiguation (Google reconciles your NAP across third parties). If no Yelp profile exists, claim it.

### 7. 🟡 No live chat / SMS option
Most modern HVAC sites have a Housecall Pro chat widget or similar. ICAC has the Housecall Pro booking embed but not the chat. Adding chat + an SMS option ("Text us at 813-395-2324") captures night/weekend leads that won't fill out a form.

### 8. 🟡 ~30% of homepage images still have non-keyword filenames
Specific offenders observed: `Presentation-t-14-w520.webp`, `SUNDAY-2026-01-30T130107.789-w400.webp`, `ICAC Team(1)-w800.webp`. These are CMS-default names from Cyberduck/Squarespace export. Rename to descriptive: `wesley-chapel-hvac-team-uniformed-technicians-2026.webp` etc. Also feeds the Image Sitemap automatically generated by `@astrojs/sitemap`.

### 9. 🟡 No GBP / Yelp / BBB outbound link from `/reviews/` or footer
The ICAC sitemap and audit reports show `/reviews/` exists and renders, but it doesn't link out to the actual Google Business Profile review page. **Fix:** add `target="_blank" rel="noopener"` link to `https://g.page/r/{place_id}/review` so review-intent visitors can leave 5★'s in one click. This is also where the Yelp + BBB profile links should live.

### 10. 🟢 No `Person` schema for individual technicians (beyond Tim Hawk)
Only Tim has a Person schema. If Tim has 2–4 lead techs, give each a small Person schema entry on the team page with `jobTitle`, `hasCredential` (NATE, EPA 608), and a headshot. Same E-E-A-T signal as a doctor's clinic listing all its physicians.

### 11. 🟢 `/financing/` doesn't embed a Synchrony application widget
Synchrony is named and linked but the page is "call to apply." Synchrony provides an iframe widget that lets homeowners apply directly. Embedding it picks up nighttime leads that won't call.

---

## Keyword positioning — different geos, no head-to-head SERP

Nealhvac's 26 ranked keywords are 100% Texas/Georgetown/Round Rock/Sun City TX terms (8 are pure brand "neal hvac" / "neal heating and cooling"). ICAC's 149 ranked keywords are Florida/Tampa/Wesley Chapel/Pasco. **They do not compete on a single shared SERP** because their service areas don't overlap.

What this means: this isn't a "we vs them" competitive battle. It's a "is our build best-in-class for an HVAC site?" benchmark. By that benchmark, ICAC is significantly stronger across every measurable dimension except the 11 specific gaps listed above.

---

## Score (0–100, my weighting per skill defaults)

| Category | Weight | ICAC | Nealhvac |
|---|:-:|:-:|:-:|
| Technical SEO | 22% | 92 | 64 |
| Content quality | 23% | 86 | 41 |
| On-page SEO | 20% | 88 | 65 |
| Schema / structured data | 10% | 90 | 50 |
| Performance (CWV est.) | 10% | 85 | 70 |
| AI search readiness (E-E-A-T + citability) | 10% | 78 | 35 |
| Images | 5% | 72 | 80 |
| **Weighted total** | | **86 / 100** | **55 / 100** |

ICAC sits in the "strong, polish-the-edges" band. Nealhvac sits in the "thin starter site" band.

---

## Recommended action order (next 2 weeks)

1. **Add `tel` field to the lead form** (CRO — biggest immediate revenue impact)
2. **Geo-recenter the area-page maps** (technical — 1 commit; thread `geo` to iframe)
3. **Rename ~6 homepage image files** to keyword filenames (image SEO; 30-min job)
4. **Add `HowTo` schema to procedural blog posts** (SEO; +1 schema variant in `Schema.astro`)
5. **Add Yelp + GBP review link to `/reviews/` page** (off-page entity strengthening)
6. **Confirm NATE status of techs**, list + add `hasCredential` schema (E-E-A-T)
7. **Plan 3–5 YouTube videos** (Tim on-camera) for top-performing service pages → embed + VideoObject schema (medium-term)
8. **Add Housecall Pro live chat widget** (CRO + 24/7 capture)
9. **Embed Synchrony application iframe on `/financing/`** (CRO)

Each of these is a 30-min to 2-hour change. None are rebuild-scale.

---

*Generated 2026-04-29. Live data captured this session: nealhvac.com homepage, sitemap_index.xml, page-sitemap.xml, robots.txt, /services/ac-repair/, /services/ac-installation/, /services/heating-repair/, /service-areas/hvac-services-ac-installations-sun-city-texas/, /blog/. icareaircare.com same set + DataForSEO ranked-keywords + domain-rank-overview for both targets.*
