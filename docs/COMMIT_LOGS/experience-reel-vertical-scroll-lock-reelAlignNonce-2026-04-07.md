# Experience reel: fix vertical gallery scroll lock (reelAlignNonce wiring)

**Date:** 2026-04-07

## Context

Vertical scrolling in the artwork gallery updated `currentSlide` via `onSlideChange`. That flowed back into `SplineFullScreen`, which could run `scrollIntoView` and snap sections to `block: "start"`, fighting the user’s scroll (“viewport lock”).

## Change checklist

- [x] [`app/(store)/shop/experience/components/SplineFullScreen.tsx`](../../app/(store)/shop/experience/components/SplineFullScreen.tsx) — `scrollIntoView` only when `reelAlignNonce` increases; `onSlideChange` for passive index sync from scroll.
- [x] [`app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) — pass `reelAlignNonce` + `onReelSlideFromScroll`; `bumpReelAlign()` on explicit navigation; hook deps include `bumpReelAlign` where used.
- [x] [`app/(store)/shop/experience/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) — remove `scrollToSplineRef` / old clamp effect; same nonce + scroll handler pattern as v2.

## Verification

- Manually: open experience v2, scroll vertically through gallery — page should not snap-lock on each image; thumbnail taps / jump-to-spline / cart add should still align the reel.
