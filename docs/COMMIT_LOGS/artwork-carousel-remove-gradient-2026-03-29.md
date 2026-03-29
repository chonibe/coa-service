# Artwork carousel: remove under-strip gradient — 2026-03-29

## Summary

Removed the full-width `bg-gradient-to-t` layer under the experience artwork carousel strip (light/dark theme fades).

## Checklist

- [x] [`app/(store)/shop/experience/components/ArtworkCarouselBar.tsx`](../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) — Delete absolute gradient div; keep carousel content and `emptyCollectionStart` for CTA logic.
