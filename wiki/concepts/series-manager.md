---
title: "Series Manager"
type: concept
tags: [feature, vendor, series, gamification, drag-and-drop]
created: 2026-04-14
updated: 2026-04-14
sources: [2026-04-14-series-manager]
---

# Series Manager

The Series Manager is an Instagram-style visual interface for vendors to create, manage, and gamify artwork series — with unlock mechanics, drag-and-drop reordering, and progress tracking.

## Definition

Series represent grouped collections of artworks (e.g., a print run or themed edition). The Series Manager provides a feed view (square cards in a responsive grid), a detail page (large cover art + artwork carousel), and a multi-step creation wizard. Collectors can unlock series based on purchases. The interface mirrors Spotify album creation and Instagram post UI patterns.

## Key Claims

1. Series creation is a 4–5 step wizard: cover art upload first (visual-first, like Instagram posts).
2. Unlock types are selected via card-based UI (not dropdowns).
3. Artworks within a series can be drag-and-drop reordered (`ArtworkCarousel.tsx`).
4. Series can be duplicated and deleted via dialog components.
5. Unlock progress is tracked with circular and linear progress indicators.
6. The feed view supports search and filter by name or unlock type.
7. Artworks within a series are linked to `artwork_series_members` by `shopify_product_id`.
8. Series are connected to the [[journey-milestone-system]] — each series can be a milestone on the artist's journey map.

## Evidence

- [[2026-04-14-series-manager]] — full component list, feature spec, gamification details

## Tensions

- The "unlock" mechanic requires purchase data to be synced to Supabase before unlock status can be computed — a latency gap between purchase and unlock.
- Drag-and-drop reordering of artworks in a series changes display order but the source of product data is Shopify — order is a Supabase-only concern.

## Related

- [[journey-milestone-system]]
- [[edition-numbering-system]]
- [[vendor-portal]]
- [[collector-dashboard]]
