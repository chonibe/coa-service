# Migration: Add Profile Fields to Vendors Table

## Issue
The `artist_history` and `profile_image` columns don't exist in the `vendors` table, causing update errors.

## Solution
Run the migration file to add these columns to the database.

## Migration File
Location: `supabase/migrations/20250128000000_add_vendor_profile_fields.sql`

## How to Apply the Migration

### Option 1: Using Supabase CLI (Recommended)
```bash
# Make sure you're in the project root
cd /Users/chonib/coa-service

# Apply pending migrations
supabase migration up

# Or link to your Supabase project and push
supabase link --project-ref your-project-ref
supabase db push
```

### Option 2: Manual SQL Execution
1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `supabase/migrations/20250128000000_add_vendor_profile_fields.sql`
4. Click "Run"

### Option 3: Direct SQL Query
Run this SQL in your Supabase SQL Editor:

```sql
-- Migration to add profile_image and artist_history fields to vendors table

DO $$
BEGIN
  -- Add profile_image column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vendors' AND column_name = 'profile_image'
  ) THEN
    ALTER TABLE vendors ADD COLUMN profile_image TEXT;
  END IF;

  -- Add artist_history column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vendors' AND column_name = 'artist_history'
  ) THEN
    ALTER TABLE vendors ADD COLUMN artist_history TEXT;
  END IF;
END $$;
```

## Verification
After running the migration, verify the columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vendors' 
  AND column_name IN ('profile_image', 'artist_history');
```

You should see both columns listed.

## Temporary Workaround
The profile update route has been updated to handle missing columns gracefully. It will:
- Still update fields that exist (bio, instagram_url)
- Skip fields that don't exist (profile_image, artist_history)
- Return a warning message indicating which fields couldn't be saved

However, to fully enable profile image and artist history features, the migration must be applied.

