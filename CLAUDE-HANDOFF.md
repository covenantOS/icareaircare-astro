# I Care Air Care - Claude Session Handoff

> **Purpose:** everything a new Claude Code session needs to continue this project with full context.
> **How to use:** on a new machine, clone the repo and tell Claude: *"Read CLAUDE-HANDOFF.md and continue the ICAC project."*
> **Last updated:** 2026-07-17 (after Week-1 technical SEO package shipped + cost-guide pillar drafted)

---

## 1. Project access

| Item | Value |
|---|---|
| Client | I Care Air Care (ICAC) - HVAC contractor, Wesley Chapel / Tampa Bay, FL |
| Production site | https://www.icareaircare.com |
| Repo | `covenantOS/icareaircare-astro` (private, via `gh` CLI, account `kevinservicelinepro`) |
| Local path (old machine) | `C:\Users\NW\Documents\claude\eye care\icareaircare-astro` |
| Stack | Astro 6 (static) + Tailwind CSS v4 + Cloudflare Pages |
| Backend | Cloudflare Pages Functions in `functions/` (D1 + KV): KPI dashboard, lead forms |
| Build | `npm run build` (~86 pages) · Dev: `npm run dev` |
| Deploy | Push to `main` = auto-deploy to production via Cloudflare Pages |
| Owner | Tim Hawk · Florida license CAC1816515 · (813) 395-2324 |

---

## 2. Working rules (IMPORTANT - these are standing authorizations)

1. **Branch vs main:**
   - **BIG changes** (new content, new pages, rewriting sections) → work on a **BRANCH**, show the user, push only after explicit OK.
   - **SMALL / technical changes** (minor tweaks, schema, meta, technical fixes) → may go **directly to `main`**.
   - **Never push to main without the user's explicit approval.**
2. **ALWAYS `git fetch` + check divergence before any push.** A colleague (Tim's internal dev) also pushes to `main` (admin dashboard, KPI, newsroom). Integrate `origin/main` first. Never force-push, never clobber their commits.
3. **ZERO em-dashes anywhere** (titles, metas, content, schema, comments). The client treats `—` as an AI-writing tell. Use hyphens, commas, or `|`. The middot `·` is allowed.
4. **Never invent marketing claims.** Only site-supported facts: 4.9★ / 700+ Google reviews, license CAC1816515, 1-year workmanship warranty, same-day *when available*, 0% Synchrony financing. **"24/7" is NOT true - never use it.**
5. **Show official content / pricing / review changes to the user before applying.**
6. **Pricing:** do not publish ICAC-specific prices without Tim's confirmation. Cited industry ranges (with sources) are acceptable.
7. Git identity on the old machine was missing; repo-local config was set to `kevinservicelinepro`.

---

## 3. Current state: what is LIVE on main

**Foundation (shipped Apr-Jun 2026):**
- Full SEO/schema audit: removed fabricated reviews (replaced with 5 real Google reviews), removed freshness-faking dates, schema corrections, purged 1,300+ em-dashes, rewrote 25 titles/metas, image optimization.
- Unique per-blog FAQ (`src/lib/blog-faqs.ts`) + FAQPage schema on every post.
- Lead pipeline: forms → spam guard → GoHighLevel CRM webhook → email fallback (`functions/api/lead.ts`).
- E-E-A-T: `/tim-hawk/` author page, Person schema with license + EPA, 9 third-party `sameAs` profiles, trust badge strip.
- Technical: canonical www 301, all legacy 404s redirected, Lighthouse 100/100, full schema `@graph`, llms.txt, RSS.

**All 13 service pages rebuilt (Jun 11, commit `1219357`):** 1,200+ words pure prose, ~15 internal links spread naturally, bullet organization, enhanced sidebar (TrustBar / ReviewQuote / OwnerTip / InContentCTA / FinancingCTA), rotating distinct-blog carousel, cannibalization resolved, FAQs + schema, metas ≤160 chars.

**2 pillar articles + 2 newsroom companions (Jun 24, commit `13761b0`):**
- Pillars (index, follow, in sitemap): `how-to-choose-safe-ac-repair-company`, `refrigerant-phase-out-ac-repair-wesley-chapel`
- Newsroom (noindex, nofollow, excluded from sitemap): `ac-repair-company-wesley-chapel-summer-risks`, `refrigerant-crisis-ac-repair-wesley-chapel`

**Week-1 technical SEO package (Jul 15, commit `3337ef0`):**
- Homepage retitled → `I Care Air Care | AC Repair & HVAC - Wesley Chapel, FL` (kills cannibalization with the Wesley Chapel area page, which now owns "Wesley Chapel AC repair").
- Wesley Chapel area meta trimmed 181 → 144 chars.
- Sidebar blog-carousel titles `h3` → `p` (duplicate heading markup fixed).
- Emergency page: title + 4.9★, H1 changed "Urgent" → **"Emergency"**.
- Contextual `Emergency AC repair in {city}` anchor added to all 9 area pages (`ServiceAreaLayout.astro`).

---

## 4. Branches (all pushed to origin as of 2026-07-17)

| Branch | Contents | Status |
|---|---|---|
| `main` | Everything above | LIVE |
| `feat/blog-ac-replacement-cost-guide` | **Cost-guide pillar (#7) - awaiting user review** | Pushed, NOT merged |
| `seo-audit-onpage-2026` | External-audit low-risk fixes (heading hierarchy, cookie policy page, blog internal links) | Pushed, awaiting client review |
| `feat/dos-blogs-nuevos` | 2 older client-doc blogs | Pushed, historical |
| `feat/ac-repair-tampa-upgrade`, `feat/blog-ac-repair-company-summer`, `fix/week1-technical-seo` | Already merged into main | Safe to delete |

---

## 5. ROADMAP - what to do next

The plan comes from the boss's `ICAC-SEO-Action-Plan-2026-07.xlsx` (verified real - see section 6).

### #7 · Cost-guide pillar - DRAFTED, awaiting review
`src/content/blog/hvac-replacement-cost-tampa-bay.md` on branch `feat/blog-ac-replacement-cost-guide`.
Targets the "ac replacement cost" cluster (9,900/mo US, difficulty 15-26 = easy). Uses **cited industry ranges only** (Florida PACE, Carrier, Bryant, Lowe's, Grande Aire) because ICAC pricing is unconfirmed. 2 price tables, 4 library images, FAQ + schema, links to `ac-replacement-tampa` + `financing`.
**Next:** user reviews → push to main.

### #8 · Troubleshooting pillars (not started)
Same process as #7 (research with DataForSEO → outline → approve → write → publish):
- `why-is-my-ac-not-cooling` (10,200/mo) - **consolidate existing thin posts into ONE pillar**
- `ac-contactor-failure-signs` (9,900/mo)
- `how-to-tell-if-ac-fuse-is-blown` (6,000/mo)
All CTA → `/services/ac-repair-tampa/`.

### #9 · Strengthen ring area pages (not started)
- **New Tampa** = highest priority (we serve it but are organically invisible at its centroid). Add unique neighborhood content (Tampa Palms, K-Bar Ranch, Hunter's Green) + local proof + internal links.
- **Lutz** (already improved to position 9.9, entered page 1 - push further), **Land O' Lakes**.

### #10 · Consolidate / 301 dead thin blogs (not started)
Merge and redirect: `ac-repair-wesley-chapel-fl` (pos ~51-64), `ac-replacement-wesley-chapel-fl` (pos ~70), 3 preventive-maintenance-plan posts. Thin duplicates bleed relevance from the owner pages.

### Client decisions still pending (blocking scope)
- Dryer vent cleaning: in or out of scope? (170/mo Pasco, 1,000 DMA)
- New `/services/mini-split-repair` page? (880/mo cluster Del-Air owns)
- Chamber of Commerce membership, media outreach (Qwoted, tampasbest.com)

### User's manual tasks (not code)
- GSC "Request Indexing" after each deploy for changed pages.
- The 9 citations: superpages, mapquest, chamberofcommerce, realreviews, zoominfo, n49, serviceatlas, hvacrecord, hvacusa. **NAP must be identical character-for-character:**
  `I Care Air Care · 27022 Foamflower Blvd, Wesley Chapel, FL 33544 · (813) 395-2324 · https://www.icareaircare.com`

---

## 6. Key findings and data

### Boss's SEO Action Plan - VERIFIED REAL, with 2 corrections
Built on 176 DataForSEO calls @ commit `13761b0`. Verified against live DataForSEO, the code, and GSC: Labs numbers exact to the decimal (139 keywords / 10 top-10 / ETV 186 / $6,032 Ads value); backlinks match (~298 referring domains, domain rank 241, beats 3 of 4 competitors, behind only Del-Air); title cannibalization confirmed in code; emergency SERP live-check confirmed ICAC #2 organic AND that Google served the *area* page instead of the emergency page.

**Correction 1:** "21 images missing alt text" is **FALSE** - the built HTML has 0 missing alts (3 empty alts are decorative, which is correct). Do not spend time on it.
**Correction 2:** The emergency + ac-maintenance "rebuilds" in the plan **were already done** on Jun 11. Correct action is internal links + GSC recrawl + wait, NOT re-rebuilding (that would reset Google's clock).

### Before/after of the Jun-11 rebuilds (GSC Jun-22 vs Jul-13, reported Jul-13)
- Sitewide 28d: **clicks 239 → 342 (+43%)**, impressions ~64.6k → ~119.4k (+85%).
- Average position "worsened" 17 → 24 = **seasonal impression-mix mirage** (summer surge floods in new broad queries that enter ranking low), NOT a ranking loss.
- Improved: refrigeration 14.7→10.1, ac-replacement 35.7→33.4, heat-pump 23.6→21.9, maintenance 49.2→48.7, **Lutz area page 17.6→9.9 (entered page 1)**.
- Emergency page impressions 6,893 → **42,889 (+522%)**, CTR 0.01% - massive new visibility, no click capture yet.
- Blogs accelerating: carrier-vs-trane 33→87 clicks, seer2 14→36, ac-running-not-cooling 2→10.
- **RED FLAGS to watch:** `hvac-installation-tampa` (position 35→42.6 AND impressions -51%, the only true red) and `indoor-air-quality-tampa` (25.2→30.3).
- **Re-measure mid-August** with cleaner (post-peak) data.

### What is driving leads (multi-channel, verified)
Leads are a **system**, not one lever:
1. **Google Business Profile / Local Pack** = likely the biggest lead source (292 calls + 263 website clicks in 6 months, Jan-Jun). Powered by the off-site citation/profile work.
2. **On-site organic** = the SEO work; captures search + brand and **converts** via forms/trust/CTAs.
3. **Brand search → homepage** = downstream effect of off-site PR and citations.
4. **AI engines (ChatGPT/Gemini)** = emerging channel fed by the AI articles + schema.
> Caveat: GSC measures clicks, not leads. Real lead counts live in the CRM (GoHighLevel) and the KPI dashboard.

### Off-site work run by the user's team (context)
- **Press-release syndication** (2 campaigns across hundreds of news/lifestyle sites). Verified: the syndication sheet contains **no link to icareaircare.com** - these are brand-mention/PR/AI-feed plays, **not backlinks**, so they do not drive organic rankings.
- **Web 2.0 Ranker "XTREME Monthly GBP SEO"** (month 3 of an ongoing package): GBP posts, citations, local/maps signals, PBN + tiered links, guest posts. This is what most plausibly drives the GBP call volume.

---

## 7. Proven workflows

### Publishing an article + newsroom from a client Google Doc
1. `read_file_content(docId)` = text (images omitted). `download_file_content(docId, exportMimeType "application/zip")` = base64 zip (auto-saved to a tool-results `.txt` when large).
2. PowerShell: `ConvertFrom-Json` → `[Convert]::FromBase64String(.content)` → `WriteAllBytes` zip → `Expand-Archive`. Images extract as `image1..N.jpg`. **The HTML export preserves document order** - regex over the `.html` maps each image to the heading it follows.
3. Convert with **sharp** (in `node_modules`; `cwebp`/`magick` are NOT installed): temp `.mjs` script → `sharp(src).resize({width:1200,withoutEnlargement:true}).webp({quality:80})` → `public/images/<seo-name>.webp`. The press-release image is not used on site. Delete the temp script.
4. Article `.md` in `src/content/blog/`: frontmatter (`title, description, tag, date, read, image, imageAlt, location, primaryService{href,label}, related[], checklist[]`) + HTML body with `<figure class="not-prose my-8"><img .../></figure>` at each section.
5. **FAQ goes in `src/lib/blog-faqs.ts` keyed by slug**, NOT in the body (`[slug].astro` renders `BLOG_FAQS[slug]` + FAQPage schema). Exclude internal QA tables (CHECKLIST / GEO SCORECARD) from the published page.
6. **Newsroom post:** add `noindex: true` to frontmatter → `BaseLayout` emits `robots: noindex, nofollow` automatically. **ALSO add the newsroom slug to the sitemap filter in `astro.config.mjs`** (it is a hardcoded path list, NOT auto-derived from frontmatter).
7. Verify: `npm run build`, then `grep dist/sitemap-0.xml` (pillar = 1, newsroom = 0).

### Service-page build standard (client requirement)
Enhanced sidebar (`enhanced={true}`) + TrustBar / ReviewQuote / OwnerTip / InContentCTA / FinancingCTA; **holistic rewrite** (not additive patching - the client pushed back on additive); bullet-point organization throughout; **≥1,200 words of pure prose**; ~15 contextual internal links spread naturally (not clustered at the end, not repeated); zero em-dashes; honest claims.
Word-count check:
```bash
sed -n '/<ServiceLayout/,/<\/ServiceLayout>/p' file | sed 's/<[^>]*>/ /g' | tr -s ' ' '\n' | grep -cE '[A-Za-z]{2,}'
```

### Gotchas
- `.not-prose` does nothing by itself in this codebase - `prose-icac` rules in `global.css` are scoped with `:not(.not-prose X)` so components keep their own colors. Do not remove that.
- The preview/screenshot tooling is unreliable in this environment; rely on `npm run build` + parsing the built HTML in `dist/` for verification.
- Python on the old machine needed `PYTHONIOENCODING=utf-8` to print `★`/`·` without crashing.

---

## 8. External assets (Google Drive / Docs)

| Asset | ID / location |
|---|---|
| Playbook: "What Is Driving Results" (team report, EN) | Doc `1lYV5E1YGEVrHFjoKxt8jzOLBpxHbWo10ytpi2I4bbzc` |
| "Service Page Improvements: Before vs After (July 2026)" | Doc `1EwhtBv_ViMPh299_bO6IviY5QFGt_8eAKjUPd643fyM` |
| Boss's action plan | `ICAC-SEO-Action-Plan-2026-07.xlsx` (user's Downloads) |
| GSC exports used | `icareaircare.com-Performance-on-Search-2026-06-08 / -06-11 / -06-22 / -07-13.zip` |
| GBP performance | Screenshots (Jan-Jun 2026): 292 calls, 263 website clicks |

Other in-repo docs worth reading: `KEYWORD-MAP-2026-06.md`, `SEO-STRATEGY-2026.md`, `CLAUDE.md`.

---

## 9. New machine setup checklist

1. **Clone the repo:** `gh repo clone covenantOS/icareaircare-astro` then `npm install`.
2. **Authenticate `gh`** as `kevinservicelinepro`.
3. **Set git identity in the repo** (it was missing before):
   ```bash
   git config user.name "kevinservicelinepro"
   git config user.email "289060844+kevinservicelinepro@users.noreply.github.com"
   ```
4. **Copy Claude's memory folder** from the old machine so persistent memory survives:
   `C:\Users\NW\.claude\projects\C--Users-NW-Documents-claude-kingdom\memory\` → same path on the new machine.
5. **Reconnect the MCP connectors** used here: Google Drive, DataForSEO, (optionally Gmail/Calendar/Slack).
6. **Create `.claude/launch.json`** for the dev server (path had a space, so use the 8.3 short path):
   ```json
   { "name": "icareaircare-dev", "runtimeExecutable": "cmd",
     "runtimeArgs": ["/c", "cd /d C:\\...\\ICAREA~1 && npm run dev -- --port 4325"], "port": 4325 }
   ```
7. **Tell Claude:** *"Read CLAUDE-HANDOFF.md and continue the ICAC project."*
