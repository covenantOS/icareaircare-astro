# Ranked-URLs Audit — 2026-04-21

**Source:** DataForSEO Google ranked-keywords API, top 50 positions, subdomains included.
**Scope:** `icareaircare.com` Google organic rankings (US).
**Result:** 100 keyword rankings across 21 unique URLs.

---

## ✅ URLs still live on the rebuilt site (no action needed)

All of these resolve on the new Astro site and continue to earn their rankings:

| URL | # ranked kws | Top keyword | Top rank |
|---|---:|---|---:|
| `/` | 17 | "i care air care" | #1 |
| `/service-areas/odessa-emergency-ac-repair/` | 18 | "urgent ac" | #14 |
| `/service-areas/air-conditioning-repair-zephyrhills-fl-i-care-air-care/` | 14 | "ac repair in zephyrhills fl" | #22 |
| `/services/air-duct-cleaning-tampa/` | 9 | "air care services" | #11 |
| `/service-areas/wesley-chapel-ac-repair/` | 8 | "complete care air" | #24 |
| `/services/emergency-ac-repair-tampa/` | 5 | "24 hour ac repair tampa" | #14 |
| `/service-areas/pasco-county-ac-repair/` | 5 | "air conditioning repair pasco county" | #25 |
| `/service-areas/new-tampa-heating-and-cooling/` | 4 | "air care pros" | #11 |
| `/service-areas/land-o-lakes-hvac-services/` | 4 | "rainbow lakes heating and air" | #20 |
| `/service-areas/lutz-home-air-conditioning-service/` | 3 | "ac repair lutz fl" | #28 |
| `/wesley-chapel-air-conditioning/` | 2 | "a c repair wesley chapel" | #16 |
| `/service-areas/polk-county-residential-ac-repair/` | 2 | "polk air conditioning & heating" | #33 |
| `/services/ac-repair-tampa/` | 1 | "emergency ac repair tampa fl" | #21 |
| `/contact/` | 1 | "icare air purifier" | #24 |
| `/services/hvac-installation-tampa/` | 1 | "hvac installation tampa" | #27 |
| `/services/heating-services-tampa/` | 1 | "tampa heating repair" | #30 |
| `/services/ac-maintenance-tampa/` | 1 | "ac care" | #33 |
| `/ac-repair-wesley-chapel-fl/` | 1 | "wesley chapel ac repair" | #35 |

---

## 🔁 Legacy URLs — 301 redirects added

These were WordPress date-based permalinks from the old site, still earning rankings. The Astro rebuild uses flat slugs, so these URLs would have 404'd without redirects.

| Legacy URL | Redirect to | Keyword / rank / volume |
|---|---|---|
| `/2026/02/11/air-duct-cleaning-in-wesley-chapel-fl-what-you-need-to-know/` | `/air-duct-cleaning-wesley-chapel/` | "air duct cleaning wesley chapel" / #13 / 40 |
| `/2025/12/09/wesley-chapel-air-conditioning/` | `/wesley-chapel-air-conditioning/` | "ac repair in wesley chapel" / #17 / 480 |
| `/2025/03/31/air-filter-change-frequency/` | `/air-filter-change-frequency/` | "air filter change frequency" / #31 / 170 |

Plus a catch-all `/:year/:month/:day/:slug/ /:slug/ 301` pattern so any other WordPress date-formatted URLs we didn't see in the top 50 still funnel to the flat-slug equivalent.

All redirects added to `public/_redirects`.

---

## Biggest ranking concentrations (keep an eye on these)

1. **Odessa** page carries the bulk of "urgent / 24-hour AC repair" keyword rankings (18 kws) — do NOT change its URL or meta.
2. **Homepage** ranks #1 for "i care air care" (brand query) — stable.
3. **Zephyrhills** area page owns the Zephyrhills AC repair cluster (14 kws, mostly ranks 22–29 — ripe for improvement).
4. **Duct cleaning** service page ranks #11 for "air care services" (vol 480) — valuable, small push could crack top 10.

---

## Gaps / opportunities surfaced

- Most rankings cluster in positions 20–40. **Moving top-of-funnel** (boost to top 10) would be higher-impact than chasing long-tail new terms.
- "24/7 ac repair near me" (880/mo) and "emergency a c repair near me" (6,600/mo) both rank #28 on `/service-areas/odessa-emergency-ac-repair/`. We do NOT actually offer 24/7, so these rankings will have high bounce. Either reposition the page as "urgent after-hours HVAC (during emergencies)" or accept the bounce.
- "wesley chapel ac repair" (vol 480) rank #35 on `/ac-repair-wesley-chapel-fl/` — this page was recently rewritten and should be monitored for movement.
- Zephyrhills kw cluster ranks #22–29 consistently — single-digit improvement possible via the rewritten body + new byline/schema.
