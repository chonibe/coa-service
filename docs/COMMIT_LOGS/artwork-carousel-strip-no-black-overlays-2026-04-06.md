# Commit context: Artwork carousel strip — remove black overlays (2026-04-06)

**Commit:** `56caae2e1` — `fix(ui): remove black overlays from experience artwork carousel strip`

## Checklist

- [x] [ArtworkCarouselBar.tsx](../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) — Remove full-tile `bg-black/20` on add-lamp + spotlight placeholder tiles.
- [x] [ArtworkCarouselBar.tsx](../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) — Replace caption pills (`bg-black/40` / `dark:bg-black/50` + heavy blur) with theme-aware light glass (`stripAddTileCaptionClass`: white/translucent in both modes).
- [x] [ArtworkCarouselBar.tsx](../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) — Dark mode missing-image fallbacks: `bg-neutral-800` → `bg-white/10` for numbered / `+` placeholders.

## Notes

Keeps labels readable; reel/spline remain visible through tile chrome.
