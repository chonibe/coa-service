# Commit log: Spline idle yaw sway with artwork on lamp (2026-04-08)

## Summary

**Idle yaw sway** (~±15°) now runs whenever the experience Spline uses **`animate`**, including when **artworks are assigned to the lamp preview**. Previously `idleSpinEnabled` was tied to `lampPreviewCount` / `collectionArtworkCount` (reel) or `lampPreviewOrder.length === 0` (Configurator).

## Checklist

- [x] [`app/(store)/shop/experience/components/SplineFullScreen.tsx`](../../app/(store)/shop/experience/components/SplineFullScreen.tsx) — `idleSpinEnabled`; `lampPreviewCount` / `collectionArtworkCount` kept for callers, underscore-destructured (unused)
- [x] [`app/(store)/shop/experience/components/CarouselStripLampSpline.tsx`](../../app/(store)/shop/experience/components/CarouselStripLampSpline.tsx) — `idleSpinEnabled`; props unchanged for API parity
- [x] [`app/(store)/shop/experience-v2/components/Configurator.tsx`](../../app/(store)/shop/experience-v2/components/Configurator.tsx) — removed `idleSpinEnabled={lampPreviewOrder.length === 0}` (default true)
- [x] [`docs/features/experience/README.md`](../../docs/features/experience/README.md) — idle behavior
- [x] [`docs/features/experience-v2/README.md`](../../docs/features/experience-v2/README.md) — idle behavior
- [x] [`docs/features/experience/ROTATION_AND_SELECTION_LOGIC.md`](../../docs/features/experience/ROTATION_AND_SELECTION_LOGIC.md) — idle behavior
