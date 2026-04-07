# Commit log: collection + prize glow pulse (2026-04-08)

## Summary

The **collection purple +** on the **horizontal carousel strip** ([`ArtworkCarouselBar`](../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx)) uses a **soft breathing glow** and **slight vertical float** (`globals.css`). The sticky bar **+** FAB ([`ExperienceCheckoutStickyBar`](../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx)) intentionally has **no** prize pulse so it does not compete with the **Your Collection** row / journey flash. Motion off under **`prefers-reduced-motion: reduce`**.

## Checklist

- [x] [`app/globals.css`](../../app/globals.css) — `experience-collection-plus-prize-pulse` + `experience-collection-plus-prize-float` + reduced-motion
- [x] [`app/(store)/shop/experience/components/ArtworkCarouselBar.tsx`](../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) — pulse class on picker +; float wrapper
- [x] [`app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx) — no pulse/float on picker FAB (strip only)
- [x] [`docs/features/experience-v2/README.md`](../../docs/features/experience-v2/README.md) — changelog line
