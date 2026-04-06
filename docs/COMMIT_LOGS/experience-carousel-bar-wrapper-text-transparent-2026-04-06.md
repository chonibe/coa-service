# Commit context: Experience carousel bar wrapper transparent text (2026-04-06)

**Commit:** `1504d6c2d` — `fix(ui): transparent text on experience carousel bar wrapper`

## Checklist

- [x] [ExperienceV2Client.tsx](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) — Wrapper around `ArtworkCarouselBar` (`order-2 w-full shrink-0 bg-transparent`): add `text-transparent` to match browser `color: rgba(15, 23, 42, 0)` (hides inherited slate body text on the strip container).
- [x] [ExperienceV2Client.tsx](../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) — Same wrapper class update for legacy experience route parity.

## Notes

Persisted a DevTools / preview tweak: the carousel bar column no longer inherits visible `rgb(15, 23, 42)` on the container; child UI in [`ArtworkCarouselBar.tsx`](../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) keeps explicit `text-*` utilities where labels and buttons need color.
