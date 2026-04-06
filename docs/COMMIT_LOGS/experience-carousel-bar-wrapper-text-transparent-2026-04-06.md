# Commit context: Experience carousel bar wrapper transparent text (2026-04-06)

**Commits:** `6a4675fd2` — `fix(ui): transparent text on experience carousel bar wrapper` · `2fdafbd5b` — `fix(ui): transparent text on carousel strip containers in ArtworkCarouselBar`

## Checklist

- [x] [ExperienceV2Client.tsx](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) — Wrapper around `ArtworkCarouselBar` (`order-2 w-full shrink-0 bg-transparent`): add `text-transparent` to match browser `color: rgba(15, 23, 42, 0)` (hides inherited slate body text on the strip container).
- [x] [ExperienceV2Client.tsx](../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) — Same wrapper class update for legacy experience route parity.
- [x] [ArtworkCarouselBar.tsx](../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) — Inner strip hosts (`pointer-events-auto … px-3` and `[data-experience-carousel-strip]` scroll row): add `text-transparent` (follow-up commit `2fdafbd5b`; same inherited-color issue as wrapper).

## Notes

Persisted DevTools / preview tweaks: outer column and inner carousel hosts no longer inherit visible `rgb(15, 23, 42)`; child UI in [`ArtworkCarouselBar.tsx`](../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) keeps explicit `text-*` utilities where labels and buttons need color.
