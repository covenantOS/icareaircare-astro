# AUDIT REPORT — icareaircare-astro
**Date:** 2026-04-20  
**Auditor:** Pre-audit sweep (internal)  
**Scope:** Every page, component, layout, lib file, config, and public asset  
**Instruction:** Find problems before an external auditor does. Do NOT fix — only report.

---

## Severity Key

| Level | Meaning |
|---|---|
| **CRITICAL** | Broken in production or a direct ranking/conversion killer |
| **HIGH** | Significant gap visible to an auditor or search engine |
| **MEDIUM** | Noticeable quality issue; easy to fix but will be called out |
| **LOW** | Polish / minor inconsistency |

---

## Category 1 — Broken / Missing Content

### CRITICAL-1 · favicon.png referenced but file does not exist
- **File:** `src/layouts/BaseLayout.astro:31`
- **Finding:** `<link rel="icon" type="image/png" href="/favicon.png" />` — `public/` contains `favicon.ico` and `favicon.svg` but **no `favicon.png`**. Every page in production will serve a broken favicon link. Browsers fall back to `favicon.ico` automatically, so the tab icon may still appear, but the declared `<link>` 404s on every page request.
- **Fix needed:** Either add `favicon.png` to `public/` or change the href to `/favicon.svg` (and type to `image/svg+xml`).

### CRITICAL-2 · `/privacy-policy/` and `/terms-of-use/` pages do not exist
- **File:** `src/components/Footer.astro:80–81`
- **Finding:** Footer contains:
  ```
  <a href="/privacy-policy/">Privacy Policy</a>
  <a href="/terms-of-use/">Terms of Use</a>
  ```
  Neither `src/pages/privacy-policy.astro` nor `src/pages/terms-of-use.astro` (or `/privacy-policy/index.astro` etc.) exists. Every visitor who clicks these links hits the 404 page. **This is also a legal compliance risk** — FormSubmit form submissions collect PII (name, email, phone, address) without a reachable privacy policy.
- **Fix needed:** Create both pages (can be simple) or remove the links.

### CRITICAL-3 · Facebook icon links to Google Maps URL
- **File:** `src/components/Footer.astro:33–35`
- **Finding:**
  ```html
  <a href={SITE.socials.google} aria-label="Facebook">
    <!-- Facebook SVG icon -->
  </a>
  ```
  The `aria-label` says "Facebook" and the icon renders as the Facebook logo, but `SITE.socials.google` resolves to the Google Maps listing URL (`https://maps.app.goo.gl/...`). A user clicking "Facebook" lands on Google Maps. Screen readers announce "Facebook" for a Google Maps link. This is both a broken UX flow and an accessibility violation.
- **Fix needed:** Either point `href` to the actual Facebook page URL, or replace with the correct Google Maps icon + label.

### HIGH-1 · Three service-area pages are stubs — missing nearly all required props
- **Files:**
  - `src/pages/service-areas/new-tampa-heating-and-cooling.astro`
  - `src/pages/service-areas/odessa-emergency-ac-repair.astro`
  - `src/pages/service-areas/air-conditioning-repair-zephyrhills-fl-i-care-air-care.astro`
- **Finding:** All three pass `ServiceAreaLayout` with only 4 bare-minimum FAQs and ~120–150 words of body content. The following required props per `ServiceAreaLayout` contract (per CLAUDE.md) are absent or empty on all three:
  - `geo` (lat/lng) — LocalBusiness schema will render with no geo coordinates
  - `zipCodes` — quick-facts bar shows nothing
  - `neighborhoods` — sidebar neighborhood list empty
  - `landmarks` — landmarks section blank
  - `climateNote` — climate section missing
  - `reviews` — local review strip absent
  - `relatedAreas` — related areas section missing
  
  These pages are also acknowledged as "Left to do" in CLAUDE.md, so this is a known gap — but they are live routes that an auditor or search engine will crawl.

### HIGH-2 · Blog post bodies are 100% identical boilerplate across all 31 posts
- **File:** `src/pages/[slug].astro`
- **Finding:** Every blog post renders the same four sections regardless of slug:
  1. **Quick Answer** — verbatim copy of the post's `description` field
  2. **What this usually means in {post.location}** — same 2 generic paragraphs for all posts (only the city name token changes)
  3. **When to call I Care Air Care** — same single paragraph for all posts
  4. **Related local help** — links from `post.related`

  None of the 31 posts contain unique, substantive body content. The checklist items (`post.checklist`) are displayed but the explanatory content is boilerplate. An auditor running a duplicate content check will flag this immediately. Google will not surface these as authoritative content.
- **Note:** `src/lib/blog.ts` stores only metadata (slug, description, checklist, etc.) — there is no CMS or markdown body content for any post.

### HIGH-3 · `/service-areas/` index page is thin and unoptimized
- **File:** `src/pages/service-areas/index.astro`
- **Finding:** The page consists of only:
  - An `<h1>` reading "Service areas across Tampa Bay"
  - The `<AreaGrid>` component
  - A `<CTABand>`
  
  No hero, no introductory copy, no meta description with local keywords beyond a generic 90-character fallback, no schema markup, no FAQ, no internal links to services. For a hub page that Google uses as the authority signal for local service area coverage, this is significantly underdeveloped.

### HIGH-4 · `/reviews/` page contains no actual customer reviews
- **File:** `src/pages/reviews.astro`
- **Finding:** The page with the title "Reviews | I Care Air Care Wesley Chapel HVAC 4.9★" contains:
  - `<ReviewStrip>` — which renders 3 generic sentiment summaries ("Clear Communication", "Respectful Service", "Practical Repairs") with no names, dates, or attributed quotes
  - ~200 words of generic prose
  - A link to Google Reviews
  
  There are **zero actual customer testimonials** on the page. A user or auditor visiting `/reviews/` expecting to read reviews will find only category labels. The 700+ reviews claim is completely unsupported by visible content on the page.

---

## Category 2 — SEO Technical

### CRITICAL (SEO) · No `robots.txt` disallow rules — Partytown fragment pages not blocked
- **File:** `public/robots.txt`
- **Finding:** `robots.txt` is `Allow: /` for all bots with sitemap pointer only. While this is functionally fine for most pages, the sitemap integration (`@astrojs/sitemap`) will include all Astro-generated routes. Partytown generates `~/partytown/` worker routes; if these land in the sitemap, search engines waste crawl budget on them. Low risk but worth noting.

### HIGH (SEO) · Several `<title>` tags exceed 60 characters and will be truncated in SERPs
- **Files and lengths:**
  - `src/pages/index.astro:33` — "Wesley Chapel HVAC Contractor | AC Repair & Installation | I Care Air Care" = **74 chars**
  - `src/pages/services/ac-repair-tampa.astro` — "AC Repair Wesley Chapel & Tampa Bay | Same-Day HVAC | I Care Air Care" = **70 chars**
  - `src/pages/services/hvac-installation-tampa.astro` — "HVAC Installation Wesley Chapel & Tampa Bay | New AC Systems | I Care Air Care" = **79 chars**
  - `src/pages/services/emergency-ac-repair-tampa.astro` — "Emergency AC Repair Wesley Chapel & Tampa | 24/7 HVAC | I Care Air Care" = **71 chars**
  - Several service-area pages also exceed 60 chars
- **Finding:** Google typically truncates titles at ~600px (~60 chars). Titles above show brand name at the end which will be cut off. The primary keyword phrase is preserved, but the brand name suffix is lost.

### HIGH (SEO) · Multiple `<meta description>` tags exceed 160 characters
- **Finding:** Several pages have descriptions in the 175–200 character range. Google will rewrite them. Spot checks:
  - `src/pages/index.astro:34` — "Wesley Chapel's 5-star HVAC contractor — serving Wesley Chapel, New Tampa, Land O' Lakes, Lutz & all Tampa Bay. 4.9★ · 700+ Google reviews · 16+ years. Same-day AC repair. Call (813) 395-2324." = **194 chars**
  - `src/pages/about-us.astro` — description is similarly long
- **Note:** Some truncation is acceptable, but phone number at the end of a 194-char description will never display.

### HIGH (SEO) · Blog post `dateModified` equals `datePublished` for all posts
- **File:** `src/pages/[slug].astro` (Article schema generation)
- **Finding:** The Article schema uses `datePublished: post.date` and `dateModified: post.date` — both set to the same publish date for all 31 posts. This signals to Google that no content has ever been updated. For evergreen service content, `dateModified` should reflect actual last-modified date.

### HIGH (SEO) · Blog Article schema uses `Organization` as author, not `Person`
- **File:** `src/pages/[slug].astro` (Article schema)
- **Finding:**
  ```json
  "author": { "@type": "Organization", "name": "I Care Air Care" }
  ```
  Google's E-E-A-T guidelines specifically value `Person` authorship with expertise signals for service/advice content. Using `Organization` as author provides zero personal credibility signal. Author should be `{ "@type": "Person", "name": "Tim Hawk", "jobTitle": "Owner & Master HVAC Technician" }` at minimum.

### MEDIUM (SEO) · `sitemap.xml` not committed — build-time only
- **File:** `public/sitemap.xml` — does not exist
- **Finding:** `@astrojs/sitemap` generates `sitemap-index.xml` at build time (in `dist/`). It is not committed to the repo or present in `public/`. The `robots.txt` points to `https://www.icareaircare.com/sitemap-index.xml`. This is correct behavior for Astro's sitemap integration, but it means:
  1. The file doesn't exist in the repo if someone checks
  2. The 3 stub area pages (New Tampa, Odessa, Zephyrhills) will be included in the sitemap despite being thin
  3. No way to exclude low-value pages (e.g., `/our-team/` redirect) without additional config

### MEDIUM (SEO) · Canonical tags are auto-generated from `Astro.url.pathname` — no override mechanism for alternate slugs
- **File:** `src/layouts/BaseLayout.astro`
- **Finding:** Canonical is set as `https://www.icareaircare.com${Astro.url.pathname}`. This works correctly but there is no prop to override the canonical for pages where the slug differs from the intended canonical (e.g., if a page is accessible at multiple paths or via query strings). Currently not an active problem, but no safety valve exists.

### MEDIUM (SEO) · `image.responsiveStyles` Astro config has no effect — all images use raw `<img>` tags
- **File:** `astro.config.mjs`
- **Finding:** `image: { responsiveStyles: true }` only applies to Astro's `<Image />` component from `astro:assets`. All images in the codebase use plain `<img>` tags. This config option is doing nothing. More importantly, no images get automatic `srcset`/`sizes` responsive handling.

### LOW (SEO) · `public/locations.kml` does not exist
- **File:** `CLAUDE.md:101` — listed as "Left to do"
- **Finding:** Acknowledged gap. No KML file exists for local SEO geo-targeting. Low priority but noted.

### LOW (SEO) · GA4 / GTM code is absent despite Partytown being configured
- **File:** `astro.config.mjs`, all layout files
- **Finding:** `partytown({ config: { forward: ['dataLayer.push', 'gtag'] } })` is configured in `astro.config.mjs` but no GTM snippet or GA4 script tag exists in any layout. Partytown is loaded with no work to do. If the site is live, there is **no analytics tracking**.

---

## Category 3 — Content Accuracy

### HIGH · "thirty combined years" claim is ambiguous and unsupported
- **File:** `src/pages/about-us.astro` (team section)
- **Finding:** The about page references "more than three decades in the Tampa Bay HVAC trade" for Tim Hawk's bio. Cross-checking: Tim is described as starting at 22, the company is 16+ years old — the math only works if he started in the trade at age ~22 and is now ~52+. This is plausible but the stated "30+ years combined" for the team may include other techs. No named team members beyond Tim are given experience figures, making "combined" unverifiable to an auditor. Risk: a reviewer fact-checking this will find nothing to corroborate.

### MEDIUM · "sixteen" is lowercase at sentence start in two places
- **Files:**
  - `src/components/IntroBand.astro` — "sixteen years later we're a family-run team" starts a sentence with a lowercase word
  - `src/pages/about-us.astro:95` — "sixteen years later, that pledge still runs the company."
  - `src/pages/about-us.astro:165` — "sixteen years. Same owner."
- **Finding:** All three instances use the word "sixteen" at the start of a sentence (or as a standalone sentence fragment) without capitalizing it. This is not a style choice — it reads as a typo to any proofreader.

### MEDIUM · Review count claim inconsistency (700 vs 700+)
- **File:** `src/lib/site.ts` — `rating: { value: 4.9, count: 700 }`
- **Finding:** `count` is `700` (exact), but most page copy reads "700+ Google reviews." These are different claims. If the actual count is exactly 700, then "700+" is technically false. If the real count is higher than 700, the `SITE.rating.count` value should reflect that. The schema renders `reviewCount: 700` exactly while UI claims "700+."

### LOW · Blog post dates are all in 2025 — may appear stale by the time the site goes live
- **File:** `src/lib/blog.ts`
- **Finding:** All 31 blog post dates are in 2025 (e.g., `2025-03-15`, `2025-06-01`). If the site launches in mid-2026 or later, blog posts dated over a year ago will appear stale. The newest post is dated `2025-12-01`. Consider updating dates or using `dateModified`.

---

## Category 4 — Content Depth & Uniqueness (E-E-A-T)

### HIGH · All 31 blog posts have no unique body content (duplicate boilerplate)
- *(See HIGH-2 above — cross-listed here for E-E-A-T impact)*
- **E-E-A-T impact:** Google evaluates blog/article content for expertise, experience, authority, and trustworthiness. Identical boilerplate paragraphs across 31 posts is the textbook definition of thin content and will trigger a "helpful content" quality signal failure. These posts should either have unique substantive content or be noindexed.

### HIGH · ReviewStrip shows no attributed reviews anywhere on the site
- **File:** `src/components/ReviewStrip.astro`
- **Finding:** The component renders three category labels ("Clear Communication", "Respectful Service", "Practical Repairs") as carousel slides. No customer name, no date, no review text, no star rating per review. This component is used on: homepage, `/reviews/`, all service pages (via ServiceLayout), all area pages (via ServiceAreaLayout). The claim "700+ reviews" is made repeatedly with **zero review content shown on the site itself**. This significantly weakens social proof and E-E-A-T.

### MEDIUM · No author bio on blog posts
- **File:** `src/pages/[slug].astro`
- **Finding:** Blog posts render a byline of "I Care Air Care Team" with no photo, no individual name, no credentials. For HVAC advice content, Google's E-E-A-T guidelines favor expert authorship with verifiable credentials. Even a simple "Written by Tim Hawk, Licensed HVAC Contractor (CAC1816515)" would significantly improve the signal.

### MEDIUM · About page `<Schema type="LocalBusiness" />` duplicates the one in BaseLayout
- **File:** `src/pages/about-us.astro` (bottom of file)
- **Finding:** `BaseLayout.astro` already renders a `LocalBusiness` JSON-LD schema on every page. The about-us page adds a second `<Schema type="LocalBusiness" />` at the bottom of the page content. This results in two identical `LocalBusiness` JSON-LD blocks in the same HTML document. Google will see duplicate structured data and may ignore or penalize both.

### LOW · No video content, before/after photos, or visual proof of work anywhere
- **Finding:** The site claims 16+ years of experience and 700+ reviews but has no visible project photos (before/after), no video testimonials, no team action shots beyond the one team photo on the homepage band. Visual proof of work is a strong E-E-A-T signal for home service businesses.

---

## Category 5 — Conversion Rate Optimization (CRO)

### HIGH · LeadForm has duplicate address fields and excessive length for a quote form
- **File:** `src/components/LeadForm.astro`
- **Finding:** The form contains 7 fields including:
  - `name="search_address"` (labeled with search icon — appears to be an autocomplete field)
  - `name="address"` (a separate plain text field)
  
  Both fields appear to collect street address. Additionally, the form collects: name, email, phone, search_address, address, city, state, zip = **7–8 fields total** for a quote request. Industry benchmarks show form completion rates drop sharply above 4–5 fields. The duplicate address fields will confuse users and likely confuse FormSubmit's email output.

### MEDIUM · "Book Online" button in Header links to external HousecallPro URL
- **File:** `src/components/Header.astro`
- **Finding:** The primary CTA in the header goes to `https://book.housecallpro.com/book/I-Care-Air-Care/cb3eaa8c` — an external domain. Users clicking this CTA leave the site immediately. There is no confirmation that this URL is still valid (it may change if the HousecallPro account changes). Consider whether this should open in a new tab (`target="_blank"`) or be replaced with an anchor to the on-page form.

### MEDIUM · FinalCTA and ContactFormSection both appear at the bottom of most pages — redundant CTAs
- **Files:** `src/layouts/ServiceLayout.astro`, `src/layouts/ServiceAreaLayout.astro`, `src/pages/index.astro`
- **Finding:** `<FinalCTA />` is followed immediately by `<ContactFormSection />` at the bottom of nearly every page. Both components ask the user to contact/book. This creates visual redundancy and may dilute the conversion signal by making users unsure which to use.

### LOW · StickyMobileCTA "Call" button color is `bg-brand-600` (teal) not `bg-accent-500` (orange)
- **File:** `src/components/StickyMobileCTA.astro`
- **Finding:** The primary CTA button system uses `.btn-primary` (accent orange) for emphasis. The sticky mobile call-to-action uses teal (`bg-brand-600`) for the Call button. This is visually inconsistent with the established button hierarchy across the rest of the site where orange = primary action.

---

## Category 6 — Mobile / Responsive Issues

### MEDIUM · Hero subtitle uses raw HTML `<br/>` and `<span>` tags passed as string props — no mobile line-break control
- **File:** `src/pages/index.astro:42`
- **Finding:** The hero subtitle is passed as a raw HTML string with `<span>` highlights. On mobile viewports, forced `<br/>` in title text (`Wesley Chapel's #1<br/>HVAC Contractor`) may or may not break at a good point depending on font size. This cannot be controlled responsively via CSS when injected as `set:html`. The break is optimized for desktop and may look awkward on small screens.

### MEDIUM · Blog post sidebar uses `<h2>` for non-section headings
- **File:** `src/pages/[slug].astro` (sidebar section)
- **Finding:** The blog sidebar renders:
  ```html
  <h2>Need help with this?</h2>
  <h2>Popular next steps</h2>
  ```
  These are not document section headings — they are sidebar widget titles. Using `<h2>` for them puts them at the same outline level as major content sections, breaking the document heading hierarchy. These should be `<h3>` or `<h4>`. This also impacts screen reader navigation.

### LOW · Mobile mega-menu uses `<details>` + `<summary>` without explicit ARIA roles
- **File:** `src/components/Header.astro`
- **Finding:** The mobile navigation drawer uses HTML `<details>`/`<summary>` elements for accordion-style sub-menus. While semantically valid, `<details>` as a navigation pattern has inconsistent screen reader support across browsers. The WAI-ARIA `button` + `aria-expanded` pattern is more reliably announced. This is a minor accessibility concern rather than a critical failure.

### LOW · `LeadForm` `hero` variant vertical rhythm on mobile not tested
- **File:** `src/components/LeadForm.astro`
- **Finding:** The hero variant of LeadForm stacks 7–8 fields vertically on mobile. With a large viewport hero background above, this form will push the page fold significantly. No audit of actual mobile render was performed, but the field count strongly suggests an awkward mobile experience.

---

## Category 7 — Code Quality / Maintainability

### MEDIUM · `SITE.socials.google` stores a Google Maps URL but is labeled `google`
- **File:** `src/lib/site.ts`
- **Finding:** `socials.google` stores `https://maps.app.goo.gl/...` (Google Maps listing). This is used:
  1. On reviews.astro for the "Read all reviews on Google" link — correct
  2. In Footer.astro with a Facebook icon + aria-label — wrong (see CRITICAL-3)
  3. The property name `google` is ambiguous — is it the Maps listing? Google Business Profile? Google review link? Should be named `googleMaps` or `googleReviews` for clarity.

### MEDIUM · `image.responsiveStyles: true` in `astro.config.mjs` is dead config
- **File:** `astro.config.mjs`
- **Finding:** *(Noted above under SEO)* — This config applies only to Astro's `<Image />` component. Since the entire site uses raw `<img>` tags, this setting is dead. It creates a false sense that responsive images are handled.

### LOW · Partytown configured with no scripts to offload
- **File:** `astro.config.mjs`
- **Finding:** `@astrojs/partytown` is installed and configured with `forward: ['dataLayer.push', 'gtag']` but no Google Tag Manager or GA4 script is present in any layout. Partytown loads its worker scripts (adding ~15–20KB) with nothing to offload. Should either be removed until tracking is added, or tracking should be added.

### LOW · Multiple unused PNG logos in `public/images/`
- **Files:** Various `*-logo.png` files visible in `public/images/`
- **Finding:** Several brand/partner logo PNGs appear to exist in `public/images/` that are not referenced in any component. These add unnecessary build/deploy weight. (Note: double-extension `.webp.webp` files are KNOWN intentional Cyberduck artifacts per CLAUDE.md — those are excluded from this finding.)

### LOW · `_redirects` file missing common legacy slug variations
- **File:** `public/_redirects`
- **Finding:** The file handles `/our-team/`, `/contact-us/`, and `/hvac-services/` but is missing:
  - `/ac-repair/` → `/services/ac-repair-tampa/`
  - `/emergency-ac-repair/` → `/services/emergency-ac-repair-tampa/`
  - `/duct-cleaning/` or `/air-duct-cleaning/` → `/services/air-duct-cleaning-tampa/`
  - `/heating/` or `/heating-services/` → `/services/heating-services-tampa/`
  - These are common short-form URLs users and old backlinks might reference. Without them, organic backlink equity from any prior short-slug inbound links is lost.

---

## Summary Table

| ID | Severity | Category | Issue |
|---|---|---|---|
| CRITICAL-1 | CRITICAL | Broken Content | `favicon.png` referenced but missing from `public/` |
| CRITICAL-2 | CRITICAL | Broken Content | `/privacy-policy/` and `/terms-of-use/` pages don't exist (Footer links broken) |
| CRITICAL-3 | CRITICAL | Broken Content | Facebook icon in Footer links to Google Maps URL |
| HIGH-1 | HIGH | Broken Content | 3 area pages (New Tampa, Odessa, Zephyrhills) are stubs missing required props |
| HIGH-2 | HIGH | Broken Content + E-E-A-T | All 31 blog posts have identical boilerplate body content — zero unique copy |
| HIGH-3 | HIGH | Broken Content + SEO | `/service-areas/` index hub page is thin (no hero, no copy, no schema) |
| HIGH-4 | HIGH | Broken Content + CRO | `/reviews/` page has zero actual attributed customer reviews |
| HIGH-5 | HIGH | SEO | Multiple `<title>` tags exceed 60 characters |
| HIGH-6 | HIGH | SEO | Multiple `<meta description>` tags exceed 160 characters |
| HIGH-7 | HIGH | SEO | Blog `dateModified` = `datePublished` — signals no content updates |
| HIGH-8 | HIGH | SEO + E-E-A-T | Blog Article schema uses `Organization` author, not `Person` |
| HIGH-9 | HIGH | E-E-A-T | ReviewStrip shows no attributed reviews anywhere on the site |
| HIGH-10 | HIGH | CRO | LeadForm has duplicate address fields + 7–8 fields total |
| MEDIUM-1 | MEDIUM | SEO | Sitemap will include stub/thin pages at build time |
| MEDIUM-2 | MEDIUM | SEO | No GA4/GTM tracking despite Partytown being configured |
| MEDIUM-3 | MEDIUM | SEO | `image.responsiveStyles: true` is dead config — no `<Image>` components used |
| MEDIUM-4 | MEDIUM | Content Accuracy | "thirty combined years" claim is ambiguous/unverifiable |
| MEDIUM-5 | MEDIUM | Content Accuracy | "sixteen" lowercase at start of sentences in 3 places |
| MEDIUM-6 | MEDIUM | Content Accuracy | `SITE.rating.count: 700` exact vs. "700+" copy mismatch |
| MEDIUM-7 | MEDIUM | E-E-A-T | No author bio on blog posts |
| MEDIUM-8 | MEDIUM | E-E-A-T | About page renders duplicate `LocalBusiness` JSON-LD (BaseLayout already injects one) |
| MEDIUM-9 | MEDIUM | CRO | "Book Online" CTA in Header navigates away from site to external HousecallPro URL |
| MEDIUM-10 | MEDIUM | CRO | FinalCTA + ContactFormSection are adjacent redundant CTAs at page bottom |
| MEDIUM-11 | MEDIUM | Mobile/A11y | Blog sidebar uses `<h2>` for widget titles (breaks heading hierarchy) |
| MEDIUM-12 | MEDIUM | Mobile | Hero title `<br/>` not responsive — may break awkwardly on small screens |
| LOW-1 | LOW | SEO | `public/locations.kml` not created (acknowledged gap in CLAUDE.md) |
| LOW-2 | LOW | SEO | Blog post dates are all 2025 — will appear stale after ~mid-2026 |
| LOW-3 | LOW | CRO | StickyMobileCTA "Call" button uses teal instead of accent orange |
| LOW-4 | LOW | Mobile/A11y | Mobile `<details>`/`<summary>` nav pattern has inconsistent screen reader support |
| LOW-5 | LOW | Code Quality | `SITE.socials.google` is ambiguous name; stores Maps URL |
| LOW-6 | LOW | Code Quality | Partytown loaded with no scripts to offload |
| LOW-7 | LOW | Code Quality | Unused PNG logos in `public/images/` |
| LOW-8 | LOW | Code Quality | `_redirects` missing short-form legacy service URL variants |

---

## Priority Fixes (Recommended Order)

1. **Immediately before launch:** CRITICAL-1 (favicon), CRITICAL-2 (privacy/terms pages), CRITICAL-3 (Facebook→Google Maps link)
2. **Before external SEO audit:** HIGH-1 (stub area pages), HIGH-2 (blog content), HIGH-9 (real reviews in ReviewStrip)
3. **Before Google Ads / paid traffic:** HIGH-10 (LeadForm fields), MEDIUM-2 (install GA4/GTM), HIGH-4 (reviews page)
4. **E-E-A-T pass:** HIGH-8 (blog author schema), MEDIUM-7 (author bio), MEDIUM-8 (duplicate LocalBusiness schema)
5. **Cleanup pass:** All MEDIUM and LOW items

---

*Report generated from static code analysis. No live site was tested. All file:line references are to the `icareaircare-astro/src/` directory unless otherwise noted.*
