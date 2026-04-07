# Experience: desktop uses sticky checkout thumbnails only (no top carousel)

## Checklist

- [x] [`app/(store)/shop/experience/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) — Removed `ArtworkCarouselBar` mount; `ExperienceCheckoutStickyBar` uses `suppressCartThumbnails={false}` and `onSelectThumbnailForSpline` on all breakpoints; dropped unused carousel remove helpers and `spotlightPlaceholders`.
- [x] [`app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) — Same shell behavior; removed dynamic `ArtworkCarouselBar` import and `handleRemoveCarouselSlot` / `handleJumpToSpline` used only by the strip.
- [x] [`app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx) — Doc comments updated for thumbnails-always / spline tap behavior.
- [x] [`docs/features/experience/README.md`](../../docs/features/experience/README.md) — Overview: no top strip in shells; sticky thumbnails are the single strip.
- [x] [`docs/features/experience-v2/README.md`](../../docs/features/experience-v2/README.md) — Overview, architecture tree, `ExperienceV2Client` bullet, shared `ArtworkCarouselBar` note.

## Notes

- [`ArtworkCarouselBar.tsx`](../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) remains in the repo unreferenced by these shells; watchlist strip trash UX was only on that strip (mobile already had no strip).
