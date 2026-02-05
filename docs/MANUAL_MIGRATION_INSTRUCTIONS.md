# Manual Migration Execution Guide - Supabase Dashboard

**Status:** CLI unavailable on system  
**Recommended Method:** Manual execution via Supabase Dashboard  
**Time Required:** 5-10 minutes

## Step-by-Step Instructions

### 1. Access Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar

### 2. Create Backup Tables (Safety First)

Copy and paste this SQL into a new query:

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

Click **Run** button. You should see:
```
Queries completed successfully. 3 rows affected.
```

### 3. Check Pre-Migration State

Copy and paste this SQL into a NEW query:

```sql
-- How many series need migration?
SELECT COUNT(*) as series_count FROM artwork_series 
WHERE unlock_type IN ('time_based', 'vip');

-- How many artworks will be affected?
SELECT COUNT(DISTINCT m.submission_id) as artworks_affected
FROM artwork_series_members m
JOIN artwork_series s ON m.series_id = s.id
WHERE s.unlock_type IN ('time_based', 'vip');

-- How many series members exist?
SELECT COUNT(*) as series_members
FROM artwork_series_members m
WHERE series_id IN (
  SELECT id FROM artwork_series
  WHERE unlock_type IN ('time_based', 'vip')
);
```

Click **Run** and note the results. **Screenshot these for your records!**

### 4. Execute the Migration

Copy and paste this SQL into a NEW query:

```sql
-- MIGRATION STEP 1: Remove all members from time_based and vip series
DELETE FROM artwork_series_members
WHERE series_id IN (
  SELECT id FROM artwork_series
  WHERE unlock_type IN ('time_based', 'vip')
);
```

Click **Run**. You should see something like:
```
Query executed successfully. X rows deleted.
```

### 5. Clear Series References

Copy and paste this SQL into a NEW query:

```sql
-- MIGRATION STEP 2: Clear series_id from vendor_product_submissions
UPDATE vendor_product_submissions
SET series_id = NULL
WHERE series_id IN (
  SELECT id FROM artwork_series
  WHERE unlock_type IN ('time_based', 'vip')
);
```

Click **Run**. You should see:
```
Query executed successfully. Y rows updated.
```

### 6. Verify Migration Success

Copy and paste this SQL into a NEW query:

```sql
-- VERIFICATION 1: Check that no members remain in these series
SELECT COUNT(*) as should_be_zero
FROM artwork_series_members m
WHERE series_id IN (
  SELECT id FROM artwork_series
  WHERE unlock_type IN ('time_based', 'vip')
);

-- VERIFICATION 2: Count how many artworks are now standalone
SELECT COUNT(*) as standalone_count
FROM vendor_product_submissions
WHERE series_id IS NULL;

-- VERIFICATION 3: Show the now-empty series (should have 0 members)
SELECT s.id, s.name, s.unlock_type,
  (SELECT COUNT(*) FROM artwork_series_members WHERE series_id = s.id) as member_count
FROM artwork_series s
WHERE s.unlock_type IN ('time_based', 'vip');
```

Click **Run**. Expected results:
- `should_be_zero`: **0** ✅
- `standalone_count`: Total standalone artworks
- Third result: All series should show `member_count: 0` ✅

### 7. Test in Application

1. Go to vendor dashboard
2. Click "Series Management"
3. Verify the series list displays correctly
4. Check that you cannot create `time_based` or `vip` series
5. Try creating a `sequential` or `threshold` series - should work fine

### 8. Clean Up (Optional)

If everything looks good and you want to remove the now-empty series:

```sql
-- DELETE the now-empty series (OPTIONAL)
DELETE FROM artwork_series
WHERE unlock_type IN ('time_based', 'vip')
AND id NOT IN (
  SELECT DISTINCT series_id FROM artwork_series_members
  WHERE series_id IS NOT NULL
);
```

Click **Run** (only if you want to delete the empty series)

---

## Troubleshooting

### If you get an error about backup table already existing:
Add `IF NOT EXISTS` to the CREATE TABLE statement - it's already in the code above, so just run it again.

### If verification queries show non-zero values:
- Don't panic, data is safe
- Check if the queries ran successfully
- You may need to run steps 4 and 5 again
- Contact support with screenshot of verification results

### If you need to rollback:
Run this in a NEW query:

```sql
-- ROLLBACK: Restore from backups
INSERT INTO artwork_series_members
SELECT * FROM backup_artwork_series_members_20260205;

UPDATE vendor_product_submissions vps
SET series_id = bsu.series_id
FROM backup_submissions_update_20260205 bsu
WHERE vps.id = bsu.id;

-- Then drop the backup tables
DROP TABLE IF EXISTS backup_artwork_series_20260205;
DROP TABLE IF EXISTS backup_artwork_series_members_20260205;
DROP TABLE IF EXISTS backup_submissions_update_20260205;
```

---

## Success Checklist

- [ ] Backup tables created successfully
- [ ] Pre-migration verification queries run and recorded
- [ ] Migration Step 1 (DELETE) executed
- [ ] Migration Step 2 (UPDATE) executed
- [ ] All verification queries return expected results
- [ ] Application tested and working
- [ ] Vendor dashboard displays correctly
- [ ] No console errors in browser

---

## Timeline

| Step | Action | Time |
|------|--------|------|
| 1 | Create backups | 1 min |
| 2 | Check pre-state | 1 min |
| 3 | Execute DELETE | 30 sec |
| 4 | Execute UPDATE | 30 sec |
| 5 | Verify success | 2 min |
| 6 | Test application | 2 min |
| 7 | Optional cleanup | 1 min |
| **Total** | | **~8 minutes** |

---

**Once complete, reply with "Migration complete!" and I'll create the final verification report.**
