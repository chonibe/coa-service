# Commit log: Sticky checkout thumb — eye for selected print, no selection ring (2026-04-06)

## Checklist

- [x] [`ExperienceCheckoutStickyBar.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx) — Removed **`ring-[#FFBA94]`** selection outline on spline-select thumbs; **`Eye`** badge (scaled for `w-9`/`w-10` tiles) above **selected non-lamp** slots when **`onSelectThumbnailForSpline`** is active; **`overflow-visible`** + clipped image wrapper; keyboard focus uses **`outline-none`** + **`focus-visible:ring`**.

## QA

- Mobile sticky strip: tap prints — selected tile shows small eye overlapping top edge; no coral ring.
- Lamp-only selection: no eye (prints only), still no ring on lamp.
