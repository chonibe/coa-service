---
title: "NFC Authentication"
type: concept
tags: [core-feature, nfc, security, authentication]
created: 2026-04-14
updated: 2026-04-17
sources: [2026-04-14-readme, 2026-04-14-system-ssot, 2026-04-17-nfc-consolidation]
---

# NFC Authentication

NFC Authentication is the physical-digital bridge that links a real-world artwork to its on-chain certificate by encoding a URL onto an NFC tag embedded in the artwork.

## Definition

The Web NFC API (`NDEFReader`) is used in-browser to write and read NFC tags. During the pairing flow, the **canonical redirect URL** is written as a URL record onto the tag. That URL is always of the form `{APP_URL}/api/nfc-tags/redirect?tagId=…&token=…`. When the tag is scanned, the redirect route resolves the scan to a `line_item_id`, logs the scan, and sends the collector to `/collector/artwork/[lineItemId]` with a state query (`?scan=pending`, `?preview=true`, `?claim=pending`, or `?authenticated=true`).

## Key Claims

1. NFC write uses the standard Web NFC API pattern — `NDEFReader.write({ records: [{ recordType: "url", data: canonical_redirect_url }] })`.
2. Only Chrome, Edge, and Opera support Web NFC; Safari is excluded. iPhone users rely on the native NFC reader which opens the URL in Safari.
3. NFC write response time target is < 2 seconds.
4. The NFC tag encodes the canonical redirect URL, not a certificate payload — the payload and claim state live in Supabase.
5. Scanning always lands the collector on `/collector/artwork/[lineItemId]`. There is **no** longer a standalone unlock page — `/nfc/unlock` and `/pages/authenticate` are legacy redirect-only shims.
6. Pairing (tag ↔ line item) is handled via `/api/nfc-tags/claim`, gated by collector session ownership. Re-pairing uses the admin interface.
7. Block visibility for authenticated content is governed by `product_benefits.is_active && is_published` (single source of truth shared by vendor editor and collector API).

## Evidence

- [[2026-04-14-system-ssot]] — Web NFC code pattern, performance target
- [[2026-04-14-readme]] — NFC feature list, browser compatibility

## Tensions

- Safari exclusion affects iPhone users (dominant collector demographic for art platforms).
- Physical NFC tags can be physically removed from artworks — authentication is tag-URL binding, not tamper-evident.

## Related

- [[certificate-of-authenticity]]
- [[collector-dashboard]]
- [[the-street-collector]]
