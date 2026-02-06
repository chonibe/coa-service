# Shopify Collection Sorting Guide

## Overview

This project uses Shopify's Storefront API to fetch products from collections. The order in which products appear in carousels, grids, and other components is controlled by the `sortKey` parameter.

## sortKey Options

### `'MANUAL'` (Default for Featured Collections)
**Use when:** You want to control the exact order products appear

**Best for:**
- Homepage carousels
- Featured collections
- Curated product showcases
- Promotional displays

**How to set order:**
1. Open Shopify Admin
2. Go to Products > Collections
3. Select your collection
4. Drag products to reorder
5. Click "Save"

**Current usage:**
- ✅ `/shop/home` - Best Sellers & New Releases
- ✅ `/shop/home-v2` - All carousels and grids
- ✅ `/shop/osmo-demo` - Product showcases

---

### `'BEST_SELLING'`
**Use when:** You want dynamic sorting by sales volume

**Best for:**
- "Trending Now" sections
- Automatic bestseller displays
- Performance-based rankings

**Notes:**
- Updates automatically based on sales
- No manual ordering required
- Good for large catalogs

---

### `'CREATED_AT'`
**Use when:** You want newest products first

**Best for:**
- "New Arrivals" sections
- Artist profile pages (show latest work)
- Time-sensitive releases

**Current usage:**
- ✅ `/api/shop/artists/[slug]` - Artist galleries
- Shows most recently created products first

---

### `'PRICE'`
**Use when:** Users filter by price

**Best for:**
- Product browse/filter pages
- Price comparison views
- Budget-conscious shoppers

**Options:**
- `reverse: false` - Low to high
- `reverse: true` - High to low

**Current usage:**
- ✅ `/shop/products` - User-controlled sorting

---

### `'TITLE'`
**Use when:** Alphabetical order is needed

**Best for:**
- A-Z product directories
- Reference catalogs
- Large inventories

---

## Code Examples

### Fetch with Manual Sorting
```typescript
const collection = await getCollection('best-sellers', {
  first: 12,
  sortKey: 'MANUAL', // Respects Shopify Admin order
})
```

### Fetch with Best Selling
```typescript
const collection = await getCollection('trending', {
  first: 8,
  sortKey: 'BEST_SELLING', // Dynamic sales-based
})
```

### Fetch Newest First
```typescript
const collection = await getCollection('new-releases', {
  first: 10,
  sortKey: 'CREATED_AT',
  reverse: true, // Newest first
})
```

### Fetch Lowest Price First
```typescript
const collection = await getCollection('all-products', {
  first: 20,
  sortKey: 'PRICE',
  reverse: false, // Low to high
})
```

---

## Component-Specific Behavior

### CircularCarousel
```tsx
// Products appear in Shopify Admin collection order
<CircularCarousel
  title="Best Sellers"
  products={bestSellers} // Sorted by sortKey: 'MANUAL'
/>
```

### FlickCards
```tsx
// Cards display in collection order
<FlickCards
  cards={newReleases} // Sorted by sortKey: 'MANUAL'
  columns={{ mobile: 1, tablet: 2, desktop: 3 }}
/>
```

---

## Where Sorting is Applied

| Page/Component | Sort Key | Reverse | Reason |
|---------------|----------|---------|--------|
| `/shop/home` - Best Sellers | `MANUAL` | No | Curated homepage display |
| `/shop/home` - New Releases | `MANUAL` | No | Curated homepage display |
| `/shop/home-v2` - All sections | `MANUAL` | No | Enhanced experience respects curation |
| `/shop/osmo-demo` | `MANUAL` | No | Demo showcases manual ordering |
| `/api/shop/artists/[slug]` | `CREATED_AT` | Yes | Show artist's newest work |
| `/shop/products` | User choice | User choice | Dynamic filtering |

---

## Troubleshooting

### "Products appear in wrong order"
**Solution:** Check that collection query uses `sortKey: 'MANUAL'` and you've saved the order in Shopify Admin.

### "New products don't show first"
**Solution:** Change `sortKey: 'MANUAL'` to `sortKey: 'CREATED_AT'` with `reverse: true`.

### "Order changes unexpectedly"
**Solution:** Using `'BEST_SELLING'` or `'CREATED_AT'` will update automatically. Switch to `'MANUAL'` for fixed order.

### "Can't reorder products"
**Solution:** 
1. Verify collection type is "Manual" in Shopify (not "Automated")
2. Ensure you're saving changes in Shopify Admin
3. Clear Next.js cache: `npm run build` or restart dev server

---

## Migration Notes

**Before:** Collections defaulted to `sortKey: 'BEST_SELLING'`
**After:** Homepage collections now use `sortKey: 'MANUAL'`

This change was made on **2026-02-04** to allow curated product displays that respect the order set in Shopify Admin.

---

## Related Documentation

- [Shopify Storefront API - Collections](https://shopify.dev/docs/api/storefront/latest/queries/collection)
- [Product Collection Sort Keys](https://shopify.dev/docs/api/storefront/latest/enums/ProductCollectionSortKeys)
- `/docs/OSMO_INSPIRED_COMPONENTS.md` - Component details
- `/lib/shopify/storefront-client.ts` - API implementation

---

**Last Updated:** 2026-02-04  
**Status:** Active
