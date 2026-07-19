# Experience mobile scroll: fixed-shell scrollport + touch-action

**Date:** 2026-07-12

## Context

After hardening home-page document scroll (`html`/`body` `min-height: 100%`, no `overflow-x` on `html`, `overflow-x: clip` on `body`), mobile `/shop/experience` still felt stuck. Experience does **not** use window scroll — it uses a fixed `h-dvh` shell with an inner `overflow-y-auto` column. That pattern fails on mobile when (1) the scrollport is not height-bounded (`h-full` / flex percentage chain), or (2) nested `touch-pan-x` strips block vertical gestures.

## Change checklist

- [x] [`app/(store)/shop/experience/layout.tsx`](../../app/(store)/shop/experience/layout.tsx) — absolute inset fill under flex-1 for a definite scrollport height
- [x] [`app/(store)/shop/experience-v3/layout.tsx`](../../app/(store)/shop/experience-v3/layout.tsx) — same absolute fill shell
- [x] [`app/(store)/shop/experience-v2/layout.tsx`](../../app/(store)/shop/experience-v2/layout.tsx) — same pattern for legacy route
- [x] [`app/(store)/shop/experience-v3/components/ExperienceV3Client.tsx`](../../app/(store)/shop/experience-v3/components/ExperienceV3Client.tsx) — `data-experience-scroll-root`, `overflow-x-clip`, explicit `-webkit-overflow-scrolling: touch`
- [x] [`app/(store)/shop/experience-v3/components/ExperienceV3ArtistWorksSlider.tsx`](../../app/(store)/shop/experience-v3/components/ExperienceV3ArtistWorksSlider.tsx) — `[touch-action:pan-x_pan-y]`
- [x] [`app/(store)/shop/experience-v3/components/ExperienceV3ProductInfoTabs.tsx`](../../app/(store)/shop/experience-v3/components/ExperienceV3ProductInfoTabs.tsx) — same touch-action
- [x] [`app/(store)/shop/experience/components/FeaturedArtistBundleSection.tsx`](../../app/(store)/shop/experience/components/FeaturedArtistBundleSection.tsx) — same touch-action
- [x] [`app/(store)/shop/experience/components/ArtworkCarouselBar.tsx`](../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) — same touch-action
- [x] [`app/(store)/shop/experience/components/SplineFullScreen.tsx`](../../app/(store)/shop/experience/components/SplineFullScreen.tsx) — reel `overflow-x-clip`
- [x] [`app/(store)/shop/experience-v3/components/ExperienceV3StickyAddPanel.tsx`](../../app/(store)/shop/experience-v3/components/ExperienceV3StickyAddPanel.tsx) — `top-auto` so fixed bar never stretches full viewport
- [x] [`docs/features/experience/README.md`](../features/experience/README.md) — version note 1.15.8

## Verification

- Playwright iPhone viewport: main column `data-experience-scroll-root` has `scrollHeight > clientHeight` and `scrollTop` changes after programmatic / touch-like scroll
- Desktop layout unchanged (fixed shell + right rail)
- Home page scroll trap not reintroduced (`html` still no `overflow-x`; `body` keeps `overflow-x: clip` + `min-height: 100%`)
