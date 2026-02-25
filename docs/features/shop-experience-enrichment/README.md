# Shop Experience Enrichment (Track B)

> **Version:** 1.0.0  
> **Created:** 2026-02-14  
> **Status:** Implemented  
> **Sprint:** Platform Integration — Track B

## Feature Overview

Track B enriches the shop experience by merging Supabase vendor/series data into the Shopify-powered storefront. This creates richer artist profiles, surfaces series context throughout the shop, and enhances product cards with collection indicators.

### Streams

| Stream | Description | Status |
|--------|-------------|--------|
| B1 — Artist Profile API + Page | Merge Supabase vendor data with Shopify for rich artist pages | Done |
| B2 — Series Context on Product Pages | Series listing page, enhanced ProductSeriesInfo, cart upsells | Done |
| B3 — Enriched Product Cards | Series badge, artist avatar, "In your collection" indicator | Done |

---

## Technical Implementation Details

### Stream B1: Artist Profile Enrichment

**Modified Files:**
- [`app/api/shop/artists/[slug]/route.ts`](../../../app/api/shop/artists/[slug]/route.ts) — Enhanced to merge Supabase vendor data (bio, instagram, profile_image, signature_url, series, collector count) with Shopify collection/vendor data
- [`app/api/shop/artists/route.ts`](../../../app/api/shop/artists/route.ts) — Enhanced to include Supabase vendor profile images and bios in the artists listing
- [`app/shop/artists/[slug]/page.tsx`](../../../app/shop/artists/[slug]/page.tsx) — Redesigned with hero section, bio, Instagram/website links, series grid, social proof

**Data Merging Strategy:**
1. Shopify provides: products, collection images, collection descriptions
2. Supabase provides: bio, artist_bio, artist_history, instagram_url, website, profile_image, profile_picture_url, signature_url
3. Supabase data takes priority for profile fields
4. Collector count is anonymized (distinct `owner_email` from `line_items`)

### Stream B2: Series Context

**New Files:**
- [`app/api/shop/series/route.ts`](../../../app/api/shop/series/route.ts) — Series listing API with collector progress
- [`app/shop/series/page.tsx`](../../../app/shop/series/page.tsx) — Series listing page with thumbnails and progress indicators
- [`app/api/shop/cart/series-suggestions/route.ts`](../../../app/api/shop/cart/series-suggestions/route.ts) — Cart-aware series completion suggestions

**Modified Files:**
- [`app/shop/[handle]/components/ProductSeriesInfo.tsx`](../../../app/shop/[handle]/components/ProductSeriesInfo.tsx) — Enhanced with guest vs authenticated views, series thumbnail grid, progress bars
- [`components/shop/CartUpsells.tsx`](../../../components/shop/CartUpsells.tsx) — Added "Complete the Series" section with series-aware suggestions
- [`app/shop/layout.tsx`](../../../app/shop/layout.tsx) — Added "Series" link to navigation

### Stream B3: Enriched Product Cards

**Modified Files:**
- [`components/shop/VinylProductCard.tsx`](../../../components/shop/VinylProductCard.tsx) — Added series indicator badge ("1 of 5"), artist avatar thumbnail overlay, "In your collection" badge
- [`components/shop/index.ts`](../../../components/shop/index.ts) — Updated barrel exports

---

## API Endpoints

### GET `/api/shop/artists/[slug]`
Returns enriched artist profile merging Shopify + Supabase data.

**Response:**
```json
{
  "name": "Artist Name",
  "slug": "artist-name",
  "bio": "Artist biography from Supabase",
  "artistHistory": "Extended history",
  "image": "https://...",
  "signatureUrl": "https://...",
  "instagramUrl": "https://instagram.com/...",
  "website": "https://...",
  "products": [...],
  "series": [{ "id": "...", "name": "...", "description": "...", "thumbnail_url": "..." }],
  "collectorCount": 42
}
```

### GET `/api/shop/artists`
Returns all artists with Supabase profile data.

**Response:**
```json
{
  "artists": [{
    "name": "Artist Name",
    "slug": "artist-name",
    "productCount": 5,
    "image": "https://...",
    "bio": "Short bio",
    "instagramUrl": "https://...",
    "hasProfile": true
  }]
}
```

### GET `/api/shop/series`
Returns all active series with collector progress (if authenticated).

**Response:**
```json
{
  "series": [{
    "id": "uuid",
    "name": "Series Name",
    "description": "...",
    "thumbnail_url": "https://...",
    "vendor_name": "Artist Name",
    "total_artworks": 5,
    "collector_progress": {
      "owned_count": 2,
      "total_artworks": 5,
      "owned_percentage": 40
    }
  }]
}
```

### POST `/api/shop/cart/series-suggestions`
Returns series completion suggestions based on cart contents.

**Request:**
```json
{ "handles": ["product-handle-1", "product-handle-2"] }
```

**Response:**
```json
{
  "suggestions": [{
    "id": "shopify-id",
    "handle": "product-handle",
    "title": "Product Title",
    "price": "29.99",
    "image_url": "https://...",
    "series_name": "Series Name",
    "series_id": "uuid"
  }]
}
```

---

## Database Schema Dependencies

- `vendors` table — profile fields: `bio`, `artist_bio`, `artist_history`, `instagram_url`, `website`, `profile_image`, `profile_picture_url`, `signature_url`
- `artwork_series` table — series metadata
- `artwork_series_members` table — links artworks to series
- `vendor_product_submissions` table — maps Shopify products to submissions
- `line_items` table — tracks ownership for collector counts and progress
- `collector_profiles` table — collector identity

---

## UI/UX Considerations

- **Artist pages** now show a rich hero with profile image, bio, social links, series grid, and social proof
- **Series listing page** shows all series as cards with thumbnails and collector progress bars
- **ProductSeriesInfo** adapts to guest vs authenticated: guests see "Part of [Series] (5 artworks)", collectors see "You own 2/5 — complete the series"
- **Cart upsells** prioritize series completion over general recommendations
- **Product cards** show series position badges and artist avatars

---

## Known Limitations

- Artist profile lookup uses case-insensitive `vendor_name` matching — may need normalization for edge cases
- Collector count is based on `line_items.owner_email` which requires email to be populated
- Series suggestions in cart depend on `shopify_product_handle` being populated in `vendor_product_submissions`
- The `VinylProductCard` new props (`seriesInfo`, `artistAvatarUrl`, `isInCollection`) need to be passed by parent components — currently the product page and product grid pages don't pass these yet (they work without them via graceful degradation)

---

## Future Improvements

- Feed `seriesInfo` and `artistAvatarUrl` into product cards on listing/grid pages (requires API enrichment for product lists)
- Add "In your collection" check on product cards using shop auth context
- Add series completion bonus credits (Track C3 dependency)
- Add "More from this artist" section to product detail pages
- Add series completion notification emails

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-14 | 1.0.0 | Initial implementation of Track B (B1, B2, B3) |
