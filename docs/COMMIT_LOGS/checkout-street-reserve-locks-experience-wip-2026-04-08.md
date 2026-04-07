# Commit log: Checkout street reserve locks + ladder pricing + experience UI

**Date:** 2026-04-08

## Summary

Wires **active Street reserve price locks** (`street_reserve_locks`) into **Stripe checkout** creation via [`fetchActiveStreetReserveLocksUsdByUserId`](../../lib/shop/fetch-street-reserve-locks-server.ts), extends [**`street-ladder-line-pricing`**](../../lib/shop/street-ladder-line-pricing.ts) (and tests), and updates experience v2 surfaces ([`OrderBar`](../../app/(store)/shop/experience-v2/components/OrderBar.tsx), lamp/filter/configurator/cart chip/slideout, etc.). Checkout API routes [`create`](../../app/api/checkout/create/route.ts) and [`create-checkout-session`](../../app/api/checkout/create-checkout-session/route.ts) consume the new pricing inputs.

## Checklist

- [x] [`lib/shop/fetch-street-reserve-locks-server.ts`](../../lib/shop/fetch-street-reserve-locks-server.ts) — server helper for locks by user.
- [x] [`lib/shop/street-ladder-line-pricing.ts`](../../lib/shop/street-ladder-line-pricing.ts) + [`.test.ts`](../../lib/shop/street-ladder-line-pricing.test.ts).
- [x] [`app/api/checkout/create/route.ts`](../../app/api/checkout/create/route.ts), [`create-checkout-session/route.ts`](../../app/api/checkout/create-checkout-session/route.ts).
- [x] Experience v2: [`OrderBar`](../../app/(store)/shop/experience-v2/components/OrderBar.tsx), [`ExperienceCartChip`](../../app/(store)/shop/experience-v2/ExperienceCartChip.tsx), [`ExperienceSlideoutMenu`](../../app/(store)/shop/experience-v2/ExperienceSlideoutMenu.tsx), [`ArtworkDetail`](../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx), [`Configurator`](../../app/(store)/shop/experience-v2/components/Configurator.tsx), [`FilterPanel`](../../app/(store)/shop/experience-v2/components/FilterPanel.tsx), [`LampIncludesSpecsPanel`](../../app/(store)/shop/experience-v2/components/LampIncludesSpecsPanel.tsx), [`LampSelectorPromoBanner`](../../app/(store)/shop/experience-v2/components/LampSelectorPromoBanner.tsx) + test.
- [x] [`docs/COMMIT_LOGS/experience-sticky-bar-thumbnails-above-checkout-2026-04-06.md`](../../docs/COMMIT_LOGS/experience-sticky-bar-thumbnails-above-checkout-2026-04-06.md) — log touch-up.

## Verification

- [ ] Logged-in user with an active reserve lock: checkout line amounts reflect lock where applicable.
- [ ] Experience checkout / OrderBar still completes a test session.
