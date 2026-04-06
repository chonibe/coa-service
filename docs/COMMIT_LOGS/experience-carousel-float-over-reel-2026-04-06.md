# Commit context: Experience carousel floats over reel (2026-04-06)

**Commit:** `e63f06073` — `fix(ui): float experience carousel over reel for true see-through strip`

## Checklist

- [x] [ExperienceV2Client.tsx](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) — Volume discount row + `ArtworkCarouselBar` live in `absolute inset-x-0 top-0 z-[50]` overlay (`pointer-events-none` shell; volume bar `pointer-events-auto`). Removes in-flow flex reservation so the 3D reel extends under transparent strip chrome.
- [x] [ExperienceV2Client.tsx](../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) — Same overlay pattern for legacy `/shop/experience` route (carousel only; no volume bar).
- [x] [SplineFullScreen.tsx](../../app/(store)/shop/experience/components/SplineFullScreen.tsx) — No code change; continues to use `absolute inset-0` root; parent passes `min-h-0 w-full flex-1` without `order-*`.

## Notes

`text-transparent` + `bg-transparent` on strip wrappers were insufficient when the strip still **reserved flex height**—the viewport showed a solid-looking band (`#171515` letterbox / shell) instead of the lamp through the gutter. Floating the strip fixes stacking without changing thumbnail tile styling (tiles still use their own overlays).
