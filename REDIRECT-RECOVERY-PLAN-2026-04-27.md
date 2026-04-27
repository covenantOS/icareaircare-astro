# Traffic Drop — Root Cause + Fix + Recovery Plan
**Date:** 2026-04-27
**Trigger:** GA4 week of 2026-04-20 → 2026-04-26 vs prior week:
- Sessions **-36.4%** · Users **-30.9%** · Pageviews **-41.3%**
- Engaged sessions **-54%** · Bounce rate **+28%**
- Channel breakdown: `google / organic` -53%, `google / cpc` -84%, direct -25%

---

## Root cause

The Astro rebuild deployed on 2026-04-23 (commit `812f4f8`) only mapped **WordPress** legacy URLs (`/YYYY/MM/DD/slug/`) to the new flat slugs. Three other URL families were left as 404s:

| Source | URL pattern | Evidence | Status before fix |
|---|---|---|---|
| **Squarespace blog** | `/blog/category/{cat}/{numeric-id}[/MM/DD/YYYY]/{slug}` | 10+ distinct URLs surfaced via `site:icareaircare.com` Google search; 4 of them landed real GA4 sessions in the regression week | 404 |
| **WordPress category archives** | `/category/{cat}/`, `/category/{cat}/page/{n}/` | DataForSEO 2026-04-27: `/category/ac-repair/` ranks #97 for "best air conditioning repair near me" (vol **1,600**) | 404 |
| **Lead-form orphan slugs** | `/request-appointment-form`, `/booking`, `/about-us` (no trailing slash variant) | GA4: `/request-appointment-form` took **6 sessions** from Facebook organic-social and 404'd every one | 404 |

Categorically, the rebuild preserved equity for the *current* (WordPress-era) URLs but discarded the equity from two earlier platforms (Squarespace, Duda) that Google's index still references. A typical legacy URL sits in Google's index for **months to years** after a site migration; the long tail keeps trickling in until either the redirect is added or Google fully drops the URL.

Why this only became severe now: the previous WordPress site likely had a default 404 that returned `200 OK` with a WP "page not found" page (common WP misconfig), so Google never saw the URLs as gone. The Astro rebuild correctly returns `404` status — which both stops the traffic *and* tells Google the URL is dead. The drop is a one-time correction; the fix is to route those URLs to the closest live equivalent.

---

## What was fixed

### 1. `public/_redirects` — comprehensive legacy-URL coverage
File grew from 33 lines → **250 lines**. New rule families:

- **§4 Lead-form orphans** — `/request-appointment-form*`, `/request-appointment*`, `/booking*`, `/schedule-service*`, `/schedule*`, `/book-now*`, `/get-quote*`, `/quote*`, `/free-estimate*`, `/estimate*` → `/book/` or `/contact/`. Targets the Facebook-social bleed.
- **§6 WordPress category archives** — 11 specific high-traffic `/category/{topic}/*` patterns route to the closest service page (e.g. `/category/ac-repair/* → /services/ac-repair-tampa/`); fall-through `/category/* → /blogs/`, plus `/tag/* → /blogs/`, `/author/* → /about-us/`, `/page/* → /blogs/`.
- **§7 Squarespace blog URLs** — 14 specific `/blog/category/{topic}/*` patterns mapped (5 topical to service pages, 9 off-topic to `/blogs/`); fall-through `/blog/category/* → /blogs/`, `/blog/* → /blogs/`. The 9 off-topic categories (gardening, plumbing, sustainable-living, etc.) are sent to `/blogs/` rather than killed because they hold long-tail link equity from 2018-era backlinks.
- **§8 Service-area + service-slug variants** — `/service-areas/wesley-chapel/`, `/service-areas/tampa/`, `/ac-repair`, `/ac-installation`, `/ac-maintenance-companies`, `/heat-pump-repair`, `/duct-cleaning`, `/thermostat`, `/iaq`, `/mini-split`, `/refrigeration`, `/24-hour`, plus 30+ more confirmed-orphan slugs from site: search.
- **§8 Duda/WP page slugs** — `/about`, `/team`, `/our-story`, `/why-choose-us`, `/jobs`, `/employment`, `/specials`, `/coupons`, `/promotions`, `/testimonials`, `/customer-reviews`, `/google-reviews`, `/financing-options`.

All redirects are **301 (permanent)** so Google migrates the URL in its index and consolidates link equity to the new destination. Order is significant: more specific rules sit above catch-alls so Netlify/Cloudflare-Pages first-match-wins behavior preserves intent.

### 2. `src/pages/404.astro` — recovery hub
Replaced the previous minimal page (one heading + 6 chip links) with a full-width hub:

- Headline reframed to "We rebuilt our website in April 2026 and a few old links didn't make the trip" — sets honest expectation, eliminates confusion
- Click-to-call button to `(813) 395-2324` and direct Book Online button (Housecall Pro)
- Inline Google site-scoped search (auto-prepends `site:icareaircare.com`)
- 8 quick-chip links (Home, Services, Areas, Blog, About, Contact, Reviews, Financing)
- `<ServiceGrid />` — 8 service cards with hero images
- `<AreaGrid />` — 9 service-area pills + Tampa Bay map
- `<BlogStrip />` — recent blog posts
- `<FinalCTA />` — final call/book CTA
- `noindex` meta retained

Total rendered page size: **155 KB**. Page now meets dwell-time floor expected of any landing page; visitors landing from a stale Google result on an as-yet-uncovered URL still find their way forward instead of bouncing.

---

## Verified by build (2026-04-27 10:30 ET)

```
[build] 65 page(s) built in 3.15s
dist/_redirects = 250 lines (+217 vs prior)
  - 18 /blog/category/* rules (Squarespace)
  - 37 /category/* rules (WordPress)
  - request-appointment-form → /book/ confirmed
dist/404.html = 155 KB
  - All checks passing (headline, phone, search, ServiceGrid,
    AreaGrid, BlogStrip, FinalCTA, noindex, site: scope wrapper)
```

---

## Deploy + recovery timeline

| When | Action | Owner |
|---|---|---|
| **Now** | Commit + push (Cloudflare Pages or Netlify auto-deploys on push) | Will |
| **Within 1 hr post-deploy** | Curl-probe a half-dozen URLs to confirm 301s fire (see test list below) | Will |
| **24 hours post-deploy** | Submit `https://www.icareaircare.com/sitemap-index.xml` again in Bing Webmaster Tools (auto-pings Bing/IndexNow) | Will |
| **48–72 hours** | Use GSC → URL Inspection → "Request indexing" on the 5 highest-value redirected URLs (e.g. `/category/ac-repair/`, `/2025/12/09/wesley-chapel-air-conditioning/`, the top 3 GA4-confirmed Squarespace URLs) | Will |
| **7 days** | Re-pull GA4 — expect organic search to start recovering. Direct + social should recover **immediately** because those depend on a working landing page, not Google's index. | Will + me |
| **30–90 days** | Full ranking recovery on legacy URLs as Google re-crawls and migrates them to the canonical destinations | n/a |

### Test list — paste these into a browser after deploy:
```
https://www.icareaircare.com/blog/category/hvac/5075321/04/28/2021/the-importance-of-surge-protective-devices-for-your-facility    → expect 301 → /blogs/
https://www.icareaircare.com/category/ac-repair/                                                                                → expect 301 → /services/ac-repair-tampa/
https://www.icareaircare.com/request-appointment-form                                                                          → expect 301 → /book/
https://www.icareaircare.com/booking                                                                                            → expect 301 → /book/
https://www.icareaircare.com/service-areas/wesley-chapel/                                                                       → expect 301 → /service-areas/wesley-chapel-ac-repair/
https://www.icareaircare.com/ac-repair                                                                                          → expect 301 → /services/ac-repair-tampa/
https://www.icareaircare.com/2025/12/09/wesley-chapel-air-conditioning/                                                         → expect 301 → /wesley-chapel-air-conditioning/  (still working)
https://www.icareaircare.com/some-completely-fake-page                                                                          → expect 404 with new recovery hub
```

---

## Separate concern surfaced — Paid Search drop

Google CPC sessions fell **51 → 8 (-84%)** between the prior week and the regression week. That magnitude does **not** match the kind of traffic loss redirects cause — it points to one of:
- Campaign paused (manual or budget-exhausted)
- Ad group's landing page disapproved or pending review (one of the URLs the ad sends to may have been a 404 in the rebuild — ads that point to 404s often get auto-disapproved)
- Conversion-tracking misconfig flagged the campaign

**Action:** open Google Ads → check status of all active campaigns + ad-group landing pages. Anything sending traffic to a slug that's now redirected (`/request-appointment-form`, `/booking`, `/our-team`, etc.) needs the destination URL updated to the canonical Astro path. The redirects fixed in this commit will keep clicks from being wasted, but Google's quality-score system penalizes ads pointing at redirect chains, so update the ad destination URLs to the final canonical URLs.

---

## What did NOT change (intentionally)

- Sitemap, robots.txt, schema, canonicals — all clean already per the 2026-04-23 post-deploy audit.
- WordPress catch-all `/:year/:month/:day/:slug/ /:slug/ 301` retained — DataForSEO confirms two URLs in this format are still ranking and the redirect is firing correctly.
- `_redirects` apex-to-www rule retained at top.
- No content edits to any service or service-area page — all the reported on-page issues from the post-deploy audit (alt-text upgrade, blog inbound linking, etc.) are open separately and unrelated to the traffic drop.

---

## Files changed

- `public/_redirects` — 33 → 250 lines
- `src/pages/404.astro` — minimal → full recovery hub
- `.claude/launch.json` — added `astro-preview` config (no behavior change to existing `astro-dev`)
- `REDIRECT-RECOVERY-PLAN-2026-04-27.md` — this file (new)

---

*Built and verified 2026-04-27. No content was changed; only redirect coverage and the 404 page were touched. The rebuild itself remains intact.*
