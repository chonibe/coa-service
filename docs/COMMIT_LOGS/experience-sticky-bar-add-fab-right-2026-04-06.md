# Commit context: Experience sticky bar — add (+) FAB on the right (2026-04-06)

## Checklist

- [x] [ExperienceCheckoutStickyBar.tsx](../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx) — Top row order: scrollable thumbnails (`flex-1`) first, **add-artwork button last**; when thumbnails suppressed, `justify-end` so the FAB stays on the right.

## Notes

Same component serves `/shop/experience` and `/shop/experience-v2`.
