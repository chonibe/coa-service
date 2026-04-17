# Collector Experience — Artwork Page & NFC Claim Flow

**Canonical reference for the collector side of the "hidden artwork" experience.** This document describes every way a user lands on `/collector/artwork/[lineItemId]` and how the page behaves in each state.

## Feature Overview

`/collector/artwork/[lineItemId]` is the **single canonical landing page** for every NFC scan, every link from the dashboard, and every admin-signed preview URL. The page renders four distinct experiences driven by search-param state from [`/api/nfc-tags/redirect`](../../../app/api/nfc-tags/redirect/route.ts):

| State query | Meaning | Page behavior |
|---|---|---|
| `?scan=pending` | Guest just completed sign-in after scanning a tag. | After sign-in returns the user here, the page auto-opens `NFCAuthSheet` for the claim. |
| `?preview=true` | Signed-in user who is **not** the owner of this edition. | Read-only copy with a preview banner. No claim CTA. Locked-preview teaser is suppressed. |
| `?claim=pending` | Signed-in owner who has not yet claimed this tag. | Page auto-opens `NFCAuthSheet` exactly once. |
| `?authenticated=true` | Signed-in owner, tag already claimed (either just now or previously). | Green "Welcome back" toast + full content. |

Implementation: [`app/collector/artwork/[id]/page.tsx`](../../../app/collector/artwork/[id]/page.tsx).

## Entry Points (all funnel into `/api/nfc-tags/redirect`)

| Entry | What it does |
|---|---|
| Physical NFC tap of a programmed tag | Tag URL is always `{APP_URL}/api/nfc-tags/redirect?tagId=…&token=…`. |
| Admin-signed preview link | `POST /api/nfc-tags/sign` returns a `permanentUrl` pointing to the same redirect endpoint. |
| Collector-programmed tag | [`/api/collector/artwork/[id]/nfc-url`](../../../app/api/collector/artwork/[id]/nfc-url/route.ts) returns the same canonical format for artists/collectors writing their own NTAG. |
| Legacy `/auth/nfc/[token]` | [`app/auth/nfc/[token]/route.ts`](../../../app/auth/nfc/[token]/route.ts) is now a thin 308 redirect to `/api/nfc-tags/redirect?token=…`. |
| Legacy `/pages/authenticate` | [`app/pages/authenticate/page.tsx`](../../../app/pages/authenticate/page.tsx) is a server redirect to the canonical endpoint. |
| Legacy `/nfc/unlock` | [`app/nfc/unlock/page.tsx`](../../../app/nfc/unlock/page.tsx) decodes the token server-side and redirects to the canonical endpoint. |
| Collector dashboard link | "View artwork" buttons link directly to `/collector/artwork/[lineItemId]`; no state param needed. |

### Canonical redirect logic

Implemented in [`app/api/nfc-tags/redirect/route.ts`](../../../app/api/nfc-tags/redirect/route.ts):

1. Resolve `line_item_id` from `?token=` (validated via `lib/nfc/token.ts`) or from `?tagId=` (lookup in `nfc_tags`).
2. Log the scan via `logScan()` → `nfc_tag_scans`.
3. Fetch `order_line_items_v2` + `orders.shopify_customer_id` to determine ownership.
4. Read `collector_session` cookie via `verifyCollectorSessionToken` (fallback to `shopify_customer_id` cookie).
5. 302 to `/collector/artwork/[lineItemId]` with the correct state query, **or** to `/login?intent=collector&redirect=/collector/artwork/[id]?scan=pending` for guests.

## Claim Flow

Once the collector reaches `/collector/artwork/[lineItemId]?claim=pending` (or `?scan=pending`):

1. [`page.tsx`](../../../app/collector/artwork/[id]/page.tsx) runs an effect that opens [`NFCAuthSheet`](../../../components/nfc/nfc-auth-sheet.tsx) if `!artwork.isAuthenticated`. Guarded by a `hasAutoPromptedClaim` flag so it fires once.
2. `NFCAuthSheet` drives either a Web NFC scan (via `hooks/use-nfc-scan.ts`) or manual code entry.
3. On scan, it POSTs to [`/api/nfc-tags/claim`](../../../app/api/nfc-tags/claim/route.ts) with `{ tagId, lineItemId }`.
4. `claim` validates collector ownership (`orders.shopify_customer_id` === session customer id), sets `order_line_items_v2.nfc_claimed_at`, writes `nfc_tag_audit_log`, and returns gamification rewards.
5. UI plays the unlock reveal animation and refetches `/api/collector/artwork/[id]` with `canInteract = true`.

## Read API

[`GET /api/collector/artwork/[id]`](../../../app/api/collector/artwork/[id]/route.ts) always returns the artwork payload so the page can render the same shell regardless of auth state. Gating is **interaction-level** (`canInteract`), not visibility-level.

Filters on `product_benefits`:

```ts
.eq("is_published", true)
.eq("is_active", true)
```

Both flags must be `true` — this is the single source of truth shared with the vendor editor write path. See [`docs/features/artwork-editor/README.md`](../artwork-editor/README.md).

Returns:
- `artwork.contentBlocks`: ordered blocks (with Section Groups holding their children).
- `artwork.lockedContentPreview`: `{ type, label }[]` teasers used before claim.
- `artwork.isAuthenticated`: `!!nfc_claimed_at`.
- `artwork.canInteract`: gating flag for UI (defaults to `isAuthenticated`).

## UI / UX Considerations

- **Always render the shell.** Image, artist, story, and content blocks render in every state. Authentication unlocks interactions, not existence.
- **Preview banner.** Non-owners see a friendly read-only banner explaining the authenticated experience is reserved for the edition's owner.
- **Sticky CTA.** Only shown when `!isAuthenticated && !previewMode` (owner has not yet claimed). Copy: "Pair your NFC to verify ownership" / "Scan NFC or enter code manually".
- **Fresh authentication toast.** When `?authenticated=true` is present and `isAuthenticated` is true, show a transient green banner "Welcome back — this edition is paired to your account."
- **No more standalone unlock page.** `/nfc/unlock` redirects here.

## Security

- All state decisions happen server-side in `/api/nfc-tags/redirect` before the browser ever sees the artwork page — the page cannot be "tricked" into granting auth by fiddling with query params, because `artwork.isAuthenticated` comes from the server.
- Claim validation cross-checks `collector_session` cookie vs `orders.shopify_customer_id`.
- Token signing uses `NEXTAUTH_SECRET` / `JWT_SECRET` / `SUPABASE_SERVICE_ROLE_KEY` via `lib/nfc/token.ts` (throws if none configured).

## Testing Requirements

Run all four scenarios end-to-end:

- [ ] **Guest flow:** Clear cookies → tap tag URL → confirm redirect to `/login?intent=collector&redirect=…` → sign in → land on `/collector/artwork/[id]?scan=pending` → `NFCAuthSheet` auto-opens → complete claim.
- [ ] **Non-owner flow:** Sign in as user B → tap a tag owned by user A → confirm redirect to `/collector/artwork/[id]?preview=true` → confirm preview banner + no CTA.
- [ ] **Owner, not claimed:** Sign in as owner → tap their own tag → confirm redirect to `/collector/artwork/[id]?claim=pending` → `NFCAuthSheet` auto-opens.
- [ ] **Owner, already claimed:** Same as above after a successful claim → confirm redirect to `/collector/artwork/[id]?authenticated=true` → "Welcome back" toast appears.
- [ ] **Editor ↔ collector:** Edit a block in `/artwork-editor/[productId]` → save → reload owner artwork page → block change appears. Unpublish a block → block disappears from collector view.

## Deployment Considerations

- Required env: `NEXT_PUBLIC_APP_URL`, `NEXTAUTH_SECRET` (or `JWT_SECRET`), Supabase service role.
- Migration dependencies: `nfc_tag_scans`, `nfc_tag_audit_log`, `order_line_items_v2` (with `nfc_tag_id`, `nfc_claimed_at`).
- HTTPS required for Web NFC API.

## Known Limitations

- `NFCAuthSheet` Web NFC path is Android/Chrome only. iOS users use the manual-code path or scan with the native iOS NFC reader and follow the URL in Safari.
- Scan logging in `/api/nfc-tags/redirect` uses `logScan(supabase, request, tagId)`; if the tag isn't in `nfc_tags` yet, the log still fires with what we have but will not map to an `order_id`.

## Future Improvements

- Push notifications to the owner when a non-owner previews their edition.
- Per-block "just unlocked" badge on newly claimed editions.
- Offline-first caching of authenticated block content via service worker.

## Related Docs

- Artist side: [`docs/features/artwork-editor/README.md`](../artwork-editor/README.md)
- NFC protocol: [`docs/features/nfc-authentication/README.md`](../nfc-authentication/README.md)
- Wiki: [`wiki/concepts/nfc-authentication.md`](../../../wiki/concepts/nfc-authentication.md), [`wiki/concepts/conditional-artwork-access.md`](../../../wiki/concepts/conditional-artwork-access.md), [`wiki/concepts/collector-dashboard.md`](../../../wiki/concepts/collector-dashboard.md)

## Version

- **Current Version:** 4.0.0 (Canonical NFC Flow Consolidation)
- **Last Updated:** 2026-04-17
- **Changelog:**
  - 4.0.0 (2026-04-17) — Consolidated every NFC entry point into `/api/nfc-tags/redirect` → `/collector/artwork/[lineItemId]`. Introduced four explicit page states (`claim=pending`, `authenticated=true`, `preview=true`, `scan=pending`). Removed standalone unlock page as a UI surface. Deleted orphan `nfc-pairing-wizard`. Unified collector-generated NFC URL format with admin-signed URL format.
