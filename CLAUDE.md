# I Care Air Care — Astro Site Rebuild

> **For a future Claude instance picking this up cold.** This file plus the repo is everything you need. The user (Will) is rebuilding the I Care Air Care website. This is the Astro project that will replace icareaircare.com.

## What this project is

A full rebuild of **icareaircare.com** in Astro + Tailwind v4.
- Business: I Care Air Care — Wesley Chapel, FL HVAC contractor (licensed CAC1816515, 700+ Google reviews, 15+ yrs, family-run, owner Tim Hawk)
- HQ: 27022 Foamflower Blvd, Wesley Chapel, FL 33544
- Phone: (813) 395-2324 · tim@icareaircare.com
- Book URL: https://book.housecallpro.com/book/I-Care-Air-Care/cb3eaa8c
- Service counties: Pasco, Hillsborough, Polk

## Tech stack

- Astro 5 (+ `astro.config.mjs`)
- Tailwind CSS v4 (via `@import "tailwindcss"` in `src/styles/global.css` — uses `@theme` block for design tokens, NOT a tailwind.config.js)
- Form submission via FormSubmit (tim@icareaircare.com)
- Google Maps embeds, Housecall Pro booking
- Static site — `npm run build` → `dist/`

## Directory cheatsheet

```
src/
  lib/site.ts          - single source of truth for phone, services[], serviceAreas[], rating, license, hours
  components/
    Header.astro       - sticky header with hysteresis scroll animation (HI=80, LO=20 px thresholds)
    Footer.astro       - 2-tier footer (Contact block blue, main footer teal). NO mt-16 — kept flush with prior section.
    Hero.astro         - reusable hero. Uses gradient + SVG pattern bg (NOT raster bg) + framed image panel on right. No blur.
    LeadForm.astro     - form (FormSubmit), 3 variants: hero / section / card
    Schema.astro       - JSON-LD (LocalBusiness, Service, FAQPage, BreadcrumbList, Article)
    ServiceGrid/AreaGrid/WhyChooseUs/ReviewStrip/ThreeStep/BrandBand/IntroBand/BlogStrip/FAQ/FinalCTA/ContactFormSection/CTABand/TrustBar/StickyMobileCTA
  layouts/
    BaseLayout.astro        - <html>, head meta, Header, Footer, StickyMobileCTA, JSON-LD, canonical
    ServiceLayout.astro     - service page template
    ServiceAreaLayout.astro - city/county template (rich: quick-facts bar, map, landmarks, climate note, local reviews, related areas, schema w/ geo)
  pages/
    index.astro, about-us.astro (merged with team), our-team.astro (301→/about-us/#team)
    contact, reviews, financing, careers, blogs, 404
    services/{ac-repair-tampa, emergency-ac-repair-tampa, ac-maintenance-tampa, hvac-installation-tampa, air-duct-cleaning-tampa, heating-services-tampa, refrigeration-repair-tampa, thermostat-installation-tampa}.astro + index.astro
    service-areas/{wesley-chapel-ac-repair, pasco-county-ac-repair, hillsborough-county-hvac-company, polk-county-residential-ac-repair, land-o-lakes-hvac-services, lutz-home-air-conditioning-service, new-tampa-heating-and-cooling, odessa-emergency-ac-repair, air-conditioning-repair-zephyrhills-fl-i-care-air-care}.astro + index.astro
public/
  images/       - .webp primarily, all customer media
  favicon.png
scripts/        - utility scripts
```

## Brand / design tokens (in `src/styles/global.css` @theme)

- brand (teal): `--color-brand-*` 50–900, primary = 500 `#5da5b8`
- navy (dark text/bg): `--color-navy-*` 50–900, primary = 700 `#1a2e45`
- accent (orange): `--color-accent-*` 50–700, primary = 500 `#e88a38`
- surface: `#f0f5f8`
- font: Inter (Google fonts)
- buttons: `.btn-primary` (accent-500), `.btn-outline` (transparent), `.btn-ghost`
- `.title-accent::after` gives section titles a short orange underline
- `.prose-icac` typography utility for long-form content

## Critical design decisions (DO NOT UNDO)

1. **Hero uses gradient+SVG pattern background, not raster.** The old version had blurry, full-bleed background images. We replaced with `bg-gradient-to-br` + inline SVG pattern + radial gradient blobs + a framed image panel on the right. Keep it.
2. **Header scroll uses hysteresis.** `HI=80px` to collapse, `LO=20px` to expand. Single-threshold approach glitched. Don't revert.
3. **Footer has NO top margin.** Removing `mt-16` killed the big white gap between page content and footer. Keep it flush.
4. **`/our-team/` permanently redirects to `/about-us/#team`.** Merged into one rich About page with story + timeline + values + team grid + credentials + map. Don't re-split.
5. **All service-area pages use `ServiceAreaLayout`** which provides quick-facts bar, dispatch/response/rating/license stats, map w/ geo coords, landmarks, climate note, local reviews, related areas, LocalBusiness + Service + FAQPage schema. Every page MUST pass `geo={{lat,lng}}`, `zipCodes`, `neighborhoods`, `landmarks`, `climateNote`, `reviews`, `relatedAreas`.

## Status (as of 2026-04-20, handoff)

### Done
- [x] Header scroll glitch fixed (hysteresis)
- [x] Hero redesigned (no raster bg, sharp framed image panel)
- [x] Footer white gap fixed
- [x] `/about-us/` rebuilt as full rich page (story + timeline + values + team + credentials + map)
- [x] `/our-team/` → 301 redirect to `/about-us/#team`
- [x] Nav links updated (Header)
- [x] `ServiceAreaLayout` upgraded (quick-facts bar, map, landmarks, climate, local reviews, related areas, richer schema)
- [x] `/service-areas/wesley-chapel-ac-repair/` rebuilt with hyper-local content
- [x] `/service-areas/pasco-county-ac-repair/` rebuilt
- [x] `/service-areas/hillsborough-county-hvac-company/` rebuilt
- [x] `/service-areas/polk-county-residential-ac-repair/` rebuilt
- [x] `/service-areas/land-o-lakes-hvac-services/` rebuilt
- [x] `/service-areas/lutz-home-air-conditioning-service/` rebuilt

### Left to do (Phase 3 + Phase 4)
- [x] `/service-areas/polk-county-residential-ac-repair/` — full hyper-local rewrite (Lakeland/Winter Haven/Bartow/Davenford + Lake Wales Ridge climate + freeze protection)
- [x] `/service-areas/land-o-lakes-hvac-services/` — full rewrite (Bexley/Connerton/Lake Padgett + lakefront latent-load specs)
- [x] `/service-areas/lutz-home-air-conditioning-service/` — full rewrite (Avila/Cheval + Pasco/Hillsborough permit split + older unincorporated Lutz)
- [ ] Rebuild remaining 3 service-area pages with same hyper-local depth:
  - [ ] `/service-areas/new-tampa-heating-and-cooling/` (Tampa Palms, Cross Creek, Cory Lake Isles, Hunter's Green, Heritage Isles, Live Oak Preserve, K-Bar Ranch, USF, Moffitt)
  - [ ] `/service-areas/odessa-emergency-ac-repair/` (Keystone, Starkey Ranch, Eagle Ridge, Crescent Lake, rural upscale NW Hillsborough)
  - [ ] `/service-areas/air-conditioning-repair-zephyrhills-fl-i-care-air-care/` (Silverado, Betmar Acres 55+, Colony Hills, AdventHealth Zephyrhills, Skydive City, east Pasco design days)
- [ ] Rebuild `/service-areas/` index hub page (grid of 9 cities, map, intro, schema)
- [x] Replaced default Astro starter README.md with comprehensive handoff-ready README
- [x] Added "Local team + vans" band to home page between Hero and BrandBand (1024x604 `-Local-Team-and-Service-AC.webp`). NOTE: the `-Local-Team-and-Service-Vans.webp` file is only 341x201 — need higher-res original to swap in.
- [ ] Strengthen supporting pages: `/contact/`, `/reviews/`, `/financing/`, `/services/` hub, `/careers/`, `/404.astro`
- [ ] Blog index stub at `/blogs/` (design for future posts, no posts yet)
- [ ] SEO pass:
  - [ ] `public/sitemap.xml` (auto-generated or hand-written)
  - [ ] `public/robots.txt`
  - [ ] `public/locations.kml` (regenerate from `SITE.serviceAreas` + geo)
  - [ ] Canonical tags (already in `BaseLayout.astro` — verify per-page overrides)
  - [ ] OG/Twitter cards (already in BaseLayout)
  - [ ] JSON-LD Article schema on any blog posts added later
  - [ ] Redirects file (Netlify `_redirects` or equivalent) — list legacy slug variations that should map to current pages. Known: `/our-team/` → `/about-us/#team` is already an Astro redirect.
  - [ ] GA4 + GTM placeholder (env-var-driven, don't hardcode IDs)

## Voice / content style guide (applied on pages rebuilt so far)

- Conversational but credentialed. "Tim" is named. Phone is named. Address is named.
- Show specific numbers: dollar ranges for common repairs, response-time windows, number of reviews.
- Hyper-local details: neighborhoods by name, ZIP codes, landmark mentions, HOA specifics, climate micro-observations. This is the SEO moat.
- Internal linking is mandatory: every service-area page links to every service page and to 3–4 nearby service areas.
- Lists: three levels of emphasis — H2 → bulleted with bolded first 2–3 words → paragraph details.
- No em dashes replaced with hyphens by post-process — we use ` — ` (space-em-space) deliberately.

## Known gotchas

- Tailwind v4 uses the `@theme` block in CSS, not `tailwind.config.js`. Customs live in `src/styles/global.css`.
- Some images in `public/images/` have trailing `.webp.webp` — intentional, Cyberduck artifact, don't rename without verifying refs.
- `SITE` comes from `src/lib/site.ts` — ALWAYS update that list if services or areas change, don't hardcode in components.
- Hero's framed image panel only shows on `lg:` and when `showForm={false}` AND an `image` is passed. Home uses `showForm=true` so the image lives in the LeadForm column.

## Commands

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # output -> dist/
npm run preview      # preview the built site
```

## When picking this up on a different device

1. `git clone <repo>` on the new machine
2. `cd icareaircare-astro && npm install`
3. `npm run dev`
4. Read this file, then `git log --oneline -20` to see recent commits
5. Continue the "Left to do" checklist above
