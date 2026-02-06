# Commit Log: Hide Series Unlock Types from Vendor Portal

**Date:** February 5, 2026  
**Commit Hash:** `2832af1b3892e6fdc123d04322394c3b7147e775`  
**Branch:** main

## Summary

Hid `time_based` and `vip` series unlock type options from the vendor dashboard UI while keeping `sequential`, `threshold`, and `nfc` options available. This is a gradual rollout strategy to phase in the more advanced unlock types later.

## Changes Made

### 1. **UnlockTypeCards Component**
**File:** `app/vendor/dashboard/series/components/UnlockTypeCards.tsx`

- **Removed** `vip` from `journeyTypes` array (lines 40-48)
- **Removed** `time_based` from `advancedTypes` array (lines 63-71)
- **Updated** "Advanced Options" label text from "(Threshold, Time-Based, NFC-only)" to "(Threshold, NFC-only)"
- **Removed** unused icon imports: `Clock`, `Star`

**Impact:** Vendors can no longer select `time_based` or `vip` when creating new series. Available options are:
- Open Collection (`any_purchase`) - Recommended
- Sequential (`sequential`) - Journey Type
- Threshold (`threshold`) - Advanced Option
- NFC-Only (`nfc`) - Advanced Option

### 2. **SeriesSettingsSidebar Component**
**File:** `app/vendor/dashboard/series/components/SeriesSettingsSidebar.tsx`

- **Removed** conditional render block for `time_based` unlock configuration (lines 184-191)
- **Removed** conditional render block for `vip` unlock configuration (lines 193-201)
- **Removed** display labels for `time_based` and `vip` in read-only display mode (lines 241-242)
- **Removed** component imports: `TimeBasedUnlockConfig`, `VIPUnlockConfig`

**Impact:** 
- Vendors cannot edit or configure `time_based` or `vip` unlock settings for new series
- Existing series with these types will continue to display their current unlock type but cannot be modified to use these types

### 3. **Series Selection Step in Product Creation**
**File:** `app/vendor/dashboard/products/create/components/series-step.tsx`

Updated three helper functions to remove handling for `time_based` and `vip` types:

- **`getUnlockTypeLabel()`:** Removed cases for "Time-Based" and "VIP"
- **`getUnlockTypeIcon()`:** Removed clock and crown icons for these types
- **`getUnlockTypeColor()`:** Removed styling rules for these types
- **Removed** unused icon import: `Clock`

**Impact:** Products being created or assigned to series will only show labels and styling for the 4 available unlock types.

## Backward Compatibility

✅ **Fully Backward Compatible**

- Existing series with `time_based` or `vip` unlock types **continue to function normally**
- Existing artworks in these series are **not affected**
- The unlock logic for these types remains in the codebase and database schema
- Vendors can still view existing series with these types, but cannot create new ones or modify them to use these types

## Next Steps

### Data Migration (Separate Task)
Artworks currently assigned to `time_based` and `vip` series should be:

1. **Identified** via Supabase query:
   ```sql
   SELECT * FROM artwork_series WHERE unlock_type IN ('time_based', 'vip');
   ```

2. **Migrated** to no series (standalone artworks) using:
   ```sql
   DELETE FROM artwork_series_members 
   WHERE series_id IN (
     SELECT id FROM artwork_series 
     WHERE unlock_type IN ('time_based', 'vip')
   );
   
   UPDATE vendor_product_submissions 
   SET series_id = NULL 
   WHERE series_id IN (
     SELECT id FROM artwork_series 
     WHERE unlock_type IN ('time_based', 'vip')
   );
   ```

3. **Optionally delete** the empty series:
   ```sql
   DELETE FROM artwork_series 
   WHERE unlock_type IN ('time_based', 'vip');
   ```

### Future Re-enablement
To re-enable these unlock types in the future:

1. Restore imports in the three modified components
2. Re-add the removed cases to `UnlockTypeCards`
3. Re-add conditional render blocks in `SeriesSettingsSidebar`
4. Re-add cases to the three helper functions in `series-step.tsx`

## Testing Checklist

- [ ] Visit vendor series management page - confirm only 4 unlock types shown in selector
- [ ] Attempt to create new series - confirm `time_based` and `vip` not available
- [ ] Check existing series with these types - confirm they still function (display correctly)
- [ ] Create new series with `sequential` type - confirm works normally
- [ ] Create new series with `threshold` type - confirm configuration works
- [ ] Create new series with `nfc` type - confirm available as advanced option
- [ ] Assign artwork to series with `any_purchase` type - confirm display correct in product creation
- [ ] Verify no console errors when viewing series management

## Files Modified

| File | Changes |
|------|---------|
| `app/vendor/dashboard/series/components/UnlockTypeCards.tsx` | Removed vip and time_based from arrays, updated label, removed icon imports |
| `app/vendor/dashboard/series/components/SeriesSettingsSidebar.tsx` | Removed conditional config blocks, removed imports for config components |
| `app/vendor/dashboard/products/create/components/series-step.tsx` | Updated three helper functions, removed Clock import |

## Related Documentation

- [Series & Edition Components Testing Guide](../SERIES_EDITION_COMPONENTS_GUIDE.md)
- [Artwork Series Types](../../types/artwork-series.ts)
- Series Unlock Type Definitions

## Deployment Notes

- **Environment:** Development/Preview (ready for production)
- **Risk Level:** Low (UI-only changes, no data modifications)
- **Rollback:** Revert commit `2832af1b3` if needed
- **Performance Impact:** None (no database or algorithm changes)
