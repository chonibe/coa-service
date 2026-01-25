# Authentication Error Troubleshooting Guide

## Current Issue: 500 `unexpected_failure` on All Login Personas

### Status
🔴 **ACTIVE ISSUE** - All authentication attempts failing with 500 error

### Error Message
```json
{
  "code": 500,
  "error_code": "unexpected_failure",
  "msg": "Unexpected failure, please check server logs for more information"
}
```

## Diagnostic Steps

### 1. Check Vercel Logs
The enhanced logging has been deployed. To check logs:

```bash
# Get the latest deployment URL
vercel ls

# Check logs for that deployment
vercel logs <deployment-url>
```

Look for these log patterns:
- `[auth/callback] Incoming request:` - Shows what parameters are being received
- `[auth/callback] Attempting to exchange code for session...` - Before exchange attempt
- `[auth/callback] Exchange result:` - Result of exchange
- `[auth/callback] Exception during exchangeCodeForSession:` - If exception occurs
- `[auth/callback] Failed to exchange Supabase auth code:` - If exchange returns error

### 2. Check Supabase Dashboard

Navigate to: https://supabase.com/dashboard/project/ldmppmnpgdxueebkkpid

#### A. Check Auth Settings
1. Go to **Authentication** → **URL Configuration**
2. Verify **Site URL**: Should be `https://app.thestreetcollector.com`
3. Verify **Redirect URLs**: Should include:
   - `https://app.thestreetcollector.com/auth/callback`
   - `https://app.thestreetcollector.com/api/auth/callback`
   - `http://localhost:3000/auth/callback` (for local dev)

#### B. Check OAuth Providers
1. Go to **Authentication** → **Providers**
2. Check **Google** provider:
   - Is it enabled?
   - Are Client ID and Secret set?
   - Is the redirect URI correct?

#### C. Check Auth Logs
1. Go to **Authentication** → **Logs**
2. Filter by recent failed attempts
3. Look for error details

### 3. Verify Environment Variables

Check that these are set in Vercel:
```bash
vercel env ls | grep -E "SUPABASE|NEXT_PUBLIC"
```

Required variables:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

### 4. Test OAuth Flow Manually

Try this URL directly (replace with your actual values):
```
https://ldmppmnpgdxueebkkpid.supabase.co/auth/v1/authorize?provider=google&redirect_to=https://app.thestreetcollector.com/auth/callback
```

Expected behavior:
1. Redirects to Google login
2. After login, redirects back with `code` parameter
3. Code is exchanged for session

If this fails, the issue is with Supabase configuration.

### 5. Check for Rate Limiting

Supabase has rate limits on auth endpoints:
- **Auth requests**: 30 per hour per IP
- **Token refresh**: 150 per hour per IP

If you've been testing repeatedly, you might be rate limited.

## Common Causes & Solutions

### Cause 1: Redirect URI Mismatch
**Symptoms**: `unexpected_failure` immediately after OAuth redirect

**Solution**:
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add exact redirect URL: `https://app.thestreetcollector.com/auth/callback`
3. Save and wait 1-2 minutes for propagation

### Cause 2: Invalid OAuth Credentials
**Symptoms**: Error during Google OAuth flow

**Solution**:
1. Go to Google Cloud Console: https://console.cloud.google.com
2. Navigate to APIs & Services → Credentials
3. Find your OAuth 2.0 Client ID
4. Verify **Authorized redirect URIs** includes:
   - `https://ldmppmnpgdxueebkkpid.supabase.co/auth/v1/callback`
5. If missing, add it and save

### Cause 3: Expired or Invalid Supabase Keys
**Symptoms**: `unexpected_failure` on all auth attempts

**Solution**:
1. Go to Supabase Dashboard → Settings → API
2. Copy the **anon** key
3. Update in Vercel: `vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Redeploy: `vercel --prod`

### Cause 4: PKCE Flow Issues
**Symptoms**: Code exchange fails with `unexpected_failure`

**Solution**:
The issue might be with PKCE (Proof Key for Code Exchange). Check if:
1. Supabase project has PKCE enabled (it should be by default)
2. The auth helper library is up to date:
   ```bash
   npm update @supabase/auth-helpers-nextjs @supabase/supabase-js
   ```

### Cause 5: Session Storage Issues
**Symptoms**: Auth works but session not persisted

**Solution**:
Check cookie settings in `lib/supabase-server.ts`:
- Cookies should be `httpOnly: true`
- `sameSite` should be `lax` or `none` (with `secure: true`)
- Domain should match your app domain

## Immediate Workaround

If you need to access the system urgently, you can:

### Option 1: Use Direct Supabase Login (if available)
If you have email/password auth enabled:
1. Go to `/login`
2. Use email/password instead of Google OAuth

### Option 2: Bypass Auth Temporarily (DEVELOPMENT ONLY)
**⚠️ NEVER DO THIS IN PRODUCTION**

In `app/auth/callback/route.ts`, temporarily add:
```typescript
// TEMPORARY DEBUG - REMOVE AFTER FIXING
if (process.env.NODE_ENV === 'development') {
  console.log('DEBUG MODE: Bypassing auth')
  // ... create session manually
}
```

## Next Steps

1. **Check Vercel logs** to see exact error from Supabase
2. **Verify Supabase redirect URIs** are correct
3. **Check Google OAuth credentials** in Google Cloud Console
4. **Test with a fresh browser** (incognito mode) to rule out cookie issues
5. **Check Supabase status**: https://status.supabase.com

## Getting Help

If issue persists:

1. **Collect logs**:
   ```bash
   vercel logs <deployment-url> > auth-error-logs.txt
   ```

2. **Check Supabase Auth Logs** (Dashboard → Authentication → Logs)

3. **Create support ticket** with:
   - Error message
   - Vercel logs
   - Supabase auth logs
   - Steps to reproduce

## Recent Changes

### Deployed Fixes (Jan 25, 2026)
- ✅ Added comprehensive error handling in auth callback
- ✅ Added try-catch around `exchangeCodeForSession`
- ✅ Added detailed logging for debugging
- ✅ Protected vendor and collector layouts

### Known Working State
Last known working deployment: `555ff0420` (before navigation changes)

If all else fails, can rollback to that commit:
```bash
git revert HEAD~3..HEAD
git push origin main
vercel --prod
```

---

**Last Updated**: January 25, 2026
**Status**: 🔴 Active Investigation
**Priority**: 🔥 Critical - Blocks all logins
