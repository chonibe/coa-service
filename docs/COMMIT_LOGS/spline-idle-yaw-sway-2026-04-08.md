# Commit log: Spline idle yaw sway ±15° (2026-04-08)

## Summary

Replaced continuous **turntable drift** on the main Spline lamp with a **smooth sinusoidal yaw** of **±15°** around the settled front pose (~**9s** full cycle), so the model feels alive but not constantly spinning.

## Checklist

- [x] [`app/template-preview/components/spline-3d-preview.tsx`](../../app/template-preview/components/spline-3d-preview.tsx) — idle branch: `sin(phase)` on `rot.y` with `baseYawRef` as center; prop JSDoc updated
- [x] [`docs/features/experience/README.md`](../../docs/features/experience/README.md) — idle behavior wording
- [x] [`docs/features/experience-v2/README.md`](../../docs/features/experience-v2/README.md) — idle behavior wording
- [x] [`docs/features/experience/ROTATION_AND_SELECTION_LOGIC.md`](../../docs/features/experience/ROTATION_AND_SELECTION_LOGIC.md) — idle behavior wording

## Notes

- **`idleSpinEnabled={false}`** still freezes at `baseYawRef` (e.g. with artwork on lamp).
- **`frontLockUntilRef`** still holds exact front pose briefly after side settle before sway resumes.
