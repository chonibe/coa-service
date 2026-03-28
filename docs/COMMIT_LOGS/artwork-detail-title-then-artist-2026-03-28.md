# Commit context: artwork title then artist in detail UI (2026-03-28)

## Checklist

- [x] [ArtworkAccordions.tsx](../../app/(store)/shop/experience/components/ArtworkAccordions.tsx) — `renderArtworkCardInner`: `h2` title first, `detailArtistName` line below (`mt-0.5` when title present).
- [x] [ArtworkDetail.tsx](../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx) — Inline split, desktop right column header, mobile sticky bar: same order (title → artist).
- [x] [docs/features/experience/README.md](../../docs/features/experience/README.md) — v1.15.2.
- [x] [docs/features/experience-v2/README.md](../../docs/features/experience-v2/README.md) — ArtworkDetail bullet + changelog.

## Tests

- Open experience reel accordion artwork card: title above artist.
- Open artwork detail (mobile + desktop): header matches.
