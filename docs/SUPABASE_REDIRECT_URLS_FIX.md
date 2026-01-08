# Supabase Redirect URLs - Configuration Issue Found

## Problem Identified

The **admin callback URL is missing** from Supabase's allowed redirect URLs, even though the vendor callback is configured (vendor login works).

This is why the admin OAuth callback is failing with "Missing OAuth code" - Supabase doesn't know it's allowed to redirect to the admin callback URL.

## Current Status

✅ **Supabase Project**: `ldmppmnpgdxueebkkpid` (linked)  
✅ **Google Provider**: Enabled  
✅ **Vendor Callback**: Working (`/auth/callback`)  
❌ **Admin Callback**: **MISSING** (`/auth/admin/callback`)

## Required Redirect URLs

You need to add the admin callback URL to Supabase:

1. `https://app.thestreetcollector.com/auth/admin/callback` (Admin callback - **ADD THIS**)
2. `https://app.thestreetcollector.com/auth/callback` (Vendor callback - already configured, vendor login works)

## How to Fix (Manual Steps)

Since the API endpoint doesn't support updating redirect URLs programmatically, you need to add them through the Supabase Dashboard:

### Step 1: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select project: **artwork-dashboard** (reference: `ldmppmnpgdxueebkkpid`)

### Step 2: Navigate to URL Configuration

1. Click **Authentication** in the left sidebar
2. Click **URL Configuration** (under Authentication section)

### Step 3: Add Admin Callback URL

1. Find the **Redirect URLs** text area
2. You should already see: `https://app.thestreetcollector.com/auth/callback` (vendor callback)
3. **Add this new line**:
   ```
   https://app.thestreetcollector.com/auth/admin/callback
   ```
4. **Important**: 
   - No trailing slashes
   - Full HTTPS URL
   - One URL per line
   - No extra spaces
   - Make sure both URLs are present

### Step 4: Save

1. Click **Save** button
2. Wait 1-2 minutes for changes to propagate

### Step-by-Step Verification

Run this command to verify the URLs were added:

```bash
node scripts/check-supabase-redirects.js
```

You should see:
```
✅ Admin callback URL is configured: https://app.thestreetcollector.com/auth/admin/callback
✅ Vendor callback URL is configured: https://app.thestreetcollector.com/auth/callback
```

**Note**: Since vendor login works, the vendor callback is already configured. You just need to add the admin callback URL.

## Why This Happened

The redirect URLs might not have been saved properly when you tried to add them before. Common issues:

1. **Not clicking Save** - Changes must be saved explicitly
2. **Formatting issues** - Extra spaces, wrong format
3. **Wrong project** - Editing a different Supabase project
4. **Cache** - Browser cache showing old values

## Verification Scripts

We've created two scripts to help:

### Check Current Configuration

```bash
node scripts/check-supabase-redirects.js
```

This shows:
- Current redirect URLs
- Whether admin/vendor callbacks are configured
- Google provider status

### Add Redirect URLs (if API worked)

```bash
node scripts/add-supabase-redirects.js
```

**Note**: This script currently fails because the Supabase API doesn't support updating redirect URLs via PUT. You must use the Dashboard.

## After Adding URLs

1. **Wait 1-2 minutes** for Supabase to propagate changes
2. **Clear browser cookies** for `dashboard.thestreetlamp.com`
3. **Try admin login again** at `/admin-login`
4. The OAuth flow should now work correctly

## Troubleshooting

If you still see errors after adding URLs:

1. **Verify exact URL format** - Check for typos, trailing slashes, etc.
2. **Check Vercel logs** - Look for `[admin/google/start]` to see the exact URL being sent
3. **Wait longer** - Supabase config can take 2-3 minutes to propagate
4. **Try vendor login** - If vendor login works, the issue is specific to admin callback format

## Next Steps

1. Add the redirect URLs through the Dashboard (steps above)
2. Run `node scripts/check-supabase-redirects.js` to verify
3. Wait 2 minutes
4. Try admin login again
5. Gmail sync should now work!

