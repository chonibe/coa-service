# Commit context: Experience carousel bar wrapper transparent text (2026-04-06)

**Commits:** `1504d6c2d` — `fix(ui): transparent text on experience carousel bar wrapper` · *(follow-up: ArtworkCarouselBar inner containers — see latest commit on `main`)*

## Checklist

- [x] [ExperienceV2Client.tsx](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) — Wrapper around `ArtworkCarouselBar` (`order-2 w-full shrink-0 bg-transparent`): add `text-transparent` to match browser `color: rgba(15, 23, 42, 0)` (hides inherited slate body text on the strip container).
- [x] [ExperienceV2Client.tsx](../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) — Same wrapper class update for legacy experience route parity.
- [x] [ArtworkCarouselBar.tsx](../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) — `pointer-events-auto flex … px-3`: add `text-transparent` (Change 3).
- [x] [ArtworkCarouselBar.tsx](../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) — `[data-experience-carousel-strip]` row (`touch-manipulation flex …`): add `text-transparent` (Change 2).

## Notes

Persisted DevTools / preview tweaks: outer column and inner carousel hosts no longer inherit visible `rgb(15, 23, 42)`; child UI in [`ArtworkCarouselBar.tsx`](../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) keeps explicit `text-*` utilities where labels and buttons need color.
