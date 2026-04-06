# Selector strip prices match cart / OrderBar

**Date:** 2026-04-06

## Summary

`ArtworkStrip` card footers used Shopify `minVariantPrice` only, while `OrderBar` used reserve locks, street ladder, and featured-bundle allocations. Also, **`Configurator.tsx` contained a duplicate block** of `useState` / `useEffect` for edition states and locks (second declarations shadowed the first), so ladder/lock data could fail to flow correctly.

## Changes

- [x] [`Configurator.tsx`](../../app/(store)/shop/experience-v2/components/Configurator.tsx) — Removed duplicate street-edition / reserve-lock hooks; pass `lockedArtworkPrices`, `streetLadderPrices`, and `featuredBundleCheckout` into `ArtworkStrip`.
- [x] [`ArtworkStrip.tsx`](../../app/(store)/shop/experience-v2/components/ArtworkStrip.tsx) — `stripArtworkUnitUsd` / `formatStripPrice` mirror `OrderBar`’s `artworkUnitUsd` (bundle → lock → ladder → storefront); wishlist quick-add uses the same unit.
- [x] [`OrderBar.tsx`](../../app/(store)/shop/experience-v2/components/OrderBar.tsx) — Per-line subtotal uses `artworkUnitUsd(art)` (includes bundle) instead of `experienceArtworkUnitUsd` only, so line totals match the bundle total.
