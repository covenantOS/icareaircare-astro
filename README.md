# I Care Air Care — Astro Rebuild

Full Astro + Tailwind v4 rebuild of **icareaircare.com**, a Wesley Chapel, FL HVAC contractor's website.
This is the working repo. `main` is the source of truth.

> **Picking this up cold as another Claude / Codex / AI instance?** Read [`CLAUDE.md`](./CLAUDE.md) first — it contains the full handoff (design decisions that must not be reverted, voice/style guide, gotchas, and the done/left-to-do checklist). This README covers what the project *is*; CLAUDE.md covers what was *decided*.

---

## The business

- **I Care Air Care** — HVAC contractor, Wesley Chapel, FL
- Owner: **Tim Hawk**
- License: **CAC1816515** (Florida)
- Rating: **4.9★** · **600+** Google reviews
- Years in business: **15+**
- HQ: **27022 Foamflower Blvd, Wesley Chapel, FL 33544**
- Phone: **(813) 395-2324** (`tel:+18133952324`)
- Email: **tim@icareaircare.com**
- Booking: https://book.housecallpro.com/book/I-Care-Air-Care/cb3eaa8c
- Service counties: **Pasco**, **Hillsborough**, **Polk**
- Geo: `28.2426914, -82.3726776`

All of the above lives as constants in [`src/lib/site.ts`](./src/lib/site.ts) — **always update that file, never hardcode in components.**

---

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Astro 5** | Static SSG, zero-JS by default |
| Styling | **Tailwind CSS v4** | Uses `@import "tailwindcss"` + `@theme` block in `src/styles/global.css`. **No `tailwind.config.js`.** |
| Forms | **FormSubmit** | Posts to `tim@icareaircare.com`. 3 variants in `LeadForm.astro`: `hero` / `section` / `card` |
| Booking | **Housecall Pro** | External link — never iframe |
| Maps | **Google Maps iframe** | Embedded per-city in `ServiceAreaLayout` |
| Analytics | Not wired yet | Slots exist for GA4 + GTM (env-var-driven) |
| Build output | Static `dist/` | Deploys anywhere — Netlify, Cloudflare Pages, Vercel |

Node version: see `package.json` `engines.node` — currently `>=22.12.0`.

---

## Commands

```bash
npm install              # install deps
npm run dev              # dev server at http://localhost:4321
npm run build            # production build -> dist/
npm run preview          # preview dist/ locally
```

---

## Directory map

```
src/
  lib/
    site.ts                        SINGLE SOURCE OF TRUTH — phone, services[], areas[], rating, license, hours, geo
  styles/
    global.css                     Tailwind v4 @theme tokens, prose utilities, btn-* classes
  components/
    Header.astro                   Sticky header; scroll hysteresis (HI=80 / LO=20 px). NAV DROPDOWNS.
    Footer.astro                   2-tier footer (blue Contact block -> teal main). NO mt-16.
    Hero.astro                     Gradient + SVG pattern bg (NOT raster). Optional framed image panel on lg+.
    LeadForm.astro                 FormSubmit form, 3 variants
    Schema.astro                   JSON-LD (LocalBusiness, Service, FAQPage, BreadcrumbList, Article)
    ServiceGrid.astro              8-service card grid
    AreaGrid.astro                 9-area card grid
    WhyChooseUs.astro              6-reason strip
    ReviewStrip.astro              Google reviews band
    ThreeStep.astro                Call -> Schedule -> Fix explainer
    BrandBand.astro                Equipment-brand logos
    IntroBand.astro                Short intro band (owner Tim + license)
    BlogStrip.astro                Blog teaser
    FAQ.astro                      FAQ accordion + schema
    FinalCTA.astro                 End-of-page CTA
    ContactFormSection.astro       Blue section w/ form + contact block
    CTABand.astro                  Orange accent CTA strip
    TrustBar.astro                 Review/license/warranty row
    StickyMobileCTA.astro          Bottom-fixed phone/book bar on mobile
  layouts/
    BaseLayout.astro               <html>, head meta, Header, Footer, StickyMobileCTA, JSON-LD, canonical
    ServiceLayout.astro            Service-page wrapper
    ServiceAreaLayout.astro        City/county wrapper: quick-facts bar, map, landmarks, climate, reviews, related areas, rich schema
  pages/
    index.astro                    Home
    about-us.astro                 Rich merged page — story + timeline + values + team (#team anchor) + credentials + map
    our-team.astro                 301 -> /about-us/#team
    contact.astro, reviews.astro, financing.astro, careers.astro, blogs.astro, 404.astro
    services/
      index.astro
      ac-repair-tampa.astro
      emergency-ac-repair-tampa.astro
      ac-maintenance-tampa.astro
      hvac-installation-tampa.astro
      air-duct-cleaning-tampa.astro
      heating-services-tampa.astro
      refrigeration-repair-tampa.astro
      thermostat-installation-tampa.astro
    service-areas/
      index.astro
      wesley-chapel-ac-repair.astro
      pasco-county-ac-repair.astro
      hillsborough-county-hvac-company.astro
      polk-county-residential-ac-repair.astro
      land-o-lakes-hvac-services.astro
      lutz-home-air-conditioning-service.astro
      new-tampa-heating-and-cooling.astro
      odessa-emergency-ac-repair.astro
      air-conditioning-repair-zephyrhills-fl-i-care-air-care.astro
public/
  images/                          All customer photos — .webp primarily. SOME have legit trailing .webp.webp (Cyberduck artifact — DO NOT RENAME without grep check).
  favicon.png
scripts/                           Utility scripts
```

---

## Design tokens

Defined in `src/styles/global.css` under `@theme`:

| Token family | Primary | Hex | Use |
|---|---|---|---|
| `--color-brand-*` (teal) | `500` | `#5da5b8` | Primary brand color, section headers |
| `--color-navy-*` | `700` | `#1a2e45` | Dark text + navy backgrounds |
| `--color-accent-*` (orange) | `500` | `#e88a38` | CTAs, underlines (`title-accent::after`), hover states |
| `--color-surface` | — | `#f0f5f8` | Section background |
| Font | Inter | — | Google fonts |

Button classes: `.btn-primary` (accent), `.btn-outline` (transparent w/ border), `.btn-ghost` (text only).
Typography utility for long-form copy: `.prose-icac`.
Decorative heading underline: `.title-accent::after`.

---

## Critical design decisions (DO NOT UNDO)

These were deliberately chosen and fix previous problems. If you're tempted to "clean up" any of them, check git history first — you're probably about to re-introduce a bug we already fixed.

1. **Hero uses CSS gradient + inline SVG pattern, not raster backgrounds.**
   Full-bleed raster hero images were blurry and grossly upscaled on 4K screens. Replaced with `bg-gradient-to-br from-navy-900 via-navy-800 to-brand-800` + inline SVG wave pattern + two radial-gradient blobs. Raster images live in a framed `aspect-[4/3]` panel on the right on `lg:+` when a page isn't showing the hero form.

2. **Header scroll uses dual-threshold hysteresis.**
   `HI = 80px` to collapse, `LO = 20px` to expand. Single-threshold flipped at the boundary because layout shift pushed scroll back under the trigger. Uses `requestAnimationFrame` throttle + inline `style="transition:height 260ms..."` instead of class swaps (class swaps flickered).

3. **Footer has NO `mt-16`.**
   ContactFormSection above ends in blue. Footer's own Contact block is blue. With `mt-16` you get 4rem of white between two blue sections — that's the "huge white gap" previously reported. Remove at your peril.

4. **`/our-team/` permanently redirects to `/about-us/#team`.**
   We merged Story + Team into one rich About page (timeline, values, team grid, credentials, map). Splitting it was never useful and both pages looked thin. The redirect preserves backlinks.

5. **Every `/service-areas/*` page uses `ServiceAreaLayout`** with the full props set:
   `slug, title, description, h1, eyebrow, subtitle, cityName, heroImage, faqs, reviews, responseWindow, driveTime, zipCodes, geo:{lat,lng}, neighborhoods, landmarks, climateNote, schoolsOrHoas, relatedAreas`.
   Passing just the required props produces a valid page but drops all the hyper-local SEO (which is the entire moat).

---

## Voice / content style guide

- **Conversational, but credentialed.** Name Tim. Name the phone number. Name the address. Name the license.
- **Show specific numbers:** dollar ranges for common repairs, response-time windows, review counts.
- **Hyper-local details:** neighborhoods by name, ZIP codes, landmark mentions, HOA specifics, climate micro-observations. This is the SEO moat — don't generify it.
- **Internal linking is mandatory:** every service-area page links to every service page and to 3–4 nearby service areas.
- **Lists in three emphasis levels:** H2 -> bulleted with **bolded first 2–3 words** -> paragraph details.
- **Em dashes are intentional:** we use ` — ` (space-em-space). No post-process replaces them with hyphens.
- **No marketing fluff.** If a sentence doesn't teach, trust-signal, or name something local, cut it.

---

## SEO conventions

- Canonical + OG/Twitter cards are set in `BaseLayout.astro`; per-page overrides via props.
- JSON-LD:
  - Home / global: `LocalBusiness` (HVACBusiness) with geo + hours + rating
  - Services: `Service` + `FAQPage` + `BreadcrumbList`
  - Service areas: `Service` w/ `areaServed.geo.GeoCoordinates` + `FAQPage` + `BreadcrumbList`
  - Future blog posts: `Article`
- Sitemap + robots.txt: **not yet generated** (see `CLAUDE.md` Phase 4 checklist).
- KML: `public/locations.kml` should be regenerated from `SITE.serviceAreas` + their geo coords when we have all of them.
- Redirects: `/our-team/ -> /about-us/#team` is handled in Astro via `Astro.redirect(..., 301)`. Any legacy slug variations from the old site should be added to a Netlify `_redirects` file (or host equivalent) when deployed.

---

## Known gotchas

- **Tailwind v4 is CSS-first.** There is no `tailwind.config.js`. Customize via `@theme` in `src/styles/global.css`.
- **Some images have `.webp.webp`** (double extension). That's a Cyberduck upload artifact from the original site — references use the exact filename so do not rename without a grep sweep.
- **`src/lib/site.ts` is the source of truth.** Services & areas arrays drive the ServiceGrid, AreaGrid, footer links, and schema. Edit there, not in components.
- **Hero's framed image panel shows only on `lg:+` AND when `showForm={false}` AND an `image` prop is passed.** The home hero uses `showForm=true` so the image rides in the form column instead.
- **FormSubmit requires first submission from the real domain** before it stops redirecting through a confirmation page. Check `tim@icareaircare.com` received at least one verification email on go-live.

---

## Cross-device workflow

Everything you need to continue the project from a different machine (or a different AI instance) is in this repo:

```bash
git clone https://github.com/covenantOS/icareaircare-astro.git
cd icareaircare-astro
npm install
npm run dev
# read CLAUDE.md for current status + what's left
```

- Source, components, layouts, pages — all tracked.
- **Images** — tracked (`public/images/`, ~70 `.webp` files).
- `.env*`, `node_modules/`, `dist/`, `.astro/` — gitignored; `npm install` rebuilds what it can.

---

## Phase status

- Phase 1 — Astro foundation, design tokens, page stubs for all preserved URLs — DONE
- Phase 2 — Homepage + 8 service pages + initial service-area/supporting pages, header + footer, schema — DONE
- Phase 3 — Hyper-local service-area rebuilds (9 cities + hub). See `CLAUDE.md` for current progress.
- Phase 4 — Supporting-page polish, blog index stub, global SEO pass (sitemap, robots, KML, redirects, GA4/GTM)

---

## License / ownership

Private, client project. Do not redistribute.
