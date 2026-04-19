---
title: "Shop Experience Page"
type: concept
tags: [feature, shop, 3d, spline, configurator, ux]
created: 2026-04-14
updated: 2026-04-14
sources: [2026-04-14-experience-readme]
---

# Shop Experience Page

The Experience page (`/shop/experience`) is a 3D product configurator where collectors choose artwork to display on a Street Lamp, visualised in real time using a Spline 3D model.

## Definition

The page consists of an intro quiz, a Spline 3D lamp preview, a virtualised artwork strip with filters, and a sticky checkout bar. Artwork is chosen from a Shopify collection; the selected artwork is overlaid on the 3D lamp model. Checkout flows through Stripe. A Featured Artist Bundle ($159) bundles a spotlight plus two prints with allocated Stripe line items.

## Key Claims

1. Route: `app/(store)/shop/experience/` (and `experience-v2/` shell — same page, different mount).
2. Spline 3D is lazy-loaded (`next/dynamic`) and only mounts when the preview container is visible (IntersectionObserver).
3. The Spline canvas has `pointer-events: none` — all interaction handled by the container div to allow page scrolling.
4. Orbit controls are fully disabled on the lamp — no cursor/drag orbit. Idle yaw sway (±15° sine) and UI-driven rotation only.
5. Artwork strip is virtualised with `@tanstack/react-virtual` — renders ~10–15 cards instead of 100+.
6. `ArtworkCarouselBar` remains in the repo but is NOT mounted in the main shells.
7. Sticky bottom bar logic: empty cart → "Choose your first artwork" only; artworks added → cart thumbnails + Checkout + purple FAB.
8. Tapping a cart thumbnail in the sticky bar selects that artwork on the Spline preview at all breakpoints.
9. Product payloads are lightweight for the strip (`PRODUCT_LIST_FRAGMENT`); full product fetched on-demand when opening detail.
10. Detail preload: cards entering the virtualised view prefetch full product data into cache.

## Evidence

- [[2026-04-14-experience-readme]] — full technical spec, Spline interaction rules, performance optimisations

## Tensions

- The Spline model and WebGL canvas create significant complexity around scroll/touch event routing — 13 separate fixes documented as of 2026-04-09.
- The `ArtworkCarouselBar` component exists but is unmounted — a source of potential confusion for future developers.

## Related

- [[shopify]]
- [[the-street-collector]]
- [[headless-architecture]]
- [[collector-dashboard]]
