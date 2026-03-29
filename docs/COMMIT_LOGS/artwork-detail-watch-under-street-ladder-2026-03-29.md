# Commit log: Watch this edition under Street ladder in artwork detail (2026-03-29)

## Checklist

- [x] [`app/(store)/shop/experience-v2/components/ScarcityBadge.tsx`](../../app/(store)/shop/experience-v2/components/ScarcityBadge.tsx) — `belowStreetLadder` prop; `StreetLadderStack` renders ladder addon then optional footer.
- [x] [`app/(store)/shop/experience-v2/components/EditionBadge.tsx`](../../app/(store)/shop/experience-v2/components/EditionBadge.tsx) — `EditionBadgeForProduct` **`showWatchControl`** (default true) to skip [`EditionWatchControl`](../../app/(store)/shop/experience-v2/components/EditionWatchControl.tsx) when watch is shown under the ladder.
- [x] [`app/(store)/shop/experience-v2/components/ArtworkDetail.tsx`](../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx) — edition metrics for watch; `streetLadderWatchControlNode`; all scarcity bars with ladder pass **`belowStreetLadder`**; all **`EditionBadgeForProduct`** instances pass **`showWatchControl={!showWatchBelowStreetLadder}`**.
- [x] [`docs/features/experience-v2/README.md`](../../docs/features/experience-v2/README.md) — ArtworkDetail / Scarcity behavior and version line.

## Summary

Collectors see **Watch this edition** immediately below the Ground Floor / list price / “N more · then $X” ladder block in the artwork details scarcity section, reusing the same watchlist API and auth flow as elsewhere. The edition narrative block no longer shows a second watch button when the ladder is present.
