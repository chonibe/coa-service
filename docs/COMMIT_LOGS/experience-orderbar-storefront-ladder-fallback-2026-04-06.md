# Commit log: OrderBar matches picker when Supabase has no `products` row

**Date:** 2026-04-06

## Problem

`ArtworkPickerSheet` showed Street ladder **$40** via `streetEditionRowFromStorefrontProduct` when `/api/shop/edition-states` had no row, while **OrderBar** used only the API-backed `streetLadderPrices` map and fell back to **Shopify $43**.

## Checklist

- [x] [lib/shop/experience-artwork-unit-price.ts](../../lib/shop/experience-artwork-unit-price.ts) — After API ladder miss, call `streetEditionRowFromStorefrontProduct`; optional `seasonBandsFallback` on maps
- [x] [lib/shop/experience-artwork-unit-price.test.ts](../../lib/shop/experience-artwork-unit-price.test.ts) — Jest: empty ladder map + metafield/inventory → $40 not $43
- [x] [app/(store)/shop/experience-v2/components/OrderBar.tsx](../../app/(store)/shop/experience-v2/components/OrderBar.tsx) — `streetPricingSeasonFallback` → `priceMaps.seasonBandsFallback`
- [x] [app/(store)/shop/experience-v2/ExperienceOrderContext.tsx](../../app/(store)/shop/experience-v2/ExperienceOrderContext.tsx) — Context prop type
- [x] [Configurator / ExperienceV2Client (both paths)](../../app/(store)/shop/experience-v2/components/) — `artworkPriceMaps` with season; pass fallback into OrderBar + `setOrderBarProps`
- [x] [ArtworkStrip](../../app/(store)/shop/experience-v2/components/ArtworkStrip.tsx) — Thread `streetPricingSeasonFallback` for strip parity
- [x] [Legacy `experience/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) — Same `artworkPriceMaps` + OrderBar props

## Note

Headless `/shop/cart` still relies on edition-states API or prior cart ladder fetch; products missing from Supabase there may still show Shopify until a separate storefront-based client enrich is added.
