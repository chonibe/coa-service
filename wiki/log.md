# Operation Log

Append-only. Most recent entry at top.

---

## [2026-04-19] ingest | GSC API toolkit — CSV, export pack, sitemaps, URL Inspection

Added [`gsc-lib.mjs`](../scripts/gsc-lib.mjs) (shared auth/CSV), extended `gsc:report` (`--format csv`, country/device dimensions), `gsc:export-all`, `gsc:sitemaps`, `gsc:inspect` + [`config/gsc-default-urls.txt`](../config/gsc-default-urls.txt). Doc: [`docs/features/street-collector/GSC_API.md`](../docs/features/street-collector/GSC_API.md). `docs/dev/gsc-exports/` gitignored.

---

## [2026-04-19] ingest | Search Console API scripts (OAuth + JSON report)

Repo scripts `scripts/gsc-oauth-token.mjs`, `scripts/gsc-search-analytics.mjs`; **`npm run gsc:oauth`** / **`gsc:report`**; documented in [[seo-gsc-baseline-runbook]] and `.env.example`.

---

## [2026-04-19] ingest | GSC template, hero-drop playbook, pillar HTML drafts

Added [[gsc-baseline-fill-in-template]], [[hero-drop-playbook]]; Shopify-ready pillar copy in [`docs/features/street-collector/pillar-articles-shopify-draft.md`](../docs/features/street-collector/pillar-articles-shopify-draft.md). Updated [[seo-gsc-baseline-runbook]], [[gtm-battle-plan]], [`index.md`](index.md).

---

## [2026-04-19] ingest | GTM / SEO battle plan wiki + docs

Added **positioning wedge**, **GTM battle plan** concept notes, **competitive intelligence** and **tier prioritisation** syntheses, **GSC baseline runbook** source; expanded [`index.md`](index.md) Concepts catalog (22 notes) and Syntheses (4); mirror doc [`docs/features/street-collector/NICHE_BATTLE_PLAN.md`](../docs/features/street-collector/NICHE_BATTLE_PLAN.md). Aligned [`docs/features/analytics/EVENTS_MAP.md`](../docs/features/analytics/EVENTS_MAP.md) `item_list_name` **`artist_profile`** and `app/(store)/shop/` paths.

---

## [2026-04-14] ingest | Portfolio image fetch — 64 artists updated

Live-fetched artist portfolio/about pages for 76 artists missing Instagram images.

**Results:**
- 45/76 og:image URLs extracted (primary representative image per artist)
- 62/76 had extractable work images (up to 6 per artist)
- 64 wiki entity pages updated with new `## Portfolio Images` section
- 12 artists skipped (sites returned no usable images — login walls, blank pages, or pure JS SPAs)
- Skipped artists: elfassi, igal-talianski, ezra-baderman, aviv-shamir, refiloe-mnisi, laura-fridman, moshe-gilboa, s-a-r-g-o-n, jake-ac-art, ajax-blyth-piper, facio, thomas-stary
- Note: Instagram post images are not fetchable without auth (returns base64 placeholders). vivaladybug and thales-towers intentionally retain GIPHY URLs — these artists' primary medium is animated GIF.

**Scripts:** `scripts/fetch-artist-portfolio-images.mjs`, `scripts/apply-portfolio-images-to-wiki.mjs`
**Data:** `docs/dev/wiki-portfolio-images.json`

---

## [2026-04-14] ingest | Artist Research Data — 84 Street Collector artists (v2: images + SEO)

Regenerated all 84 artist entity pages with full image content, SEO metadata, and FAQ sections.

**Added in v2:**
- Process Images section (up to 4 images with URLs, labels, and inline `![]()` previews) — 82/84 artists have images
- Instagram section with profile link; showcase image grids where populated (8 artists)
- SEO section: page title, meta description, target keyword list per artist
- FAQ section (4 Q&A pairs per artist, structured for FAQPage JSON-LD)
- Impact callout section (14 artists)
- Editions & Exclusivity callout section (14 artists)
- Additional History & CV section with raw research notes (83 artists)
- Location-based tags in frontmatter (france, germany, israel, uk, usa, etc.)

---

## [2026-04-14] ingest | Artist Research Data — 84 Street Collector artists (v1)

Ingested `content/artist-research-data.json` as source `2026-04-14-artist-research-data`.

**Files created:**
- `wiki/sources/2026-04-14-artist-research-data.md` — source summary
- `wiki/syntheses/2026-04-14-street-collector-artists.md` — artist roster by geography
- `wiki/entities/<slug>.md` × 84 — one entity page per artist (2 duplicate slugs skipped: `antonia-lev-1`, `troy-browne-1`)
- `wiki/index.md` — initial index created
- `wiki/log.md` — this file

**Script used:** `scripts/generate-artist-wiki-pages.mjs`

**Notable:**
- Each entity page contains: narrative bio, location, Instagram handle, portfolio URL, exhibitions, press links, pull quote (where available), source links
- ~7 artists have unknown/unverified locations
- Instagram post image URLs not populated — flagged in source data notes
- Some exhibition dates and client claims carry inline verification notes from original research passes
- No conflicts identified with existing wiki pages
