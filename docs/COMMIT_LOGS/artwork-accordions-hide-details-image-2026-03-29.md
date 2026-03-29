# Commit log: Hide artwork product image in artwork details card

**Date:** 2026-03-29

## Summary

Removed the hero artwork `Image` from `renderArtworkCardInner` in [`app/(store)/shop/experience/components/ArtworkAccordions.tsx`](../../app/(store)/shop/experience/components/ArtworkAccordions.tsx). The artwork details block now shows title, artist line, and scarcity/edition only (no duplicate product image). Applies to the horizontal gallery first slide and the standalone panel.

## Checklist

- [x] Implementation — [`ArtworkAccordions.tsx`](../../app/(store)/shop/experience/components/ArtworkAccordions.tsx) (removed `aspect-[4/5]` image block; kept `Image` / `getShopifyImageUrl` for lamp details section).
