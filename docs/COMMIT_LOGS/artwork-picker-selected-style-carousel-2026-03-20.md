# Artwork picker / strip — selected style matches carousel — 2026-03-20

## Summary

Reduced the “selected in sheet” affordance: removed **outer ring** + **persistent scale shrink** on artwork cards. Selected (non-merged) cards now use the same **inset peach glow** as [`ArtworkCarouselBar`](../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) “on lamp” thumbnails.

## Checklist

- [x] [`app/(store)/shop/experience/components/ArtworkPickerSheet.tsx`](../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) — `ArtworkCardV2` image area inset shadow; drop `ring-1` / `scale-[0.95]` on wrapper
- [x] [`app/(store)/shop/experience-v2/components/ArtworkStrip.tsx`](../../app/(store)/shop/experience-v2/components/ArtworkStrip.tsx) — same treatment for `isInCart && !isMerged`
- [x] [`docs/features/experience-v2/README.md`](../../docs/features/experience-v2/README.md) — picker + carousel notes, correct `ArtworkPickerSheet` path

## Unchanged

Merged pair rows still use `border-2 border-[#FFBA94]` container styling.
