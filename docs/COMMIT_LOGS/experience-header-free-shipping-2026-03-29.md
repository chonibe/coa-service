# Experience header sub-bar: Free Worldwide Shipping — 2026-03-29

## Summary

Replaced the pricing line below the experience page header with a static **Free Worldwide Shipping** message.

## Checklist

- [x] [`app/(store)/shop/experience-v2/ExperienceSlideoutMenu.tsx`](../../app/(store)/shop/experience-v2/ExperienceSlideoutMenu.tsx) — Sub-bar under main header: removed `Street Lamp · $… · Artworks from $40` (dynamic and fallback); display **Free Worldwide Shipping** instead.

## Routes affected

- `/shop/experience`
- `/shop/experience-v2` (both use the same `ExperienceSlideoutMenu` from `experience-v2`)
