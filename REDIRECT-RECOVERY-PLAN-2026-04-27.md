# Traffic Drop — Root Cause + Fix + Recovery Plan
**Date:** 2026-04-27
**Final commit:** `37458b6` (after 3 iteration commits: `34c9645`, `6a975ed`, `1e222ef`, `37458b6`)
**Trigger:** GA4 week of 2026-04-20 → 2026-04-26 vs prior week:
- Sessions **-36.4%** · Users **-30.9%** · Pageviews **-41.3%**
- Engaged sessions **-54%** · Bounce rate **+28%**
- Channel breakdown: `google / organic` -53%, `google / cpc` -84%, direct -25%

---

## Root cause

The Astro rebuild deployed on 2026-04-23 only mapped **WordPress** legacy URLs (`/YYYY/MM/DD/slug/`). Three other URL families — from prior platforms still in Google's index — were left as 404s:

| Source | URL pattern | Evidence | Status before fix |
|---|---|---|---|
| **Squarespace blog** | `/blog/category/{cat}/{numeric-id}[/MM/DD/YYYY]/{slug}` | 10+ distinct URLs surfaced via `site:icareaircare.com` Google search; 4 of them landed real GA4 sessions in the regression week | 404 |
| **WordPress category archives** | `/category/{cat}/`, `/category/{cat}/page/{n}/` | DataForSEO 2026-04-27: `/category/ac-repair/` ranks #97 for "best air conditioning repair near me" (vol **1,600**) | 404 |
| **Lead-form orphan slugs** | `/request-appointment-form`, `/booking`, `/about/`, `/service-areas/wesley-chapel/` | GA4: `/request-appointment-form` took **6 sessions** from Facebook organic-social and 404'd every one | 404 |

Categorically, the rebuild preserved equity for the *current* (WordPress-era) URLs but discarded the equity from two earlier platforms (Squarespace, Duda) that Google's index still references. A typical legacy URL sits in Google's index for **months to years** after a site migration; the long tail keeps trickling in until either the redirect is added or Google fully drops the URL.

Why this only became severe now: the previous WordPress site likely had a default 404 that returned `200 OK` with a WP "page not found" page (common WP misconfig), so Google never saw the URLs as gone. The Astro rebuild correctly returns `404` status — which both stops the traffic *and* tells Google the URL is dead. The drop is a one-time correction; the fix is to route those URLs to the closest live equivalent.

---

## What was fixed (final iterated state)

### `public/_redirects` — 116 rules
Final structure (in order; rules listed first take precedence):

1. **Apex → www** canonical (1 rule)
2. **Lead-form orphans** (12 rules) — `/request-appointment-form*`, `/booking*`, `/schedule*`, `/quote`, `/get-quote`, `/free-estimate`, plus trailing-slash variants
3. **WordPress category archives** (29 rules) — 11 specific high-value categories (`/category/ac-repair/* → /services/ac-repair-tampa/` etc.), plus catch-alls `/category/*`, `/tag/*`, `/author/*`
4. **Squarespace blog URLs** (6 rules) — 3 topical category mappings (heating, duct cleaning, IAQ) plus `/blog/category/* → /blogs/` catch-all and `/blog*` hub redirects
5. **Existing site-internal slug consolidations** (10 rules) — `/our-team*`, `/contact-us*`, `/hvac-services`, `/service-area`, plus the 3 keyword-cannibalization consolidations
6. **Service-area orphan variants** (10 rules) — both no-slash and slash forms for all 5 short-form variants Google indexed
7. **Service-slug orphans** (23 rules) — `/ac-repair`, `/ac-maintenance`, `/heat-pump`, `/duct-cleaning`, `/iaq`, `/mini-split`, `/refrigeration`, `/24-hour`, etc. (all evidence-based)
8. **Common Duda/WP page slugs** (14 rules) — `/about*`, `/team*`, `/jobs*`, `/specials`, `/coupons`, `/testimonials`, `/customer-reviews`, `/google-reviews`, `/financing-options`
9. **WordPress date-permalinks** (10 rules) — 3 specific high-value rankings + year-prefixed catch-alls for 2020–2026 (replaces a generic `/:year/:month/:day/:slug/` rule that previously matched `/category/.../page/2/` greedily)
10. **Safety net** (1 rule) — `/blogs/:slug/ → /:slug/` for any old internal links

All redirects are **301 (permanent)**. File order is significant on Cloudflare Pages — empirical testing showed CF Pages stops processing rules around #120, so the file is intentionally trimmed below that ceiling and ordered by impact.

### `src/pages/our-team.astro` — deleted
Was using `Astro.redirect()` which generates a `<meta http-equiv="refresh">` HTML page. Google may not honor meta-refresh as a permanent redirect. Replaced with explicit `/our-team/ /about-us/#team 301` in `_redirects`, which now returns a true HTTP 301 response (verified via curl, see test report below).

### `astro.config.mjs` — sitemap filter cleaned up
Removed the `!page.includes('/our-team/')` filter line (no longer needed since the page no longer generates).

### `src/pages/404.astro` — recovery hub
Replaced the previous minimal page with a full-width hub:
- Headline reframed: "We rebuilt our website in April 2026 and a few old links didn't make the trip"
- Click-to-call to (813) 395-2324 + Book Online button
- Inline Google site-scoped search (auto-prepends `site:icareaircare.com`)
- 8 quick-chip links + `<ServiceGrid />` + `<AreaGrid />` + `<BlogStrip />` + `<FinalCTA />`
- `noindex` meta retained
- Final rendered page: 155 KB

---

## Test results (live, post-deploy)

### Curl-tested 53 URLs against the live site at 11:17 ET 2026-04-27. **53/53 pass.**

#### Group A: Trailing-slash variants — 13/13 OK
`/about/`, `/team/`, `/jobs/`, `/request-appointment-form/`, `/booking/`, `/schedule/`, `/our-team/`, `/contact-us/`, plus all 5 `/service-areas/{wesley-chapel,tampa,pasco,polk,hillsborough}/` — all return HTTP 301 to the correct destination.

#### Group B: Previously-passing URLs — 9/9 OK (no regressions)
`/iaq`, `/heat-pump`, `/ac-repair`, `/24-hour`, `/category/ac-repair/`, `/category/ac-maintenance/page/2/`, the Squarespace `/blog/category/hvac/.../surge-protective-devices` URL, plus the 2 evidence-based WordPress date-permalinks — all still 301 correctly.

#### Group C: Live pages — 24/24 OK
Every service page, service-area page, supporting page (`/about-us/`, `/contact/`, `/book/`, `/blogs/`, `/reviews/`, `/financing/`, `/careers/`), and the 2 root-level blog posts return HTTP 200.

#### Group D: SEO infra — 5/5 OK
`/sitemap-index.xml`, `/sitemap-0.xml`, `/robots.txt`, `/llms.txt`, `/rss.xml` all return HTTP 200. Sitemap contains **59 URLs** (none reference the deleted `/our-team/`).

#### Group E: New 404 hub — 2/2 OK
Truly fake URLs (`/totally-fake-page-xyz`, `/this/does/not/exist`) return HTTP 404 with the new hub markers (`404 · Page moved`, `We couldn't find that page`, `Search the site`).

### Notes on multi-hop chains
Apex domain visits create a 2-redirect chain: `icareaircare.com/iaq → www.icareaircare.com/iaq → www.icareaircare.com/services/indoor-air-quality-tampa/`. Google handles up to 5 hops in a chain and preserves PageRank through them, so this is acceptable.

---

## Known docs that are now stale (low priority)

- `CLAUDE.md` line in directory cheatsheet says `our-team.astro (301→/about-us/#team)` — that file is now deleted; the redirect lives in `_redirects` instead. Update on next CLAUDE.md pass.

---

## Deploy + recovery timeline

| When | Action | Owner |
|---|---|---|
| ✅ Done | Commit + push (Cloudflare Pages auto-deploys) | Me |
| ✅ Done | Verify all critical URL families with curl (53/53 pass) | Me |
| **Within 24 hours** | Submit `https://www.icareaircare.com/sitemap-index.xml` again in Bing Webmaster Tools (auto-pings IndexNow) | Will |
| **48–72 hours** | In GSC, use URL Inspection → "Request indexing" on the 5 highest-value redirected URLs:<br>· `/category/ac-repair/`<br>· `/2025/12/09/wesley-chapel-air-conditioning/`<br>· top 3 GA4-confirmed Squarespace URLs (e.g. `/blog/category/hvac/5075321/04/28/2021/the-importance-of-surge-protective-devices-for-your-facility`) | Will |
| **7 days** | Re-pull GA4 — direct + social should recover **immediately** (those depend on a working landing page, not Google's index). Organic search starts recovering within the week. | Will + me |
| **30–90 days** | Full ranking recovery on legacy URLs as Google re-crawls and migrates them to the canonical destinations | n/a |

### Curl-tested URL list (run again any time to verify):
```
https://www.icareaircare.com/category/ac-repair/                            → /services/ac-repair-tampa/
https://www.icareaircare.com/category/ac-maintenance/page/2/                → /services/ac-maintenance-tampa/
https://www.icareaircare.com/blog/category/hvac/5075321/04/28/2021/...      → /blogs/
https://www.icareaircare.com/request-appointment-form                       → /book/
https://www.icareaircare.com/request-appointment-form/                      → /book/
https://www.icareaircare.com/booking                                        → /book/
https://www.icareaircare.com/service-areas/wesley-chapel/                   → /service-areas/wesley-chapel-ac-repair/
https://www.icareaircare.com/about/                                         → /about-us/
https://www.icareaircare.com/our-team/                                      → /about-us/#team
https://www.icareaircare.com/iaq                                            → /services/indoor-air-quality-tampa/
https://www.icareaircare.com/2025/12/09/wesley-chapel-air-conditioning/     → /wesley-chapel-air-conditioning/
https://www.icareaircare.com/some-completely-fake-page                      → 404 with new recovery hub
```

---

## Separate concern still open — Paid Search drop (-84%)

Google CPC sessions fell 51 → 8 between the prior week and the regression week. That magnitude does **not** match the kind of traffic loss redirects cause. The redirects fixed in this commit will keep ad clicks from being wasted on 404s, but Google's quality-score system penalizes ads pointing at redirect chains, so:

**Action for the user:** open Google Ads → confirm campaigns are active and budget is healthy → update each ad-group's destination URL to the **final canonical Astro path** (e.g. `/services/ac-repair-tampa/`, not `/ac-repair`, not `/services/ac-repair-tampa` without trailing slash). Even with the redirects in place, sending ad traffic through a 301 hurts quality score over time.

---

## Iteration log

| Commit | Change | Lines | Result |
|---|---|---:|---|
| `34c9645` | Initial _redirects + 404 hub | 250 | Many redirects fired but `/category/.../page/2/` greedy-matched WP date catch-all |
| `6a975ed` | Year-prefixed date catch-all + reorganized | 216 | Date bug fixed; CF Pages soft cap dropped some §8/§9 rules |
| `1e222ef` | Trim duplicates → 103 rules | 135 | Discovered CF Pages does NOT auto-normalize trailing slashes |
| `37458b6` | Add slash variants + delete `our-team.astro` | 116 | **All 53 URLs pass live curl tests** |

---

## Files changed (final state)

- `public/_redirects` — 33 → 116 rules (250 → 135 line file size after compaction)
- `src/pages/404.astro` — minimal → full recovery hub (155 KB rendered)
- `src/pages/our-team.astro` — **deleted**
- `astro.config.mjs` — removed redundant `/our-team/` sitemap-filter line
- `.claude/launch.json` — added `astro-preview` config alongside `astro-dev`
- `REDIRECT-RECOVERY-PLAN-2026-04-27.md` — this file (new)

---

*Generated 2026-04-27. Builds verified locally; redirects verified live on `www.icareaircare.com` after CF Pages deploy. No content was changed; only redirect coverage and the 404 page were touched.*
