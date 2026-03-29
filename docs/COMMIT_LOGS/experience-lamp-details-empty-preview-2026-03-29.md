# Commit log: Fix Street Lamp details when lamp preview is empty

**Date:** 2026-03-29

## Problem

With **no artwork on the Spline** (`lampPreviewOrder.length === 0`) but **artworks still in the cart**, the carousel “last clicked” sync set `displayedProduct` to the first strip artwork. That replaced the Street Lamp as the product driving `ArtworkAccordions` / specs / what’s included under the reel.

## Fix

In [`ExperienceV2Client.tsx`](../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) (and [`experience-v2` copy](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx)): run **`setDisplayedProduct(lamp)` and return** at the start of the carousel sync effect when `lampPreviewOrder.length === 0`, so the carousel strip cannot override lamp details in that state.

## Checklist

- [x] [`app/(store)/shop/experience/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience/components/ExperienceV2Client.tsx)
- [x] [`app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx)
