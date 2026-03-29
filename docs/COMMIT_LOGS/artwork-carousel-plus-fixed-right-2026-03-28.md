# Commit log: Artwork carousel + fixed on the right (2026-03-28)

## Summary

Moved the collection **Add** (`+`) from the row above the thumbnails into the **horizontal strip** as the **last carousel item** (after the final thumbnail), aligned with other tiles; it scrolls horizontally with the strip. (Earlier iteration had it fixed outside the strip on the right — superseded.)

**Follow-up:** The scroll strip shows **at most 7** thumbnails at once (`MAX_CAROUSEL_STRIP_THUMBS`), with a window that follows **`activeIndex`** so the bar does not clip or crowd the layout; full collection indices are unchanged for tap/remove.

## Checklist

- [x] [`app/(store)/shop/experience/components/ArtworkCarouselBar.tsx`](../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) — `+` lives **inside** `data-experience-carousel-strip` after thumbnails/placeholders; top row only for watchlist back or empty CTA; **max 7** visible thumbs + window following `activeIndex`; desktop scroll effect deps include `stripWindowStart` / `activeIndex`.
- [x] [`docs/features/experience-v2/README.md`](../features/experience-v2/README.md) — ArtworkCarouselBar picker entry + version line.

## Tests

- [ ] Manual: `/shop/experience-v2` (or experience route using this bar) with ≥1 artwork — scroll thumbnails horizontally; **+** stays pinned on the right.
- [ ] Empty collection: “Choose your first artwork” CTA unchanged.
- [ ] Watchlist mode: back control unchanged; no collection `+` on the right.
