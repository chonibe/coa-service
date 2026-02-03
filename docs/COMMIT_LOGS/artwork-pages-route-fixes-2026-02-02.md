# Artwork Pages Route Fixes - February 2, 2026

## Summary
Fixed 404 errors and runtime errors related to the artwork pages route consolidation. Updated remaining references from the old `/vendor/dashboard/artwork-pages/[productId]` route to the new `/artwork-editor/[productId]` route, and added defensive checks to prevent `block_config` undefined errors.

## Problems Identified

### 1. 404 Error on Artwork Pages Route
**Error:** `Failed to load resource: the server responded with a status of 404 ()`
**URL:** `https://app.thestreetcollector.com/vendor/dashboard/artwork-pages/00000000-0000-4000-8000-07de59de00e3`

**Root Cause:** The route `/vendor/dashboard/artwork-pages/[productId]` was removed during the artwork editor consolidation (see artwork-pages-removal-2026-02-02.md), but several components still referenced the old route.

### 2. MapBlock Runtime Error
**Error:** `TypeError: Cannot read properties of undefined (reading 'block_config')`

**Root Cause:** The MapBlock component expected `contentBlock.block_config` but didn't handle cases where:
- `contentBlock` itself might be undefined
- `block_config` property might be missing

**Stack Trace Location:** MapBlock component line 26, attempting to access `contentBlock.block_config`

## Changes Made

### 1. Fixed MapBlock Component Null Safety
**File:** `app/collector/artwork/[id]/components/MapBlock.tsx`

**Before:**
```typescript
interface MapBlockProps {
  title?: string | null
  contentBlock: {
    block_config: {
      // ... config properties
    }
  }
}

export function MapBlock({ title, contentBlock }: MapBlockProps) {
  const config = contentBlock.block_config || {}
```

**After:**
```typescript
interface MapBlockProps {
  title?: string | null
  contentBlock?: {
    block_config?: {
      // ... config properties
    }
  }
}

export function MapBlock({ title, contentBlock }: MapBlockProps) {
  // Add defensive checks for undefined contentBlock or block_config
  if (!contentBlock?.block_config) {
    console.warn('MapBlock: contentBlock or block_config is undefined')
    return null
  }
  
  const config = contentBlock.block_config || {}
```

**Changes:**
- Made `contentBlock` optional with `?`
- Made `block_config` optional with `?`
- Added early return with warning if data is missing
- Prevents runtime errors when block data is malformed

### 2. Updated Product Table Edit Link
**File:** `app/vendor/dashboard/components/product-table.tsx`

**Before:**
```typescript
<Link href={`/vendor/dashboard/artwork-pages/by-handle/${product.handle}`}>
  <FileText className="h-4 w-4" />
  <span className="sr-only">Edit Artwork Page</span>
</Link>
```

**After:**
```typescript
<Link href={`/artwork-editor/${product.id}`}>
  <FileText className="h-4 w-4" />
  <span className="sr-only">Edit Artwork Page</span>
</Link>
```

**Changes:**
- Updated route from `/vendor/dashboard/artwork-pages/by-handle/` to `/artwork-editor/`
- Changed from handle-based routing to ID-based routing
- Aligns with new consolidated route structure

### 3. Updated By-Handle Page Redirect
**File:** `app/vendor/dashboard/artwork-pages/by-handle/[handle]/page.tsx`

**Before:**
```typescript
const data = await response.json()
if (data.product?.id) {
  router.replace(`/vendor/dashboard/artwork-pages/${data.product.id}`)
  return
}
```

**After:**
```typescript
const data = await response.json()
if (data.product?.id) {
  router.replace(`/artwork-editor/${data.product.id}`)
  return
}
```

**Changes:**
- Updated redirect destination from old route to new route
- Maintains handle-based lookup but redirects to correct editor

### 4. Updated Mobile Page Preview Link
**File:** `app/artwork-pages/[productId]/mobile/page.tsx`

**Before:**
```typescript
const handlePreview = () => {
  window.open(`/vendor/dashboard/artwork-pages/${productId}/preview`, "_blank")
}
```

**After:**
```typescript
const handlePreview = () => {
  window.open(`/preview/artwork/${productId}`, "_blank")
}
```

**Changes:**
- Updated preview route from `/vendor/dashboard/artwork-pages/[id]/preview` to `/preview/artwork/[id]`
- Aligns with existing preview API route at `app/api/vendor/artwork-pages/[productId]/preview/route.ts`
- Matches preview page at `app/preview/artwork/[productId]/page.tsx`

### 5. Added MapBlock Validation in Page
**File:** `app/collector/artwork/[id]/page.tsx`

**Before:**
```typescript
case "Artwork Map Block":
  return (
    <motion.div
      key={block.id}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay, duration: 0.6 }}
    >
      <MapBlock
        title={block.title}
        contentBlock={block}
      />
    </motion.div>
  )
```

**After:**
```typescript
case "Artwork Map Block":
  // Add defensive check for block data
  if (!block || !block.block_config) {
    console.warn(`MapBlock ${block?.id}: Missing block_config data`)
    return null
  }
  return (
    <motion.div
      key={block.id}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay, duration: 0.6 }}
    >
      <MapBlock
        title={block.title}
        contentBlock={block}
      />
    </motion.div>
  )
```

**Changes:**
- Added validation before rendering MapBlock
- Logs warning with block ID when data is missing
- Returns null instead of crashing
- Provides better debugging information

## Files Changed

### Modified:
- ✅ `app/collector/artwork/[id]/components/MapBlock.tsx` - Added null safety checks
- ✅ `app/vendor/dashboard/components/product-table.tsx` - Updated edit link route
- ✅ `app/vendor/dashboard/artwork-pages/by-handle/[handle]/page.tsx` - Updated redirect route
- ✅ `app/artwork-pages/[productId]/mobile/page.tsx` - Updated preview link
- ✅ `app/collector/artwork/[id]/page.tsx` - Added block validation

## Route Migration Summary

### Old Routes → New Routes

| Old Route | New Route | Purpose |
|-----------|-----------|---------|
| `/vendor/dashboard/artwork-pages/[id]` | `/artwork-editor/[id]` | Main editor |
| `/vendor/dashboard/artwork-pages/by-handle/[handle]` | `/artwork-editor/[id]` (via redirect) | Handle lookup → editor |
| `/vendor/dashboard/artwork-pages/[id]/preview` | `/preview/artwork/[id]` | Preview artwork page |

### Preserved Routes

These routes still exist and are working correctly:
- ✓ `/artwork-editor/[productId]` - Light mode artwork editor
- ✓ `/preview/artwork/[productId]` - Vendor preview page
- ✓ `/artwork-pages/[productId]/mobile` - Mobile editor (legacy)
- ✓ `/vendor/dashboard/artwork-pages/by-handle/[handle]` - Handle resolver (redirects to new route)
- ✓ `/vendor/dashboard/artwork-pages/series/[seriesId]` - Series-specific pages

## API Routes

### Still Active:
- ✓ `/api/vendor/artwork-pages/[productId]` - CRUD operations
- ✓ `/api/vendor/artwork-pages/[productId]/preview` - Preview data
- ✓ `/api/vendor/artwork-pages/[productId]/reorder` - Reorder blocks
- ✓ `/api/vendor/artwork-pages/[productId]/apply-template` - Apply templates

## Testing Checklist

### Route Testing:
- [x] Product table "Edit Page" button works
- [x] By-handle route redirects correctly
- [x] Mobile preview opens correct page
- [x] No 404 errors on artwork editor access

### Component Testing:
- [x] MapBlock renders without errors when data is valid
- [x] MapBlock returns null gracefully when data is missing
- [x] Console warnings appear for debugging when blocks are malformed
- [x] Other blocks continue to render even if MapBlock data is missing

### Integration Testing:
- [x] Artwork page loads successfully
- [x] All block types render correctly
- [x] No console errors for valid data
- [x] Helpful warnings for invalid data

## Error Handling Improvements

### Before:
- Runtime crashes when `block_config` was undefined
- No helpful error messages
- Entire page could fail to render

### After:
- Graceful degradation when data is missing
- Console warnings for debugging
- Other content continues to render
- Clear error messages identifying problematic blocks

## Browser Console Output

### Valid MapBlock:
- No errors or warnings
- Block renders normally

### Invalid MapBlock (missing block_config):
```
[Warning] MapBlock: contentBlock or block_config is undefined
[Warning] MapBlock 123: Missing block_config data
```

## Related Issues

### Resolved:
- ✅ 404 error on `/vendor/dashboard/artwork-pages/[productId]`
- ✅ TypeError reading `block_config` property
- ✅ Inconsistent route references across components

### Prevention:
- Added TypeScript optional chaining throughout
- Added validation before component rendering
- Console warnings for easier debugging
- Better error messages for developers

## Migration Guide

### For Developers:
1. **Use new routes in all new code:**
   - Editor: `/artwork-editor/[id]`
   - Preview: `/preview/artwork/[id]`

2. **Handle-based lookups:**
   - Still supported via `/vendor/dashboard/artwork-pages/by-handle/[handle]`
   - Automatically redirects to new route

3. **Block Components:**
   - Always check for `block_config` existence
   - Use optional chaining: `block?.block_config?.property`
   - Add early returns for missing data

### For API Consumers:
- No changes to API routes
- Same endpoints continue to work
- Preview API matches new preview page route

## Backward Compatibility

### Maintained:
- ✓ By-handle routes (redirects to new location)
- ✓ API routes unchanged
- ✓ Mobile editor still works
- ✓ Series pages still work

### Removed:
- ❌ Direct access to `/vendor/dashboard/artwork-pages/[id]`
- ❌ List page at `/vendor/dashboard/artwork-pages`

## Performance Impact

### Improvements:
- Faster rendering (blocks with errors don't crash page)
- Better user experience (partial content vs total failure)
- Easier debugging (console warnings instead of silent failures)

### Neutral:
- Route redirects add minimal overhead
- Validation checks are negligible performance cost

## Future Enhancements

Potential improvements:
1. Add visual placeholder for failed blocks (instead of silent null)
2. Admin panel to view blocks with missing data
3. Automated data validation in database
4. Migration script to fix existing malformed blocks
5. TypeScript strict mode for block schemas

## Rollback Plan

If issues arise:

```bash
# Revert all changes
git checkout HEAD~1 -- app/collector/artwork/[id]/components/MapBlock.tsx
git checkout HEAD~1 -- app/vendor/dashboard/components/product-table.tsx
git checkout HEAD~1 -- app/vendor/dashboard/artwork-pages/by-handle/[handle]/page.tsx
git checkout HEAD~1 -- app/artwork-pages/[productId]/mobile/page.tsx
git checkout HEAD~1 -- app/collector/artwork/[id]/page.tsx
```

## Version Info
- **Date:** February 2, 2026
- **Related Changes:** Artwork Pages Removal (artwork-pages-removal-2026-02-02.md)
- **Status:** ✅ Complete
- **Tested:** ✅ Yes
- **Deployed:** Pending

## References

### Related Commits:
- Artwork Pages Removal - 2026-02-02
- Artwork Editor Consolidation - 2026-02-02

### Affected Routes:
- `/artwork-editor/[productId]`
- `/preview/artwork/[productId]`
- `/vendor/dashboard/artwork-pages/by-handle/[handle]`

### Affected Components:
- MapBlock
- ProductTable
- MobileArtworkEditor
- CollectorArtworkPage
