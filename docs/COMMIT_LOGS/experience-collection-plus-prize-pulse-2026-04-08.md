# Commit log: collection + prize glow pulse (2026-04-08)

## Summary

The **collection purple +** (horizontal strip in [`ArtworkCarouselBar`](../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) and round FAB in [`ExperienceCheckoutStickyBar`](../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx)) now uses a **soft breathing glow** and **slight vertical float** (`globals.css`), with motion off under **`prefers-reduced-motion: reduce`**.

## Checklist

- [x] [`app/globals.css`](../../app/globals.css) — `experience-collection-plus-prize-pulse` + `experience-collection-plus-prize-float` + reduced-motion
- [x] [`app/(store)/shop/experience/components/ArtworkCarouselBar.tsx`](../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) — pulse class on picker +; float wrapper
- [x] [`app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx) — same classes + float wrapper
- [x] [`docs/features/experience-v2/README.md`](../../docs/features/experience-v2/README.md) — changelog line
