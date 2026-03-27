# Commit log: Artwork picker empty-state labeled CTA (2026-03-27)

## Summary

Replaced the icon-only blue **+** control that opened the artwork picker when the collection was empty with a **large, centered, text-labeled button** so new users immediately see how to start.

## Checklist

- [x] [`app/(store)/shop/experience/components/ArtworkCarouselBar.tsx`](../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) — Empty collection (`stripMode === 'collection'`, no selected artworks): **“Choose your first artwork”** + `ChevronRight`, `max-w-[min(100%,22rem)]`, `rounded-2xl`, `py-4`, blue filled button. Non-empty: unchanged **glass +** for add.
- [x] [`docs/features/experience-v2/README.md`](../features/experience-v2/README.md) — ArtworkCarouselBar bullet + version line updated; corrected animation note (CSS transition, not Framer on this bar).

## Testing

- [ ] Manual: `/shop/experience-v2` with **empty** local collection — confirm CTA opens picker; after adding one artwork, confirm compact **+** returns.
