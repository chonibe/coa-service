# Operation Log

Append-only. Most recent entry at top. Valid operations: `ingest`, `query`, `lint`, `explore`, `schema-update`.

---

## [2026-04-19] feature | Unlock experience editor before publish (draft submissions)

**Checklist**
- [x] [`app/vendor/(app)/studio/artworks/[id]/experience/page.tsx`](app/vendor/(app)/studio/artworks/[id]/experience/page.tsx) — If `shopify_product_id` exists, open `/artwork-editor/{shopify_product_id}`; otherwise open `/artwork-editor/{submissionId}` so blocks in `product_data.benefits` are editable while still draft. Closed submissions still blocked.
- [x] [`app/api/vendor/artwork-pages/[productId]/route.ts`](app/api/vendor/artwork-pages/[productId]/route.ts) — GET preserves stored benefit `id`s for submission blocks; PUT accepts `id` or `blockId`; DELETE matches string query param to numeric/string ids; POST submission response returns normalized `contentBlock` with `block_config`.
- [x] [`app/api/vendor/artwork-pages/[productId]/reorder/route.ts`](app/api/vendor/artwork-pages/[productId]/reorder/route.ts) — Accepts `blockOrders` (editor payload) or `updates`; fixes submission reorder id matching.
- [x] [`docs/features/artwork-editor/README.md`](docs/features/artwork-editor/README.md) — Reorder and PUT contract notes for submissions.

**Vercel**: Production deploy completed (2026-04-19); alias `https://app.thestreetcollector.com`.

---

## [2026-04-18] feature | Restore per-artwork unlock editor; retire series studio block editor

**Checklist**
- [x] [`app/vendor/(app)/studio/artworks/[id]/experience/page.tsx`](app/vendor/(app)/studio/artworks/[id]/experience/page.tsx) — Resolves submission → `shopify_product_id`, then `router.replace` to [`/artwork-editor/[productId]`](app/artwork-editor/[productId]/page.tsx) (blocks, soundtrack, map, preview). If not published yet, “Publish first” + link to edit.
- [x] [`app/vendor/(app)/studio/page.tsx`](app/vendor/(app)/studio/page.tsx) — **Unlock** → per-artwork experience route (no series template editor).
- [x] [`app/vendor/(app)/studio/nfc/page.tsx`](app/vendor/(app)/studio/nfc/page.tsx) — Artwork name links to `/artwork-editor/{productId}` when programmed.
- [x] [`app/vendor/(app)/studio/series/[id]/experience/page.tsx`](app/vendor/(app)/studio/series/[id]/experience/page.tsx) — Replaced with guidance pointing to Studio → Artworks → Unlock.
- [x] [`app/vendor/(app)/studio/series/[id]/experience/editor/page.tsx`](app/vendor/(app)/studio/series/[id]/experience/editor/page.tsx) — Redirects to the guidance page (no `SeriesTemplateEditor` in AppShell).
- [x] [`app/vendor/(app)/studio/series/page.tsx`](app/vendor/(app)/studio/series/page.tsx) + [`series/[id]/page.tsx`](app/vendor/(app)/studio/series/[id]/page.tsx) — Menu / header: “Unlock on artworks” → `/vendor/studio`; empty-state copy updated.
- [x] [`app/vendor/dashboard/artwork-pages/series/[seriesId]/page.tsx`](app/vendor/dashboard/artwork-pages/series/[seriesId]/page.tsx) — Comment: legacy dashboard-only series editor.

**Note**: Product create flow unchanged — no Hidden Treasures / benefits UI restored on artwork.

**Vercel**: Production deploy completed (2026-04-18); alias `https://app.thestreetcollector.com`.

---

## [2026-04-18] fix | Add artwork wizard: Continue visible on desktop

**Checklist**
- [x] [`app/vendor/dashboard/products/create/components/shopify-style-form.tsx`](app/vendor/dashboard/products/create/components/shopify-style-form.tsx) — Removed `lg:hidden` from the sticky step footer so **Back** / **Continue** / final **Submit** show at `lg+`; step indicator `n / 4` always in that bar.

**Vercel**: Production deploy completed (2026-04-18).

---

## [2026-04-18] feature | Remove per-artwork Hidden Treasures UI; artist delete vs close listing

**Checklist**
- [x] [`app/vendor/dashboard/products/create/components/series-step.tsx`](app/vendor/dashboard/products/create/components/series-step.tsx) — Removed Hidden Treasures / per-artwork benefits UI from the series step; rely on series-level unlock experience instead.
- [x] `app/vendor/dashboard/products/create/components/benefits*` — Deleted standalone benefits forms and `benefits-management` stack (no remaining imports).
- [x] [`supabase/migrations/20260418140000_product_submission_status_closed_draft.sql`](supabase/migrations/20260418140000_product_submission_status_closed_draft.sql) — Adds enum values `draft` and `closed` (idempotent `DO $$ … EXCEPTION duplicate_object`).
- [x] [`app/api/vendor/products/submissions/[id]/close/route.ts`](app/api/vendor/products/submissions/[id]/close/route.ts) — `POST` sets `status` to `closed` for `published` / `approved` (artist-initiated only).
- [x] [`app/api/vendor/products/submissions/[id]/route.ts`](app/api/vendor/products/submissions/[id]/route.ts) — `PUT` blocked when `closed`; `DELETE` allowed when no active sales and not already closed.
- [x] [`app/api/vendor/products/submissions/route.ts`](app/api/vendor/products/submissions/route.ts) — List filter accepts `draft` and `closed`; lint fixes (`const` maps, omit join field).
- [x] [`app/vendor/(app)/studio/page.tsx`](app/vendor/(app)/studio/page.tsx) — Delete when unsold; **Close listing** for any published/approved (artist choice); closed cards do not deep-link into edit; filter tab for closed.
- [x] [`app/vendor/(app)/studio/artworks/[id]/edit/page.tsx`](app/vendor/(app)/studio/artworks/[id]/edit/page.tsx) — Clearer message when submission is `closed`.

**Deploy / DB**: Apply the migration to Supabase before relying on `closed` / `draft` in production. Closing is DB-only (no Shopify unpublish in this change).

**Vercel**: Production deploy completed (2026-04-18); alias `https://app.thestreetcollector.com`.

---

## [2026-04-18] deploy | Studio: series cover upload, images, series deep-link, series-only benefits, block editor route

**Checklist**
- [x] [`app/vendor/(app)/studio/series/new/page.tsx`](app/vendor/(app)/studio/series/new/page.tsx) — Cover upload uses `POST /api/vendor/media-library/upload`; reads `file.url`; clearer upload errors.
- [x] [`next.config.js`](next.config.js) — `images.remotePatterns` includes `**.supabase.co` so `next/image` works for Supabase Storage (series cards, artwork picker, media library).
- [x] [`app/vendor/(app)/studio/media/page.tsx`](app/vendor/(app)/studio/media/page.tsx) — List query `sort=date_desc` (was invalid `newest`).
- [x] [`app/vendor/(app)/studio/artworks/new/page.tsx`](app/vendor/(app)/studio/artworks/new/page.tsx) — `?series=` resolves series name (list + fallback `GET /api/vendor/series/:id`); cancel returns to series when deep-linked.
- [x] [`app/vendor/(app)/studio/series/[id]/experience/editor/page.tsx`](app/vendor/(app)/studio/series/[id]/experience/editor/page.tsx) — AppShell route re-exports `SeriesTemplateEditor` (same as new block editor).
- [x] [`app/vendor/(app)/studio/series/[id]/experience/page.tsx`](app/vendor/(app)/studio/series/[id]/experience/page.tsx) — Primary CTA links in-app to `/experience/editor` (no external dashboard tab).
- [x] [`app/vendor/(app)/studio/page.tsx`](app/vendor/(app)/studio/page.tsx) — Submissions map `seriesId`; card opens **Edit**; **Unlock** → series editor or series index.
- [x] [`app/vendor/(app)/studio/artworks/[id]/experience/page.tsx`](app/vendor/(app)/studio/artworks/[id]/experience/page.tsx) — Explains series-wide NFC; routes to series editor when submission has `series_id` or `?series=`.
- [x] [`app/vendor/dashboard/products/create/components/benefits-management.tsx`](app/vendor/dashboard/products/create/components/benefits-management.tsx) + [`series-step.tsx`](app/vendor/dashboard/products/create/components/series-step.tsx) — With a series, benefits are **series-level only** (no per-artwork toggle); standalone per-artwork treasures UI replaced with copy pointing to Series → Unlock experience.
- [x] [`app/vendor/(app)/studio/nfc/page.tsx`](app/vendor/(app)/studio/nfc/page.tsx) — Artwork link goes to `/vendor/studio/series` instead of per-artwork editor.

---

## [2026-04-14] ingest | Final ingestion — access model, edition reserve, warehouse, product creation

**Sources ingested** (4 new):
- `docs/features/conditional-artwork-access/README.md` → `wiki/sources/2026-04-14-conditional-artwork-access.md`
- `docs/features/first-edition-reserve/README.md` → `wiki/sources/2026-04-14-first-edition-reserve.md`
- `docs/features/warehouse-order-tracking/README.md` → `wiki/sources/2026-04-14-warehouse-order-tracking.md`
- `docs/features/vendor-product-creation/README.md` → `wiki/sources/2026-04-14-vendor-product-creation.md`

**Concepts created** (4 new):
- `wiki/concepts/conditional-artwork-access.md`
- `wiki/concepts/first-edition-reserve.md`
- `wiki/concepts/warehouse-order-tracking.md`
- `wiki/concepts/vendor-product-creation.md`

**Conflicts logged**: 1 — warehouse My Orders uses Supabase session auth vs. Shopify cookie auth used elsewhere in collector flows. Not a strict conflict (different surfaces) but noted in `2026-04-14-warehouse-order-tracking.md`.

**Index updated**: 20 sources, 4 entities, 20 concepts, 1 synthesis.

**Remaining gaps** (lower priority):
- `docs/features/experience-v2/` Featured Artist Bundle
- `docs/features/data-enrichment-protocol.mdc`
- `docs/architecture/` subdirectories
- `docs/features/skills-hub/`
- `docs/features/gift-cards/`
- `docs/features/for-business/`

---

## [2026-04-14] ingest | Deep ingestion — series, journey, giveaway, analytics

**Sources ingested** (4 new):
- `docs/features/series-manager/README.md` → `wiki/sources/2026-04-14-series-manager.md`
- `docs/features/journey-milestone-system/README.md` → `wiki/sources/2026-04-14-journey-milestone.md`
- `GIVEAWAY_SUMMARY.md` → `wiki/sources/2026-04-14-giveaway.md`
- `docs/features/analytics/README.md` → `wiki/sources/2026-04-14-analytics.md`

**Concepts created** (4 new):
- `wiki/concepts/series-manager.md`
- `wiki/concepts/journey-milestone-system.md`
- `wiki/concepts/giveaway-roulette.md`
- `wiki/concepts/analytics-tracking.md`

**Index updated**: 16 sources, 4 entities, 16 concepts, 1 synthesis.

**Contradictions found**: None.

**Open gaps remaining**:
- `docs/features/experience-v2/` Featured Artist Bundle not fully documented
- `docs/architecture/` not yet explored
- Shopify metaobject/metafield schema not documented
- `docs/features/vendor-product-creation/` not yet ingested
- `docs/features/conditional-artwork-access/` not yet ingested
- `docs/features/first-edition-reserve/` not yet ingested
- `docs/features/warehouse-order-tracking/` not yet ingested

---

## [2026-04-14] ingest | Extended codebase ingestion — feature docs, payouts, NFC, credits, experience

**Sources ingested** (6 new):
- `docs/features/vendor-payouts/README.md` → `wiki/sources/2026-04-14-vendor-payouts.md`
- `docs/features/nfc-authentication/README.md` → `wiki/sources/2026-04-14-nfc-auth-feature.md`
- `docs/features/collector-dashboard/README.md` → `wiki/sources/2026-04-14-collector-dashboard-feature.md`
- `docs/features/affiliate-program/README.md` → `wiki/sources/2026-04-14-affiliate-program.md`
- `docs/features/post-purchase-credits/README.md` → `wiki/sources/2026-04-14-post-purchase-credits.md`
- `docs/features/experience/README.md` → `wiki/sources/2026-04-14-experience-readme.md`

**Concepts created** (4 new):
- `wiki/concepts/vendor-payout-system.md`
- `wiki/concepts/affiliate-program.md`
- `wiki/concepts/credits-economy.md`
- `wiki/concepts/experience-page.md`

**Syntheses created** (1):
- `wiki/syntheses/2026-04-14-platform-architecture-overview.md`

**Index updated**: 12 sources, 4 entities, 12 concepts, 1 synthesis.

**Contradictions found**: None.

**Open gaps remaining**:
- Giveaway Roulette feature not yet ingested (`app/giveaway/`)
- `docs/features/series-manager/` not yet ingested
- `docs/features/analytics/` not yet ingested
- `docs/architecture/` directory not yet explored
- Shopify metaobject/metafield schema not documented
- `docs/features/experience-v2/` Featured Artist Bundle not fully documented
- `docs/features/journey-milestone-system/` not yet ingested

---

## [2026-04-14] ingest | Initial codebase knowledge organisation

**Files created**: 18 wiki pages across all categories.

**Sources ingested** (6):
- `README.md` → `wiki/sources/2026-04-14-readme.md`
- `docs/SYSTEM_SSOT.md` → `wiki/sources/2026-04-14-system-ssot.md`
- `docs/API_DOCUMENTATION.md` → `wiki/sources/2026-04-14-api-documentation.md`
- `docs/RBAC_ARCHITECTURE.md` → `wiki/sources/2026-04-14-rbac-architecture.md`
- `VISION.md` → `wiki/sources/2026-04-14-vision.md`
- `docs/features/crm/README.md` → `wiki/sources/2026-04-14-crm-readme.md`

**Entities created** (4):
- `wiki/entities/the-street-collector.md`
- `wiki/entities/supabase.md`
- `wiki/entities/shopify.md`
- `wiki/entities/vercel.md`

**Concepts created** (8):
- `wiki/concepts/certificate-of-authenticity.md`
- `wiki/concepts/nfc-authentication.md`
- `wiki/concepts/rbac.md`
- `wiki/concepts/edition-numbering-system.md`
- `wiki/concepts/vendor-portal.md`
- `wiki/concepts/collector-dashboard.md`
- `wiki/concepts/headless-architecture.md`
- `wiki/concepts/crm-system.md`

**Infrastructure created**: `index.md`, `log.md`, `wiki/` directory tree.

**Contradictions found**: None across ingested sources.

**Open gaps identified**:
- `docs/features/` contains ~50 feature subdirectories not yet ingested (experience, nfc-pairing, series-manager, analytics, etc.)
- No synthesis pages exist yet — awaiting queries
- `docs/architecture/` not yet explored
- `docs/epics/` and `docs/sprints/` not yet explored
- Shopify metaobject/metafield schema not documented in wiki
- Giveaway roulette feature has no dedicated concept page
- Payout system has no dedicated concept page
