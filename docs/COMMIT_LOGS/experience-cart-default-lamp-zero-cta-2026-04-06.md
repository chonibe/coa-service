# Commit log: Experience cart default lamp 0 + ArtworkDetail Add to cart

**Date:** 2026-04-06

## Checklist

- [x] [`lib/shop/experience-cart-persistence.ts`](../../lib/shop/experience-cart-persistence.ts) — `cartVersion` **3**; default **`lampQuantity` 0**; removed legacy **0 → 1** migration; invalid/missing lamp field defaults to **0**.
- [x] [`app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) — Removed **`hideCta`** on [`ArtworkDetail`](../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx); labels **Add to cart** / **Add lamp to cart**.
- [x] [`app/(store)/shop/experience/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) — Same as v2 client.
- [x] [`app/(store)/shop/experience-v2/components/Configurator.tsx`](../../app/(store)/shop/experience-v2/components/Configurator.tsx) — Matching **`addToOrderLabel`** strings.
- [x] [`app/(store)/shop/experience-v2/components/ArtworkDetail.tsx`](../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx) — Default label **Add to cart**; selected state **Added to cart — Tap to remove**.
- [x] [`docs/features/experience-v2/README.md`](../../docs/features/experience-v2/README.md) — Cart defaults, ArtworkDetail CTA, featured-bundle preview copy fix.

## Notes

- **Featured bundle** still calls **`setLampQuantity(1)`** when the user explicitly applies the bundle — unchanged.
- Existing **`localStorage`** rows with **`lampQuantity: 1`** keep that value on load.
