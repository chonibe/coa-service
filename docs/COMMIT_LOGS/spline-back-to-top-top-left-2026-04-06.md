# Commit context: Spline gallery — docked back-to-top top-left (2026-04-06)

## Checklist

- [x] [SplineFullScreen.tsx](../../app/(store)/shop/experience/components/SplineFullScreen.tsx) — When `backToTopDocked` and gallery exists, move the ArrowUp FAB from bottom-left (above sticky bar padding) to **top-left** via `fixed` + safe-area `top` + `left-4` / `md:left-6`, `z-[55]` so it stacks above the experience carousel overlay (`z-50`).

## Notes

Inline “back to top” at the end of the gallery scroll (`!backToTopDocked`) is unchanged. Bottom `8rem` padding offset for the docked control was removed (no longer needed).
