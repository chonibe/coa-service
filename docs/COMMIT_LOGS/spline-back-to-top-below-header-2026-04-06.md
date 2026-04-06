# Commit context: Spline docked back-to-top — below experience top chrome (2026-04-06)

**Commit:** `381bc6140` — `fix(ui): place docked gallery back-to-top below experience header`

## Checklist

- [x] [SplineFullScreen.tsx](../../app/(store)/shop/experience/components/SplineFullScreen.tsx) — Replace `top: max(0.75rem, safe-area)` with `calc(env(safe-area-inset-top) + header + shipping strip + gap)` aligned to [`ExperienceSlideoutMenu`](../../experience-v2/ExperienceSlideoutMenu.tsx) (`h-14` / `sm:h-16` + ~`1.75rem` strip).

## Notes

Onboarding (no shipping strip) leaves a slightly larger gap under the header; acceptable without passing layout props into `SplineFullScreen`.
