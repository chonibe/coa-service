# Commit log: Featured bundle strip — horizontal scroll + carousel-style selection (2026-04-06)

## Summary

The featured artist bundle card under the Spline uses a **horizontally scrollable** thumbnail row (snap, `touch-pan-x`, desktop drag-to-scroll) aligned with the main **ArtworkCarouselBar** behavior. Tiles are **smaller** (`w-14` / `sm:w-24`). The strip can include **up to 8** products: Street Lamp, the two bundle pair prints, then additional spotlight catalog prints so the row **overflows and slides** when the artist collection is larger.

## Selection / tap behavior (parent)

- **Lamp, not yet in order:** same as before — add lamp + spotlight filter + bump.
- **Lamp, already in order:** sync main carousel selection and `displayedProduct` (like tapping the lamp tile on the strip).
- **Print, not in cart:** add artwork + analytics + lamp preview (existing flow).
- **Print, in cart:** `handleTapCarouselItem` / lamp preview toggle (carousel parity).

## Checklist

- [x] [`FeaturedArtistBundleSection.tsx`](../../app/(store)/shop/experience/components/FeaturedArtistBundleSection.tsx) — scroll container, snap, drag, eye row, selected ring, `aria-current`.
- [x] [`SplineFullScreen.tsx`](../../app/(store)/shop/experience/components/SplineFullScreen.tsx) — `bundlePreviewStripProducts`, `bundleStripSelectedProductId`, `bundleStripLampPreviewProductIds`, `onBundleStripItemPress`.
- [x] [`ExperienceV2Client.tsx` (v2)](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) — strip list + `handleBundleStripItemPress` + PostHog carousel event when re-selecting from strip.
- [x] [`ExperienceV2Client.tsx` (legacy)](../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) — same strip list + handler (no extra funnel event).

## Deployment

`vercel --prod --yes` after commit.
