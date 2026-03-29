# Commit log: Experience edition copy under watch + sticky bar copy (2026-03-29)

## Checklist

- [x] [`app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx) — Mobile summary: **`N artwork` / `N artworks`** (removed “added”); **`+`** remains [`PlusSep`](../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx) between lamp and text.
- [x] [`app/(store)/shop/experience-v2/components/EditionWatchWithNarrative.tsx`](../../app/(store)/shop/experience-v2/components/EditionWatchWithNarrative.tsx) — New: [`EditionWatchControl`](../../app/(store)/shop/experience-v2/components/EditionWatchControl.tsx) + subline/CTA from [`edition-stages`](../../lib/shop/edition-stages.ts).
- [x] [`app/(store)/shop/experience/components/ArtworkAccordions.tsx`](../../app/(store)/shop/experience/components/ArtworkAccordions.tsx) — Remove **`editionOnly`** UI and body **ArtworkEditionUnifiedSection** / **EditionBadgeForProduct**; wire **`EditionWatchWithNarrative`** via **`belowStreetLadder`** or below bar when no ladder.
- [x] [`app/(store)/shop/experience-v2/components/ArtworkDetail.tsx`](../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx) — Same scarcity/watch pattern; drop separate edition framed sections; keep spotlight GIF-only rows where applicable.
- [x] [`docs/features/experience/README.md`](../../docs/features/experience/README.md) · [`docs/features/experience-v2/README.md`](../../docs/features/experience-v2/README.md)

## Summary

The framed “GROUND FLOOR” **Artwork edition** block is removed from the experience reel and from **ArtworkDetail** scroll areas; collectors get **Watch this edition** plus the former badge subline/CTA as small text under the scarcity / ladder block. The mobile checkout strip no longer appends “added” after the artwork count.
