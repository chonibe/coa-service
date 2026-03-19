# Spline Revert to Original Responsive Behavior — 2026-03-19

## Summary

Reverted Spline 3D preview to the simpler responsive approach from commit `d6394636d`. The Spline runtime handles resize natively when given a full-bleed container; the viewport resizes, not the model.

## Problem

Subsequent fixes (letterboxing, aspect-ratio wrapper, `viewRollViewportScale`) added complexity that overrode the Spline runtime's built-in responsive behavior. The original solution was already correct.

## Solution

Reverted to the minimal layout from `d6394636d`:

1. **Simple structure**: Outer div with `ref={containerRef}`, canvas with `inset-0 w-full h-full`, `width: 100%`, `height: 100%`.
2. **Removed**: `viewRollViewportScale` state and its ResizeObserver effect.
3. **Removed**: Aspect-ratio wrapper div (4/5 or 5/4) and letterboxing.
4. **Removed**: `resizeOb.observe(canvas)` — only observe container.
5. **Kept**: Container as single source of truth for `getContainerSize()`, `svh` in SplineFullScreen, `experience-selector-settled` listener for layout settling.

## Checklist

- [x] Remove `viewRollViewportScale` state → [`app/template-preview/components/spline-3d-preview.tsx`](../../../app/template-preview/components/spline-3d-preview.tsx)
- [x] Remove viewRollViewportScale effect and experience-selector-settled rotation dispatch
- [x] Revert minimal mode to simple container + canvas (no aspect-ratio wrapper)
- [x] Remove `resizeOb.observe(canvas)`
- [x] Update docs → [`docs/features/experience/README.md`](../experience/README.md)

## Related

- Original fix: [`docs/COMMIT_LOGS/spline-responsive-sizing-fix-2026-03-19.md`](./spline-responsive-sizing-fix-2026-03-19.md) (container as source of truth, svh)
- Commit `d6394636d`: "fix: Spline 3D preview responsiveness and loading" — removed hardcoded 1.26 mobile scale, simplified canvas to inset-0 w-full h-full
