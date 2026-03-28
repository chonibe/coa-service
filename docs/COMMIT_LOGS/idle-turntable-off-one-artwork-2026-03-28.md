# Commit log: idle turntable off when one artwork on lamp (2026-03-28)

## Summary

Idle Spline “turntable” drift now stops as soon as **at least one** artwork is assigned to the lamp preview, instead of only when **both** sides were filled.

## Checklist

- [x] [`app/(store)/shop/experience/components/SplineFullScreen.tsx`](../../app/(store)/shop/experience/components/SplineFullScreen.tsx) — `idleSpinEnabled={lampPreviewCount < 1}`; JSDoc for `lampPreviewCount` updated
- [x] [`app/(store)/shop/experience-v2/components/Configurator.tsx`](../../app/(store)/shop/experience-v2/components/Configurator.tsx) — `idleSpinEnabled={lampPreviewOrder.length === 0}` for the embedded `Spline3DPreview`
- [x] [`docs/features/experience/ROTATION_AND_SELECTION_LOGIC.md`](../../docs/features/experience/ROTATION_AND_SELECTION_LOGIC.md) — rotation contract updated for idle drift
- [x] [`docs/features/experience-v2/README.md`](../../docs/features/experience-v2/README.md) — performance / 3D behavior note

## Verification

- With zero artworks on the lamp preview, idle drift may run (unchanged from empty state).
- With one or two artworks on the lamp, idle drift is disabled.
