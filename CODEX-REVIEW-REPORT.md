# CODEX Review Report - I Care Air Care Astro Site

Date: 2026-04-21  
Repository: `icareaircare-astro`  
Scope: adversarial static audit of booking, trust/compliance, SEO/schema, content quality, accessibility, performance, privacy, security, and conversion paths.

## Executive Summary

`npm run build` passes cleanly and the site has a strong foundation: NAP data is centralized in `src/lib/site.ts`, most images have useful alt/size attributes, schema parses, service/service-area pages include a "Reviewed by Tim" trust pattern, and the main content footprint is much richer than a thin local-service rebuild usually is.

The launch risks are not in the Astro build. They are in operational correctness and trust. The biggest issues are:

1. The custom `/api/book` integration likely does not match the current Housecall Pro Create Lead contract: it sends `Authorization: Bearer ...` and lead-level `notes`, while the official Create Lead docs expect API-key auth in the `Token {api-key}` format and expose lead-level `note`.
2. The booking API returns raw debug details to the browser on Housecall Pro failures, including the exact payload sent. That payload contains name, phone, email, full address, service details, and note contents.
3. The booking UI and API disagree on appointment-window shape. The frontend sends `{ date, slot, label }`; the API only reads `{ when, time }`. As written, selected appointment requests are omitted from the Housecall Pro note.
4. Several service-area pages still link to an old Housecall Pro booking URL, bypassing the new `/book/` flow and the current external fallback URL.
5. The review strip claims reviews are "sourced in real-time" while the review data is hardcoded with relative timestamps like "14 hours ago". This is a trust/compliance problem.
6. Financing copy contains live CTAs to a commented "placeholder" Synchrony URL and makes specific credit/APR/approval claims that need business/legal verification.
7. SEO hygiene is close but uneven: redirected URLs are still in the sitemap, many titles/descriptions exceed typical SERP display ranges, `/thank-you/` is omitted from sitemap but still indexable, and three legacy blog posts remain thin or redirected.

External source checks used:

- Housecall Pro Create Lead docs: <https://docs.housecallpro.com/docs/housecall-public-api/8961eaf9f1c28-create-lead>
- Housecall Pro API Leads help article: <https://help.housecallpro.com/en/articles/12062219-api-leads-in-job-inbox>

The Housecall Pro help article says API Leads are placed into the Job Inbox and require API Leads to be enabled, with Max plan availability noted. No live Housecall Pro API request was made during this audit.

## Build And Audit Status

- Build: `npm run build` passed.
- Pages built: 62.
- Git status before audit: clean.
- No hardcoded HCP API key or auth token found in built text assets.
- JSON-LD emitted by built pages parsed successfully in the static scan.
- Image audit: no missing `alt`, `width`, `height`, or lazy/eager loading issues surfaced in generated HTML.
- No `localStorage` / `sessionStorage` usage was found in the source audit.

## Severity-Ranked Findings

| Severity | Area | Location | Finding | Why it matters | Effort |
| --- | --- | --- | --- | --- | --- |
| P0 | Booking API | `functions/api/book.ts:175` | Sends `Authorization: Bearer ${env.HCP_API_KEY}`. Official Create Lead docs indicate API-key auth should use `Token {api-key}`. | Leads may fail in production even though the form appears complete to the user. | S |
| P0 | Booking API | `functions/api/book.ts:163` | Sends lead-level `notes`; the current Create Lead schema exposes lead-level `note`. | Customer context may not arrive in Housecall Pro, or the request may be rejected. | S |
| P0 | Privacy / Security | `functions/api/book.ts:198-205`, `src/pages/book.astro:861-864` | On HCP failure, the API returns `debug.hcp_body`, endpoint, and `payload_sent`; the UI displays this under "Technical details". | Exposes PII in browser state, screenshots, support chats, and logs. | S |
| P0 | Booking UX / Data | `src/pages/book.astro:807`, `src/pages/book.astro:1060-1072`, `functions/api/book.ts:25-28`, `functions/api/book.ts:90-91` | Frontend sends `window.date`, `window.slot`, `window.label`; backend reads `window.when` and `window.time`. | The selected date and 2-hour window do not get included in the HCP lead note. | S |
| P1 | Booking Reliability | `functions/api/book.ts:222-228` | File exports both `onRequestPost` and a catch-all `onRequest` that returns 405 even for POST. | Depending on Cloudflare Pages Functions routing semantics, this could shadow method-specific handling. Needs a deploy/runtime test or simplification. | S |
| P1 | Abuse / Duplicates | `src/pages/book.astro:1055-1089`, `functions/api/book.ts:118-218` | Client disables the button during submit, but server has no idempotency, rate limiting, bot friction, or replay guard. | Retries, double submissions, and bots can create duplicate or spam leads. | M |
| P1 | Validation | `functions/api/book.ts:71-78` | Server validation checks only broad required fields; it does not validate ZIP/state, service enum, consent truthiness beyond presence, or appointment window. | Bad data can reach HCP, and client-side checks can be bypassed. | S |
| P1 | Booking Links | `src/pages/service-areas/*:80-86`, `README.md:20`, `CLAUDE.md:11` | Six service-area pages and project docs still use old HCP URL `cb3eaa8c`; `SITE.bookUrlExternal` uses `fc288...`. | Users can land in the wrong scheduler, and future maintainers will copy stale links. | S |
| P1 | CRO | `src/components/Header.astro:185`, `src/components/Header.astro:239`, `src/components/FinalCTA.astro:18`, `src/components/StickyMobileCTA.astro:12` | Internal `/book/` links open in a new tab. | Adds friction, breaks normal back-button flow, and is especially awkward on mobile. | S |
| P1 | Reviews / Trust | `src/components/ReviewStrip.astro:4-8`, `src/components/ReviewStrip.astro:159` | Hardcoded reviews use relative timestamps but page claims they are "sourced in real-time". | Misleading freshness claim; will become visibly stale. | S |
| P1 | Reviews Schema | `src/components/ReviewStrip.astro:175-190` | Emits Review schema from hardcoded snippets without durable `datePublished` or a clear source refresh process. | Rich-result trust risk if review data is not verifiably current. | M |
| P1 | Financing / Legal | `src/pages/financing.astro:21-22`, `src/pages/financing.astro:57-81`, `src/pages/financing.astro:114`, `src/pages/financing.astro:126`, `src/pages/financing.astro:430-449` | A live financing page uses a commented placeholder Synchrony URL and claims 0% APR terms, 90-second approval, 640+ score, $75k limits, and soft prequal behavior. | Financial advertising must be precise, current, and approved by the lender/business. | M |
| P1 | Privacy | `src/pages/privacy-policy.astro:38-41` | Privacy policy mentions FormSubmit and HCP links, but not the new server-side `/api/book` flow, Cloudflare processing, or HCP API lead creation. | Users submit PII through the site before it reaches HCP; policy should reflect that. | S |
| P1 | Security Headers | repo root / `public/` | No `_headers` file or equivalent policy was found for CSP, frame-ancestors, Referrer-Policy, Permissions-Policy, or X-Content-Type-Options. | Cloudflare may provide some defaults, but the app does not define a site-specific browser security baseline. | M |
| P1 | SEO Redirects | `public/_redirects:11-13`, generated `dist/sitemap-0.xml` | Three URLs are 301-redirected but still appear in the sitemap. | Search engines are being asked to crawl URLs the site says are canonical elsewhere. | S |
| P1 | Index Control | `astro.config.mjs:11-16`, `src/pages/thank-you.astro` | `/thank-you/` is excluded from sitemap but is not explicitly `noindex`. | A conversion confirmation page can be indexed. | S |
| P1 | Technical SEO | built static scan | Many titles exceed 60 chars and descriptions exceed 155 chars. Examples: homepage description 175 chars, `/services/` title 64 and description 173, many service-area descriptions 160-190. | Snippets may truncate badly and weaken local SERP clarity. | M |
| P1 | Accessibility | `src/styles/global.css:11-12`, `src/styles/global.css:27`, `src/styles/global.css:83`, `src/styles/global.css:87` | Brand/accent colors fail contrast on white for normal text: `#4892a6` is 3.54:1, `#5da5b8` is 2.79:1, `#e88a38` is 2.59:1. | Links and CTA text can fail WCAG AA when used as normal text. | M |
| P1 | Accessibility | `src/components/MultiStepForm.astro:66-69` | FormSubmit contact inputs use placeholders but no labels or aria labels. | Screen-reader users and voice dictation users get weak form semantics. | S |
| P1 | Accessibility | `src/components/Header.astro:91`, `src/components/Header.astro:126`, `src/components/Header.astro:158` | Desktop dropdown buttons have `aria-haspopup` but no dynamic `aria-expanded`; hover/focus CSS controls state. | Assistive tech does not get menu state, and keyboard behavior is fragile. | M |
| P1 | Accessibility | `src/components/Header.astro:282-297` | Mobile drawer toggles aria/body overflow/Escape but does not trap focus or return focus reliably. | Keyboard users can tab behind the drawer. | M |
| P2 | Accessibility | `src/layouts/BaseLayout.astro:26` | `<html lang="en">` lacks `dir="ltr"`. | Minor but easy compliance fix requested by the review prompt. | XS |
| P2 | Motion | `src/styles/global.css:46`, `src/components/StickyMobileCTA.astro:17-35` | Global smooth scrolling and sticky CTA transitions are not guarded by `prefers-reduced-motion`. | Users with motion sensitivity get forced animation. | S |
| P2 | Heading Structure | `src/components/Footer.astro`, `src/components/MultiStepForm.astro` | Static scan found repeated h2-to-h4 and h1-to-h3 skips from global footer/form modules. | Not fatal, but weakens semantic outline and screen-reader navigation. | S |
| P2 | Performance | `src/styles/global.css:1` | `@import "@fontsource-variable/inter"` pulls multiple subsets into `dist/_astro`, including latin-ext, cyrillic, greek, and vietnamese. | More font bytes than needed for an English local business site. | S |
| P2 | Performance | `astro.config.mjs:18` | Partytown integration injects bootstrap assets on every page even when `PUBLIC_GA_ID` is absent. | Avoidable JS overhead if analytics is disabled. | S |
| P2 | Content Trust | `src/pages/services/ac-maintenance-tampa.astro:64` | Claims last-12-month averages: 15% undercharge, 22% efficiency drop, capacitors 30% below spec, under-$50 fixes vs $400+ repairs. | Very specific business data needs a source or should be softened. | S |
| P2 | Content Trust | `src/pages/service-areas/hillsborough-county-hvac-company.astro:74` | Claims hundreds of post-hurricane coastal outdoor unit replacements after Idalia/Helene. | Large disaster-response claim should be provable. | S |
| P2 | Content Trust | `src/pages/service-areas/polk-county-residential-ac-repair.astro:8`, `src/pages/service-areas/polk-county-residential-ac-repair.astro:44`, `src/pages/service-areas/polk-county-residential-ac-repair.astro:80` | Claims Polk has 2-5 freeze events/year and many installs are left on factory defaults. | Could be true, but it reads like cited data and needs substantiation. | S |
| P2 | Content Trust | `src/pages/services/hvac-installation-tampa.astro:7`, `src/pages/services/thermostat-installation-tampa.astro:8` | Uses technical/regulatory/savings claims like "2026 Florida minimum is 15.2 SEER2" and 23% smart thermostat savings. | These need citations or current manufacturer/regulatory references. | S |
| P2 | Content Consistency | `README.md:14-15`, `CLAUDE.md:8`, `scripts/gen-areas.mjs:18-21`, `scripts/genstubs.mjs:81`, `scripts/scraped-blog-posts.json` | Stale license, review, 24/7, and 30+ year claims remain in docs/scripts/generated data. | Future regeneration can reintroduce old claims into live pages. | M |
| P2 | Local Claims | `src/pages/about-us.astro:94`, service-area pages around `:56-57` | Some pages say "hundreds" while the site mostly says `700+`. | Not wrong, but inconsistent trust language. | XS |
| P2 | Blog Quality | `src/lib/blog.ts`, generated blog pages | Three legacy posts are weak: `ac-not-cooling-solutions` is about 433 words; `emergency-ac-repair-wesley-chapel-fl` and the old duct-cleaning post have thin structures and are redirected. | These are the pages most likely to feel like legacy SEO filler. | M |
| P2 | Utility Route | `src/pages/our-team.astro`, `public/_redirects:1-2` | `/our-team/` is both a redirect route and a generated noindex skeleton with no H1/meta value. | Low risk, but it is routing clutter. | S |
| P3 | Schema | `src/components/Schema.astro:120-123` | Generic FAQ schema does not strip HTML; layouts sometimes strip before passing, but the component itself accepts raw HTML. | Avoids future JSON-LD validator warnings if reused elsewhere. | S |
| P3 | Copy Source | `src/lib/site.ts:8-9`, `src/pages/book.astro:355` | Internal booking URL and HCP fallback URL are split between site config and page-local usage. | Easy to drift again unless all booking links resolve through one helper/config value. | S |

## Booking Integration Deep Dive

The new custom booking flow is the most important launch surface because it handles high-intent leads and PII.

`src/pages/book.astro` builds a clean six-step flow and posts to `/api/book`. The UI requires a date and slot before submit (`src/pages/book.astro:1049-1050`) and sends `window: state.window` (`src/pages/book.astro:1072`). The state shape is initialized as `{ date: '', slot: '', label: '' }` (`src/pages/book.astro:807`) and filled with a human-readable label at `src/pages/book.astro:1181-1182`.

The API does not read that shape. `functions/api/book.ts:25-28` defines `window.when` and `window.time`, and `buildNote` only formats those fields (`functions/api/book.ts:90-91`). Result: a customer can choose "Tuesday, 10am-12pm" in the interface, see it in the review step, submit successfully, and the HCP note still loses the appointment request.

The HCP payload itself also needs correction. The code comments say lead-level fields are `notes` and `lead_source`, and the payload sends `notes: note` (`functions/api/book.ts:139-164`). The current official Create Lead docs expose lead-level `note` singular. The request also sends `Authorization: Bearer ...` (`functions/api/book.ts:175`); official docs indicate the API key header format should be `Token {api-key}`. I would treat this as a hard launch blocker until a test lead is created in the actual Housecall Pro account.

Recommended fix order:

1. Remove browser-facing debug details immediately. Return a short request id and log sanitized details server-side.
2. Change HCP auth to the documented `Token` format and `notes` to `note`.
3. Update the backend model to accept `date`, `slot`, and `label`, then include the appointment request in the HCP note.
4. Add server-side validation for service enum, state, ZIP, date/slot, consent, email, and phone.
5. Add duplicate protection: an idempotency key from the browser, KV/Durable Object or short-lived cache, and rate limiting by IP plus normalized phone/email.
6. Runtime-test on Cloudflare Pages whether `onRequest` shadows `onRequestPost`; the safest code shape is often just `onRequest` with method branching or just method-specific exports, not both.

## Privacy And Security

The largest privacy issue is not secret leakage. It is customer data echoed back to the customer browser and potentially to screenshots/support conversations.

On HCP error, the API returns:

- HCP status.
- HCP response body, truncated to 1400 chars.
- Endpoint.
- The full payload sent to HCP.

That payload includes name, email, mobile number, service address, unit, city, ZIP, requested service, and freeform notes. The booking page then renders those debug details in the UI (`src/pages/book.astro:861-864`). This is convenient during development but unsafe in production.

The privacy policy should also be updated. It accurately mentions FormSubmit (`src/pages/privacy-policy.astro:38`) and Housecall Pro (`src/pages/privacy-policy.astro:41`), but the current booking path is no longer simply a direct HCP booking link. User data first hits the site's Cloudflare Function, then is sent to Housecall Pro's API. The policy should disclose Cloudflare hosting/functions, FormSubmit for contact forms, Google Analytics if enabled, and HCP API lead creation.

I did not find a `public/_headers` file. Add a Cloudflare Pages header policy for at least:

- `Content-Security-Policy` or a staged `Content-Security-Policy-Report-Only`.
- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy` for camera/microphone/geolocation as appropriate.
- `frame-ancestors 'self'` or equivalent CSP directive.

## SEO And Schema

The schema story is broadly good. The site emits HVACBusiness, Person, BreadcrumbList, FAQPage, Article, HowTo, Service, and FinancialProduct JSON-LD. The generated JSON-LD parsed during static scanning. Service and area pages include visible reviewer/credential blocks, which is a strong AI-search and E-E-A-T signal.

The SEO weak spots are operational:

- `public/_redirects:11-13` consolidates three URLs, but those old URLs still appear in the generated sitemap.
- `/thank-you/` is filtered out of the sitemap in `astro.config.mjs:15`, but the page itself is indexable.
- `/book/` is also filtered out of the sitemap. That can be fine if it is intentionally utility-only, but then it should probably be `noindex`; if it is a conversion landing page, include it.
- Many titles/descriptions are longer than typical SERP display lengths. The homepage description is 175 chars (`src/pages/index.astro:34`), `/services/` has a 64-char title and 173-char description, and many service-area descriptions exceed 155 chars.
- `/our-team/` exists as both redirect config and an Astro route skeleton.

Schema-specific cautions:

- `src/components/ReviewStrip.astro:175-190` should not emit review schema from stale hardcoded review snippets unless the source and refresh cadence are defensible.
- `src/components/Schema.astro:120-123` should strip HTML from FAQ answers inside the component, not rely on every caller doing it.
- `src/components/Schema.astro:22` repeats the "founded in 2010 after 30+ years" owner claim. That may be true, but because it is in schema, make sure the business wants that exact statement published machine-readably.

## Content And Trust Claims

The site has a lot of useful local specificity. The risk is that some specificity reads invented unless it is backed by internal data or public sources.

Claims to verify or soften before launch:

- Financing terms, credit scores, APR ranges, loan limits, 90-second approval, and soft-prequal copy on `/financing/`.
- "Every review is verified by Google - sourced in real-time" in the review strip.
- AC maintenance last-12-month averages in `src/pages/services/ac-maintenance-tampa.astro`.
- Polk freeze counts and default-install claims in `src/pages/service-areas/polk-county-residential-ac-repair.astro`.
- Post-hurricane replacement volume in `src/pages/service-areas/hillsborough-county-hvac-company.astro`.
- Smart thermostat savings and SEER2 regulatory claims on service pages.
- Stale 24/7, 30+ years, 400+ reviews, and old license references in `scripts/` and docs.

The blog library is mostly solid. The static scan found 30 blog posts; most have internal links, local terms, and adequate length. The weak set is small:

- `ac-not-cooling-solutions`: about 433 words and redirected.
- `emergency-ac-repair-wesley-chapel-fl`: thin structure and no pricing terms.
- `air-duct-cleaning-in-wesley-chapel-fl-what-you-need-to-know`: thin structure, no close CTA, and redirected.

Treat those as consolidation cleanup, not a site-wide content failure.

## Accessibility

The biggest accessibility issue is color contrast. The brand palette is pleasant but several colors are too light on white:

- `#5da5b8` on white: 2.79:1.
- `#4892a6` on white: 3.54:1.
- `#e88a38` on white: 2.59:1.
- `#d0761f` on white: 3.34:1.

`src/styles/global.css:83` uses `text-brand-600` for prose links, and button/link variants use accent/brand colors broadly. For normal text, use darker tokens such as `brand-700` or navy; reserve lighter tones for icons, large text, backgrounds, or non-text decoration.

Other accessibility fixes:

- Add real labels or `aria-label` to `MultiStepForm` inputs (`src/components/MultiStepForm.astro:66-69`).
- Add `aria-expanded` state management to desktop dropdown buttons.
- Trap focus in the mobile drawer and return focus to the opener on close.
- Add `dir="ltr"` to the root html element.
- Guard smooth scrolling and sticky CTA motion with `prefers-reduced-motion`.
- Clean heading skips caused by reusable footer/form modules.

## Performance

The site is not obviously bloated, but a few easy wins exist:

- Restrict Inter font imports. `@fontsource-variable/inter` currently pulls several subsets that are not needed for an English local site.
- Only enable Partytown when `PUBLIC_GA_ID` is set, or accept the small bootstrap cost intentionally.
- Review inline scripts. The built scan saw many inline JSON-LD blocks, which is expected, but also global component JS on many pages. Keep it, but avoid adding more inline behavior where CSS or progressive enhancement is enough.
- Keep the review marquee reduced-motion behavior; that component already has a `prefers-reduced-motion` block, which is good.

## Conversion And UX

The site asks for the right actions: call, book, finance, contact. The conversion problems are mostly link behavior and trust details:

- Internal booking links should stay in the same tab.
- Service-area old HCP links should route through `SITE.bookUrl` or the current HCP fallback.
- The booking fallback at `src/pages/book.astro:355` should use `SITE.bookUrlExternal`, not a duplicated hardcoded value.
- The booking form should never show raw technical JSON to users. Replace it with: "We could not send the request. Please call..." plus a support code.
- If `/book/` is excluded from sitemap, make that an intentional noindex utility page; if it is an important landing page, index it and write title/meta for it.

## Recommended Fix Plan

### Before Launch

1. Fix HCP auth/header and `note` field, then create a real test lead.
2. Remove browser-facing debug payloads and sanitize server logs.
3. Fix appointment-window payload mismatch.
4. Replace old HCP booking URLs and centralize booking URLs.
5. Add server validation, idempotency, and rate limiting to `/api/book`.
6. Verify Synchrony URL and all finance terms with the business/lender; hide or soften until confirmed.
7. Remove or correct "sourced in real-time" review copy.
8. Add `noindex` to `/thank-you/` and remove redirected URLs from the sitemap.

### Next Sprint

1. Add security headers.
2. Update privacy policy for Cloudflare Functions and server-side HCP API processing.
3. Fix high-impact title/meta truncation on homepage, services index, service-area pages, and top service pages.
4. Fix color contrast tokens and FormSubmit labels.
5. Add drawer focus management and desktop dropdown ARIA state.
6. Clean stale claims in `README.md`, `CLAUDE.md`, `scripts/gen-areas.mjs`, `scripts/genstubs.mjs`, and `scripts/scraped-blog-posts.json`.

### Later Polish

1. Rework the three weak/redirected blog posts.
2. Restrict font subsets.
3. Remove `/our-team/` route clutter if the redirect is the canonical behavior.
4. Add source/citation strategy for technical claims that are meant to rank in AI answers.

## Confirmed Strengths

- The build passes.
- Source-of-truth business info in `src/lib/site.ts` is current: `CAC1822037`, `(813) 395-2324`, Foamflower Blvd. address, 4.9 rating, 700 review count, 16 years.
- The built site did not expose the HCP API key in text assets.
- Service and service-area templates include visible reviewer/license/EPA credential blocks.
- JSON-LD parsed in static checks.
- Image accessibility and layout basics are in good shape.
- The site has strong local entities: Wesley Chapel, Pasco, Hillsborough, Polk, named neighborhoods, Tim Hawk, license, address, phone, and service categories.
- The booking UX is much better than a generic embedded scheduler once the API contract and privacy issues are fixed.

