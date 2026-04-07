# Commit log: Featured bundle strip — forward vertical wheel to reel (2026-04-07)

## Summary

Mirrors [`ArtworkCarouselBar`](../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) wheel behavior: **vertical** trackpad/mouse wheel over the featured bundle card applies to the **experience reel** (`scrollRef` in [`SplineFullScreen`](../../app/(store)/shop/experience/components/SplineFullScreen.tsx)). **Horizontal-dominant** wheel while the pointer is on the thumb strip still scrolls the strip only. Prevents the bundle block from “eating” page up/down scroll.

## Checklist

- [x] [`FeaturedArtistBundleSection.tsx`](../../app/(store)/shop/experience/components/FeaturedArtistBundleSection.tsx) — `bundleWheelHostRef` + non-passive `wheel` listener; `overscroll-y-auto` on strip; removed `touch-manipulation` on thumb buttons.
- [x] [`SplineFullScreen.tsx`](../../app/(store)/shop/experience/components/SplineFullScreen.tsx) — `experienceReelRef={scrollRef}` into bundle section.
