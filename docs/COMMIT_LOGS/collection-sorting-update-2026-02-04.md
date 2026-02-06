# Collection Sorting Update - Manual Order Respected

**Date:** 2026-02-04  
**Type:** Enhancement  
**Status:** ✅ Complete

---

## Summary

Updated all homepage and featured collection queries to use `sortKey: 'MANUAL'` instead of the default `'BEST_SELLING'`. This ensures product carousels and grids respect the exact order you set in Shopify Admin, allowing for curated displays.

---

## Changes Made

### 1. Updated Collection Queries

**Files Modified:**
- ✅ `app/shop/home/page.tsx`
- ✅ `app/shop/home-v2/page.tsx`
- ✅ `app/shop/osmo-demo/page.tsx`

**Before:**
```typescript
getCollection('best-sellers', { first: 8 })
// Defaulted to sortKey: 'BEST_SELLING'
```

**After:**
```typescript
getCollection('best-sellers', { first: 8, sortKey: 'MANUAL' })
// Now respects Shopify Admin collection order
```

### 2. Files Left Unchanged (Intentionally)

**Artist API (`app/api/shop/artists/[slug]/route.ts`)**
- Uses `sortKey: 'CREATED_AT'` with `reverse: true`
- **Reason:** Shows artist's newest work first
- **Behavior:** Correct for artist galleries

**Products Page (`app/shop/products/page.tsx`)**
- Uses dynamic `sortKey` from user selection
- **Reason:** User-controlled filtering
- **Behavior:** Correct for browse/search pages

---

## Impact

### What Changed
- ✅ Best Sellers carousel now shows products in your Shopify order
- ✅ New Releases grid displays in your curated sequence
- ✅ Featured artist collections respect manual arrangement
- ✅ CircularCarousel cards appear in Shopify Admin order
- ✅ FlickCards gallery respects collection sorting

### What Stayed the Same
- ⚠️ Artist profile pages still show newest work first (by design)
- ⚠️ Product browse page still allows user sorting (by design)
- ⚠️ Search results remain relevance-based (by design)

---

## Benefits

### 1. Curatorial Control
You can now:
- Feature specific products first in carousels
- Create story-driven product sequences
- Highlight promotional items at the start
- Control the visual flow of your shop

### 2. Marketing Flexibility
- Promote seasonal items by placing them first
- Spotlight collaborations in custom order
- Test different product arrangements
- Optimize for conversions

### 3. Consistency
- Product order matches your Shopify Admin setup
- No surprises from automatic sorting algorithms
- Easier to maintain and update displays

---

## How to Update Product Order

### In Shopify Admin:
1. Navigate to **Products > Collections**
2. Select the collection (e.g., "Best Sellers")
3. Ensure collection type is **"Manual"** (not "Automated")
4. **Drag and drop** products to reorder
5. Click **"Save"**
6. Refresh your site to see changes

### Verification:
```bash
# Check the order in your terminal
curl https://your-site.com/shop/home

# Or use Shopify's GraphQL API explorer:
# https://shopify.dev/docs/api/storefront
```

---

## Technical Details

### API Function Used
```typescript
export async function getCollection(
  handle: string, 
  options: {
    first?: number
    sortKey?: 'MANUAL' | 'BEST_SELLING' | 'CREATED_AT' | 'PRICE' | 'TITLE'
    reverse?: boolean
  }
)
```

### Sort Key Options

| Sort Key | Use Case | Reverse | Output |
|----------|----------|---------|--------|
| `MANUAL` | Curated displays | N/A | Your Shopify order |
| `BEST_SELLING` | Dynamic rankings | No | Top sellers first |
| `CREATED_AT` | New arrivals | Yes | Newest first |
| `PRICE` | Price filtering | No/Yes | Low-high or high-low |
| `TITLE` | Alphabetical | No | A-Z order |

---

## Code Changes

### app/shop/home/page.tsx
```typescript
// Line 48-56
const [newReleasesCollection, bestSellersCollection, product] = await Promise.all([
  getCollection(homepageContent.newReleases.collectionHandle, {
    first: homepageContent.newReleases.productsCount,
    sortKey: 'MANUAL', // ← Added
  }).catch(() => null),
  getCollection(homepageContent.bestSellers.collectionHandle, {
    first: 6,
    sortKey: 'MANUAL', // ← Added
  }).catch(() => null),
  getProduct(homepageContent.featuredProduct.productHandle).catch(() => null),
])

// Line 76
const collection = await getCollection(artist.handle, { 
  first: 1, 
  sortKey: 'MANUAL' // ← Added
}).catch(() => null)
```

### app/shop/home-v2/page.tsx
```typescript
// Line 52-60
const [newReleasesCollection, bestSellersCollection, product] = await Promise.all([
  getCollection(homepageContent.newReleases.collectionHandle, {
    first: homepageContent.newReleases.productsCount,
    sortKey: 'MANUAL', // ← Added
  }).catch(() => null),
  getCollection(homepageContent.bestSellers.collectionHandle, {
    first: 12,
    sortKey: 'MANUAL', // ← Added
  }).catch(() => null),
  getProduct(homepageContent.featuredProduct.productHandle).catch(() => null),
])

// Line 80
const collection = await getCollection(artist.handle, { 
  first: 1, 
  sortKey: 'MANUAL' // ← Added
}).catch(() => null)
```

### app/shop/osmo-demo/page.tsx
```typescript
// Line 34-37
const [bestSellersCollection, newReleasesCollection] = await Promise.all([
  getCollection(homepageContent.bestSellers.collectionHandle, { 
    first: 8, 
    sortKey: 'MANUAL' // ← Added
  }).catch(() => null),
  getCollection(homepageContent.newReleases.collectionHandle, { 
    first: 6, 
    sortKey: 'MANUAL' // ← Added
  }).catch(() => null),
])
```

---

## Documentation Added

### 1. SHOPIFY_COLLECTION_SORTING.md
Complete guide covering:
- All sortKey options with examples
- When to use each sorting method
- How to change collection order in Shopify
- Component-specific behavior
- Troubleshooting guide

### 2. OSMO_INSPIRED_COMPONENTS.md (Updated)
Added section:
- Explanation of manual sorting benefits
- List of where it's applied
- Quick reference for changing order

---

## Testing Checklist

- [x] Homepage best sellers displays in Shopify order
- [x] Homepage new releases respects manual sorting
- [x] Enhanced homepage (home-v2) uses manual order
- [x] Osmo demo page shows correct sequence
- [x] CircularCarousel cards appear in proper order
- [x] FlickCards grid respects collection sorting
- [x] Artist pages still show newest work first (correct)
- [x] Product browse page still allows user sorting (correct)

---

## Migration Guide

### If You Want Dynamic Sorting (Bestsellers)
Change back to:
```typescript
getCollection('collection-handle', {
  first: 10,
  sortKey: 'BEST_SELLING', // Auto-sorted by sales
})
```

### If You Want Newest First
Use:
```typescript
getCollection('collection-handle', {
  first: 10,
  sortKey: 'CREATED_AT',
  reverse: true, // Newest first
})
```

### If You Want Custom Logic
Keep `MANUAL` and reorder in Shopify Admin as needed.

---

## Related Issues

**User Request:**
> "make sure we are using the settings from the shopify collection itself when we have the cards so that we can modify the order of the cards and which products"

**Solution:**
Implemented `sortKey: 'MANUAL'` across all featured collection queries to respect Shopify Admin collection order.

---

## Performance Impact

- ✅ No performance change
- ✅ Same API calls, different parameter
- ✅ No additional queries required
- ✅ Cache behavior unchanged (60s revalidation)

---

## Future Enhancements

1. **Admin UI for Sort Selection**
   - Let admins choose sort method per section
   - Store preferences in database
   - Allow A/B testing different orders

2. **Hybrid Sorting**
   - Manual order for top 5 products
   - Best-selling for remaining
   - Configurable split point

3. **Visual Collection Editor**
   - Drag-and-drop in admin dashboard
   - Preview how order looks on site
   - Bulk reordering tools

---

## Rollback Instructions

If needed, revert to best-selling sort:

```bash
# Find and replace in files
sed -i "s/sortKey: 'MANUAL'/sortKey: 'BEST_SELLING'/g" app/shop/*/page.tsx
```

Or manually change `sortKey: 'MANUAL'` back to default (omit parameter).

---

**Implemented By:** AI Assistant  
**Reviewed By:** Pending  
**Deployed:** Pending
