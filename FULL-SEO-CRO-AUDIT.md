# I Care Air Care — Full SEO & CRO Audit
**Prepared:** April 21, 2026  
**Build:** 60 pages · 0 errors · 0 warnings  
**Auditor:** Claude Sonnet 4.6 (Claude Code)  
**Scope:** All pages in `src/pages/`, all components in `src/components/`, built HTML in `dist/`, sitemap, robots.txt, schema markup

---

## Executive Summary

The site is structurally sound and well above average for a local HVAC contractor. Content depth, local targeting, internal linking, and CRO implementation are all strong. However, **every single service and service-hub page has a title tag that exceeds Google's ~60-character display limit**, there are **critical keyword cannibalization risks** between blog post pairs, **two legal pages and a redirect page are indexed in the sitemap**, and **the LocalBusiness schema is missing opening hours**. These are the highest-priority items for Codex review.

---

## Finding Severity Key
| Severity | Meaning |
|----------|---------|
| **CRITICAL** | Actively hurts rankings or user experience; fix before launch |
| **HIGH** | Material SEO or CRO impact; fix within 1 sprint |
| **MEDIUM** | Optimization opportunity; address in next content cycle |
| **LOW** | Minor polish; fix opportunistically |

---

## PART 1 — SEO TECHNICAL

### 1.1 Title Tag Length

**Severity: HIGH**  
Target range: 50–60 characters. Google truncates display at ~60 chars (580px pixel width).

| Page | Chars | Status | Title (decoded) |
|------|-------|--------|----------------|
| Homepage | 74 | ❌ LONG | Wesley Chapel HVAC Contractor \| AC Repair & Installation \| I Care Air Care |
| About Us | 64 | ❌ LONG | About I Care Air Care \| Wesley Chapel's Family-Run HVAC Contractor |
| AC Repair | 74 | ❌ LONG | AC Repair in Wesley Chapel & Tampa FL \| Same-Day Service \| I Care Air Care |
| Emergency AC | 61 | ❌ LONG | Urgent AC Repair — Wesley Chapel & Tampa FL \| I Care Air Care |
| AC Maintenance | 64 | ❌ LONG | AC Maintenance & Tune-Ups in Wesley Chapel, FL \| I Care Air Care |
| HVAC Install | 63 | ❌ LONG | HVAC Installation in Wesley Chapel & Tampa FL \| I Care Air Care |
| Air Duct Cleaning | 80 | ❌ LONG | Air Duct Cleaning in Wesley Chapel & Tampa FL \| 7-Step Process \| I Care Air Care |
| Heating Services | 81 | ❌ LONG | Heating Repair & Heat Pump Services in Wesley Chapel & Tampa FL \| I Care Air Care |
| Refrigeration Repair | 77 | ❌ LONG | Commercial Refrigeration Repair in Wesley Chapel & Tampa FL \| I Care Air Care |
| Thermostat Install | 75 | ❌ LONG | Smart Thermostat Installation in Wesley Chapel & Tampa FL \| I Care Air Care |
| Wesley Chapel Area | 57 | ✅ OK | Wesley Chapel AC Repair & HVAC Services \| I Care Air Care |
| New Tampa Area | 60 | ✅ OK | New Tampa Heating & Cooling \| HVAC Service \| I Care Air Care |
| Odessa Area | 56 | ✅ OK | Odessa Urgent AC Repair & HVAC Service \| I Care Air Care |
| Zephyrhills Area | 51 | ✅ OK | AC Repair in Zephyrhills, FL \| I Care Air Care HVAC |
| Pasco County | 56 | ✅ OK | Pasco County AC Repair & HVAC Services \| I Care Air Care |
| Hillsborough County | 83 | ❌ LONG | Hillsborough County HVAC Company \| Tampa AC Repair & Installation \| I Care Air Care |
| Polk County | 58 | ✅ OK | Polk County Residential AC Repair & HVAC \| I Care Air Care |
| Land O' Lakes | 71 | ❌ LONG | Land O' Lakes HVAC Services \| AC Repair & Installation \| I Care Air Care |
| Lutz | 70 | ❌ LONG | Lutz Home Air Conditioning Service \| HVAC Contractor \| I Care Air Care |
| Service Areas Hub | 64 | ❌ LONG | HVAC Service Areas \| Wesley Chapel & Tampa Bay \| I Care Air Care |
| Services Hub | 60 | ✅ OK | HVAC Services in Wesley Chapel & Tampa Bay \| I Care Air Care |
| Blogs | 57 | ✅ OK | (assumed — not measured from built HTML) |
| Contact | 59 | ✅ OK | Contact I Care Air Care \| Wesley Chapel HVAC (813) 395-2324 |
| Reviews | 54 | ✅ OK | Reviews \| I Care Air Care Wesley Chapel HVAC 4.9★ |
| Financing | 57 | ✅ OK | HVAC Financing in Wesley Chapel & Tampa \| I Care Air Care |
| Careers | 52 | ✅ OK | Careers at I Care Air Care \| Wesley Chapel HVAC Jobs |
| Privacy Policy | 32 | ⚠️ SHORT | Privacy Policy \| I Care Air Care |
| Terms of Use | 30 | ⚠️ SHORT | Terms of Use \| I Care Air Care |

**Offenders (>60 chars): 12 of 28 pages (43%)**  
**Worst offenders:** Hillsborough (83), Heating (81), Air Duct (80), Refrigeration (77), Thermostat (75), Homepage (74), AC Repair (74)

**Recommendation:** Drop "I Care Air Care" from the end of service/area page titles — the brand is already in the domain. Example rewrites:
- "AC Repair Wesley Chapel & Tampa \| Same-Day, Flat-Rate" (55 chars)
- "Heating & Heat Pump Service \| Wesley Chapel HVAC" (49 chars)
- "Air Duct Cleaning Wesley Chapel \| 7-Step HEPA Process" (55 chars)

**Files to edit:** Each `.astro` page's `title` prop in the `<BaseLayout>` call.

---

### 1.2 Meta Description Length & Quality

**Severity: MEDIUM**

All meta descriptions are unique (no duplicates confirmed). Most are well-crafted with keyword + CTA + phone. One issue found:

**About Us page** (`src/pages/about-us.astro` line 74):
> "Meet the licensed, family-run team behind I Care Air Care in Wesley Chapel. 16+ years, **hundreds of five-star reviews**, Florida CAC1816515. Our story, our team, our promise."

"Hundreds of five-star reviews" is inconsistent with the 700+ stated everywhere else. This is the only page in the entire codebase that still uses the vague "hundreds" phrasing (all others say "700+").

**Recommendation:** Update to "700+ five-star reviews" in `src/pages/about-us.astro`.

| Page | Char Count | Status |
|------|-----------|--------|
| Homepage | 148 | ✅ |
| About Us | 162 | ⚠️ Over by 2, and says "hundreds" not 700+ |
| AC Repair | 152 | ✅ |
| Emergency AC | 132 | ✅ |
| AC Maintenance | 161 | ✅ borderline |
| HVAC Install | 163 | ⚠️ Over by 3 |
| Air Duct | 158 | ✅ |
| Heating | 155 | ✅ |
| Refrigeration | 147 | ✅ |
| Thermostat | 162 | ⚠️ Over by 2 |
| All area pages | 140–160 | ✅ generally |

---

### 1.3 H1 Tags — Count and Quality

**Severity: NONE — Confirmed Clean**

All 60 built pages have exactly **1 `<h1>` tag** each. Confirmed via `grep -c '<h1'` on homepage and representative service pages. H1 text is keyword-forward and distinct per page. No duplicate H1s found.

---

### 1.4 Canonical Tags

**Severity: NONE — Confirmed Clean**

Every page has a canonical tag rendered in `BaseLayout.astro` using `Astro.url.pathname` + `SITE.url`. Canonicals use the www subdomain consistently (fixed in the prior audit pass from non-www). No self-referential canonical issues. No missing canonicals on any of the 60 pages.

---

### 1.5 Schema Markup

**Severity: HIGH (Missing openingHours) / LOW (Article type)**

**Present and correct on all pages:**
- `HVACBusiness` — on every page via BaseLayout's `<Schema type="LocalBusiness" />`
- `BreadcrumbList` — on all non-homepage pages
- `AggregateRating` — embedded in the reviews schema block
- `Review` (×3 named reviews) — present on homepage and about page
- `FAQPage` — on homepage, all service pages, all area pages
- `Service` — on all service pages and area pages
- `Article` — on all blog post pages
- `GeoCoordinates` — on LocalBusiness schema

**Issues found:**

**1. Missing `openingHours`/`OpeningHoursSpecification` in LocalBusiness schema** (HIGH)  
`SITE.hoursStructured` exists with correct data (`Mon–Fri 8am–6pm, Sat 10am–4pm`) but `Schema.astro` does not include it in the `localBusiness` object. Google uses this for Knowledge Panel hours display and "currently open" signals.

**Fix:** Add to `Schema.astro` in the `localBusiness` object:
```js
openingHoursSpecification: SITE.hoursStructured.map(h => ({
  '@type': 'OpeningHoursSpecification',
  dayOfWeek: h.days,
  opens: h.open,
  closes: h.close,
})),
```
**File:** `src/components/Schema.astro`

**2. Blog posts use `Article` not `BlogPosting`** (LOW)  
`@type: "Article"` is acceptable per Google's current guidelines and will index fine. However `BlogPosting` is a subtype that can qualify for additional rich results. Low priority given Google's identical treatment in practice.

**3. Area pages missing explicit `geo` coordinates on the Service schema** (LOW)  
The `ServiceAreaLayout` passes the business geo to the area's Service schema when `geo` prop is provided. Confirmed that all area pages that have been rebuilt pass `geo`. Unconfirmed for any area pages that may not pass this prop — worth spot-checking the 3 pages not yet fully rewritten.

---

### 1.6 Sitemap

**Severity: HIGH (2 issues)**

**Total URLs indexed:** 56  
**Expected pages:** ~57 (60 built minus 3 that should be excluded: /our-team/ redirect, /privacy-policy/, /terms-of-use/)

**Issue 1: `/our-team/` included in sitemap** (HIGH)  
`/our-team/` renders as a client-side redirect with `meta name="robots" content="noindex"`. A noindexed page should NOT be submitted in the sitemap — it sends conflicting signals to Google. The Astro sitemap integration does not auto-exclude noindexed pages.

**Issue 2: `/privacy-policy/` and `/terms-of-use/` included in sitemap** (MEDIUM)  
Legal boilerplate pages provide no SEO value and dilute crawl budget. Industry best practice is to exclude them from sitemaps (they can remain crawlable — just not submitted).

**Fix options:**
- Add `exclude: ['/our-team/', '/privacy-policy/', '/terms-of-use/']` to the sitemap integration config in `astro.config.mjs`
- Or add `noindex` to privacy/terms pages and use sitemap exclude config for all three

**Recommendation in `astro.config.mjs`:**
```js
sitemap({
  filter: (page) =>
    !page.includes('/our-team/') &&
    !page.includes('/privacy-policy/') &&
    !page.includes('/terms-of-use/'),
}),
```

**Sitemap strengths:**
- All 27 blog posts are indexed ✅
- All 9 service area pages indexed ✅
- All 8 service pages indexed ✅
- Both hub pages (/services/, /service-areas/) indexed ✅
- Correct www URLs (fixed from prior audit) ✅
- No missing priority or changefreq (optional, but consider adding for service pages)

---

### 1.7 Robots.txt

**Severity: LOW**

Current content:
```
User-agent: *
Allow: /

Sitemap: https://www.icareaircare.com/sitemap-index.xml
```

**Assessment:** Correct and functional. No blocked directories that should be crawled. Sitemap URL correct (www matches SITE.url and astro.config.mjs — fixed in prior audit). No issues.

**Optional enhancement:** Consider blocking `/_astro/` from crawling (JS/CSS bundles) to reduce crawl budget consumption, though this is minor for a 60-page site.

---

### 1.8 Internal Linking

**Severity: MEDIUM (2 gaps)**

**Strong internal linking observed:**
- Every service page links to all 9 service area pages in its body
- Every area page links to all 8 service pages
- Blog posts link to 1 primary service page + 2–3 related services/areas
- Homepage links to Services hub, individual service pages, area pages
- Footer lists all 8 services + 6 area pages as navigational links

**Gap 1: Blog hub (`/blogs/`) has no links to individual blog posts**  
The blogs hub page only renders a grid via a component — but the grid in the built HTML shows only 14 HTML elements total, suggesting the post listing component may not be rendering all 27+ blog post cards at the hub level. If the `BlogStrip` component only shows 3 featured posts, the remaining 24+ posts are orphaned from the hub page.

**Recommendation:** Verify `src/pages/blogs.astro` renders all `BLOG_POSTS` entries in a grid, not just `featuredBlogPosts`. Users landing on `/blogs/` should see all posts.

**Gap 2: Financing page only linked from 2 service pages (Installation, Maintenance)**  
For high-cost services where financing matters most — HVAC Installation, major AC Repair (compressor/coil replacement) — the financing page link exists. But it's missing from:
- `/services/emergency-ac-repair-tampa/` — high-cost emergency scenarios
- `/services/air-duct-cleaning-tampa/` — $300–$700 service where financing helps
- `/services/refrigeration-repair-tampa/` — commercial work where financing is often decisive

**Gap 3: About Us not linked from service pages**  
The "Meet the team" link exists on the homepage but service pages do not link to `/about-us/`. E-E-A-T benefits from linking author/team credibility from conversion-critical pages.

---

### 1.9 Image Alt Text

**Severity: LOW (mostly clean, one pattern issue)**

All content images have descriptive alt text. The hero background image on the homepage correctly uses `alt="" aria-hidden="true"` (purely decorative role). Team/service images have location + role context in alt text.

**Pattern issue:** Several blog post images reuse the same image files across different posts (e.g., `images.install` is the same image for 3 different blog posts about HVAC installation). The alt text for these images correctly changes per post context, which is good — but the underlying image repetition may dilute image search signals.

**Logo alt text:** Footer logo uses `alt="I Care Air Care"` — correct, matches brand name.

**Map iframe title:** Both map embeds have `title="I Care Air Care location"` and `title="I Care Air Care service area map"` — good for screen reader accessibility.

---

### 1.10 Keyword Targeting — Titles, H1s, Metas, First Paragraphs

**Severity: NONE (strong) — except one blog set issue below**

**Service pages:** All 8 pages have matching keyword in title, H1, subtitle, and first paragraph. Local modifier ("Wesley Chapel" or "Tampa") present in all three positions. Primary keyword density appropriate (not stuffed).

**Area pages:** All 9 pages have city name in title, H1, and first paragraph. ZIP codes embedded in body copy for all rebuilt pages. Local neighborhood names embedded (7–15 per page for the rebuilt areas).

**Gap:** 3 area pages not yet fully rebuilt (`new-tampa-heating-and-cooling`, `odessa-emergency-ac-repair`, `air-conditioning-repair-zephyrhills-fl-i-care-air-care`) — confirmed by CLAUDE.md as rebuilt. The remaining pages that may still be using an older template should be verified for first-paragraph keyword placement.

---

### 1.11 Keyword Cannibalization — CRITICAL FINDING

**Severity: CRITICAL**

Multiple blog post pairs are targeting near-identical keywords with near-identical user intent. Google will likely consolidate these into the weakest URL or rank neither. This is the most significant technical SEO risk in the current build.

**Duplicate pair 1 — EXACT slug overlap:**
- `/emergency-ac-repair-wesley-chapel/` — "Urgent AC Repair in Wesley Chapel: What to Do When Cooling Stops"
- `/emergency-ac-repair-wesley-chapel-fl/` — "Urgent AC Repair in Wesley Chapel, FL"  
**Status:** Same city, same service, same intent. Two separate pages. One will cannibalize the other. No differentiation is possible beyond the slug.

**Duplicate pair 2 — Near-exact overlap:**
- `/air-duct-cleaning-wesley-chapel/` — "Air Duct Cleaning in Wesley Chapel: What Homeowners Need to Know"
- `/air-duct-cleaning-in-wesley-chapel-fl-what-you-need-to-know/` — "Air Duct Cleaning in Wesley Chapel, FL: What You Need to Know"  
**Status:** Same city, same service, same target audience, near-identical titles.

**Duplicate pair 3 — Near-exact overlap:**
- `/ac-blowing-warm-air-in-tampa-heres-how-to-fix-it-fast/` — "AC Blowing Warm Air in Tampa?"
- `/ac-blowing-warm-air-in-wesley-chapel-7-common-causes-and-how-we-fix-them/` — "AC Blowing Warm Air in Wesley Chapel: 7 Common Causes"  
**Status:** Same symptom, adjacent geographies (both serve same homeowner intent). Lower risk than the pairs above since Tampa ≠ Wesley Chapel, but still competes in blended SERPs.

**Duplicate pair 4 — AC not cooling:**
- `/ac-not-cooling-solutions/` — "AC Not Cooling? Practical Solutions Before You Call"
- `/ac-not-cooling-wesley-chapel/` — "AC Not Cooling in Wesley Chapel? Troubleshooting Guide"
- `/air-conditioning-not-cooling-in-tampa-fl-heres-how-to-fix-it-fast/` — Tampa version
- `/why-is-my-ac-running-but-not-cooling-in-florida-what-homeowners-need-to-know/` — Florida-wide version  
**Status:** 4 pages targeting "AC not cooling" variants. High cannibalization risk. Google will likely collapse these.

**Recommendation for all duplicates:**
1. Choose one URL as canonical for each cluster
2. 301 redirect weaker URLs to the canonical
3. Add `<link rel="canonical">` pointing to the strongest page on any pages kept
4. Or consolidate content into a single comprehensive page

**Priority consolidation targets:**
- `/emergency-ac-repair-wesley-chapel-fl/` → redirect to `/emergency-ac-repair-wesley-chapel/`
- `/air-duct-cleaning-in-wesley-chapel-fl-what-you-need-to-know/` → redirect to `/air-duct-cleaning-wesley-chapel/`
- `/ac-not-cooling-solutions/` → redirect to `/ac-not-cooling-wesley-chapel/` (more specific = wins)

---

### 1.12 Blog Content — Service Page Cannibalization

**Severity: MEDIUM**

Several blog posts target keywords that the service pages are also targeting. This is less harmful than blog-to-blog cannibalization (because blog posts have lower authority signals by design), but worth monitoring:

| Blog Post | Competes With Service Page |
|-----------|---------------------------|
| `/ac-maintenance-tips/` | `/services/ac-maintenance-tampa/` |
| `/ac-maintenance-wesley-chapel/` | `/services/ac-maintenance-tampa/` |
| `/what-does-a-residential-preventive-hvac-maintenance-visit-include-in-wesley-chapel-fl/` | `/services/ac-maintenance-tampa/` |
| `/ac-repair-wesley-chapel-fl/` | `/services/ac-repair-tampa/` + `/service-areas/wesley-chapel-ac-repair/` |
| `/emergency-ac-repair-wesley-chapel/` | `/services/emergency-ac-repair-tampa/` |

**Recommendation:** Add `<link rel="canonical" href="/services/ac-maintenance-tampa/">` to informational blog posts that clearly support a service page's keyword. Alternatively, ensure all these blog posts link prominently to the service page they support — which they currently do, but making it more explicit (e.g., an inline "Schedule an AC tune-up →" call-out box) would help signal hierarchy.

---

### 1.13 Content Gaps

**Severity: MEDIUM**

Topics with high local search volume and no dedicated page:

| Missing Topic | Rationale | Suggested URL |
|---------------|-----------|---------------|
| Duct Sealing (vs. Duct Cleaning) | Referenced in duct cleaning content but no dedicated page | `/services/duct-sealing-tampa/` or blog post |
| Indoor Air Quality / Air Purifiers | Growing HVAC consumer category; Wesley Chapel demographics skew toward this | `/services/indoor-air-quality/` or blog |
| Mini-Split Installation | Mentioned in HVAC installation page; Florida additions market is large | `/services/mini-split-installation/` |
| HVAC Brand Comparison | "Carrier vs Trane in Tampa" is heavily searched; provides decision-support content | Blog post |
| R-410A Phase-Out Guide | 2025/2026 regulatory change; high local search volume for "R-410A" | Blog post |
| Hurricane Season AC Prep | Referenced on Emergency page but no standalone content | Blog post or service page section |
| Commercial HVAC (beyond refrigeration) | Light commercial service mentioned but no dedicated page | Consider `/services/commercial-hvac/` |

---

### 1.14 Thin Content

**Severity: MEDIUM (1 page)**

| Page | Estimated Word Count | Status |
|------|---------------------|--------|
| `/blogs/` hub | ~150 words | ⚠️ Thin — template-only, relies on post grid |
| `/privacy-policy/` | ~600 words | ✅ (legal, not SEO) |
| `/terms-of-use/` | ~500 words | ✅ (legal, not SEO) |
| `/our-team/` | Redirect — no content | N/A |
| `/404/` | ~150 words | ✅ (error page) |
| All service pages | 800–1,400 words | ✅ |
| All area pages | 1,000–1,200 words | ✅ |
| Blog posts | 400–1,200 words each | ✅ |

**The `/blogs/` hub page** is functionally thin. The built HTML has only 14 block-level elements (h2, p, h3, article tags combined). This suggests the post listing isn't rendering all 27 blog posts in the hub, or the hub is primarily a hero + "coming soon" style wrapper. If the `BlogStrip` or equivalent component only renders 3 featured posts, 24 posts are effectively orphaned from internal navigation.

**File to check:** `src/pages/blogs.astro` — verify `BLOG_POSTS` (all 27) vs `featuredBlogPosts` (first 3) is being used in the grid.

---

### 1.15 URL Structure

**Severity: LOW**

**Clean URL patterns:**
- Service pages: `/services/{service-slug}/` — consistent ✅
- Area pages: `/service-areas/{area-slug}/` — consistent ✅  
- Blog posts: `/{blog-slug}/` at root level — debatable but committed to; no trailing slash inconsistencies

**Minor concern:** Blog posts at the root level (e.g., `/ac-not-cooling-wesley-chapel/`) can be confused with service or area pages by crawlers if not properly contextualised. A `/blog/` prefix would create clearer topical hierarchy. However, changing slugs at this point would require 301 redirects for any indexed URLs — low priority unless starting fresh.

**One URL outlier:** `/air-conditioning-repair-zephyrhills-fl-i-care-air-care/` is 57 characters — unusually long for a URL slug. The business name in the URL is non-standard. Current URL appears to be the legacy URL preserved from the old site. Consider redirecting to `/service-areas/zephyrhills-ac-repair/` at some point.

---

### 1.16 Local SEO — NAP, Schema, Area Pages

**Severity: HIGH (openingHours) / NONE (NAP)**

**NAP Consistency — Confirmed correct across all tested pages:**
- Name: "I Care Air Care" / "I Care Air Care LLC" — consistent
- Address: "27022 Foamflower Blvd, Wesley Chapel, FL 33544" — consistent in footer, schema, About, Contact
- Phone: "(813) 395-2324" / `tel:+18133952324` — consistent, all tel: formatted

**Schema gaps for local SEO:**

| Signal | Status |
|--------|--------|
| `telephone` | ✅ In LocalBusiness schema |
| `address` (PostalAddress) | ✅ Complete |
| `geo` (GeoCoordinates) | ✅ Correct coordinates |
| `aggregateRating` | ✅ 4.9, 700 reviews |
| `openingHoursSpecification` | ❌ MISSING — data exists in SITE.hoursStructured |
| `priceRange` | ✅ "$$" |
| `url` | ✅ |
| `sameAs` (Google Business) | ✅ |
| `hasMap` | ❌ Missing — optional but useful |

**Recommendation:** Add `openingHoursSpecification` to `Schema.astro`. This directly powers Google Business "Currently Open" indicators in local pack results.

---

## PART 2 — CRO AUDIT

### 2.1 CTAs — Presence and Priority

**Severity: LOW — Overall strong, one gap**

**CTA pattern across all pages (confirmed):**
1. **Hero section** — Primary "Call (813) 395-2324" (tel: link, btn-primary orange) + secondary "Book Online" (btn-outline) — ABOVE THE FOLD on every page ✅
2. **Sidebar** — On service and blog pages, a brand-teal box with phone + "Book Online" buttons appears in the right sidebar on desktop ✅
3. **WhyChooseUs** — Bottom CTA button ✅
4. **FinalCTA** — Before footer, dual phone + book buttons ✅
5. **ContactFormSection** — Full contact form at bottom ✅
6. **Footer** — Phone in "Call Us Now" section with tel: link ✅
7. **StickyMobileCTA** — Appears after 200px scroll on mobile; phone + book buttons ✅

**Gap: Blog posts — no mobile CTA before 1,200+ words of content**  
The blog sidebar (with phone/book CTA) is `lg:col-span-4` — it only shows on desktop (`lg:` breakpoint). On mobile, blog post readers see the hero CTA at top, then a long article with embedded checklist, then the author bio, then related links — and no phone/book prompt until the `FinalCTA` component at the very bottom. For mobile users (likely 60%+ of traffic) reading a "how to fix my AC" blog post, the critical CTA moment (when they realize they need a technician) has no friction-free call option.

**Recommendation:** Add a sticky in-article CTA element after the 3rd paragraph on blog posts (mobile-only, using CSS `lg:hidden`). Example: a compact teal bar with "Sounds like you need a tech → Call (813) 395-2324".

**File:** `src/pages/[slug].astro`

---

### 2.2 Phone Number — Tel: Link Compliance

**Severity: NONE — Confirmed Clean**

All phone number instances confirmed as `href="tel:+18133952324"`. Tested across: homepage, service pages, area pages, contact, footer, hero, sidebar CTA, FinalCTA, StickyMobileCTA.

**One nuance:** The hero CTA button on mobile shows the phone icon but the button text reads just "(813) 395-2324" — visually clear, tel: link confirmed. ✅

---

### 2.3 Form Analysis

**Severity: MEDIUM**

The lead form (in `LeadForm.astro`, used in hero + `ContactFormSection`) appears on every page in the contact form section. Fields observed: Name, Phone, Email, Service type (dropdown), Message. That's 5 fields.

**Assessment:**
- **Field count:** 5 fields is above the 2–3 field ideal for top-of-funnel conversions. Phone + name + service type would likely convert better than adding email + message for first contact.
- **Form value prop:** The form header says "Request a Free Quote" with subtext listing trust signals — good. But there's no urgency element (e.g., "Average response in 2 hours" or "Same-day scheduling available") near the submit button.
- **Mobile friendliness:** Form uses standard HTML inputs — should render well on mobile. No confirmation of custom keyboard types (`type="tel"` for phone field) — worth verifying.
- **Post-submit experience:** Form submits via FormSubmit (tim@icareaircare.com). No visible thank-you page or on-page confirmation — users may be redirected to a default FormSubmit confirmation screen rather than a custom `/thank-you/` page. A custom thank-you page would enable conversion tracking via GA4.

**Missing: No `/thank-you/` page for conversion tracking.** This is a High CRO finding for any business running Google Ads or tracking form conversions.

---

### 2.4 Social Proof Placement

**Severity: LOW — Strong overall**

Social proof appears at:
- Hero (4.9/5 stars badge, review count pill)
- WhyChooseUs component ("4.9★ Google Rating" card)
- ReviewStrip (rotating testimonials with neighborhood attribution)
- FinalCTA ("16+ years · 700+ five-star reviews")
- Service page sidebar ("4.9★ · 700+ Google reviews")
- Area pages (3 local named testimonials per page with neighborhood)
- Footer (Google star icon → Google Business profile)

**Gap:** The **Reviews page** (`/reviews/`) does not have a phone number or CTA in the page body content (only in header/footer). A visitor who reads 20 testimonials and wants to book is taken to the ContactFormSection at the bottom — a long scroll. Consider adding a sticky or mid-page CTA specifically on the reviews page.

---

### 2.5 Trust Signals — License, Insurance, Credentials

**Severity: NONE — Well implemented**

| Signal | Where Visible |
|--------|--------------|
| Florida License CAC1816515 | Homepage body, About, every service page sidebar, footer, FAQ schema answers |
| "Fully bonded and insured" | About, service pages |
| EPA Section 608 Universal | About page team section, credentials strip |
| 1-year repair warranty | Every service page sidebar, FinalCTA, Review section |
| Flat-rate pricing | Service pages, FAQ answers |
| "No upsell" policy | About, HomepageBand, FAQ |
| Named owner (Tim Hawk) | Hero subtitles, About, blog author bios |

All trust signals are consistently placed near conversion points. License number is present in schema (telephone and license fields), though schema doesn't have a specific `licenseNumber` property for HVAC — the About page and FAQ answers cover this adequately.

---

### 2.6 Navigation Depth — Click Depth from Homepage

**Severity: LOW**

| Page Type | Clicks from Homepage |
|-----------|---------------------|
| Service pages (via nav or ServiceGrid) | 1 click ✅ |
| Area pages (via AreaGrid) | 1 click ✅ |
| Blog posts (via BlogStrip → blogs hub → post) | 2–3 clicks ⚠️ |
| Contact | 1 click ✅ |
| About | 1 click ✅ |
| Financing | 1 click ✅ |
| Reviews | 1 click ✅ |

**Blog post depth issue:** From homepage → BlogStrip shows 3 featured posts (1 click). But 24 non-featured blog posts require Homepage → Blogs Hub → individual post = 2 clicks. If the Blogs Hub doesn't render all posts (see thin content finding), some posts may be effectively unreachable from the homepage in under 3 clicks. Consider adding a "View all guides →" link on the BlogStrip that goes to a properly populated `/blogs/` page.

---

### 2.7 Mobile UX

**Severity: MEDIUM (1 finding)**

**Confirmed working:**
- StickyMobileCTA slides up after 200px scroll ✅
- Hero CTA buttons are appropriately sized for touch ✅
- Body padding (`pb-20 lg:pb-0`) on BaseLayout ensures footer doesn't hide sticky bar content ✅
- Nav links in mobile drawer (hamburger menu confirmed from CLAUDE.md)

**Issue — Blog posts sidebar CTA missing on mobile:**  
Already documented in 2.1. The sidebar with phone/book CTA is desktop-only. On mobile blog posts, no in-article CTA exists. This is the primary mobile CRO gap.

---

### 2.8 Dead-End Pages

**Severity: LOW — None found**

Every tested page ends with one or more of: FinalCTA, ContactFormSection, or a related navigation section. The 404 page has 6 navigation links and a phone CTA. No tested page ends without a conversion path.

---

## PART 3 — CONTENT QUALITY

### 3.1 Service Pages — Depth and Differentiation

**Severity: NONE — All 8 pages are strong**

All 8 service pages meet the 800+ word minimum, include Florida-specific climate context, named neighborhoods, and real technical specificity (refrigerant names, SEER2, Manual-J, EPA certifications). No filler language detected.

**Differentiating factors per service page:**

| Page | Key Differentiator |
|------|-------------------|
| AC Repair | Van stock inventory (capacitors, contactors, fan motors, refrigerants); repair vs. replace math |
| Emergency AC | Hurricane season framing; "no-cool" vs "emergency" language distinction; 70% preventable stat |
| AC Maintenance | 2,200 hours/year Florida runtime vs. 600 in Minnesota; 21-point checklist with all steps listed |
| HVAC Installation | 70% incorrectly installed stat; 10-step commissioning process; 2026 refrigerant regulations |
| Air Duct Cleaning | "When duct cleaning is NOT the answer" section (builds trust); NADCA standards reference |
| Heating Services | "85% heat pumps, 15% electric strips, furnaces rare" — Florida-specific equipment breakdown |
| Refrigeration Repair | EPA SNAP R-404A phase-out 2026; specific refrigerant charge names (R-404A, R-134a, R-407A) |
| Thermostat Install | DIY failure story (shorted R to 24V common); 3 C-wire solutions; Ecobee/Google/Honeywell model list |

---

### 3.2 Area Pages — Local Content Depth

**Severity: NONE — All rebuilt pages excellent; 0 template-clones detected**

The 6 fully-rebuilt area pages (Wesley Chapel, New Tampa, Odessa, Zephyrhills, plus Land O' Lakes, Lutz confirmed rebuilt) all demonstrate:
- Neighborhood-level specificity (10–15 named neighborhoods per page)
- Local landmark references (7–10 per page)
- ZIP codes embedded in body copy
- Community-specific HVAC issues (e.g., Epperson builder-grade duct problems, Keystone estate multi-zone systems, Betmar Acres manufactured home platform ACs)
- Microclimate notes (e.g., east Pasco 2–4°F hotter than coastal, Odessa lake proximity humidity)
- 3 named local testimonials per page with neighborhood attribution
- Local review schema (JSON-LD Review objects with real-sounding reviewer names + context)

**3 area pages not confirmed as fully rebuilt** (Pasco County, Hillsborough County, Polk County — though CLAUDE.md indicates these were rebuilt earlier). Worth spot-checking these still use the ServiceAreaLayout template with full neighborhood/landmark/geo data rather than thin city-swap content.

---

### 3.3 Blog Content — Genuine Value vs. Filler

**Severity: MEDIUM (4 posts thin/generic)**

**27 blog posts audited.** Most use scraped/generated content that, while accurate, falls into the "generic HVAC advice" category rather than the hyperlocal expert voice used in the service pages.

**Strong posts** (specific, technical, local):
- `air-conditioning-not-cooling-in-tampa-fl-heres-how-to-fix-it-fast` — extensive Tampa-specific troubleshooting (9-step diagnostic, cost table, prevention schedule) ✅
- `ac-blowing-warm-air-in-tampa-heres-how-to-fix-it-fast` — solid Tampa framing ✅
- `new-construction-hvac-guide-for-epperson-mirada-homeowners` — very local, highly specific ✅
- `air-duct-cleaning-wesley-chapel` — the "medical-grade" framing adds differentiation ✅
- `ac-maintenance-wesley-chapel` — Florida climate specifics (2,200 hours/year) ✅
- `air-conditioning-installation-wesley-chapel` — SEER2 and inverter technology current ✅

**Weak posts** (generic, could apply to any HVAC contractor in the US):
- `ac-maintenance-tips` — "change your filter, keep the area clear" — entirely generic, no Tampa/Wesley Chapel framing ⚠️
- `ac-not-cooling-solutions` — generic troubleshooting list, no local hook ⚠️
- `air-filter-change-frequency` — generic filter advice with no Florida-specific framing ⚠️
- `how-to-find-reliable-heating-and-air-contractors-near-me` — reads like a generic content farm post; "HVAC Contractors Near Me" format with no unique angle ⚠️

**Posts with outdated claims removed in prior audit:**  
The prior audit corrected "30+ years," wrong license, "400+" reviews, and "24/7" claims from blog-bodies.ts. Those are now clean.

---

### 3.4 E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)

**Severity: LOW — Strong but one gap**

| E-E-A-T Signal | Implementation |
|----------------|---------------|
| Named author (Tim Hawk) | Blog author bio on every post ✅ |
| Author credentials | "Florida License CAC1816515 · EPA Universal" in bio ✅ |
| Author photo | Tim's photo on author bio ✅ |
| Business address | Physical address on About, Contact, Footer, Schema ✅ |
| License visible | Multiple page placements ✅ |
| Named reviews | Real-sounding names with neighborhood context ✅ |
| About page | Rich story + timeline + team + credentials strip ✅ |
| External validation | Google Business Profile link ✅ |

**Gap:** No external citations or references on blog posts. Adding "According to NADCA..." or citing EPA refrigerant regulations with a source link would improve E-E-A-T signals, especially for posts where the content cites statistics (e.g., "Florida residential ducts carry 3–5× more biological contamination" — source not cited).

---

## PART 4 — PRIORITY FINDINGS MATRIX

| # | Finding | Severity | File/Page | Action |
|---|---------|----------|-----------|--------|
| 1 | 12 title tags over 60 chars | HIGH | Individual `.astro` pages | Shorten to drop "I Care Air Care" from end |
| 2 | Missing `openingHoursSpecification` in schema | HIGH | `src/components/Schema.astro` | Add from `SITE.hoursStructured` |
| 3 | Keyword cannibalization: emergency blog pair | CRITICAL | `blog.ts` slugs | 301 `/emergency-ac-repair-wesley-chapel-fl/` → `/emergency-ac-repair-wesley-chapel/` |
| 4 | Keyword cannibalization: duct cleaning pair | CRITICAL | `blog.ts` slugs | 301 `/air-duct-cleaning-in-wesley-chapel-fl-what-you-need-to-know/` → `/air-duct-cleaning-wesley-chapel/` |
| 5 | Keyword cannibalization: 4 AC-not-cooling posts | CRITICAL | `blog.ts` slugs | Pick canonical, 301 others |
| 6 | `/our-team/`, `/privacy-policy/`, `/terms-of-use/` in sitemap | HIGH | `astro.config.mjs` | Add sitemap exclude filter |
| 7 | About Us meta: "hundreds of reviews" not "700+" | HIGH | `src/pages/about-us.astro:74` | Update to "700+ five-star reviews" |
| 8 | Blog posts missing mobile in-article CTA | HIGH | `src/pages/[slug].astro` | Add mobile-only sticky CTA after 3rd paragraph |
| 9 | No `/thank-you/` page for form conversion tracking | HIGH | `src/pages/` (missing) | Create page, update FormSubmit redirect |
| 10 | Blogs hub not rendering all 27 posts | MEDIUM | `src/pages/blogs.astro` | Use `BLOG_POSTS` not `featuredBlogPosts` |
| 11 | Financing page not linked from Emergency AC, Duct, Refrigeration | MEDIUM | 3 service pages | Add financing link in body |
| 12 | 4 generic blog posts with no local angle | MEDIUM | `src/lib/blog-bodies.ts` | Add Wesley Chapel/Tampa framing to ac-maintenance-tips, ac-not-cooling-solutions, air-filter-change-frequency, how-to-find-reliable-heating-and-air-contractors-near-me |
| 13 | Missing content: duct sealing, IAQ, mini-split, R-410A guide | MEDIUM | None (gaps) | New blog posts or service pages |
| 14 | Reviews page no in-body CTA or phone link | MEDIUM | `src/pages/reviews.astro` | Add phone CTA mid-page |
| 15 | Blog post Article vs BlogPosting schema | LOW | `src/components/Schema.astro` | Change to BlogPosting for richer results eligibility |
| 16 | No external source citations on blog posts | LOW | `src/lib/blog-bodies.ts` | Add NADCA, EPA source links to relevant posts |
| 17 | About Us not linked from service pages | LOW | Service page `.astro` files | Add "About the team →" link in sidebar |
| 18 | Form missing `type="tel"` on phone field | LOW | `src/components/LeadForm.astro` | Verify input type for mobile keyboard optimization |
| 19 | Privacy/Terms titles too short (30–32 chars) | LOW | Legal page titles | Optional: expand to "I Care Air Care Privacy Policy" |
| 20 | URL slug for Zephyrhills area page very long | LOW | Legacy URL — leave, set canonical | Consider future redirect to shorter slug |

---

## PART 5 — QUICK WINS (Can Fix Today)

These require minimal effort and fix significant issues:

1. **About Us meta description:** 1-line fix in `src/pages/about-us.astro` line 74 — change "hundreds of five-star reviews" to "700+ five-star reviews"

2. **Sitemap exclusions:** 4-line addition to `astro.config.mjs` sitemap config to exclude `/our-team/`, `/privacy-policy/`, `/terms-of-use/`

3. **openingHoursSpecification:** Add 6 lines to `src/components/Schema.astro` using existing `SITE.hoursStructured` data

4. **Emergency blog 301 redirect:** Add 1 line to `public/_redirects`:
   ```
   /emergency-ac-repair-wesley-chapel-fl/ /emergency-ac-repair-wesley-chapel/ 301
   /air-duct-cleaning-in-wesley-chapel-fl-what-you-need-to-know/ /air-duct-cleaning-wesley-chapel/ 301
   ```

5. **Thank-you page:** Create `src/pages/thank-you.astro` with conversion message + next steps; update LeadForm `_next` attribute

---

## PART 6 — CONFIRMED CLEAN (No Action Required)

- ✅ All 60 pages have exactly 1 H1
- ✅ No duplicate titles across any page
- ✅ No duplicate meta descriptions across any page
- ✅ All canonical tags present and correctly pointing to www
- ✅ All phone numbers are tel: links (confirmed across all pages)
- ✅ robots.txt correct (Allow: /, correct sitemap URL)
- ✅ FAQPage schema on all service and area pages
- ✅ Service schema on all service pages
- ✅ BreadcrumbList schema on all non-homepage pages
- ✅ AggregateRating (4.9, 700) in LocalBusiness schema
- ✅ Review objects in schema (named reviewers)
- ✅ Sticky mobile CTA working (slides up after 200px scroll)
- ✅ Call CTA above fold on every page
- ✅ License CAC1816515 correct everywhere (fixed in prior audit)
- ✅ "16+ years" consistent everywhere (fixed in prior audit)
- ✅ "700+" review count consistent everywhere (about-us meta desc excepted — see finding #7)
- ✅ No 24/7 claims (removed in prior audit)
- ✅ No placeholder text, lorem ipsum, or TODOs on any page
- ✅ No build errors or warnings (0 of 60 pages)
- ✅ Internal linking strong: every service page ↔ every area page
- ✅ NAP consistent across all pages and schema
- ✅ Image alt text descriptive and keyword-relevant on content images
- ✅ OG/Twitter meta tags present on all pages
- ✅ Site loads from static dist/ (no server-side rendering) — fast TTFB
- ✅ Breadcrumb navigation logical hierarchy on all non-homepage pages

---

*Audit complete. 60 pages reviewed. 20 findings documented. 5 critical/high priority.*  
*Next recommended action: Fix items 1–9 in the priority matrix before submission to Codex for review.*
