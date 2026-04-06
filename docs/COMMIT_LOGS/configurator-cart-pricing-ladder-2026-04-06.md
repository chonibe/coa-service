# Configurator order totals match ladder / reserve pricing

**Date:** 2026-04-06

## Summary

The quiz/onboarding **Configurator** (legacy experience shell) summed artwork lines using Shopify `minVariantPrice` only and did not pass **Street ladder** (`edition-states`) or **Reserve lock** prices into **OrderBar**. The selector UI and scarcity copy could show ladder pricing while the experience cart chip and `OrderBar` subtotals stayed on list price. Logic now mirrors **ExperienceV2Client**: fetch edition states + reserve locks, use `experienceArtworkUnitUsd` for `artworksTotal` / `orderTotal`, and pass `lockedArtworkPrices` and `streetLadderPrices` through `setOrderBarProps`.

## Checklist

- [x] [`app/(store)/shop/experience-v2/components/Configurator.tsx`](../../app/(store)/shop/experience-v2/components/Configurator.tsx) — Edition-states fetch, ladder map, reserve locks, `artworksTotal` via `experienceArtworkUnitUsd`, OrderBar props.

## Related

- [`ExperienceV2Client.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) — Reference implementation (already correct).
- [`OrderBar.tsx`](../../app/(store)/shop/experience-v2/components/OrderBar.tsx) — Consumes `lockedArtworkPrices` / `streetLadderPrices` for display and Stripe line items.
