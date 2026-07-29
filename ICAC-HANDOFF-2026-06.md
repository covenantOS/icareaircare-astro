# I Care Air Care (ICAC) — Project Handoff & Context

> Paste this whole document into a new chat to continue the work with full context.
> Last updated: 2026-06-09.

---

## 1. PROJECT ACCESS (how a new chat reaches the site)

- **Client:** I Care Air Care — HVAC contractor, Wesley Chapel / Tampa Bay, FL.
- **Production site:** https://www.icareaircare.com
- **GitHub repo:** `covenantOS/icareaircare-astro` (private, accessed via `gh` CLI, account `kevinservicelinepro`).
- **Local clone path:** `C:\Users\NW\Documents\claude\eye care\icareaircare-astro`
  - This is the working folder. Do NOT mix other clients (kingdom-builders, titan, slp/servicelinepro, cfc) into this project.
- **Tech stack:** Astro 6 (static), Tailwind CSS v4, Cloudflare Pages (hosting). Pages Functions in `functions/` use D1 + KV (KPI dashboard, lead forms).
- **Build:** `npm run build` (outputs to `dist/`, 81 pages). **Dev server:** `npm run dev` (localhost:4321+).
- **Deploy:** pushing to `main` on origin auto-deploys to production via Cloudflare Pages.

## 2. WORKFLOW RULES (IMPORTANT)

- **Work directly on `main` now and push when the user approves** (the user explicitly said "no more branches"). Earlier sessions used feature branches; the user changed this.
- **Always run `git fetch` + check `git rev-list --left-right --count main...origin/main` before pushing** — a colleague (Tim's internal dev) also pushes to `main` (admin dashboard, KPI, newsroom posts). Never force-push or clobber their commits. Integrate origin/main first.
- **Verify before pushing:** `npm run build` must pass.
- **Em-dash policy: ZERO em-dashes anywhere** (titles, metas, content, schema, even comments). The client treats em-dashes (—) as an AI-writing tell. Use hyphens, commas, or " | ". (The middot · is allowed.)
- **Official content / marketing claims / reviews:** show the user before changing. Only use claims supported on the site (4.9★ / 700+ Google reviews, license CAC1816515, 1-year warranty, same-day when available, 0% Synchrony financing). Do NOT invent claims (e.g. "24/7" is NOT true).

## 3. KEY ARCHITECTURE / FILES

- `src/layouts/BaseLayout.astro` — global head: meta robots (`index, follow` or `noindex`), canonical (self), OG/Twitter, GTM/Partytown, schema includes. Has a `noindex` prop.
- `src/layouts/ServiceLayout.astro` — template for all 13 service pages. Has an `enhanced={true}` prop that turns on the richer sidebar (featured review + Google Business Profile map + expandable Service-area and Related-services modules with internal links). **Currently enabled ONLY on `ac-repair-tampa` as a prototype.**
- `src/layouts/ServiceAreaLayout.astro` — template for 9 service-area pages. Contains `VERIFIED_REVIEWS` (5 real Google reviews) used for Review schema.
- `src/components/Schema.astro` — central JSON-LD. Emits an `@graph` of HVACBusiness + Person (Tim Hawk) + WebSite, plus Service / FAQPage / BreadcrumbList / Article / FinancialProduct per page type.
- `src/components/ReviewStrip.astro` — sitewide review marquee + LocalBusiness `review` schema (real reviews, no aggregateRating here; aggregateRating lives only on HVACBusiness).
- `src/lib/site.ts` — SITE config: NAP, rating (4.9 / 700), serviceAreas[], services[], socials.google (GBP link), phone.
- `src/lib/blog-faqs.ts` — unique per-post FAQ sets for all 39 blogs (keyed by slug). Wired into `src/pages/blogs/[slug].astro` via `BLOG_FAQS[post.slug]`.
- `src/content.config.ts` — blog frontmatter schema (Zod). Includes optional `noindex` and `imageAlt`.
- `astro.config.mjs` — sitemap integration with a `filter` excluding noindex/legacy URLs.
- `public/_headers` — Cloudflare headers (X-Robots-Tag, security headers).
- `public/robots.txt`, `public/_redirects` — redirects already 1:1 correct (non-www -> www, root blog slugs -> /blogs/...).

## 4. AGENCY CONTENT MODEL (so you understand the blog "duplicates")

A PR agency produces 3 assets per topic:
- **Article** (long, 2400+ words) -> lives on site, the SEO "pillar" page.
- **Newsroom** (short, ~750 words) -> lives on site, optimized for GEO (AI answer engines) + journalist pickup, links to the pillar. **These are set `noindex` + excluded from sitemap** to avoid organic cannibalization with the pillar, while staying live for AI/PR.
- **Press Release** -> distributed off-site (wire).

The 2 newsroom posts currently on site: `wesley-chapel-ac-installation-surges-beat-the-heat` (pairs with pillar `rising-heat-residential-ac-installation-wesley-chapel`) and `changing-incentives-energy-costs-ac-replacement-wesley-chapel` (pairs with pillar `ac-replacement-incentives-2026-wesley-chapel`). Both are noindex.

## 5. CONTEXT / BACKGROUND (the SEO problem we are solving)

- **Goal:** improve clicks. GSC shows high impressions but very low CTR (~0.32%, ~4-7 clicks/day, avg position ~20). Root causes: (a) money pages rank on page 2-3, (b) Local Pack eats "near me" clicks, (c) most non-brand clicks blocked. The biggest lever is Google Business Profile (off-site) + getting money pages to page 1 (internal links + content).
- Redirects (www/non-www, root vs /blogs/) are already correct (verified 301s).

## 6. WHAT IS DONE (all pushed to main, live)

See the "Audit Summary (English)" section below.

## 7. WHAT IS NEXT (the user's chosen next work)

**Improve the service pages:**
1. **Roll out the enhanced sidebar** (the `enhanced={true}` prototype on `ac-repair-tampa`) to the other 12 service pages — by setting `enhanced={true}` on each, or making it the ServiceLayout default. Review one first, then apply to all.
2. **Internal linking** — add contextual internal links from service/area pages and high-traffic blogs to the money pages (emergency-ac-repair, ac-repair, ac-maintenance, Wesley Chapel area) to push them from page 2-3 toward page 1. Pages that need links (mostly only link to /contact today): ac-maintenance-tampa, indoor-air-quality-tampa, mini-split-installation-tampa, refrigeration-repair-tampa. Weak blogs needing links: carrier-vs-trane-vs-rheem, seer2-explained, ac-replacement-wesley-chapel-fl.

**Other optional / pending (not critical):**
- Shorten over-length titles/metas: contact (title 76 / meta 173), reviews (meta 173), about-us (title 72).
- Request GSC re-crawl so Google reprocesses the schema fixes + newsroom noindex.
- Google Business Profile optimization (off-site, client side) — highest ROI for "near me" clicks.
- Optional schema polish: unify the two #business nodes (HVACBusiness in Schema.astro + LocalBusiness in ReviewStrip share the same @id; works via merge but could be one node), add datePublished to reviews. Note: self-serving review markup does NOT produce organic star snippets (Google policy) — that is expected, not a bug.

---

## AUDIT SUMMARY (English) — for colleagues

All items below are completed and live on `main` / production.

| # | Issue | Fix |
|---|---|---|
| 1 | Meta robots not explicit | Added `index, follow` meta on all indexable pages + `X-Robots-Tag` header |
| 2 | Image SEO | Added descriptive `title` + improved `alt` on meaningful images |
| 3 | **Fabricated reviews in schema** (initials + fake neighborhood stories, schema-only, not real Google reviews) on 9 area pages | Removed; replaced with 5 real, verifiable Google reviews provided by the owner |
| 4 | **Freshness-faking** ("Updated {today}" auto-generated each build + "verified as of {today}" + frozen "14 hours ago" review dates) | Removed all misleading freshness signals |
| 5 | Schema correctness | Counties now `AdministrativeArea` (were `City`); telephone in E.164; added `paymentAccepted`, `currenciesAccepted`, `hasMap`; removed deprecated `HowTo` schema (Google killed HowTo rich results in 2023) |
| 6 | **Em-dashes everywhere** (1,300+ across titles, metas, content, schema) | Purged sitewide; now zero em-dashes |
| 7 | SEO titles + meta descriptions | Rewrote 25 page titles + metas with CTR hooks (rating, Same-Day, Free Estimate, 0% Financing), keyword-first, under ~58 chars, no em-dashes; reinforced service-page metas with social proof |
| 8 | Heavy / orphaned images | Recompressed 3 large webp + deleted 6 orphaned images (~2 MB saved); hero `ac-not-cooling` 232KB -> 103KB |
| 9 | **Boilerplate FAQ** (all 39 blogs shipped the SAME FAQ + identical FAQPage schema) | Generated unique, content-specific FAQ for every blog (39 sets, ~156 Q&A) in `src/lib/blog-faqs.ts`; each blog now renders + schema-marks its own FAQ |
| 10 | **Content cannibalization** (2 short "newsroom" posts competing with their long-form pillar articles for the same keyword) | Set newsroom posts `noindex` + excluded from sitemap; they stay live for AI engines / journalists, organic ranking consolidates to the pillar |
| 11 | Blog hero images duplicated across posts + 1 broken hero (`.webp.webp`) | Unique hero image per blog + fixed broken filename (earlier sessions) |
| 12 | Careers page low-quality image | Replaced with branded photo + descriptive alt/title |

**What I am working on next:** improving the service pages — rolling out the enhanced sidebar (featured review + Google Business Profile map + expandable internal-link modules) to all service pages, and adding an internal-linking strategy to push the high-impression money pages from page 2-3 toward page 1.

**Verified false positives (rejected during audit):** "Hero has no h1" (it does), "duplicate aggregateRating" (only one exists), "admin pages missing noindex" (they have it). Schema overall is strong and above-average for an HVAC site.
