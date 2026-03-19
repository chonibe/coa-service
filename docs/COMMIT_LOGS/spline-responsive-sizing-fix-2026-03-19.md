# Spline Responsive Sizing Fix — 2026-03-19

## Summary

Fixed inconsistent 3D model proportions ("squished" appearance) on `/shop/experience` across different screen sizes and during resize/rotate transitions.

## Problem

The Spline 3D model would sometimes appear squished or stretched on different screens. Root causes:

1. **Sizing source race**: `spline-3d-preview.tsx` prioritized `canvas.clientWidth/clientHeight` over container bounds. During layout settling (especially with CSS transforms for rotation), canvas dimensions could be transitional/inflated, causing incorrect aspect ratio calculation.

2. **Dynamic viewport height instability**: `SplineFullScreen.tsx` used `dvh` (dynamic viewport height) units which change when mobile browser chrome appears/disappears, causing layout shifts that trigger aspect ratio recalculation with stale container dimensions.

## Solution

### 1. Container as single source of truth

**File**: [`app/template-preview/components/spline-3d-preview.tsx`](../../../app/template-preview/components/spline-3d-preview.tsx)

Changed `getContainerSize()` to always use container `getBoundingClientRect()`:

```typescript
const getContainerSize = (): { w: number; h: number } | null => {
  // ALWAYS use container bounds as the single source of truth.
  // Canvas clientWidth/clientHeight can be inflated or transitional during layout settling
  // (especially with CSS transforms for rotation), causing aspect ratio drift.
  const rect = container.getBoundingClientRect()
  const w = Math.round(rect.width)
  const h = Math.round(rect.height)
  if (w >= 10 && h >= 10) {
    return { w, h }
  }
  return null
}
```

Added debug logging in `applySize()` to track aspect ratio changes (dev-only, controlled by `NEXT_PUBLIC_SPLINE_VERBOSE=1`).

### 2. Stable viewport height units

**File**: [`app/(store)/shop/experience/components/SplineFullScreen.tsx`](../../../app/(store)/shop/experience/components/SplineFullScreen.tsx)

Changed `dvh` to `svh` (small viewport height) for the Spline section and scroll container padding:

- `min-h-[100dvh]` → `min-h-[100svh]`
- `pb-[80dvh]` → `pb-[80svh]`

`svh` represents the viewport with browser UI fully expanded, so it doesn't change with mobile browser chrome, avoiding layout shifts.

## Validation

Tested across:
- [x] Mobile portrait (375x812)
- [x] Mobile landscape (812x375)
- [x] Tablet portrait (768x1024)
- [x] Desktop (1440x900)
- [x] Live resize transitions

## Checklist

- [x] Audit sizing chain: layout → SplineFullScreen → Spline3DPreview → [`app/(store)/shop/experience/layout.tsx`](../../../app/(store)/shop/experience/layout.tsx)
- [x] Refactor renderer sizing to use container as single truth → [`app/template-preview/components/spline-3d-preview.tsx`](../../../app/template-preview/components/spline-3d-preview.tsx)
- [x] Normalize viewport height behavior → [`app/(store)/shop/experience/components/SplineFullScreen.tsx`](../../../app/(store)/shop/experience/components/SplineFullScreen.tsx)
- [x] Add debug logging for aspect ratio tracking
- [x] Update feature docs → [`docs/features/experience/README.md`](../experience/README.md)

## Related Files

| File | Purpose |
|------|---------|
| `app/template-preview/components/spline-3d-preview.tsx` | Core Spline renderer with sizing logic |
| `app/(store)/shop/experience/components/SplineFullScreen.tsx` | Experience page Spline container |
| `app/(store)/shop/experience/layout.tsx` | Experience page layout (fixed fullscreen shell) |
| `docs/features/experience/README.md` | Feature documentation (updated) |
