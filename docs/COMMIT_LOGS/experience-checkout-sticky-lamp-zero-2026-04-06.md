# Commit log: Checkout sticky bar — hide lamp thumb when lamp not in cart

**Date:** 2026-04-06

## Checklist

- [x] [`app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx) — Remove mobile-only branch that always rendered `StickyThumb` for the lamp; use **`visibleSlots`** (lamp entries only when `lampQuantity > 0`) for all breakpoints.
- [x] [`docs/features/experience-v2/README.md`](../../docs/features/experience-v2/README.md) — Sticky bar thumbnail behavior.
- [x] [`docs/features/experience/README.md`](../../docs/features/experience/README.md) — Mobile sticky bar bullet corrected.

## Notes

- Desktop path already used `slots` / `visibleSlots` correctly; the bug was isolated to the `md:hidden` block.
