---
title: "Conditional Artwork Access"
type: concept
tags: [feature, collector, nfc, authentication, content]
created: 2026-04-14
updated: 2026-04-17
sources: [2026-04-14-conditional-artwork-access, 2026-04-17-nfc-consolidation]
---

# Conditional Artwork Access

The "view freely, authenticate to interact" model lets all collectors see artwork content publicly, while NFC authentication unlocks interactive capabilities (posting stories, voice notes, full-resolution media).

## Definition

The collector artwork page (`/collector/artwork/[id]`) always returns content blocks (images, text, videos, artist info, story timelines) regardless of NFC authentication status. The `canInteract: boolean` field on the API response controls whether the collector can post stories and add voice notes. The locked content preview is only shown when content exists AND the collector is the **owner** and is unauthenticated. Non-owners in preview mode do not see the unlock CTA.

## Key Claims

1. Content blocks are always returned — no authentication gate for viewing.
2. Blocks are filtered on both `product_benefits.is_active` **and** `is_published`. Both flags must be `true`. This is the single source of truth shared by the vendor editor write path (`/api/vendor/artwork-pages/[productId]`) and the collector read path (`/api/collector/artwork/[id]`).
3. Newly created blocks (via POST, `apply-template`, or `copy-from`) default to `is_published: true` and `is_active: true` so artist edits are visible to the owner as soon as they are saved.
4. `canInteract: boolean` is true only for NFC-authenticated owners.
5. Lock UI (unlock CTA) appears only when unlockable content exists, the viewer is the owner, and the tag is not yet claimed. Non-owners in `?preview=true` see a read-only banner instead.
6. Artist profile is always visible regardless of authentication or ownership.
7. NFC authentication transitions `canInteract` from false to true without a page reload (via re-fetch).
8. Version: 2.0.0, updated 2026-04-17 alongside the NFC flow consolidation.

## Evidence

- [[2026-04-14-conditional-artwork-access]] — API change details, before/after code pattern

## Tensions

- Moving content visibility from "authentication-gated" to "always visible" may reduce the perceived value of NFC authentication — the incentive to authenticate is now interaction, not access.
- `lockedContentPreview` logic has a compound condition: `!isAuthenticated && hasBlocksToLock` — must be maintained as content types evolve.

## Related

- [[nfc-authentication]]
- [[certificate-of-authenticity]]
- [[collector-dashboard]]
- [[credits-economy]]
