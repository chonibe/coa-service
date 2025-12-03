# Understanding Supabase Redirect Behavior

## What We Know

From the logs, we can see:
- ✅ The code is sending the correct redirect URL: `https://dashboard.thestreetlamp.com/auth/admin/callback`
- ✅ Vendor login works (vendor callback URL is configured correctly)
- ❌ Admin login fails with "Missing OAuth code"

## How Supabase Handles Redirects

When you call `supabase.auth.signInWithOAuth()` with a `redirectTo` parameter:

1. **Supabase validates** the `redirectTo` URL against its allowed redirect URLs list
2. **If valid**: Supabase redirects to that URL **with** the OAuth code
3. **If invalid**: Supabase redirects to that URL **without** the code (or redirects to a default)

## What's Happening

Since vendor login works, we know:
- Supabase is configured correctly
- The OAuth flow works
- The vendor callback URL (`/auth/callback`) is in the allowed list

Since admin login fails, the admin callback URL (`/auth/admin/callback`) is likely:
- Not in the allowed list, OR
- Has a formatting issue that prevents exact matching

## Debugging Steps

### Step 1: Check What Supabase Actually Redirects To

When you try to log in as admin, check the browser's Network tab:

1. Open Browser DevTools → Network tab
2. Try admin login
3. Look for the redirect to `/auth/admin/callback`
4. Check the **full URL** - does it have a `?code=...` parameter?

**If the URL is**: `https://dashboard.thestreetlamp.com/auth/admin/callback` (no code)
- Supabase rejected the redirect URL

**If the URL is**: `https://dashboard.thestreetlamp.com/auth/admin/callback?code=...` (with code)
- Supabase accepted it, but something else is wrong

### Step 2: Compare Vendor vs Admin URLs

Since vendor works, compare:

**Vendor (works)**:
- URL in Supabase: `https://dashboard.thestreetlamp.com/auth/callback`
- Code sends: `https://dashboard.thestreetlamp.com/auth/callback`
- ✅ Match

**Admin (fails)**:
- URL in Supabase: `https://dashboard.thestreetlamp.com/auth/admin/callback` (verify this!)
- Code sends: `https://dashboard.thestreetlamp.com/auth/admin/callback`
- ❓ Need to verify exact match

### Step 3: Check Supabase Dashboard Again

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. **Copy the EXACT text** from the Redirect URLs field
3. Look for the admin callback URL
4. Verify it's exactly: `https://dashboard.thestreetlamp.com/auth/admin/callback`
5. Check:
   - Is it on its own line?
   - No trailing slash?
   - No extra spaces?
   - Exact same as vendor URL format?

### Step 4: Test with Browser DevTools

1. Open Browser DevTools → Network tab
2. Clear network log
3. Try admin login
4. Look for the OAuth redirect chain:
   - Request to Supabase OAuth
   - Redirect to Google
   - Redirect back to Supabase
   - **Final redirect to your app** - check this URL!

The final redirect URL will tell us:
- If Supabase accepted the redirectTo parameter
- What URL it actually redirected to
- Whether it included the code

## Common Issues

### Issue 1: URL Not Saved Properly

Even if you added it, it might not have saved:
- Click "Save" again in Supabase Dashboard
- Wait 2-3 minutes
- Try again

### Issue 2: Multiple Supabase Projects

Make sure you're editing the **same project** your app uses:
- Your app uses: `ldmppmnpgdxueebkkpid`
- Verify you're editing this project in Dashboard

### Issue 3: Cached Configuration

Supabase might be using cached config:
- Wait 5 minutes after saving
- Try in incognito mode
- Clear all cookies

### Issue 4: URL Format Mismatch

The URL in Supabase must match **exactly**:
- Character by character
- Case sensitive
- No extra whitespace
- No trailing characters

## Next Steps

1. **Check browser Network tab** during admin login attempt
2. **Copy the exact redirect URL** from the final redirect
3. **Compare it** with what's in Supabase Dashboard
4. **Share the redirect URL** you see in the Network tab

This will tell us exactly what Supabase is doing and why it's not passing the code.

