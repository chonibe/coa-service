# NFC Authentication (Mobile-First)

## Overview
The NFC Authentication system allows collectors to physically verify ownership of their artworks using NFC tags. This implementation is mobile-first, utilizing bottom sheets and Web NFC for a native-like experience on supported devices.

## Features
- **Mobile-Native UI**: Uses `vaul` bottom sheets for ergonomic one-handed use.
- **Web NFC Integration**: Direct scanning on Chrome for Android.
- **iOS Support**: Instructional fallback for Safari/iOS users to use native system scanning.
- **Haptic Feedback**: Tactile vibration alerts on scan success.
- **Gamification**: Instant reward of Ink-O-Gatchi credits upon successful authentication.
- **Centralized Component**: The `NFCAuthSheet` is shared across the dashboard and profile.
- **NFC Tag Writer**: Write permanent URLs to physical NFC tags directly from the browser.
- **Exclusive Content**: Unlock page fetches and renders real product benefit blocks (text, image, video, audio).
- **Permanent Tag URLs**: Physical tags use non-expiring redirect URLs (`/api/nfc-tags/redirect?tagId=...`).

## Technical Implementation

### Shared Token Utilities
- [`lib/nfc/token.ts`](../../../lib/nfc/token.ts): Centralized `base64UrlEncode`, `base64UrlDecode`, `getSigningSecret`, `signPayload`, and `validateToken` functions. All NFC routes import from here—no duplication.

### Components
- [`components/nfc/nfc-auth-sheet.tsx`](../../../components/nfc/nfc-auth-sheet.tsx): **Canonical** multi-step NFC claim sheet. Triggered by `/collector/artwork/[id]` when the page receives `?claim=pending` or `?scan=pending` from `/api/nfc-tags/redirect`.
- [`components/nfc/nfc-tag-writer.tsx`](../../../components/nfc/nfc-tag-writer.tsx): Write URLs to NFC tags (Web NFC) or copy-URL fallback.
- [`src/components/NfcTagScanner.tsx`](../../../src/components/NfcTagScanner.tsx): Standalone scanner card component.
- ~~`components/ui/nfc-pairing-wizard.tsx`~~: **Removed 2026-04** — superseded by `NFCAuthSheet` driven by the canonical `/api/nfc-tags/redirect` flow. Its NDEF-raw-payload assumption was incompatible with the URL-based tag scheme.

### Hooks
- [`hooks/use-nfc-scan.ts`](../../../hooks/use-nfc-scan.ts): React hook wrapping the Web NFC API.
  - Uses `useRef` for `NDEFReader` and `AbortController` for proper cleanup.
  - Parses full NDEF message records (not just `serialNumber`).
  - Exports `writeTag(url)` for writing URLs to tags.
  - Exports `isWriteSupported` flag.

### API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/nfc-tags/claim` | POST | Links a physical tag ID to a digital line item. **Requires collector session auth.** Validates ownership. |
| `/api/nfc-tags/verify` | GET | Look up tag by `?tagId=` — returns claim status. |
| `/api/nfc-tags/verify` | POST | Legacy pairing handler retained for `/customer/dashboard` and `/admin/preview`. New flows should use `/api/nfc-tags/claim`. |
| `/api/nfc-tags/sign` | POST | Signs a token for one-time auth flows (10-min TTL). Also returns `permanentUrl` for physical tags. |
| `/api/nfc-tags/redirect` | GET | **Canonical NFC entry point.** Accepts `?tagId=` or `?token=`, resolves `line_item_id`, logs the scan, and redirects to `/collector/artwork/[lineItemId]` with a state query (`?claim=pending`, `?authenticated=true`, `?preview=true`, or `?scan=pending` via `/login`). |
| `/api/nfc-tags/get-programming-data` | GET | Returns tag data and permanent URL for NFC writers. |
| `/auth/nfc/[token]` | GET | Thin 308 redirect to `/api/nfc-tags/redirect?token=…` (kept for backward compatibility with older printed links). |
| `/pages/authenticate` | GET | Thin redirect to `/api/nfc-tags/redirect` (deprecated demo page). |
| `/nfc/unlock` | GET | Server-side token decode → redirect to `/api/nfc-tags/redirect` (deprecated standalone unlock page). |

### Canonical Data Flow (v4)
All NFC scans converge on **`/api/nfc-tags/redirect` → `/collector/artwork/[lineItemId]`**. The artwork page is the single canonical landing surface; there is no longer a separate unlock page.

1. Physical scan (or admin-signed link) hits `/api/nfc-tags/redirect?tagId=…` or `?token=…`.
2. Route resolves `line_item_id` (from signed token or `nfc_tags` lookup) and logs the scan.
3. Route reads the collector session cookie and compares to `orders.shopify_customer_id`.
4. Route 302s to `/collector/artwork/[lineItemId]` with one of:
   - `?scan=pending` after `/login?intent=collector&redirect=…` — guest returning signed-in.
   - `?preview=true` — signed-in non-owner (read-only copy, no claim CTA).
   - `?authenticated=true` — signed-in owner, already claimed.
   - `?claim=pending` — signed-in owner, not yet claimed (page auto-opens `NFCAuthSheet`).
5. `NFCAuthSheet` POSTs to `/api/nfc-tags/claim`, which validates ownership, sets `order_line_items_v2.nfc_claimed_at`, writes audit logs, and returns the reward payload.
6. UI plays the unlock animation and transitions to the authenticated view on the same page.

### Database
- **`nfc_tags`**: Core tag registry (tag_id, status, line_item_id, certificate_url, etc.)
- **`nfc_tag_scans`**: Audit log of every physical scan (tag_id, scanned_at, ip_address, user_agent). Migration: `20260214000000_create_nfc_tag_scans.sql`.
- **`nfc_tag_audit_log`**: Action-level audit trail for claim, verify, and error events.

### Security
- **No hardcoded secrets**: All signing uses env vars (`NEXTAUTH_SECRET`, `JWT_SECRET`, or `SUPABASE_SERVICE_ROLE_KEY`). Throws if none configured.
- **Collector session authentication**: Claim endpoint verifies `collector_session` cookie or `shopify_customer_id` cookie. Validates the collector owns the order.
- **Rate limiting**: Covered by the global `/api/*` middleware in `middleware.ts`.

## Testing Steps (v4 canonical flow)

**Scan-state matrix — test all four states land on `/collector/artwork/[lineItemId]` with the expected UI:**

| Scanner state | Expected redirect chain | Expected UI |
|---|---|---|
| Guest (no cookies) | `/api/nfc-tags/redirect` → `/login?intent=collector&redirect=/collector/artwork/[id]?scan=pending` → `/collector/artwork/[id]?scan=pending` | After sign-in, page auto-opens `NFCAuthSheet`. |
| Signed-in non-owner | `/api/nfc-tags/redirect` → `/collector/artwork/[id]?preview=true` | Preview banner, no claim CTA, no locked-preview teaser. |
| Signed-in owner, not claimed | `/api/nfc-tags/redirect` → `/collector/artwork/[id]?claim=pending` | Page auto-opens `NFCAuthSheet` exactly once. |
| Signed-in owner, already claimed | `/api/nfc-tags/redirect` → `/collector/artwork/[id]?authenticated=true` | Green "Welcome back" toast + full content. |

**Legacy device tests**

1. **Android (Chrome)**: 
   - Open the dashboard.
   - Click "Authenticate" on a pending artwork.
   - Follow the wizard and scan a physical NTAG213/215 tag.
2. **iOS (Safari)**:
   - Observe the instructional fallback.
   - Close the browser and scan the tag natively to verify redirection logic.
3. **NFC Tag Writer**:
   - Navigate to the NFC management page or artwork page.
   - Use the `NfcTagWriter` component to write a permanent URL to a tag.
   - Verify the tag redirects correctly when scanned.
4. **Unlock Page**:
   - Generate a signed URL via `/api/nfc-tags/sign`.
   - Navigate to `/nfc/unlock?token=...`.
   - Verify real content blocks render (or fallback message if no blocks exist).

## Deployment Considerations
- Requires HTTPS for Web NFC API to function.
- `NEXTAUTH_SECRET` or `JWT_SECRET` must be configured for signed token verification in redirect flows.
- Run the `20260214000000_create_nfc_tag_scans.sql` migration before deploying.

## Files Changed Summary (Overhaul v3.0.0)

### Modified (11 files):
- `hooks/use-nfc-scan.ts` — rewritten with useRef, AbortController, NDEF parsing, write support
- `app/api/nfc-tags/claim/route.ts` — fixed supabase scope, added all SELECT columns, added collector auth
- `app/api/nfc-tags/verify/route.ts` — added POST handler for pairing wizard
- `app/api/nfc-tags/get-programming-data/route.ts` — removed broken generateRawNdefMessage, added permanent URL
- `app/api/nfc-tags/sign/route.ts` — uses shared token utils, returns permanent URL
- `app/api/nfc-tags/redirect/route.ts` — uses shared token utils
- `app/nfc/unlock/page.tsx` — uses shared token utils, loads real exclusive content from product_benefits
- `app/auth/nfc/[token]/route.ts` — uses shared token utils, removed hardcoded secret
- `src/components/NfcTagScanner.tsx` — added missing lucide-react icon imports
- `components/nfc/nfc-auth-sheet.tsx` — no changes needed (already correct)
- `components/ui/nfc-pairing-wizard.tsx` — already sends POST (now matches backend)

### Created (3 files):
- `lib/nfc/token.ts` — shared token sign/validate utilities
- `components/nfc/nfc-tag-writer.tsx` — NFC tag write component with copy-URL fallback
- `supabase/migrations/20260214000000_create_nfc_tag_scans.sql` — missing table migration

## Versioning
- **Current Version**: 4.0.0 (Canonical NFC Flow Consolidation)
- **Last Updated**: 2026-04-17

## Change Log
| Version | Date | Changes |
|---|---|---|
| 4.0.0 | 2026-04-17 | Consolidated all NFC entry points to `/api/nfc-tags/redirect` → `/collector/artwork/[lineItemId]`. Deprecated `/pages/authenticate` and `/nfc/unlock` to redirects. Converted `/auth/nfc/[token]` to a thin 308. Removed orphan `components/ui/nfc-pairing-wizard.tsx`. Unified `/api/collector/artwork/[id]/nfc-url` to emit the canonical redirect URL. Fixed vendor `product_benefits` defaults (`is_published: true`, `is_active: true`) and allowed `is_active` updates. Added four artwork-page states via search params (`claim=pending`, `authenticated=true`, `preview=true`, `scan=pending`). |
| 3.0.0 | 2026-02-14 | Full NFC overhaul: fixed runtime bugs (supabase scope, missing columns, missing POST handler, missing imports), security fixes (removed hardcoded secret, added collector auth), extracted shared token utilities, rewrote NFC scan hook with cleanup/write support, created NFC tag writer component, added permanent URLs for physical tags, connected real exclusive content to unlock page, created nfc_tag_scans migration |
| 2.0.0 | 2026-01-13 | Integrated mobile-first NFC auth with bottom sheets and Ink-O-Gatchi rewards |
