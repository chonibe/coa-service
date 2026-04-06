# Commit log: Sticky bar — eye for both lamp-side prints, row above thumb (2026-04-06)

## Checklist

- [x] [`ExperienceCheckoutStickyBar.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx) — Prop **`lampPreviewProductIds`**; **`LampPreviewEyeBadge`** above each **artwork** thumb when id is in that list (side A + B). Reserved **`h-[15px]`** row + **`pt-1`** on scroll so the badge is not clipped by the thumb **`overflow-hidden`**. Strip row uses **`items-end`**; **`+N`** uses matching spacer column.
- [x] [`ExperienceV2Client.tsx` (v2 + legacy)](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) — Pass **`lampPreviewProductIds={lampPreviewOrder}`**.

## QA

- Two different prints on lamp: both sticky artwork tiles show the eye above the image.
- One print on lamp: one eye.
- Lamp tile: no eye.
