# Commit log: collection + prize pulse — strip only, not sticky bar (2026-04-08)

## Summary

Removed **`animate-experience-collection-plus-prize-pulse`** and **`animate-experience-collection-plus-prize-float`** from [`ExperienceCheckoutStickyBar`](../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx) so the **Your Collection** row / FAB area does not glow; journey **flash** / shine remains. Carousel strip **+** in [`ArtworkCarouselBar`](../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) unchanged.

## Checklist

- [x] [`app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx) — static picker FAB
- [x] [`app/globals.css`](../../app/globals.css) — comment: strip only
- [x] [`docs/features/experience-v2/README.md`](../../docs/features/experience-v2/README.md) — changelog
- [x] [`docs/COMMIT_LOGS/experience-collection-plus-prize-pulse-2026-04-08.md`](../../docs/COMMIT_LOGS/experience-collection-plus-prize-pulse-2026-04-08.md) — aligned wording
