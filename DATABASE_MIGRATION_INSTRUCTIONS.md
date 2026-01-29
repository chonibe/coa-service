# Database Migration Instructions

## Issue
The new Slides feature requires 3 new database tables that haven't been applied to your Supabase instance yet:
- `artwork_slides` - For Reels-style slide content
- `artwork_story_posts` - For shared story timeline (artist + collector posts)
- `collector_notifications` - For push/in-app notifications

## Solution: Apply Migrations via Supabase Dashboard

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project: **coa-service**
3. Click on **SQL Editor** in the left sidebar

### Step 2: Run the Migration SQL
1. Open the file `APPLY_MIGRATIONS.sql` in your project root
2. Copy the entire contents (all ~380 lines)
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press Ctrl/Cmd + Enter)

### Step 3: Verify Tables Were Created
After running the SQL, verify the tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('artwork_slides', 'artwork_story_posts', 'collector_notifications');
```

You should see all 3 tables listed.

### Step 4: Test the Feature
1. Refresh your application
2. Navigate to **Artwork Pages** in the vendor dashboard
3. Click **Manage Slides** on any artwork
4. You should now see the slides editor interface

## What Was Changed
- Fixed `product_id` foreign keys to use `UUID` instead of `TEXT`
- Updated RLS policies to use `vendor_name` (email) instead of `vendor_id`
- Added proper RLS policies for vendor/collector access control
- Added triggers for `updated_at` timestamps
- Added notification trigger for artist replies

## Troubleshooting

### If tables already exist
The SQL includes `DROP TABLE IF EXISTS` statements, so it's safe to run even if the tables partially exist.

### If you see permission errors
Make sure you're using the **Service Role Key** in your environment variables, not the anonymous key.

### If schema cache errors persist
After running the migration, you may need to:
1. Click **API** in the Supabase sidebar
2. Click **Restart API** button
3. Wait 30 seconds and refresh your app

## Alternative: Command Line (if Supabase CLI is properly configured)

If you can resolve the CLI migration history conflicts:

```bash
supabase db push --include-all
```

However, the dashboard method is more reliable for this situation.

## Support
If you encounter issues, the migration SQL is validated and ready to run. The main failure points are:
1. Wrong Supabase project selected
2. Insufficient permissions (use service role)
3. Schema cache not refreshed

All code is already deployed and ready - it just needs the database tables!
