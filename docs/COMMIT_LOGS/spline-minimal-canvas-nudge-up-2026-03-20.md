# Spline minimal canvas — move model up — 2026-03-20

## Summary

Raised the 3D lamp in **minimal** `Spline3DPreview` by increasing the CSS `translateY` on the WebGL canvas from `-4%` to `-10%` (still composed with quarter-turn rotation).

## Checklist

- [x] [`app/template-preview/components/spline-3d-preview.tsx`](../../app/template-preview/components/spline-3d-preview.tsx) — minimal mode canvas `transform` `translateY(-10%)`
- [x] [`docs/features/experience/README.md`](../../docs/features/experience/README.md) — Spline viewport sizing: document vertical nudge
- [x] [`docs/features/experience-v2/README.md`](../../docs/features/experience-v2/README.md) — note shared framing with link to V1 doc

## Scope

Applies anywhere **minimal** `Spline3DPreview` is used (e.g. [`SplineFullScreen`](../../app/(store)/shop/experience/components/SplineFullScreen.tsx), [`Configurator`](../../app/(store)/shop/experience-v2/components/Configurator.tsx)).
