# Data Migration Guide: Move Artworks from time_based and vip Series

**Date:** February 5, 2026  
**Migration File:** `supabase/migrations/20260205000000_migrate_time_based_vip_series_to_standalone.sql`

## Overview

This migration moves all artworks from `time_based` and `vip` series back to standalone status (no series). This is part of the gradual rollout to hide these unlock types from the vendor portal UI.

## Pre-Migration Checks

Before running this migration, perform these verification queries in Supabase SQL Editor:

### 1. Check how many series need migration:
```sql
SELECT id, name, unlock_type, 
  (SELECT COUNT(*) FROM artwork_series_members WHERE series_id = artwork_series.id) as member_count
FROM artwork_series
WHERE unlock_type IN ('time_based', 'vip')
ORDER BY unlock_type, name;
```

### 2. Check total artworks affected:
```sql
SELECT COUNT(DISTINCT m.submission_id) as total_artworks_affected
FROM artwork_series_members m
JOIN artwork_series s ON m.series_id = s.id
WHERE s.unlock_type IN ('time_based', 'vip');
```

### 3. Get list of artworks by series:
```sql
SELECT 
  s.name as series_name,
  s.unlock_type,
  COUNT(m.id) as artwork_count,
  STRING_AGG(DISTINCT m.submission_id, ', ') as submission_ids
FROM artwork_series s
LEFT JOIN artwork_series_members m ON s.id = m.series_id
WHERE s.unlock_type IN ('time_based', 'vip')
GROUP BY s.id, s.name, s.unlock_type;
```

## Migration Steps

### Step 1: Backup Current State

In Supabase SQL Editor, create backup records:

```sql
-- Create temporary backup tables
CREATE TABLE IF NOT EXISTS backup_artwork_series_20260205 AS
SELECT * FROM artwork_series WHERE unlock_type IN ('time_based', 'vip');

CREATE TABLE IF NOT EXISTS backup_artwork_series_members_20260205 AS
SELECT m.* FROM artwork_series_members m
JOIN artwork_series s ON m.series_id = s.id
WHERE s.unlock_type IN ('time_based', 'vip');

CREATE TABLE IF NOT EXISTS backup_submissions_update_20260205 AS
SELECT id, series_id FROM vendor_product_submissions
WHERE series_id IN (SELECT id FROM artwork_series WHERE unlock_type IN ('time_based', 'vip'));
```

### Step 2: Run the Migration

In Supabase SQL Editor, execute the migration file contents:

```sql
-- Step 1: Remove all members from time_based and vip series
DELETE FROM artwork_series_members
WHERE series_id IN (
  SELECT id FROM artwork_series
  WHERE unlock_type IN ('time_based', 'vip')
);

-- Step 2: Clear series_id from vendor_product_submissions
UPDATE vendor_product_submissions
SET series_id = NULL
WHERE series_id IN (
  SELECT id FROM artwork_series
  WHERE unlock_type IN ('time_based', 'vip')
);

-- Step 3: Delete the series (OPTIONAL - currently commented out)
-- Uncomment below only if you want to fully remove these series records
-- DELETE FROM artwork_series WHERE unlock_type IN ('time_based', 'vip');
```

### Step 3: Verify Migration Success

Run these verification queries to confirm the migration:

#### 3a. Check that series members were removed:
```sql
SELECT COUNT(*) as remaining_members
FROM artwork_series_members m
JOIN artwork_series s ON m.series_id = s.id
WHERE s.unlock_type IN ('time_based', 'vip');
-- Expected result: 0
```

#### 3b. Check that submissions are now standalone:
```sql
SELECT COUNT(*) as standalone_artworks
FROM vendor_product_submissions
WHERE series_id IS NULL;
```

#### 3c. Verify series still exist (but are empty):
```sql
SELECT s.id, s.name, s.unlock_type,
  (SELECT COUNT(*) FROM artwork_series_members WHERE series_id = s.id) as member_count
FROM artwork_series s
WHERE s.unlock_type IN ('time_based', 'vip');
-- These series should now show member_count = 0
```

#### 3d. Check artworks are accessible without series:
```sql
SELECT COUNT(*) as migrated_artworks
FROM vendor_product_submissions
WHERE id IN (SELECT submission_id FROM backup_artwork_series_members_20260205)
AND series_id IS NULL;
-- Should match total_artworks_affected from pre-migration check
```

## Rollback Procedure

If the migration needs to be reversed:

```sql
-- Restore artwork_series_members from backup
INSERT INTO artwork_series_members
SELECT * FROM backup_artwork_series_members_20260205;

-- Restore series_id in vendor_product_submissions
UPDATE vendor_product_submissions vps
SET series_id = bsu.series_id
FROM backup_submissions_update_20260205 bsu
WHERE vps.id = bsu.id;
```

## Post-Migration Tasks

### 1. Notify Vendors
Send communication to vendors whose artworks were moved:
- List affected vendors
- Explain the change (phase 1 of gradual rollout)
- Provide instructions for re-organizing artworks if needed

### 2. Update Documentation
- [ ] Update feature documentation
- [ ] Update release notes
- [ ] Update vendor FAQ

### 3. Monitor System
- [ ] Check vendor dashboard for any UI issues
- [ ] Verify artworks display correctly as standalone
- [ ] Monitor for any benefit/unlock logic errors

### 4. Clean Up (Optional)

If migration is successful and you want to remove the empty series:

```sql
DELETE FROM artwork_series
WHERE unlock_type IN ('time_based', 'vip')
AND id NOT IN (
  SELECT DISTINCT series_id FROM artwork_series_members
);
```

## Data Integrity Notes

### What Gets Preserved:
✅ Artwork submission data  
✅ Order line items and purchases  
✅ Collector ownership records  
✅ Edition numbers and certificates  
✅ Collector profiles and history  

### What Changes:
- `vendor_product_submissions.series_id` → NULL for affected artworks
- `artwork_series_members` records → Deleted
- Series remains in database but empty (unless Step 3.4 cleanup is run)

### What Does NOT Change:
- Artwork content, metadata, or images
- Buyer records or transaction history
- Collector achievements or profiles
- Any other series data

## Estimated Impact

- **Affected Artworks:** TBD (run pre-migration check)
- **Affected Series:** TBD (run pre-migration check)
- **Database Impact:** Low (only 2 tables modified)
- **Performance Impact:** None (migration is straightforward DELETE/UPDATE)
- **Downtime Required:** None (operations can continue)

## Timeline

| Step | Task | Duration | Notes |
|------|------|----------|-------|
| Pre | Run verification queries | 5 min | Check what's being migrated |
| Pre | Create backups | 2 min | Safety measure |
| Migration | Execute SQL | 1 min | Actual data movement |
| Post | Verify success | 5 min | Confirm all queries pass |
| Post | Notify stakeholders | 15 min | Communication |

## Related Commits

- **UI Changes:** `2832af1b3` - Hide time_based and vip options from vendor portal
- **Migration:** `20260205000000_migrate_time_based_vip_series_to_standalone.sql`

## Support

If you encounter issues:

1. Check backup tables first
2. Review verification queries results
3. Use rollback procedure if needed
4. Contact development team with verification query outputs

## Completion Checklist

- [ ] Pre-migration verification queries run and documented
- [ ] Backup tables created successfully
- [ ] Migration SQL executed successfully
- [ ] All post-migration verification queries pass
- [ ] Series are now empty (0 members)
- [ ] Artworks are now standalone
- [ ] No errors in application logs
- [ ] Vendor portal displays correctly
- [ ] Vendor notifications sent (if applicable)
- [ ] Documentation updated
- [ ] Cleanup queries run (if series deletion desired)

---

**Status:** Ready for execution  
**Risk Level:** Low (data preservation, easy rollback)  
**Tested:** No (awaiting Supabase access)
