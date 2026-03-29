# Commit log: picker — single Street price + next bump copy

**Date:** 2026-03-27

## Summary

Removed duplicate price display (overlay chip + footer) on experience artwork picker cards. Street ladder is shown once under the title with stage label, existing scarcity subcopy, and an explicit **next price bump** (or end-of-edition) line from new API fields.

## Checklist

- [x] [`lib/shop/street-collector-pricing-stages.ts`](../../lib/shop/street-collector-pricing-stages.ts) — `getStreetNextPriceBump()` for next rung or edition end.
- [x] [`lib/shop/street-edition-states.ts`](../../lib/shop/street-edition-states.ts) — Shared `StreetEditionStatesRow` type including `nextBump`.
- [x] [`app/api/shop/edition-states/route.ts`](../../app/api/shop/edition-states/route.ts) — Each item includes `nextBump`.
- [x] [`app/(store)/shop/experience/components/ArtworkPickerSheet.tsx`](../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) — Footer-only ladder UI; removed `StreetPricingChip` from card image.
- [x] [`app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) — Map `nextBump` from API.
- [x] [`app/(store)/shop/experience/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) — Same.
- [x] [`docs/features/experience-v2/README.md`](../features/experience-v2/README.md) — Version note.
- [x] [`app/(store)/shop/experience-v2/components/StreetPricingChip.tsx`](../../app/(store)/shop/experience-v2/components/StreetPricingChip.tsx) — Doc comment (picker uses footer).

## Testing

- Open picker on `/shop/experience` or `/shop/experience-v2`: one prominent USD for Street editions; amber line for next step when applicable.
