# NFC Flow Consolidation — 2026-04-17

## Summary

Consolidated every NFC entry point (physical scan, admin-signed link, collector-programmed tag, legacy `/auth/nfc/[token]`, legacy `/pages/authenticate`, legacy `/nfc/unlock`) into a **single canonical router** at `/api/nfc-tags/redirect`, and a **single landing page** at `/collector/artwork/[lineItemId]` with four explicit states (`scan=pending`, `preview=true`, `claim=pending`, `authenticated=true`). Fixed a latent bug where artist-created content blocks were invisible to collectors because the vendor POST defaulted to `is_published: false` while the collector API filtered on `is_published: true`.

## Changes Made

### Phase 1 — Canonical NFC redirect router
- [x] Rewrote `/api/nfc-tags/redirect` to resolve `tagId` / `token` → `line_item_id`, log the scan to `nfc_tag_scans`, read the `collector_session` cookie, and 302 to `/collector/artwork/[lineItemId]` with the right state query — [`app/api/nfc-tags/redirect/route.ts`](../../app/api/nfc-tags/redirect/route.ts)

### Phase 2 — Deprecate legacy entry points (redirect-only)
- [x] `/pages/authenticate` is now a server redirect to the canonical endpoint — [`app/pages/authenticate/page.tsx`](../../app/pages/authenticate/page.tsx)
- [x] `/nfc/unlock` decodes the token server-side and redirects to the canonical endpoint — [`app/nfc/unlock/page.tsx`](../../app/nfc/unlock/page.tsx)
- [x] `/auth/nfc/[token]` is a thin 308 redirect; removed the `self-programmed-${Date.now()}` placeholder tagId bug — [`app/auth/nfc/[token]/route.ts`](../../app/auth/nfc/[token]/route.ts)

### Phase 3 — Unified tag URL format
- [x] Collector-generated tag URLs now match admin-signed format (`/api/nfc-tags/redirect?tagId=…&token=…`) — [`app/api/collector/artwork/[id]/nfc-url/route.ts`](../../app/api/collector/artwork/[id]/nfc-url/route.ts)

### Phase 4 — Four-state artwork landing page
- [x] Added `useSearchParams` parsing for `claim`, `authenticated`, `preview`, `scan` states — [`app/collector/artwork/[id]/page.tsx`](../../app/collector/artwork/[id]/page.tsx)
- [x] Added `useEffect` that auto-opens `NFCAuthSheet` exactly once on `claim=pending` or `scan=pending` for non-authenticated owners
- [x] Sticky CTA hidden in `preview` mode; copy rewritten to "Pair your NFC to verify ownership"
- [x] Added preview banner for signed-in non-owners and "Welcome back" toast for freshly authenticated owners
- [x] Removed unused imports: `Loader2`, `Lock`, `Unlock`, `formatCurrency`, `VideoBlock`, `AudioBlock`, `ArtistSignatureBlock`, `ArtistBioBlock`, `FrostedOverlay`, `LockedOverlay`

### Phase 5 — Single source of truth for block visibility
- [x] Vendor POST now defaults `is_published: true` + `is_active: true` so artist saves are immediately visible — [`app/api/vendor/artwork-pages/[productId]/route.ts`](../../app/api/vendor/artwork-pages/[productId]/route.ts)
- [x] Vendor PUT now allows `is_active` updates
- [x] `apply-template` inserts blocks as published by default — [`app/api/vendor/artwork-pages/[productId]/apply-template/route.ts`](../../app/api/vendor/artwork-pages/[productId]/apply-template/route.ts)
- [x] `copy-from` inserts blocks as published by default — [`app/api/vendor/artwork-pages/[productId]/copy-from/route.ts`](../../app/api/vendor/artwork-pages/[productId]/copy-from/route.ts)
- [x] Verified collector read path filters on **both** `is_active` and `is_published` in product-level and series-level queries — [`app/api/collector/artwork/[id]/route.ts`](../../app/api/collector/artwork/[id]/route.ts)

### Phase 6 — Component dedup
- [x] Deleted orphan `components/ui/nfc-pairing-wizard.tsx` (zero importers, incompatible NDEF-raw-payload assumption)
- [x] Updated comment in `app/api/nfc-tags/verify/route.ts` to note the POST is retained only for legacy dashboard callers
- [x] Updated `components/ui/LEGACY_COMPONENTS.md` to reflect the removal

### Phase 7 — Documentation
- [x] New: [`docs/features/artwork-editor/README.md`](../features/artwork-editor/README.md) — artist upload flow, block types, API contract
- [x] New: [`docs/features/collector-experience/README.md`](../features/collector-experience/README.md) — entry points, four page states, claim flow
- [x] Updated: [`docs/features/nfc-authentication/README.md`](../features/nfc-authentication/README.md) — v4 data flow, testing matrix, API table
- [x] Wiki updates: [`wiki/concepts/nfc-authentication.md`](../../wiki/concepts/nfc-authentication.md), [`wiki/concepts/conditional-artwork-access.md`](../../wiki/concepts/conditional-artwork-access.md), [`wiki/concepts/collector-dashboard.md`](../../wiki/concepts/collector-dashboard.md)
- [x] Wiki source: [`wiki/sources/2026-04-17-nfc-consolidation.md`](../../wiki/sources/2026-04-17-nfc-consolidation.md)

## Files Modified

- `app/api/nfc-tags/redirect/route.ts`
- `app/pages/authenticate/page.tsx`
- `app/nfc/unlock/page.tsx`
- `app/auth/nfc/[token]/route.ts`
- `app/api/collector/artwork/[id]/nfc-url/route.ts`
- `app/collector/artwork/[id]/page.tsx`
- `app/api/vendor/artwork-pages/[productId]/route.ts`
- `app/api/vendor/artwork-pages/[productId]/apply-template/route.ts`
- `app/api/vendor/artwork-pages/[productId]/copy-from/route.ts`
- `app/api/nfc-tags/verify/route.ts` (comment only)
- `components/ui/LEGACY_COMPONENTS.md`
- `docs/features/nfc-authentication/README.md`
- `wiki/concepts/nfc-authentication.md`
- `wiki/concepts/conditional-artwork-access.md`
- `wiki/concepts/collector-dashboard.md`

## Files Created

- `docs/features/artwork-editor/README.md`
- `docs/features/collector-experience/README.md`
- `wiki/sources/2026-04-17-nfc-consolidation.md`
- `docs/COMMIT_LOGS/nfc-flow-consolidation-2026-04-17.md` (this file)

## Files Removed

- `components/ui/nfc-pairing-wizard.tsx`

## Deployment Notes

- No new migrations required.
- Env vars unchanged (`NEXTAUTH_SECRET` / `JWT_SECRET`, `NEXT_PUBLIC_APP_URL`).
- After deploy, run the [testing matrix in the nfc-authentication README](../features/nfc-authentication/README.md#testing-steps-v4-canonical-flow) covering all four scan states.
- Any physical tags previously programmed with `/auth/nfc/[token]` or `/nfc/unlock` URLs continue to work via the redirect shims; re-programming is not required.

## Rollback

Revert this commit; the legacy entry points remain on disk (as redirect-only pages/routes), so the previous behavior is restored simply by reverting `/api/nfc-tags/redirect/route.ts`, the artwork page, and the vendor API defaults. The deleted `nfc-pairing-wizard.tsx` must be restored from git if rollback is needed.
