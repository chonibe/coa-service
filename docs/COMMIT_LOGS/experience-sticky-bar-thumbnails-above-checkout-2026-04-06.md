# Commit context: Experience sticky bar — thumbnails above checkout (2026-04-06)

## Checklist

- [x] [ExperienceCheckoutStickyBar.tsx](../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx) — Stack layout: top row = add FAB + horizontal thumbnail strip; second row = full-width checkout pill (`w-full`).
- [x] [SplineFullScreen.tsx](../../app/(store)/shop/experience/components/SplineFullScreen.tsx) — Docked back-to-top `paddingBottom` increased (`4.75rem` → `8rem` + safe area) so the control clears the taller sticky bar.

## Notes

Applies to both `/shop/experience` and `/shop/experience-v2` (shared `ExperienceCheckoutStickyBar`).
