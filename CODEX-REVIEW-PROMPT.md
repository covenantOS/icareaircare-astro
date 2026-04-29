# Codex Review Prompt — I Care Air Care Astro Site

Paste the entire contents below into Codex (or give it this file plus access to the repo). The prompt asks Codex to do an adversarial review of work that was done by Claude in this repo.

---

## Prompt for Codex

You are reviewing an Astro 5 + Tailwind v4 website for a Wesley Chapel, FL HVAC contractor called **I Care Air Care**. The site was built/rebuilt by another AI (Claude) across many sessions. Your job is to be a **skeptical senior reviewer** — not cheerleader. Find what is wrong, missing, or half-done. Report everything with specificity (file path, line number when possible, why it matters).

### Context you need to read first

1. `CLAUDE.md` at repo root — the handoff doc. Explains business, tech stack, design decisions, and what was already done.
2. `AUDIT-2026-THIN-CONTENT-AND-LINKING.md` — a read-only audit that documented thin content, linking gaps, and 2026 SEO/CRO findings.
3. `FULL-SEO-CRO-AUDIT.md` — an earlier audit round covering title tags, meta descriptions, schema, and canonicals.
4. `AUDIT-REPORT.md` — the first audit pass Claude did.
5. `README.md` — project overview and commands.
6. `src/lib/site.ts` — the single source of truth for NAP, services, areas, rating, license.
7. `functions/api/book.ts` — the Cloudflare Pages Function that creates a lead in Housecall Pro via their public API.
8. `src/pages/book.astro` — the multi-step booking form that POSTs to `/api/book`.

Build the site first with `npm run build` and check that it succeeds with 0 errors and 0 warnings. Open the built output in `dist/` to inspect rendered HTML.

### Scope of your review

Review **all of the following areas** and produce a single ranked report at `CODEX-REVIEW-REPORT.md` at the repo root. Do NOT modify source files unless the user explicitly asks you to — this is a read-only review.

Focus areas:

#### 1. Housecall Pro API integration (HIGHEST PRIORITY)
- `functions/api/book.ts` POSTs to `https://api.housecallpro.com/leads` with a nested `customer` object. Is this the correct endpoint + payload shape per HCP's public API docs at https://docs.housecallpro.com/? Check every field name against the actual spec.
- Look at `hcp_body` error messages returned to the client when submission fails. Is error handling robust? Are we logging enough to diagnose production issues without leaking PII?
- Rate limiting: the function has none. Does Cloudflare Pages Functions provide built-in rate limiting, or do we need it? What's the risk surface?
- Are we idempotent against double-submits? (User double-clicks Confirm Booking → two leads in HCP?)
- Verify the HCP API key is ONLY read server-side and never exposed in any client bundle. Search all of `dist/` for the literal string "HCP" or any auth header to be sure.
- Is the customer payload missing any fields HCP would want (job type, service address vs billing address, preferred technician, etc.)?

#### 2. SEO technical
- Every page: title ≤ 60 chars, meta description ≤ 155 chars, canonical present, one H1, proper heading hierarchy, breadcrumb schema.
- Sitemap at `dist/sitemap-index.xml` and `dist/sitemap-0.xml` — all indexable pages present? Any noindex pages leaking in? Legal/utility pages excluded?
- robots.txt at `dist/robots.txt` — correct `Sitemap:` URL, no Disallow rules blocking content?
- JSON-LD schema — validate every type used (HVACBusiness, Service, FAQPage, BreadcrumbList, Article, HowTo, Person, FinancialProduct, AggregateRating, Review). Run each through https://validator.schema.org/ mentally — any malformed fields, missing required properties, or bogus types?
- Open Graph + Twitter Card meta on every page.
- Internal linking — are hub pages (services, service-areas, blogs) properly cross-linked? Any orphans?
- Keyword cannibalization — are any two pages targeting the same primary keyword without a clear differentiator? Check 301 redirects in `public/_redirects`.
- `lang="en"` on <html>, `dir` attribute, viewport meta, charset.
- Image alt text coverage, image dimensions specified (CLS prevention).

#### 3. 2026 AI-search optimization
- Google AI Overviews + ChatGPT cite content with: clear Q&A structure, specific numbers, named entities, brief direct-answer paragraphs. Audit which pages are AI-overview-friendly and which aren't.
- Entity clarity: is Tim Hawk (owner) a first-class named entity with `sameAs` references, a Person schema, and consistent citation across the site?
- Is there any content where a human would think "this is clearly AI-generated spun content"? Flag for rewrite.

#### 4. Content quality
- Service pages (`src/pages/services/*.astro`): read each. Is the content specific enough, accurate, credible? Any fluff? Any pricing that's clearly made up vs. realistic Tampa Bay HVAC rates?
- Service area pages (`src/pages/service-areas/*.astro`): hyper-local enough? Neighborhoods named? HOAs referenced? Climate specifics? Or are they city-swap templates?
- Blog posts (`src/lib/blog-bodies.ts`): 30 posts total. How many have 600+ words of actual body content, proper H2 hierarchy, internal links, pricing specifics, neighborhood mentions, and a soft CTA at the close? How many are still "headline salad"?
- Careers page (`src/pages/careers.astro`): genuine and attractive to applicants, or generic?
- Financing page (`src/pages/financing.astro`): realistic Synchrony financing terms? Legal disclaimers adequate? Any scammy-looking "0% APR!!!" formatting?
- About Us page (`src/pages/about-us.astro`): tells a real story with specifics?
- Contact page: links to service/area pages for internal link equity?

#### 5. CRO (conversion rate optimization)
- Above-the-fold on every page: phone number + call CTA visible on mobile?
- Sticky mobile CTA — works correctly? Overlap issues?
- Booking form (`/book/`): step-by-step flow works end-to-end on mobile AND desktop? Validation reasonable? Error states clear? 404-style errors handled gracefully?
- Trust signals near every CTA: license, years in business, rating, reviews count?
- Form friction: `/book/` has 6 steps — any unnecessary fields, confusing labels, keyboard types wrong?
- `/thank-you/` page — fires for both form submissions and booking? Custom copy based on `?ref=...`?
- Dead-end pages — every page ends with a clear next step?
- Do any CTAs open in a new tab when they shouldn't, or stay in-tab when they should open new?

#### 6. Accessibility
- `prefers-reduced-motion` respected on carousels and animations?
- Color contrast — check the teal `#5da5b8` on white, navy `#1a2e45`, accent orange `#e88a38` — WCAG AA compliant?
- Keyboard navigation through `/book/` form — all steps, all buttons reachable via tab?
- Form labels properly associated with inputs? ARIA labels where needed?
- Image alt text: decorative images correctly marked `alt=""` and `aria-hidden`?
- Heading hierarchy: no skipped levels (h1 → h3 without h2)?

#### 7. Performance
- Image formats (webp everywhere?), dimensions specified, lazy loading applied where appropriate?
- No render-blocking scripts in <head>?
- CSS size reasonable? Any unused CSS?
- Fonts: Inter is loaded — verify no FOIT/FOUT, verify preconnect to font CDN if applicable?
- JavaScript: how much ships to each page? `/book/` has a lot of inline JS — acceptable?
- Sitemap + robots + redirects all served from edge cache?

#### 8. Security / privacy
- Privacy Policy and Terms of Use: present, reasonable, reference actual third parties used (FormSubmit, Cloudflare, Housecall Pro)?
- Forms: any PII stored client-side via localStorage? Leaked in URLs?
- GA4 / GTM — are IDs hardcoded anywhere, or properly env-driven?
- Any exposed API keys or secrets in the client bundle?
- CSP, HSTS, X-Frame-Options — Cloudflare handles some of these at the edge. Anything missing that we should set?

#### 9. Code quality / maintainability
- `src/lib/site.ts` as single source of truth — respected everywhere, or are there hardcoded strings that should use `SITE`?
- Typescript strictness — any implicit `any` or missing types in Astro frontmatter scripts?
- Astro islands / hydration: are any components needlessly shipped as client components?
- Naming conventions: consistent across components?
- Dead code: unused imports, unreachable branches, TODO comments?
- Dependencies: `package.json` — anything outdated or unnecessary?

#### 10. Business-specific
- NAP (name/address/phone) consistency: verify "I Care Air Care" / "27022 Foamflower Blvd, Wesley Chapel, FL 33544" / "(813) 395-2324" appears identically across every page, Schema, Footer, Contact — spot any variation.
- License `CAC1816515` — appears correctly everywhere? Any legacy references to old licenses?
- Rating "700+ reviews / 4.9★" — consistent?
- Business hours `Mon–Fri 8a-6p, Sat 10a-4p` — consistent in text + structured data?
- Any residual "24/7" claims (business does NOT offer 24/7)?
- Photo usage: any still using the same photo repeatedly where variety would help?

### Deliverable

Write a single markdown file at `CODEX-REVIEW-REPORT.md` at repo root with:

1. **Executive summary** — top 5 findings in priority order (what would you fix first?)
2. **Severity-ranked punch list** in a table (Critical / High / Medium / Low × Area × File:Line × What × Why × Effort S/M/L). Target at least 30 findings; stop when you've run out of substantive issues.
3. **Per-area deep dives** — one section per focus area above (1 through 10), with detailed findings.
4. **Quick-win suggestions** — what can be fixed in under 15 minutes each that would materially help.
5. **Strategic suggestions** — bigger moves that would take significant effort but would be transformative.

### Tone

Be direct. Be specific. Cite file paths and line numbers. Don't pad with filler ("Additionally..." "Furthermore..."). Don't hedge — if something is wrong, say it's wrong. Don't claim credit for things that were actually done well; briefly acknowledge them in a "confirmed clean" section at the end.

Length target: 3,000–6,000 words of substantive findings.

### What NOT to do

- Do not modify source files
- Do not rebuild more than necessary
- Do not run external validators like Lighthouse or Playwright (just read the source + HTML)
- Do not invent statistics or cite sources that don't exist
- Do not pull external content as "the correct HVAC best practice" — anchor recommendations to Google Search Central docs, web.dev Core Web Vitals guidance, Nielsen Norman, or industry-standard references only
