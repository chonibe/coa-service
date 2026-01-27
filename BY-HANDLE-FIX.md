# By-Handle Artwork Pages Access Fix

## Issue Summary
Vendors were unable to access artwork pages for old/sold products using URLs like:
`https://app.thestreetcollector.com/vendor/dashboard/artwork-pages/by-handle/afternoon-love`

The system was returning 404 errors because:
1. Old products don't have the `handle` field properly populated
2. The API only did exact handle matching
3. No fallback mechanism existed for products without handles

## Solution Implemented

Extended `/api/vendor/products/by-handle/[handle]/route.ts` with a **three-tier search strategy**:

### Tier 1: Exact Handle Match
```typescript
.eq("handle", handle)
```
Searches for exact handle match (fastest)

### Tier 2: Case-Insensitive Handle Search
```typescript
.ilike("handle", handle)
```
If exact match fails, tries case-insensitive search

### Tier 3: Name Similarity Search
```typescript
// Convert "afternoon-love" -> "Afternoon Love"
const searchName = handle
  .split('-')
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ')

.ilike("name", `%${searchName}%`)
```
If handle still not found, searches by product name

## Key Features

### 1. Handle Format Conversion
- Converts URL-friendly handles to readable names
- Example: `afternoon-love` → `Afternoon Love`
- Enables finding products even without handle field

### 2. Better Error Messages
When product not found, returns:
```json
{
  "error": "Product not found",
  "message": "No product found with handle 'afternoon-love'",
  "suggestion": "Try syncing products from Shopify...",
  "availableProducts": [
    { "handle": "side-b-3", "name": "Side B 3" },
    { "handle": null, "name": "Afternoon Love" }
  ]
}
```

### 3. Improved Logging
- Logs each search attempt
- Shows which tier found the match
- Helps debug handle issues

### 4. Match Transparency
Returns `matchedBy` field in response:
```json
{
  "success": true,
  "product": { "id": "...", "name": "Afternoon Love" },
  "matchedBy": "name_similarity"  // or "exact_handle"
}
```

## Use Cases

### Old/Sold Products
- ✅ Products without handle field populated
- ✅ Products with missing Shopify sync data
- ✅ Legacy products from before handle implementation

### Case Mismatches
- ✅ `Afternoon-Love` vs `afternoon-love`
- ✅ `AFTERNOON-LOVE` vs `afternoon-love`

### Name-Based Access
- ✅ Access by product name even without handle
- ✅ Works with partial name matches

## Testing

### Test Case 1: Exact Handle
```
URL: /vendor/dashboard/artwork-pages/by-handle/afternoon-love
Expected: ✅ Redirects to /vendor/dashboard/artwork-pages/{productId}
```

### Test Case 2: No Handle (Name Match)
```
URL: /vendor/dashboard/artwork-pages/by-handle/afternoon-love
Product in DB: { name: "Afternoon Love", handle: null }
Expected: ✅ Finds product by name similarity
```

### Test Case 3: Case Mismatch
```
URL: /vendor/dashboard/artwork-pages/by-handle/AFTERNOON-LOVE
Product in DB: { handle: "afternoon-love" }
Expected: ✅ Finds via case-insensitive search
```

## Migration Recommendations

While this fix works around missing handles, consider:

1. **Sync Missing Handles**
   ```sql
   -- Find products without handles
   SELECT id, name, shopify_product_id 
   FROM products 
   WHERE handle IS NULL;
   ```

2. **Populate Handles from Shopify**
   - Use the sync script: `scripts/sync-product-handles-from-shopify.ts`
   - Or manually update from Shopify admin

3. **Generate Handles from Names**
   ```sql
   -- Generate slug-style handles from product names
   UPDATE products 
   SET handle = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
   WHERE handle IS NULL;
   ```

## Files Modified
- `app/api/vendor/products/by-handle/[handle]/route.ts`

## Related Issues
- Artwork pages 404 errors (fixed in previous commit)
- Product handle sync from Shopify

## Impact
- ✅ Vendors can now access ALL products via by-handle URLs
- ✅ No database changes required
- ✅ Backward compatible with existing handles
- ✅ Provides path forward for handle migration

## Deployment
- **Commit**: `8dcca3fb3`
- **Date**: January 27, 2026
- **Status**: Deployed to production

---

**Note**: This is a workaround solution. For best performance and maintainability, ensure all products have proper `handle` fields populated from Shopify.
