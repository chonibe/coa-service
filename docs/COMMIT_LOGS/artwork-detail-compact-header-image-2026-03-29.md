# Commit log: Artwork detail — artist above title, compact hero image

**Date:** 2026-03-29

## Summary

Tightened the experience **artwork detail** sheet so the hero image uses less vertical space (especially on mobile) and the **artist name appears above the artwork title** everywhere that header is shown (desktop columns, mobile sticky bar).

## Implementation checklist

- [x] **Artist above title + resolved name** — [`app/(store)/shop/experience-v2/components/ArtworkDetail.tsx`](../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx): header blocks use `editionArtistName` (vendor + spotlight/API) first, then `h2` for `product.title`; mobile bottom bar matches.
- [x] **Smaller hero image (mobile)** — same file: replaced tall `aspect-[4/5]` gallery with fixed max height `min(36dvh, 260px)`, `max-w-sm`, centered `w-[calc(100%-2rem)]`.
- [x] **Smaller hero image (desktop / inline)** — same file: carousel container `flex-1 min-h-0` → `h-[min(42dvh,380px)] max-h-[380px] shrink-0` so the left column no longer grows to fill most of the viewport.
- [x] **Scroll hint** — reduced initial smooth scroll nudge from `120` to `48` px after open (less need to peek past a huge image).

## Testing

- [ ] Manual: open artwork detail on mobile width — image should be noticeably shorter; artist line above title in bottom bar and in any desktop header.
- [ ] Manual: desktop slideout / inline panel — image column height capped; title block shows artist then title.
