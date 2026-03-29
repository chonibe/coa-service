# Commit log: Checkout sticky bar centered add overlay (2026-03-28)

## Summary

[`ExperienceCheckoutStickyBar`](../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx): **empty collection** shows only **“Choose your first artwork”** (no checkout on that row). **≥1 artwork:** thumbnails + **Checkout** + centered add FAB. **`stripMode`** hides the empty row on **watchlist** with zero artworks.

## Checklist

- [x] [`app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx) — `stripMode`; empty collection CTA + optional checkout; `onOpenPicker` FAB only when **≥1** artwork; `pointer-events` / `z-[3]` checkout.
- [x] [`app/(store)/shop/experience/components/ArtworkCarouselBar.tsx`](../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) — choose CTA + strip **+** only when `!reserveCheckoutBar`; split watchlist back row.
- [x] [`app/(store)/shop/experience/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) — `reserveCheckoutBar` + `stripMode` on sticky bar; `onOpenPicker`.
- [x] [`app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) — `reserveCheckoutBar` always; `stripMode="collection"`; `onOpenPicker`.
- [x] [`docs/features/experience-v2/README.md`](../features/experience-v2/README.md) · [`docs/features/experience/README.md`](../features/experience/README.md).

## Tests

- [ ] **Collection**, 0 artworks: sticky shows **Choose your first artwork** first; carousel does not duplicate CTA; picker opens.
- [ ] After first artwork: CTA gone; thumbnails + centered **+** + **Checkout**.
- [ ] **Watchlist**, 0 artworks: no sticky bar; carousel back control / copy unchanged.
- [ ] Empty collection: only **Choose your first artwork** (no sticky **Checkout**); checkout remains via header cart / after art is added.
