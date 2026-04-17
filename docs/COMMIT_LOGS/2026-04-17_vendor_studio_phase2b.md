# Vendor Studio · Phase 2b — Series operations (archive, duplicate, preview)

**Date:** 2026-04-17
**Phase:** 2b — Series operations
**Scope:** Studio › Series tab — surface archive, duplicate, and preview affordances. Stops the artist from being stranded with a dead "soft-delete" toggle and lets them iterate confidently on collection variants.

## What changed

### New columns
- `supabase/migrations/20260417210000_artwork_series_archive_field.sql`
  - Adds `archived_at TIMESTAMPTZ` to `artwork_series` (idempotent, partial index for vendor lookups).
  - Existing soft-delete still flows through `is_active = false`; the new timestamp lets the UI distinguish "Archived 3w ago" from a temporarily disabled series and offer a clean Restore.
  - **Apply with `supabase db push` from your local CLI when you're ready to land it.** All read paths fall back gracefully if the column is missing.

### New endpoints
- `POST /api/vendor/series/[id]/archive` — flips `is_active=false`, stamps `archived_at`. Returns the updated row. Idempotent (no-op if already archived).
- `POST /api/vendor/series/[id]/unarchive` — clears `archived_at`, flips `is_active=true`. Guards against `unique(vendor_id, name)` collisions so restoring after the artist re-used the name fails fast with a 409 instead of a generic 500.
- `GET /api/vendor/series` — accepts new `?include_archived=true` and `?archived_only=true` query params. Default behaviour is unchanged so collector and unlock paths stay tight.

### UI
- `app/vendor/(app)/studio/series/page.tsx`
  - **Filter pills**: `Active | Archived` with live counts.
  - **Per-row kebab menu**: Edit details, Edit unlock experience, Preview (opens the public collector view in a new tab), Duplicate (modal prompt for the new name), Archive / Restore.
  - **Archived rendering**: thumbnail desaturated, inline action links hidden, "Archived Xd ago" pill added.
  - **Empty states**: dedicated copy for the Archived tab so artists know what lands there.

## Why this shape

- **`is_active` + `archived_at` instead of a brand-new `is_archived` flag** keeps every existing reader (`/api/collector/series`, unlock checks, `apply-template` lookups) honest without a coordinated migration. The timestamp is the only new thing the UI needs to read.
- **Preview = open collector view in a new tab** — we already have `app/collector/series/[id]/page.tsx` and it works for an unauthenticated browse. Building a separate signed-preview endpoint would have leaked scope into Phase 3 (revisions / preview tokens).
- **Duplicate UX uses the existing `[id]/duplicate` endpoint** — only the artist-facing wiring is new. A modal beats `prompt()` because we want to show what the duplicate carries forward (template + members) and own the loading state.

## Risks & follow-ups

- The `archived_at` column ships as nullable so the API and UI work even before `supabase db push` runs. Once the migration lands, the "Archived Xd ago" pill will populate; until then the row falls back to the existing `is_active = false` semantics (still hidden from the active tab via the filter).
- No bulk archive / restore yet — that lands with Phase 2.8 bulk-upload work since both share the same selection model.
- Preview opens the live public view. A signed preview that supports unsaved drafts is queued for Phase 3.4 (collector preview toast on publish).

## Files touched

- `supabase/migrations/20260417210000_artwork_series_archive_field.sql` (new)
- `app/api/vendor/series/route.ts`
- `app/api/vendor/series/[id]/archive/route.ts` (new)
- `app/api/vendor/series/[id]/unarchive/route.ts` (new)
- `app/vendor/(app)/studio/series/page.tsx`

## Verification checklist

- [ ] `supabase db push` (run locally — see warning above about the queue of unrelated migrations).
- [x] Studio › Series renders Active/Archived pills with correct counts.
- [x] Duplicate modal posts to existing `/duplicate` endpoint and refetches the list.
- [x] Archive/Restore round-trip updates the UI without a full page reload.
- [x] Preview opens `/collector/series/[id]` in a new tab.
- [ ] Manual smoke on staging once the migration is applied — confirm the "Archived Xd ago" pill renders.
