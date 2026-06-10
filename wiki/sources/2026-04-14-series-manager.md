---
title: "Series Manager Feature Documentation"
type: source
tags: [series, vendor, gamification, drag-and-drop, unlock]
created: 2026-04-14
updated: 2026-04-14
sources: []
---

# Series Manager Feature Documentation

Feature documentation for the Instagram-style visual series manager with unlock mechanics, drag-and-drop reordering, and gamification.

## Metadata

- **Author**: The Street Collector team
- **File**: `docs/features/series-manager/README.md`
- **Date**: Living document, last observed 2026-04-14

## Summary

The Series Manager gives vendors an Instagram-inspired interface for creating and managing artwork series. The multi-step creation wizard starts with cover art upload (visual-first). Series display in a responsive square grid with hover actions. Each series has a detail view with a horizontal artwork carousel supporting drag-and-drop reordering. Unlock mechanics add gamification — collectors unlock series through purchases, with progress tracked via circular/linear indicators.

## Key Takeaways

- Multi-step creation: cover art → unlock type (card selection) → step indicator → preview.
- Gallery: square cards, hover actions (View/Duplicate/Delete), search + filter, floating create button.
- Detail: large cover art left, info right, horizontal artwork carousel with drag-and-drop.
- Key components: `CoverArtUpload.tsx`, `UnlockTypeCards.tsx`, `StepProgress.tsx`, `UnlockProgress.tsx`, `ArtworkCarousel.tsx`, `SeriesCard.tsx`, `FloatingCreateButton.tsx`.
- Dialog components: `DeleteSeriesDialog.tsx`, `DuplicateSeriesDialog.tsx`, `UnlockCelebration.tsx`, `UnlockTypeTooltip.tsx`, `SearchAndFilter.tsx`.
- Artworks linked to series via `artwork_series_members.shopify_product_id`.
- Series integrate with journey milestone system (series = milestone/island).

## New Information

- `UnlockTypeTooltip.tsx` provides contextual help for each unlock type — reduces vendor confusion.
- `UnlockCelebration.tsx` is a shared celebration animation reused by the journey system.
- Series duplication clones all artworks and settings.

## Contradictions

None against other wiki pages.

## Entities Mentioned

- [[the-street-collector]]
- [[supabase]]
- [[shopify]]

## Concepts Touched

- [[series-manager]]
- [[journey-milestone-system]]
- [[edition-numbering-system]]
- [[vendor-portal]]
