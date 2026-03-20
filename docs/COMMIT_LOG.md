# Commit Log

## Commit: style(experience): center footers, remove row/spine borders (2026-03-20)

**Ref:** `af72f76ce`

### Summary
Picker and strip: **centered** artwork title and price under each image; removed **border between image and footer** on strip cards; removed **outer border** on 2-up artist rows; center **artist spine** is text-only (**no** background or vertical borders).

### Implementation Checklist

- [x] [app/(store)/shop/experience/components/ArtworkPickerSheet.tsx](app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) – footer layout, row wrapper, spine
- [x] [app/(store)/shop/experience-v2/components/ArtworkStrip.tsx](app/(store)/shop/experience-v2/components/ArtworkStrip.tsx) – footer layout, row wrapper, spine
- [x] [docs/features/experience-v2/README.md](docs/features/experience-v2/README.md)

---

## Commit: feat(experience): artist-grouped rows, center spine, title+price footers (2026-03-20)

**Ref:** `df1826a02`

### Summary
Picker and configurator strip now lay out **virtual rows by artist (Shopify `vendor`)**: pairs in one row share a **vertical artist label** in the center (same structure as the old “both selected” merge). Picker cards no longer show the artist in the footer—only **artwork title** with **price on the line below**. Odd per-artist counts use one **half-width centered** card. Shared row builder lives in `lib/shop/experience-artwork-rows.ts`; scroll-to-product and prefetch use the new row model.

### Implementation Checklist

- [x] [lib/shop/experience-artwork-rows.ts](lib/shop/experience-artwork-rows.ts) – `buildArtworkRowsByArtist`, `rowIndexForProductId`
- [x] [app/(store)/shop/experience/components/ArtworkPickerSheet.tsx](app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) – artist rows, always-on spine for pairs, `spinePairLayout` + `flushToSpine` rounding on `ArtworkCardV2`, footer title + stacked price
- [x] [app/(store)/shop/experience-v2/components/ArtworkStrip.tsx](app/(store)/shop/experience-v2/components/ArtworkStrip.tsx) – same row model, spine for pairs, centered single-card rows, prefetch + `scrollToProductId` via `rowIndexForProductId`
- [x] [docs/features/experience-v2/README.md](docs/features/experience-v2/README.md) – picker / grid documentation updated

---

## Commit: Lighthouse Performance and Best Practices (2026-03-10)

**Ref:** `70813b0a82`  
**Deployed:** https://app.thestreetcollector.com

### Summary
Improves Lighthouse Performance and Best Practices for the street-collector landing page: lazy-load videos, hero preload in head, deferred PostHog/GA, proxy-video cache, bfcache-friendly revalidate, explicit poster dimensions.

### Implementation Checklist

- [x] [components/LazyVideo.tsx](components/LazyVideo.tsx) – Intersection Observer lazy video
- [x] [app/layout.tsx](app/layout.tsx) – Hero poster preload, font preconnect, deferred GA
- [x] [app/api/proxy-video/route.ts](app/api/proxy-video/route.ts) – Long-lived cache headers
- [x] [app/shop/street-collector/page.tsx](app/shop/street-collector/page.tsx) – `revalidate = 60`
- [x] [components/google-analytics.tsx](components/google-analytics.tsx) – Deferred GA/Ads
- [x] See [docs/features/lighthouse-performance/README.md](docs/features/lighthouse-performance/README.md) for full details

---

## Commit: feat(theme): add #1c0202 to base and #FFBA94 highlight palette (2026-03-06)

**Ref:** `d9179ccd6`

### Summary
Added subtle `#1c0202` warmth to the dark mode base and introduced the `#FFBA94` highlight palette for section headers, labels, and accent text across the experience and shop components.

### Implementation Checklist

- [x] [app/globals.css](app/globals.css) – Base moved to `#171515` (with `#1c0202` warmth); added `--experience-highlight`, `--experience-highlight-muted`, `--experience-highlight-soft` tokens
- [x] [tailwind.config.ts](tailwind.config.ts) – Added `experience.highlight`, `experience.highlight-muted`, `experience.highlight-soft`; fixed `require()` → ES import for tailwindcss-animate
- [x] [app/shop/experience/components/ArtworkDetail.tsx](app/shop/experience/components/ArtworkDetail.tsx) – Section headers (Includes, Specifications, About the Artist) use highlight color
- [x] [app/shop/experience/components/ArtworkInfo.tsx](app/shop/experience/components/ArtworkInfo.tsx) – Artist name uses highlight color
- [x] [app/shop/experience/components/OrderBar.tsx](app/shop/experience/components/OrderBar.tsx) – Labels (Shipping, Total, Checkout) use highlight color
- [x] [app/shop/experience/components/Configurator.tsx](app/shop/experience/components/Configurator.tsx) – Selected “Artworks” tab uses highlight color
- [x] Experience, shop, gift-cards, Spline, PolarisSheet – Replaced `dark:bg-neutral-*` with stepped palette (`#171515`, `#1a1616`, `#201c1c`, etc.)

### Palette Reference
| Token | Hex | Use |
|-------|-----|-----|
| Base | `#171515` | Page background, dialogs, menus |
| Highlight | `#FFBA94` | Section headers, labels, accent text |
| Surface steps | `#1a1616`–`#4a4444` | Cards, panels, borders |

### Verification
- Dark mode components use new palette; highlight text visible and consistent

---

## Standardize on order_line_items_v2 (YYYY-MM-DD)

### Summary
Migrated all application routes (`app/`, `lib/`) from the legacy `order_line_items` table to `order_line_items_v2` to fix silent data mismatches and broken flows (NFC pairing, certificates, collector portal).

### Implementation Checklist

- [x] **Phase 1 – NFC Pairing Flow (P0)**  
  - [app/api/nfc-tags/assign/route.ts](app/api/nfc-tags/assign/route.ts): Table name + added `request` param to `POST`  
  - [app/api/nfc-tags/verify/route.ts](app/api/nfc-tags/verify/route.ts): Join `order_line_items(*)` → `order_line_items_v2(*)` + added `request` param to `GET`  
  - [app/api/nfc-tags/create/route.ts](app/api/nfc-tags/create/route.ts): Table name + added `request` param to `POST`  
  - [app/api/nfc-tags/get-programming-data/route.ts](app/api/nfc-tags/get-programming-data/route.ts): Table name + added `request` param to `GET`

- [x] **Phase 2 – Certificate Flow (P0)**  
  - [app/api/certificate/generate/route.ts](app/api/certificate/generate/route.ts): Both read and write to v2  
  - [app/api/certificate/delete/route.ts](app/api/certificate/delete/route.ts): Table name + added `request` param  
  - [app/api/customer/certificates/route.ts](app/api/customer/certificates/route.ts): Table name + added `request` param  

- [x] **Phase 3 – Collector Portal (P1)**  
  - [app/api/collector/story/[productId]/route.ts](app/api/collector/story/[productId]/route.ts)  
  - [app/api/collector/artists/[name]/route.ts](app/api/collector/artists/[name]/route.ts)  
  - [app/api/collector/series/[id]/route.ts](app/api/collector/series/[id]/route.ts)  
  - [app/api/benefits/claim/route.ts](app/api/benefits/claim/route.ts)  
  - [app/api/benefits/collector/route.ts](app/api/benefits/collector/route.ts)

- [x] **Phase 4 – Vendor/Admin Routes (P2)**  
  - [app/api/vendor/stats/sales/route.ts](app/api/vendor/stats/sales/route.ts)  
  - [app/api/vendor/collectors/route.ts](app/api/vendor/collectors/route.ts)  
  - [app/api/vendor/announcements/route.ts](app/api/vendor/announcements/route.ts)  
  - [lib/payout-validator.ts](lib/payout-validator.ts)  
  - [app/admin/certificates/bulk/page.tsx](app/admin/certificates/bulk/page.tsx)

- [x] **Phase 5 – Sync Routes (P2)**  
  - [app/api/shopify/manual-sync/route.ts](app/api/shopify/manual-sync/route.ts)  
  - [app/api/shopify/sync-missing-order/route.ts](app/api/shopify/sync-missing-order/route.ts)  
  - [app/api/shopify/sync-fulfillments/route.ts](app/api/shopify/sync-fulfillments/route.ts)  
  - [app/api/shopify/check-missing-orders/route.ts](app/api/shopify/check-missing-orders/route.ts)  
  - [app/api/shopify/sync-status/route.ts](app/api/shopify/sync-status/route.ts)  
  - [app/api/sync-vendor-names/route.ts](app/api/sync-vendor-names/route.ts)  
  - [app/api/sync-all-products/route.ts](app/api/sync-all-products/route.ts)  
  - [app/api/editions/resequence/route.ts](app/api/editions/resequence/route.ts)

- [x] **Phase 6 – Utility/Other + gaps**  
  - [app/api/supabase-proxy/route.ts](app/api/supabase-proxy/route.ts)  
  - [app/api/products/list/route.ts](app/api/products/list/route.ts)  
  - [app/api/test-connections/route.ts](app/api/test-connections/route.ts)  
  - [app/api/update-line-item-status/route.ts](app/api/update-line-item-status/route.ts) – already v2  
  - [app/api/debug/route.ts](app/api/debug/route.ts)  
  - [app/api/debug/schema/route.ts](app/api/debug/schema/route.ts)  
  - [app/api/sync-vendor-names-single/route.ts](app/api/sync-vendor-names-single/route.ts) *(gap)*  
  - [app/api/warehouse/orders/auto-fulfill/route.ts](app/api/warehouse/orders/auto-fulfill/route.ts) *(gap)*  

### Verification
- `rg 'from\("order_line_items"\)' app/ lib/` returns **zero** matches

### Not Changed (per plan)
- `scripts/` – maintenance scripts  
- `db/` – SQL reference files  
- Database schema – no migrations  
- Legacy table – kept for backward compatibility  
