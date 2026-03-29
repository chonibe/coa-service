# Experience selector ↔ Spline preview sync — 2026-03-29

## Summary

Aligned artwork “selector” state with the Spline lamp preview: one source of truth for on-lamp IDs, and immediate preview updates when adding from the grid/picker.

## Checklist

- [x] [`app/(store)/shop/experience-v2/components/Configurator.tsx`](../../app/(store)/shop/experience-v2/components/Configurator.tsx) — Removed `lampSelectionQueue` (strip used a buggy FIFO that ignored `currentFrontSideRef`). `ArtworkStrip` now receives `lampPreviewOrder` (same as Spline). On **remove from order** via Add, `lampPreviewOrder` updates so textures match the cart.
- [x] [`app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) — Dropped `queueMicrotask` around add-to-order + `setLampPreviewOrder` so preview updates in the same event as `setCartOrder`.
- [x] [`app/(store)/shop/experience/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) — Same `queueMicrotask` removal for parity.
- [x] [`docs/features/experience/ROTATION_AND_SELECTION_LOGIC.md`](../../docs/features/experience/ROTATION_AND_SELECTION_LOGIC.md) — Document single `lampPreviewOrder` for strip + model; add/remove order flow.

## Verification

- Manual: Configurator — add artwork via strip Add; Spline shows that artwork. With two on-lamp, add a third; hidden side replaces; strip Side 1/2 match model.
- Manual: Experience V2 — add from picker; Spline updates immediately.
