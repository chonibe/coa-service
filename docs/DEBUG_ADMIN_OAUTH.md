# Debug Admin OAuth Issues

## If You've Added the URL But Still Getting Errors

### Step 1: Verify the Exact URL Format

The URL in Supabase **must match exactly** what your app sends. Check:

1. **In your app logs** (Vercel logs), look for:
   ```
   [admin/google/start] OAuth redirect configuration: { redirectTo: '...' }
   ```

2. **Copy that exact URL** and verify it's in Supabase's Redirect URLs list

3. **Common issues:**
   - ❌ Trailing slash: `https://dashboard.thestreetlamp.com/auth/admin/callback/` (wrong)
   - ✅ No trailing slash: `https://dashboard.thestreetlamp.com/auth/admin/callback` (correct)
   - ❌ Wrong protocol: `http://dashboard.thestreetlamp.com/auth/admin/callback` (wrong)
   - ✅ HTTPS: `https://dashboard.thestreetlamp.com/auth/admin/callback` (correct)
   - ❌ Wrong domain: `dashboard.thestreetlamp.com/auth/admin/callback` (missing https://)
   - ✅ Full URL: `https://dashboard.thestreetlamp.com/auth/admin/callback` (correct)

### Step 2: Check Vercel Logs

1. Go to Vercel Dashboard → Your Project → Logs
2. Try logging in again
3. Look for these log messages:
   - `[admin/google/start] OAuth redirect configuration`
   - `[auth/admin/callback] Missing OAuth code`
   - `[auth/admin/callback] Search params:`
   - `[auth/admin/callback] Full URL:`

4. **Check what URL is actually being sent to Supabase**

### Step 3: Verify Supabase Configuration

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. **Copy the exact text** from the Redirect URLs field
3. Verify:
   - Each URL is on its own line
   - No extra spaces or characters
   - URLs match exactly what's in the logs

### Step 4: Test with Browser DevTools

1. Open Browser DevTools → Network tab
2. Try logging in
3. Look for the redirect to `/auth/admin/callback`
4. Check:
   - What's the full URL?
   - Are there any query parameters?
   - Is there an `error` or `error_description` parameter?

### Step 5: Check for Supabase Error Messages

Sometimes Supabase will pass error information in the redirect. Check the callback URL for:
- `?error=...`
- `?error_description=...`

These will tell you why Supabase rejected the redirect.

### Step 6: Verify Supabase Project

Make sure you're editing the **correct Supabase project**:
- Project ref: `ldmppmnpgdxueebkkpid`
- URL: `https://ldmppmnpgdxueebkkpid.supabase.co`

### Step 7: Wait and Retry

After making changes in Supabase:
1. **Wait 2-3 minutes** for changes to propagate
2. **Clear browser cookies** for `dashboard.thestreetlamp.com`
3. **Try again**

### Step 8: Check for Multiple Supabase Projects

If you have multiple Supabase projects, make sure:
- The `NEXT_PUBLIC_SUPABASE_URL` environment variable points to the correct project
- You're editing the Redirect URLs in the **same project** that your app uses

## Common Error Messages and Solutions

### "Missing OAuth code"
- **Cause**: Supabase didn't pass the code in the redirect
- **Solution**: Verify the redirect URL is in Supabase's allowed list

### "error_description" in URL
- **Cause**: Supabase rejected the redirect for a specific reason
- **Solution**: Check the error_description value for details

### Redirect loops
- **Cause**: URL not in allowed list, causing Supabase to redirect without code
- **Solution**: Add the exact URL to Supabase's allowed redirects

## Still Not Working?

1. **Check Vercel environment variables:**
   - `NEXT_PUBLIC_SUPABASE_URL` should be `https://ldmppmnpgdxueebkkpid.supabase.co`
   - Verify this matches the Supabase project you're editing

2. **Try the vendor callback to verify Supabase is working:**
   - If vendor login works, Supabase is configured correctly
   - The issue is specific to the admin callback URL

3. **Contact Support:**
   - Share the exact error messages from logs
   - Share the exact URL from `[admin/google/start]` logs
   - Share a screenshot of Supabase Redirect URLs configuration

