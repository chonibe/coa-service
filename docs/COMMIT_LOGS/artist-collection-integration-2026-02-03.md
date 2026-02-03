# Artist Collection Integration

## Date: 2026-02-03

## Summary

Updated artist profile pages to fetch data from Shopify collections instead of using product vendor data. Artists now display their proper profile photos and bios from their dedicated collections.

## Changes Made

### Artist API Enhancement

**Modified Files:**
- [`app/api/shop/artists/[slug]/route.ts`](../../app/api/shop/artists/[slug]/route.ts)

**Changes:**
- Primary data source changed from product vendor filtering to Shopify collection lookup
- Collections provide proper artist profile data:
  - `collection.image.url` → Artist profile photo
  - `collection.description` or `collection.descriptionHtml` → Artist bio
  - `collection.title` → Artist name
  - `collection.products` → Artist's artworks
- Fallback to vendor-based logic if collection not found
- Uses `getProductsByVendor()` for fallback instead of filtering all products

## Data Flow

### Before
```
User visits /shop/artists/nia-stai
  ↓
API fetches ALL products (first 250)
  ↓
Filters by vendor name
  ↓
Uses first product's image as profile photo ❌
  ↓
Uses first product's description as bio ❌
```

### After
```
User visits /shop/artists/nia-stai
  ↓
API fetches collection by handle "nia-stai"
  ↓
Uses collection.image as profile photo ✓
  ↓
Uses collection.description as bio ✓
  ↓
Gets products directly from collection ✓
  ↓
Fallback to vendor search if no collection found
```

## API Logic

```typescript
// 1. Try to fetch collection by slug (handle)
const collection = await getCollection(slug, {
  first: 50,
  sortKey: 'CREATED_AT',
  reverse: true,
})

if (collection) {
  // Use collection data (preferred)
  return {
    name: collection.title,
    image: collection.image?.url,
    bio: collection.description,
    products: collection.products.edges.map(e => e.node),
  }
}

// 2. Fallback to vendor search
const { products } = await getProductsByVendor(artistName, {
  first: 50,
  sortKey: 'CREATED_AT',
  reverse: true,
})

// Use first product's data as fallback
return {
  name: products[0].vendor,
  image: products[0].featuredImage?.url,
  bio: products[0].description,
  products,
}
```

## Benefits

1. **Proper Profile Photos**: Collections have dedicated artist photos instead of product images
2. **Better Bios**: Collection descriptions are artist-focused, not product-focused
3. **Curated Content**: Collections can be manually curated with specific products
4. **Performance**: Single collection query instead of filtering 250 products
5. **Fallback Support**: Still works for vendors without collections

## Collection Structure in Shopify

Artists should have collections set up with:
- **Handle**: Matches artist slug (e.g., `nia-stai`, `or-bar-el`)
- **Title**: Artist's display name (e.g., "Nia Shtai")
- **Description**: Artist bio and background
- **Image**: Professional profile photo
- **Products**: Curated list of artist's artworks

## Testing

Test the changes by visiting:
- https://app.thestreetcollector.com/shop/artists/nia-stai
- https://app.thestreetcollector.com/shop/artists/or-bar-el
- https://app.thestreetcollector.com/shop/artists/hen-macabi

Expected behavior:
1. Profile photo from collection (not product image)
2. Artist bio from collection description
3. Artworks from collection products
4. If no collection exists, fallback to vendor search

## Related Files

### API Routes
- [`app/api/shop/artists/[slug]/route.ts`](../../app/api/shop/artists/[slug]/route.ts) - Artist profile API

### Frontend Pages
- [`app/shop/artists/[slug]/page.tsx`](../../app/shop/artists/[slug]/page.tsx) - Artist profile page with vinyl cards

### Shopify Client
- [`lib/shopify/storefront-client.ts`](../../lib/shopify/storefront-client.ts) - `getCollection()` and `getProductsByVendor()`

## Deployment

**Status:** ✅ Deployed to production

**Production URL:** https://app.thestreetcollector.com

**Deployment URL:** https://street-collector-ouj8834de-chonibes-projects.vercel.app

**Deployed:** 2026-02-03

## Future Enhancements

- [ ] Add collection metafields for social media links
- [ ] Support artist video introductions via collection metafields
- [ ] Add artist featured/best selling products via collection tags
- [ ] Cache collection data for improved performance
