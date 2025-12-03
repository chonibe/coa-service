# Admin Callback URL Formatting Check

## Problem

You've added both redirect URLs to Supabase, but admin login still fails with "Missing OAuth code" while vendor login works.

## Root Cause

This usually indicates a **formatting issue** with the admin callback URL in Supabase. Supabase is very strict about URL matching - even a small difference (trailing slash, extra space, etc.) will cause it to reject the redirect.

## Exact URL Format Required

The admin callback URL in Supabase **must match exactly**:

```
https://dashboard.thestreetlamp.com/auth/admin/callback
```

## Common Formatting Issues

### ❌ Wrong: Trailing Slash
```
https://dashboard.thestreetlamp.com/auth/admin/callback/
```
**Fix**: Remove the trailing slash

### ❌ Wrong: Extra Spaces
```
 https://dashboard.thestreetlamp.com/auth/admin/callback 
```
**Fix**: Remove all spaces before and after

### ❌ Wrong: Wrong Protocol
```
http://dashboard.thestreetlamp.com/auth/admin/callback
```
**Fix**: Use `https://` not `http://`

### ❌ Wrong: Missing Protocol
```
dashboard.thestreetlamp.com/auth/admin/callback
```
**Fix**: Include `https://` at the beginning

### ❌ Wrong: Different Case
```
https://Dashboard.TheStreetLamp.com/auth/admin/callback
```
**Fix**: Use lowercase: `dashboard.thestreetlamp.com`

### ❌ Wrong: Extra Characters
```
https://dashboard.thestreetlamp.com/auth/admin/callback?
https://dashboard.thestreetlamp.com/auth/admin/callback 
```
**Fix**: No trailing characters, no query parameters

## How to Fix

### Step 1: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select project: **artwork-dashboard** (`ldmppmnpgdxueebkkpid`)
3. Navigate to: **Authentication** → **URL Configuration**

### Step 2: Check Current URLs

1. Look at the **Redirect URLs** text area
2. You should see two URLs:
   - `https://dashboard.thestreetlamp.com/auth/callback` (vendor - works)
   - `https://dashboard.thestreetlamp.com/auth/admin/callback` (admin - check this one)

### Step 3: Verify Admin URL Format

1. **Select and copy** the admin callback URL text
2. **Compare character by character** with:
   ```
   https://dashboard.thestreetlamp.com/auth/admin/callback
   ```
3. Check for:
   - Trailing slash (`/`)
   - Leading/trailing spaces
   - Wrong protocol (`http://` instead of `https://`)
   - Extra characters
   - Different casing

### Step 4: Fix the URL

1. **Delete** the admin callback URL line
2. **Type it fresh** (don't copy-paste):
   ```
   https://dashboard.thestreetlamp.com/auth/admin/callback
   ```
3. Make sure:
   - No trailing slash
   - No spaces before or after
   - Starts with `https://`
   - All lowercase
   - One URL per line

### Step 5: Save and Wait

1. Click **Save**
2. **Wait 2-3 minutes** for changes to propagate
3. Clear browser cookies for `dashboard.thestreetlamp.com`
4. Try admin login again

## Verification

After fixing, you can verify by:

1. **Check Vercel logs** - Look for `[admin/google/start]` to see the exact URL being sent
2. **Check browser Network tab** - See what URL Supabase redirects to
3. **Run verification script**:
   ```bash
   node scripts/check-supabase-redirects.js
   ```

## Why Vendor Works But Admin Doesn't

Since vendor login works, we know:
- ✅ Supabase is configured correctly
- ✅ OAuth flow works
- ✅ The vendor callback URL format is correct

The issue is **specific to the admin callback URL format**. Common causes:
1. Admin URL was copy-pasted with extra characters
2. Admin URL has a trailing slash
3. Admin URL has spaces
4. Admin URL was added differently than vendor URL

## Still Not Working?

If you've verified the format is correct and it's still not working:

1. **Check Vercel logs** for the exact error
2. **Check browser console** for any redirect errors
3. **Try removing and re-adding** the admin URL
4. **Wait 5 minutes** (sometimes propagation takes longer)
5. **Try in incognito mode** (to rule out caching)

## Quick Test

To quickly test if it's a formatting issue:

1. Remove the admin callback URL from Supabase
2. Save
3. Wait 1 minute
4. Add it back, typing it manually (not copy-paste)
5. Save
6. Wait 2 minutes
7. Try admin login

If it works after re-adding, it confirms it was a formatting issue.

