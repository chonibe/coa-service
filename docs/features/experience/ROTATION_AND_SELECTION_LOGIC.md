# Experience Rotation And Selection Logic

## Purpose

This document is the source of truth for how artwork selection, queue numbering, and Spline model rotation must behave on `/shop/experience`.

- Implementation (selector + state): [`app/(store)/shop/experience/components/Configurator.tsx`](../../../app/(store)/shop/experience/components/Configurator.tsx)
- Implementation (3D rotation + settle): [`app/template-preview/components/spline-3d-preview.tsx`](../../../app/template-preview/components/spline-3d-preview.tsx)
- Selector UI (queue badges): [`app/(store)/shop/experience/components/ArtworkStrip.tsx`](../../../app/(store)/shop/experience/components/ArtworkStrip.tsx)
- Performance/scene context: [`docs/features/experience/README.md`](./README.md)

## Behavior Contract

### 1) Model Side Rules

- The model has two artwork slots (`index 0`, `index 1`) mapped into Spline sides via `swapLampSides`.
- The currently front-facing side is tracked by `currentFrontSideRef` in configurator.
- `currentFrontSideRef` is updated only from Spline settle completion (`onFrontSideSettled`), not at rotation-request time.

### 2) Selection Queue Rules (User-facing numbering)

- Queue badges (Side 1 / Side 2) in the artwork strip use the same IDs as the model: `lampPreviewOrder` (see [`ArtworkStrip`](../../../app/(store)/shop/experience-v2/components/ArtworkStrip.tsx) `getLampPosition`).
- With 2 selected, selecting a new artwork replaces the hidden physical slot (not a separate FIFO queue), matching Spline textures.

### 3) Physical Slot Replacement Rules (Model-facing)

- Physical model slots are driven by `lampPreviewOrder`.
- With 2 selected, replacement targets the currently hidden side to avoid visible-side popping.
- The currently visible side should remain visually stable until the rotate-in transition.

### 4) Rotation Rules

- First artwork-driven transition uses a full showcase spin.
- Subsequent transitions:
  - hold on opposite side while new texture applies,
  - then rotate into selected front side,
  - then lock briefly at front before any idle behavior resumes.
- Idle yaw sway (~±15°) is off whenever at least one artwork is on the lamp preview: [`SplineFullScreen`](../../../app/(store)/shop/experience/components/SplineFullScreen.tsx) passes `idleSpinEnabled={lampPreviewCount < 1}`; [`Configurator`](../../../app/(store)/shop/experience-v2/components/Configurator.tsx) uses `idleSpinEnabled={lampPreviewOrder.length === 0}` so the model stays settled after the first placement.

## State Model

- `lampPreviewOrder`: physical side assignment for model textures and strip “on lamp” badges (single source of truth).
- `rotateToSide`: requested side to bring front (`A`/`B`).
- `rotateTrigger`: monotonic counter to force repeated side-settle animations.
- `currentFrontSideRef`: last settled front side, updated through `onFrontSideSettled`.

## Event Flow

### Select Artwork (Eye Tap)

1. Compute physical replacement order (`lampPreviewOrder`) with hidden-side replacement when full.
2. Compute `rotateToSide` for selected artwork in the new physical order.
4. Increment `rotateTrigger`.
5. Spline applies textures while opposite side is held, then rotates into view and settles.
6. On settle completion, Spline calls `onFrontSideSettled(side)` and configurator updates `currentFrontSideRef`.

### Add To Order (Add Button)

1. Add/remove cart state (`cartOrder`).
2. If adding, update `lampPreviewOrder` with the same side/rotation logic as eye-select. If removing, remove that ID from `lampPreviewOrder` so the strip and Spline stay aligned.
3. Trigger rotate via `rotateToSide` + `rotateTrigger`.

## Invariants

- Do not update `currentFrontSideRef` before Spline settle completes.
- Strip “on lamp” badges and Spline textures must both derive from `lampPreviewOrder` (avoid a second queue that uses different replacement rules).
- Do not re-enable idle model drift in experience mode unless side/rotation logic is redesigned accordingly.

## Manual Verification Checklist

- [ ] `1` selected, then `2` selected: both sides populate and rotate to selected side.
- [ ] With two artworks on the lamp, selecting a third replaces the hidden side; strip badges match the two IDs on the model.
- [ ] During `3` replacement, currently visible side does not pop to another artwork before rotate.
- [ ] New artwork comes from hidden side and rotates into view (no front flash).
- [ ] Rapid repeated selections still settle to correct front side.
- [ ] Removing one artwork rotates to the remaining artwork side.

## Version

- Last updated: 2026-03-14
- Version: 1.0.0
