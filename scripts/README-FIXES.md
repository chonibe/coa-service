# Database & Application Fixes

This document outlines the fixes implemented for duplicate collector profiles and missing product issues.

## Issues Fixed

### 1. Duplicate Collector Profiles
**Problem**: Multiple collector profiles exist with the same `shopify_customer_id`, causing authentication failures and 401 errors.

**Root Causes**:
- No unique constraint on `shopify_customer_id` in `collector_profiles` table
- Profile creation scripts didn't check for existing Shopify customer IDs
- View queries returning multiple rows when expecting one

### 2. Missing Product Handles
**Problem**: Products with handles `afternoon-love` and `side-b-3` returning 404 errors.

**Root Causes**:
- Product handles not synced from Shopify
- Products missing from local database

### 3. Stale JavaScript Bundles
**Problem**: `ReferenceError: copied is not defined` in browser console.

**Root Cause**: Browser cache containing outdated compiled JavaScript

---

## Fix Implementation Steps

### Step 1: Detect Duplicate Profiles

Run the detection query to identify all duplicate profiles:

```bash
# Using psql or Supabase SQL Editor
psql -h <host> -U <user> -d <database> -f scripts/detect-duplicate-collector-profiles.sql
```

Or run directly in Supabase SQL Editor.

### Step 2: Merge Duplicate Profiles

**IMPORTANT**: Backup your database before running the merge script!

```bash
# Dry run (no changes made)
npx tsx scripts/merge-duplicate-collector-profiles.ts

# Merge specific Shopify customer ID
npx tsx scripts/merge-duplicate-collector-profiles.ts 6435402285283

# Merge all duplicates (dry run)
npx tsx scripts/merge-duplicate-collector-profiles.ts

# Execute actual merge
npx tsx scripts/merge-duplicate-collector-profiles.ts --execute

# Execute merge for specific customer
npx tsx scripts/merge-duplicate-collector-profiles.ts 6435402285283 --execute
```

The script will:
- Keep the oldest profile (first created)
- Merge all data into that profile
- Delete duplicate profiles
- Log all actions

### Step 3: Apply Database Constraint

After merging duplicates, apply the unique constraint:

```bash
# Using Supabase migrations
supabase db push

# Or run directly
psql -h <host> -U <user> -d <database> -f supabase/migrations/20260127000001_add_unique_shopify_customer_id.sql
```

This prevents future duplicate profiles from being created.

### Step 4: Verify Product Handles

Check if products exist and have correct handles:

```bash
# Check specific handles
npx tsx scripts/verify-product-handles.ts afternoon-love side-b-3

# Check submission UUID
npx tsx scripts/verify-product-handles.ts 00000000-0000-4000-8000-07de59de00e3

# List all products
npx tsx scripts/verify-product-handles.ts
```

### Step 5: Sync Product Handles from Shopify

If products are missing handles, sync from Shopify:

```bash
# Dry run (no changes)
npx tsx scripts/sync-product-handles-from-shopify.ts

# Execute sync
npx tsx scripts/sync-product-handles-from-shopify.ts --execute
```

**Requirements**:
- `SHOPIFY_STORE_DOMAIN` in .env.local
- `SHOPIFY_ADMIN_ACCESS_TOKEN` in .env.local

### Step 6: Clear Build Cache & Rebuild

Clear stale JavaScript bundles:

```bash
# Using provided script
npm run clear-cache

# Or manually
rm -rf .next
rm -rf node_modules/.cache
npm run build
```

Then clear browser cache or hard reload (Ctrl+Shift+R / Cmd+Shift+R).

---

## Verification

### Verify Collector Profiles Fixed

1. Check for remaining duplicates:
```sql
SELECT shopify_customer_id, COUNT(*) 
FROM collector_profiles 
WHERE shopify_customer_id IS NOT NULL 
GROUP BY shopify_customer_id 
HAVING COUNT(*) > 1;
```

Should return 0 rows.

2. Test authentication:
- Navigate to `/collector/artwork/{line_item_id}`
- Should not see 401 errors
- Profile should load correctly

### Verify Product Handles Fixed

1. Check products exist:
```bash
npx tsx scripts/verify-product-handles.ts afternoon-love side-b-3
```

2. Test vendor dashboard:
- Navigate to `/vendor/dashboard/products/afternoon-love`
- Should load product details without 404

### Verify Frontend Fixed

1. Clear browser cache
2. Navigate to artwork page
3. Should not see "copied is not defined" error
4. JavaScript should load without errors

---

## Prevention

### Updated Scripts

All profile creation scripts now check for existing `shopify_customer_id` before creating new profiles:

- ✅ `scripts/enrich-pii-by-order-id.js`
- ✅ `scripts/enrich-collector-profiles.js`
- ✅ `scripts/sync-profiles-from-csv.js`
- ✅ `app/auth/collector/callback/route.ts`

### Database Constraint

The unique constraint on `shopify_customer_id` prevents future duplicates:

```sql
CREATE UNIQUE INDEX idx_collector_profiles_unique_shopify_customer_id 
ON collector_profiles (shopify_customer_id) 
WHERE shopify_customer_id IS NOT NULL;
```

### Query Handler

The collector lib now handles potential duplicates gracefully:
- Uses `.limit(1)` instead of `.maybeSingle()`
- Logs warnings when duplicates detected
- Returns first result instead of failing

---

## Troubleshooting

### Merge Script Fails

**Error**: "Cannot delete profile - foreign key constraint"

**Solution**: The script should handle foreign keys automatically. If it fails, check:
1. Are there custom tables referencing `collector_profiles.id`?
2. Add handling for those tables in the merge script

### Constraint Migration Fails

**Error**: "Duplicate key value violates unique constraint"

**Solution**: Duplicates still exist. Run merge script first:
```bash
npx tsx scripts/merge-duplicate-collector-profiles.ts --execute
```

### Products Still Missing

**Solution**: Products may not exist in Shopify. Options:
1. Check Shopify admin for product existence
2. Update product handle in database manually
3. Create product in Shopify first, then sync

### Still Seeing Stale JavaScript

**Solution**: 
1. Clear browser cache completely
2. Try incognito/private browsing mode
3. Clear CDN cache if using one (Vercel, Cloudflare, etc.)

---

## Support

If issues persist after following these steps:

1. Check server logs for detailed error messages
2. Verify environment variables are set correctly
3. Ensure database migrations are up to date
4. Contact development team with:
   - Specific error messages
   - Artwork/Product IDs that fail
   - Browser console output
   - Server logs
