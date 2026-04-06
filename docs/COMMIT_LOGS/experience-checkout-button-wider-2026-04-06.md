# Commit context: Experience sticky checkout button wider (2026-04-06)

## Checklist

- [x] [ExperienceCheckoutStickyBar.tsx](../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx) — Checkout pill: `px-6 md:px-8`, `min-w-[12rem] sm:min-w-[14rem]`, `justify-center`; when `suppressCartThumbnails` (carousel strip visible), `flex-1` so the button grows in the row.

## Notes

Shared by `/shop/experience` and `/shop/experience-v2` (same component import path).
