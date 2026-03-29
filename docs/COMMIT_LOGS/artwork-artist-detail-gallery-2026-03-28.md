# Commit log: Artwork + artist detail gallery (2026-03-28)

## Summary

- **Artwork details** (product description) and **artist spotlight** are shown as a two-slide horizontal gallery when both are available (including while artist data is loading).
- Navigation: previous/next chevrons, dot indicators, and horizontal scroll with scroll-snap for touch/trackpad.
- **Edition / scarcity** block stays **above** the gallery when the product is not a lamp/bundle (same as before, with section order adjusted only for the gallery case).
- Single-slide cases unchanged: description-only keeps the accordion; artist-only keeps the standalone banner.
- Fixed invalid `setShowArtistBio` references (state did not exist).

## Implementation

- [`app/(store)/shop/experience-v2/components/ArtworkDetail.tsx`](../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx) — `ArtworkArtistDetailGallery`, `spotlightForBanner` / `showArtworkArtistGallery`, wired for desktop slideout, mobile sheet, and inline panel.

## Documentation

- [`docs/features/experience-v2/README.md`](../../docs/features/experience-v2/README.md)

## Checklist

- [x] Gallery UI in [`ArtworkDetail.tsx`](../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx)
- [x] Feature note in [`docs/features/experience-v2/README.md`](../../docs/features/experience-v2/README.md)
- [x] This log: [`docs/COMMIT_LOGS/artwork-artist-detail-gallery-2026-03-28.md`](./artwork-artist-detail-gallery-2026-03-28.md)
