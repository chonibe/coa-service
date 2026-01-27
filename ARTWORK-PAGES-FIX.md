# Artwork Pages API Fix - Support for Submissions

## Issue Summary
The artwork pages editor was returning 404 errors when trying to create or edit content blocks for:
1. Pending submissions (UUIDs from `vendor_product_submissions` table)
2. Accepted products stored in the `products` table with UUID IDs

### Error Messages
```
Failed to load resource: the server responded with a status of 404
Error: Product not found
Failed to add block: 404
```

## Root Cause
The GET handler in `/api/vendor/artwork-pages/[productId]/route.ts` supported both submission IDs (UUIDs) and product IDs, but the mutation handlers (POST, PUT, DELETE) and the apply-template handler only checked the `products` table, causing 404 errors for submissions.

## Solution Implemented
Extended all API handlers to support both submissions and products:

### Files Modified
1. `app/api/vendor/artwork-pages/[productId]/route.ts`
   - POST handler (add content block)
   - PUT handler (update content block)
   - DELETE handler (remove content block)

2. `app/api/vendor/artwork-pages/[productId]/apply-template/route.ts`
   - POST handler (apply default template)

### Implementation Details

#### UUID Detection
All handlers now detect if the `productId` is a UUID using regex:
```typescript
const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)
```

#### Dual Lookup Strategy
1. If UUID: First check `vendor_product_submissions` table
2. If not found or not UUID: Check `products` table
3. Return 404 only if neither lookup succeeds

#### Data Storage Approach

**For Submissions:**
- Content blocks are stored in `product_data.benefits` array as JSON
- Block IDs use temp format: `temp-0`, `temp-1`, etc.
- No draft/published state (always considered published)
- Changes are made by updating the entire `product_data` object

**For Products:**
- Content blocks are stored in `product_benefits` table
- Block IDs are database-generated integers
- Supports draft/published states via `is_published` flag
- Changes are made via direct database operations

### Key Features

#### POST (Add Block)
- For submissions: Appends new block to `product_data.benefits` array
- For products: Inserts into `product_benefits` table
- Automatically generates appropriate IDs for each storage type

#### PUT (Update Block)
- For submissions: Finds and updates block in `product_data.benefits` array
- For products: Updates row in `product_benefits` table
- Supports partial updates (only specified fields are changed)

#### DELETE (Remove Block)
- For submissions: Filters out block from `product_data.benefits` array
- For products: Deletes row from `product_benefits` table

#### Apply Template
- For submissions: Adds 4 default template blocks to `product_data.benefits` array
- For products: Inserts 4 default template blocks into `product_benefits` table
- Template includes: Text Block, Image Block, Video Block, Audio Block

## Testing
1. ✅ Server starts without compilation errors
2. ✅ No linter errors
3. ⏳ Awaiting user testing with actual submission and product IDs

## Benefits
1. Vendors can now edit content blocks for pending submissions
2. Vendors can edit content blocks for accepted products with UUID IDs
3. Consistent API behavior across all product/submission types
4. Maintains backward compatibility with existing products

## Migration Path
When a submission is accepted and converted to a product:
- Content blocks from `product_data.benefits` can be migrated to `product_benefits` table
- This migration is handled by the submission acceptance workflow (separate concern)

## Related Files
- `/app/vendor/dashboard/artwork-pages/[productId]/page.tsx` - Frontend editor component
- `/app/api/vendor/artwork-pages/route.ts` - Artwork pages listing API
- `/app/api/vendor/artwork-pages/[productId]/route.ts` - Content blocks CRUD API
- `/app/api/vendor/artwork-pages/[productId]/apply-template/route.ts` - Template application API

## Date
January 27, 2026
