---
title: "NFC Authentication Feature Documentation"
type: source
tags: [nfc, authentication, mobile, unlock, tokens]
created: 2026-04-14
updated: 2026-04-14
sources: []
---

# NFC Authentication Feature Documentation

Detailed technical documentation for the mobile-first NFC authentication system, covering the React hook, component architecture, API endpoints, token signing, and unlock page.

## Metadata

- **Author**: The Street Collector team
- **File**: `docs/features/nfc-authentication/README.md`
- **Date**: Living document, last observed 2026-04-14

## Summary

The NFC auth system lets collectors physically verify artwork ownership by scanning an NFC tag. The implementation is mobile-first, using `vaul` bottom sheets for ergonomic UI. Chrome for Android gets direct Web NFC scanning; iOS/Safari gets an instructional fallback directing users to use the native system scanner.

Physical NFC tags store **permanent redirect URLs** (`/api/nfc-tags/redirect?tagId=...`) — not expiring signed tokens — so they work indefinitely after pairing. One-time auth flows use a separate signed token (10-minute TTL) from `POST /api/nfc-tags/sign`.

Successful authentication awards Ink-O-Gatchi credits and unlocks exclusive content on the `/nfc/unlock` page. The unlock page reads `product_benefits` records (text, image, video, audio blocks) and renders them.

## Key Takeaways

- Main component: `components/nfc/nfc-auth-sheet.tsx` (`NFCAuthSheet`) — multi-step wizard.
- Tag writer: `components/nfc/nfc-tag-writer.tsx` — writes permanent URLs to physical tags.
- NFC hook: `hooks/use-nfc-scan.ts` — wraps Web NFC API with `useRef`/`AbortController` cleanup.
- Token utilities: `lib/nfc/token.ts` — single source for `base64UrlEncode`, `signPayload`, `validateToken`.
- Permanent tag URL: `/api/nfc-tags/redirect?tagId=...` (non-expiring, logs scans to `nfc_tag_scans`).
- One-time auth URL: signed token with 10-min TTL from `POST /api/nfc-tags/sign`.
- Claim endpoint: `POST /api/nfc-tags/claim` — links physical tag ID to a collector's line item, validates ownership.
- Verify endpoint: `GET /api/nfc-tags/verify?tagId=` — returns claim status.
- Unlock page: `/nfc/unlock` — validates token, fetches `product_benefits`, renders content blocks.
- iOS: instructional fallback (no programmatic NFC write via Safari).
- Credits awarded on successful scan.

## New Information

- The `NfcTagScanner` standalone component lives at `src/components/NfcTagScanner.tsx` (not `components/`).
- `hooks/use-nfc-scan.ts` exports both `writeTag(url)` and `isWriteSupported` flag.
- `nfc_tag_scans` table logs every redirect scan — provides analytics on physical tag usage.
- Product benefits system (`product_benefits` table) is separate from the certificate system.

## Contradictions

None against other wiki pages.

## Entities Mentioned

- [[the-street-collector]]
- [[supabase]]

## Concepts Touched

- [[nfc-authentication]]
- [[certificate-of-authenticity]]
- [[collector-dashboard]]
- [[credits-economy]]
