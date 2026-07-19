# Purchase UX clarity — scarcity, shipping timeline, Stripe Link — 2026-07-19

## Summary

Addressed Experience / checkout UX critique: inline explanations for scarcity / street ladder / edition holds; shipping duration visible before Stripe; Checkout no longer defaults to Link phone verification.

## Checklist

- [x] [`lib/shop/experience-purchase-hints.ts`](../../lib/shop/experience-purchase-hints.ts) — Shared scarcity / ladder / hold hint copy + shipping trust constant
- [x] [`ExperienceMeaningHint.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceMeaningHint.tsx) — Expandable “What this means” / always-visible microcopy
- [x] [`ExperienceV3ProductPanel.tsx`](../../app/(store)/shop/experience-v3/components/ExperienceV3ProductPanel.tsx) — Wire street ladder into edition strip; scarcity hint
- [x] [`StreetLadderScarcityAddon.tsx`](../../app/(store)/shop/experience-v2/components/StreetLadderScarcityAddon.tsx) — Ladder “What this means”
- [x] [`EditionHoldIndicator.tsx`](../../app/(store)/shop/experience-v2/components/EditionHoldIndicator.tsx) — Hold banner helper text
- [x] [`ExperienceV3FloatingAddCard.tsx`](../../app/(store)/shop/experience-v3/components/ExperienceV3FloatingAddCard.tsx) — Sticky ladder microcopy
- [x] Trust / home / OrderBar shipping labels include **9–15 business days**; Stripe delivery estimate aligned
- [x] Checkout APIs omit `link` from `payment_method_types`; Payment Element `wallets.link: 'never'`
- [x] [`docs/features/experience/README.md`](../../docs/features/experience/README.md) — Version 1.15.12 changelog

## Manual verification still needed

- [ ] Stripe hosted Checkout opens card form (not Link phone) after Experience Place Order
- [ ] Apple Pay / Google Pay still appear when wallet is available
- [ ] Mobile trust strip shows shipping duration without clipping
