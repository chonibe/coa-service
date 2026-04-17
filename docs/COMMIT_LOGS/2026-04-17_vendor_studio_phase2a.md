# Phase 2a — Studio polish (autosave, image hints, filter counts, focus)

**Date:** 2026-04-17
**Branch:** main
**Related plan:** `restore-profile-nfc-payout-affordances` → Phase 2 ("studio polish")
**Predecessor:** `2026-04-17_vendor_payouts_phase1_depth.md`

---

## What this commit ships

Reduces the cost of a misclick or a closed tab during artwork creation, and
makes the Studio list discriminate between approval states the artist
actually cares about (Approved vs Rejected, not just "Pending"). Pure
client-side improvements — zero schema changes, zero new endpoints.

1. **Local autosave for the new-artwork form**
   - Form state debounce-saves to `localStorage` keyed by submission scope
     (`new` for fresh drafts, `<id>` for edits — but only the `new` flow
     restores, so server-authoritative edits are never overwritten by stale
     offline state).
   - Sticky header shows `Saving draft locally…` → `Draft autosaved 12s ago`.
   - On reload, a blue banner says `Restored unsaved draft` with a one-click
     `Discard and start fresh` action.
   - Snapshot is dropped on successful submit (server now owns the record).
   - 14-day TTL guards against ancient drafts.

2. **Image upload resolution warnings**
   - Inspect `naturalWidth × naturalHeight` before upload; surface a
     non-blocking amber `Alert` if the long edge is below 2000px or short
     edge below 1500px ("may look soft"), and a hint at < 3000px long edge.
   - Each warning is independently dismissible. Videos skip the inspection.

3. **DPI / print spec hint on the Print Files step**
   - Inline blue `Alert` directly under the heading, before the upload
     dropzone. Spells out 300 DPI minimum, CMYK, 3mm bleed, embedded fonts.

4. **Studio filter pills + counts**
   - Adds `Approved` and `Rejected` pills (was: All / Draft / Pending /
     Published only — `Approved` was even declared in the type but never
     rendered).
   - Each pill shows the live count of submissions in that state.

5. **Submit-then-focus**
   - Form `onComplete` callback now passes back `{ submissionId, status,
     isDraft }`. The new-artwork page redirects to
     `/vendor/studio?focus=<id>` and the Studio page scrolls + flashes a
     ring around the freshly-created artwork.
   - Note: did NOT route to `/artwork-editor/[id]` because the experience
     editor resolves on a published Shopify product, and a freshly
     submitted artwork is `pending` (no Shopify product yet). Hand-off to
     the experience editor naturally happens after admin approval.

## Files touched

- `app/vendor/(app)/studio/page.tsx`
  - `FilterStatus` extended with `rejected`.
  - `filters` array now All / Draft / Pending / Approved / Published /
    Rejected with `count` per pill.
  - `useSearchParams()` `?focus=<id>` highlights and scrolls to the row.
- `app/vendor/(app)/studio/artworks/new/page.tsx`
  - `handleComplete` accepts the result and redirects to focus URL.
- `app/vendor/dashboard/products/create/components/shopify-style-form.tsx`
  - `useRef`, `AUTOSAVE_PREFIX`, `AutosaveSnapshot`, debounced effect,
    `clearAutosave`, `discardRestoredDraft`, sticky autosave label,
    "Restored unsaved draft" banner.
  - `onComplete` signature now `(result?: {...}) => void`.
- `app/vendor/dashboard/products/create/components/images-step.tsx`
  - `inspectImageDimensions`, `buildResolutionWarning`, dismissible
    `warnings` state, amber `Alert` block.
- `app/vendor/dashboard/products/create/components/print-files-step.tsx`
  - Blue `Info` Alert with print spec checklist.

## QA checklist

- [ ] Start an artwork, type a title, refresh the page → banner appears
      with the title pre-filled.
- [ ] Click `Discard and start fresh` → form clears and `localStorage`
      is empty.
- [ ] Submit successfully → autosave is dropped (refresh shows no banner).
- [ ] Upload a 1200×800 jpeg → amber warning. Upload a 4500×3000 jpeg →
      no warning. Dismiss × works independently per file.
- [ ] Print Files step always shows the blue print-spec alert.
- [ ] Studio shows 6 pills with counts. `Approved` and `Rejected` filter
      submissions correctly.
- [ ] Submit a new artwork → land in Studio with the new card highlighted
      with a primary-color ring and centered in the viewport.

## Deferred (intentional)

- **2.5 Promote series choice** — needs a form re-layout; folded into
  Phase 2b along with the series ops.
- **2.8 Bulk artwork upload + API** — Phase 2b, requires new endpoint +
  CSV parser + UI.
- **2.9–2.11 Series archive / duplicate UI / preview** — Phase 2b,
  requires migration for `is_archived`, new preview endpoint, and Studio
  series page wiring for the existing `/duplicate` API.

## Next phase

Phase 2b — Series operations (archive migration + API + UI, duplicate UI
wiring, preview endpoint, plus bulk artwork upload).
