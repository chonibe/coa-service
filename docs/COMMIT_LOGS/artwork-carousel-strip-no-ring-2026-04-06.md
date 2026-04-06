# Commit context: Artwork carousel strip — remove tile rings (2026-04-06)

## Checklist

- [x] [ArtworkCarouselBar.tsx](../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) — Strip lamp placeholder + spotlight placeholder tiles: drop `ring-1 ring-white/45` (dark) / neutral rings (light); use `ring-0 shadow-none`.
- [x] [ArtworkCarouselBar.tsx](../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) — Mini Spline strip tile: replace inset ring with `ring-0` (keep `focus-visible` outline for keyboard).

## Notes

Tailwind `ring-*` drew the visible white outline around `w-24` thumbnail cards. `box-sizing: content-box` on `next/image` fill was not applied — it would fight absolute `inset-0` sizing.
