# Commit log: experience picker footer uses Street ladder USD

**Date:** 2026-03-27

## Summary

The artwork picker card footer (title row) showed Shopify `minVariantPrice` only, while the overlay chip already used the Street ladder. Footer price and early-access strikethrough now use the same reference: ladder `priceUsd` when present and positive, otherwise storefront; early access applies 10% off that reference.

## Checklist

- [x] [`app/(store)/shop/experience/components/ArtworkPickerSheet.tsx`](../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) — `formatPickerCardFooterPrice` replaces storefront-only `formatPrice` for the card footer; early-access compare-at uses ladder-backed reference when applicable.
- [x] [`docs/features/experience-v2/README.md`](../features/experience-v2/README.md) — Version note for picker footer ladder parity.

## Testing

- Open `/shop/experience-v2` or `/shop/experience`, open artwork picker; confirm footer USD under each card matches `StreetPricingChip` / cart ladder for Street editions.
