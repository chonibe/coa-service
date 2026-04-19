---
title: "Conditional Artwork Access Documentation"
type: source
tags: [collector, nfc, content-access, api]
created: 2026-04-14
updated: 2026-04-14
sources: []
---

# Conditional Artwork Access Documentation

Feature documentation for the view-freely, authenticate-to-interact access model on collector artwork pages.

## Metadata

- **Author**: The Street Collector team
- **File**: `docs/features/conditional-artwork-access/README.md`
- **Version**: 1.0.0
- **Implemented**: 2026-02-01

## Summary

Previously, content blocks were gated behind NFC authentication. This feature removes the view gate but preserves the interaction gate. The API now always returns content blocks and adds `canInteract: boolean` to indicate interaction permission. The locked content preview (unlock CTA) is shown only when content exists AND the user is unauthenticated.

## Key Takeaways

- `GET /api/collector/artwork/[id]`: `contentBlocks` always returned; `canInteract: boolean` new field.
- `lockedContentPreview` logic: `!isAuthenticated && hasBlocksToLock` (not just `!isAuthenticated`).
- Artist profile always visible.
- Interaction capabilities (stories, voice notes) still require NFC auth.
- Change was in `app/api/collector/artwork/[id]/route.ts` and `app/collector/artwork/[id]/page.tsx`.

## New Information

- Before: `contentBlocks: isAuthenticated ? contentBlocks : []` — empty for unauthenticated.
- After: `contentBlocks: contentBlocks` — always populated.
- `canInteract` is the new permission signal replacing the content gating approach.

## Contradictions

None against other wiki pages.

## Entities Mentioned

- [[the-street-collector]]
- [[supabase]]

## Concepts Touched

- [[conditional-artwork-access]]
- [[nfc-authentication]]
- [[collector-dashboard]]
