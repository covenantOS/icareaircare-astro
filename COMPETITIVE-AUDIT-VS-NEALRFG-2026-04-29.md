# Competitive Audit — icareaircare.com vs nealrfg.com (Stryker Agency build)
**Date:** 2026-04-29
**Why this site:** Same agency (Stryker Digital Marketing) that built nealhvac.com — different industry (roofing/waterproofing in Palm Beach County), different stack (Next.js + Netlify vs WordPress + Hostinger). Goal: extract patterns Stryker uses across clients that ICAC could copy.

---

## Tech stack comparison

| | **icareaircare.com** | **nealrfg.com** |
|---|---|---|
| Framework | Astro 5 (static) | **Next.js** (React, static export) |
| Hosting / CDN | Cloudflare Pages | **Netlify** (Edge cache) |
| HSTS | preload, 1y | yes, 1y |
| Sitemap format | sitemap-index → 0 | flat `/sitemap.xml` |
| Total indexable URLs | 59 | **225** |
| Generator visible | (hand-rolled head) | (none — Next-built) |
| Industry schema subtype | `HVACBusiness` | `RoofingContractor` |

Stryker uses different stacks per client (WordPress for nealhvac, Next.js for nealrfg). Means: they're not platform-locked — they pick the stack that matches the engagement. Both end up with similar content patterns regardless of stack. ICAC's Astro is in the same "modern static" lineage as Next.js — measurably faster than WordPress.

---

## Volumetric comparison

| Dimension | ICAC | Nealrfg | Winner |
|---|---:|---:|:---:|
| Indexable URLs | 59 | **225** | nealrfg (3.8×) |
| Service pages | 13 | ~6 (Roofing×6) | ICAC |
| Service-area pages | 10 | ~10 city pages | tie |
| **Blog / content marketing** | **28** | likely 0 visible from sitemap, mostly long-tail city × service combos | ICAC |
| Homepage body word count | **2,611** | 1,590 | ICAC has more (so user's "more home content" hunch is *raw count* — but quality patterns differ; see below) |
| Homepage `<h2>` count | 15 | 8 | ICAC |
| Homepage internal links | 142 | 81 | ICAC |
| Homepage YouTube embeds | 0 | 5 | nealrfg |
| Homepage Instagram embeds | 0 | 16 (live feed) | nealrfg |
| Schema `@type` distinct | 21+ | 9 | ICAC |
| Ranked organic keywords (DataForSEO) | 149 | 149 (tie) | tie |
| Top-10 organic positions | 1 | **8** | nealrfg (more concentrated wins) |
| ETV (estimated traffic value) | $220 | **$1,098** | nealrfg (higher-CPC industry) |
| Estimated paid-traffic-cost equiv. | $7,745 | **$23,808** | nealrfg |

**Read:** ICAC has more raw URLs of high-quality content (the 28 blog posts vs nealrfg's near-zero blog). Nealrfg dominates with 225 URLs that are mostly **city × service** programmatic combinations, plus they outrank ICAC on top-10 generic terms in their market. Different SEO games — neither is wrong; different content strategies.

---

## What Stryker does on nealrfg that ICAC doesn't (and the user CAN action)

### 🔴 1. "As Seen On" media-logo band
Nealrfg displays Palm Beach Post, WPBF News (TV), and Miami Herald logos in a dedicated section above the fold. ICAC has zero media-feature display.

**Action:** Find any local Tampa/Wesley Chapel media features (Tampa Bay Times feature, Bay News 9 segment, Tampa Bay Magazine "Best of," Wesley Chapel Patch / 813 Area Magazine mention, Best of Pasco 2024/2025/2026 listing, BBB Torch nominee press, etc.). Even one logo creates the "as featured on" trust signal. If you have nothing, this is one to push for proactively — local PR for an HVAC contractor with 700+ reviews + 16 years is reachable.

### 🔴 2. Awards section with year-stamped credentials
Nealrfg displays: *"2026 Community Choice Awards Palm Beach County Winner"* and *"Chamber of Commerce of the Palm Beaches Community Partner 2026"* — both with the year visible. Recency = trust.

**Action:** Add a footer or homepage strip for any current Tampa awards: BBB A+, Angi Super Service, HomeAdvisor Top Rated, Best of Wesley Chapel, Pasco Chamber membership year. ICAC already has BBB and Angi profiles in `externalProfiles` — display the badges visually, not just in `sameAs`.

### 🟠 3. Concrete annual volume claim
*"Serving over 2000 customers per year"* — a specific operating-scale stat. Plus *"99.9% satisfaction rate"*.

**Action:** Add an annual-volume number to the homepage hero or trust strip. Examples:
- "2,500+ Tampa Bay homes serviced annually"
- "Since 2010, more than 12,000 service calls completed"
- "98% of repairs completed in one visit"

The number doesn't have to be 2,000 — it just has to be a *specific* operational stat beyond review count. Pulling from Housecall Pro's job count would make this defensible.

### 🟠 4. "#1 spender with local supplier" — proprietary moat statement
*"#1 spender with local supplier"* → resolved into *"faster material availability"*. It's a specific, hard-to-fake competitive moat.

**Action:** Find ICAC's equivalent. Possibilities:
- "Largest Rheem Pro Partner in Pasco County"
- "Top 5% Carrier dealer by Tampa Bay volume" (if true; needs verification with Carrier rep)
- "Stocking dealer — every truck carries 80+ unique SKUs" (operational detail)
- "Direct wholesale relationships with 4 distributors → parts on truck, not next-day"

The pattern: a specific, verifiable claim about your supply chain that competitors can't match.

### 🟠 5. Headline-paired "dual badge" hero
Nealrfg's hero pairs *"4.9★ · 800+ customers"* with *"50-YEAR PRODUCT WARRANTIES"* as a single visual unit, then repeats this dual badge 4× through the page.

**Action:** ICAC already has the components — repackage them as a dual badge:
- **Badge A**: "4.9★ · 700+ Google reviews"
- **Badge B**: "10-Year Manufacturer Warranty + 1-Year Workmanship"  *(or)*  "Florida CAC1822037 · 16+ years"  *(or)*  "Rheem Pro Partner — Tampa Bay's Authorized Dealer"

Display together, repeat through page (hero, mid-page, FAQ section, before CTA). The repetition is the point — Stryker is teaching Google + visitors what to associate with the brand.

### 🟡 6. Instagram live-feed embed
*"Discover Our Roofing Work"* with live IG embed (16 references in HTML). Recency signal + visual social proof + Google indexing of fresh image content.

**Action:** Only if ICAC has an active Instagram with regular posts (truck shots, install before/afters, team photos). Skip if posting cadence is < 1/week — empty feed is worse than no feed.

### 🟡 7. `OfferCatalog` schema wrapping `Service` items
Nealrfg's schema:
```json
{ "@type": "Service", "hasOfferCatalog": { "@type": "OfferCatalog", "itemListElement": [ ... { "@type": "Offer", "itemOffered": { "@type": "Service", ... } } ] } }
```
ICAC's current schema (in `Schema.astro`):
```json
{ "makesOffer": [ { "@type": "Offer", "itemOffered": { "@type": "Service", ... } } ] }
```

**Action:** Trivial schema upgrade. Wrap the existing `makesOffer` array in an `OfferCatalog`. Same data, more idiomatic structure. Google Search Console may surface richer service info as a result. ~10 lines of change in `src/components/Schema.astro`.

### 🟡 8. "Real-time tracking" CRO copy
*"You can track your progress in real time"* → leverages Housecall Pro's customer-facing tracking. Stryker is *messaging* the technology as a moat.

**Action:** ICAC already books through Housecall Pro (`bookUrl` in `SITE`). Add copy to homepage and service pages:
- "Track your tech to your driveway in real time"
- "SMS updates the morning of your appointment"
- Pair with a screenshot of the Housecall Pro tracking UI for visual proof

This is FREE — the capability already exists, you just don't message it.

### 🟢 9. Dedicated "Roof Types" comparison content
Nealrfg has separate landing pages for shingle, metal, tile roofing — a material-comparison content cluster (these likely contribute to the 225-URL count). Stryker programmatically generates these for long-tail discovery.

**Action equivalent for ICAC:**
- `/services/heat-pump-vs-traditional-ac-tampa/`
- `/services/carrier-vs-trane-vs-rheem-tampa-comparison/`
- `/services/manual-j-load-calculation-tampa/`
- `/services/seer2-rating-explained-florida-2026/`

These rank for "X vs Y" and informational queries that ICAC's blog touches but doesn't have dedicated landing pages for. Programmatic SEO win. Medium effort (1 page each, 3-4 hours).

---

## What ICAC does that nealrfg does NOT (don't lose these)

| ICAC strength | Why it matters |
|---|---|
| **28 published blog posts** with Article + Speakable + (now) HowTo schema, Tim Hawk byline, dates | Nealrfg has near-zero blog content. ICAC owns long-tail informational queries Stryker isn't going after. |
| **Per-area geo iframes** (just shipped) | Pasco/Lutz/Polk pages map to area centroid, not HQ |
| **8 third-party sameAs** (Google, Yelp, BBB, Facebook, Rheem, Angi, HomeAdvisor, Manta) | Nealrfg has just Google + IG; ICAC's entity reconciliation is much stronger |
| **HowTo schema** on procedural blog posts | Rich results for "how to" queries; nealrfg has none |
| **Speakable schema** on every page | Voice/AI assistant readout eligibility |
| **Pricing transparency** ($150–$600 typical, $99 tune-up, etc.) | Nealrfg shows zero dollar amounts; ICAC builds trust through specificity |
| **Verbatim local Reviews schema** on area pages with neighborhood + reviewer name | Stronger E-E-A-T than nealrfg's testimonial carousel |
| **Tim Hawk individual `Person` schema** + `/tim-hawk/` author page (shipped today) | Nealrfg has founders' names but no Person entity — ICAC's E-E-A-T is sharper |
| **Chat + Call floating widgets** (shipped today) | Both tracked via GTM; nealrfg has neither |
| **Manufacturer dealer status displayed** (Rheem Pro Partner, 8 brand mentions) | Nealrfg doesn't display any manufacturer authorizations |
| **Booking widget embedded** (Housecall Pro) | Nealrfg has form-only |
| **License # displayed prominently** (CAC1822037) | Nealrfg displays CCC1332869 too — tie. Both winning here. |

---

## Things ICAC has weaker than nealrfg (separate from the recommendations above)

- **Top-10 SERP positions:** ICAC has 1; nealrfg has 8. They've concentrated link/content power on a tighter keyword set. ICAC's 149 keywords are more spread across 11–50. Implication: invest in a few high-volume head terms (already covered in `RANKED-URLS-AUDIT-2026-04-21.md` — "ac repair tampa", "wesley chapel hvac" etc.). The Stryker pattern is to write *fewer, deeper, more linked-up* pages.
- **Brand-term ETV:** nealrfg's brand search "neal roofing" gets 1,900 monthly volume — they've built brand demand. ICAC's "i care air care" probably has lower monthly volume. Building brand search demand happens via offline (radio, billboard, vehicle wraps) more than SEO.

---

## Things the user already noted as not-now / not-applicable (skipped from recommendations)

- ❌ **Video content** — Tim isn't on camera yet; revisit when ready (would feed VideoObject schema + AI-citation surface)
- ❌ **Customer map** — interactive map drives users off-page; ICAC's sitewide service-areas map already covers the SEO benefit
- ❌ **NATE certification** — ICAC techs aren't NATE-certified (per Will, 2026-04-29)
- ❌ **Synchrony embed widget** — not available per Will / Synchrony partner program

---

## Recommended action order (next 2 weeks)

| Priority | Item | Effort |
|---|---|---|
| 1 | **Add annual volume + satisfaction stat** to hero trust strip ("X,000+ Tampa Bay homes serviced") — pull number from Housecall Pro | 30 min |
| 2 | **Find one local award/feature** to display ("Best of Pasco 2026", BBB Torch nominee, Angi Super Service Award year, Tampa Chamber member) — one badge on homepage hero | 30 min owner side, 30 min implement |
| 3 | **"Real-time tracking" copy** on homepage + service pages — messages Housecall Pro capability as a moat | 30 min |
| 4 | **`OfferCatalog` schema wrap** in `Schema.astro` makesOffer | 15 min |
| 5 | **Dual-badge hero** — pair "4.9★ · 700+ reviews" with "Rheem Pro Partner" or "16 yrs · CAC1822037" as a single visual unit, repeat 3× through page | 1 hour |
| 6 | **Find proprietary moat statement** — pick ONE: "Tampa Bay's #X Rheem dealer," "80+ SKUs on every truck," "Direct wholesale = parts today, not next week" | Owner conversation; 30 min implement |
| 7 | **"As seen on" band** — only ship if Tim has any media features. Otherwise schedule press push (separate workstream) | gated on owner side |
| 8 | **Equipment-comparison landing pages** (heat-pump vs AC, Carrier vs Trane vs Rheem) — programmatic SEO | 3-4 hrs each, 1 page/day |
| 9 | **Instagram embed** — gated on whether the IG feed is currently active with weekly+ posts | Owner check |

Items 1-4 are 100% mine to implement and can ship today if you say go. Items 5-6 need 5 minutes of your input first (which stat, which moat). Items 7-9 are gated on external info or owner work.

---

## Cross-client agency pattern (Stryker)

Both Stryker builds (nealhvac on WordPress, nealrfg on Next.js) share these signature moves:
- **Heavy CTA repetition** — "Free Quote" or "Free Estimate" 4× per page
- **Dual-badge hero** — one rating + one warranty/tenure badge
- **Tight area focus** — one county/region, deep city pages
- **Location-keyworded image filenames**
- **Industry-specific schema subtype** (HVACBusiness / RoofingContractor)
- **Yoast-style or Next-default SEO** (titles, meta, sitemap)
- **No blog presence on the cheap-tier client (nealhvac); some on the higher-tier (nealrfg)**

What they don't do consistently:
- Pricing transparency
- Manufacturer dealer badges
- 28-post blog libraries
- HowTo / Speakable / Review schema at ICAC's depth
- Per-area centered map iframes

ICAC's build is genuinely beating Stryker's nealhvac on every measurable dimension and is roughly tied with nealrfg overall — winning on schema + content depth, losing on top-10 SERP concentration + concrete operating-scale stats + media features.

---

*Generated 2026-04-29. Live data captured this session: nealrfg.com homepage, sitemap.xml, robots.txt; DataForSEO ranked-keywords + domain-rank-overview for both targets. ICAC homepage source via repo; remote already includes /tim-hawk/ + externalProfiles + TrustBadgeStrip.*
