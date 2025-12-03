# Fix Admin OAuth Redirect Configuration

## Problem
The admin OAuth callback is being called without a code, causing "Missing OAuth code" errors.

This happens because:
1. Both vendor and admin OAuth flows use the **same Supabase Google OAuth client**
2. Google OAuth redirects to **Supabase first** (`https://ldmppmnpgdxueebkkpid.supabase.co/auth/v1/callback`)
3. Supabase then redirects to your app callback
4. Supabase must have the admin callback URL in its **allowed redirect URLs** list

## Important: OAuth Client Configuration

**Both vendor and admin flows use the same Google OAuth client:**
- **Client ID**: `410611814888-jf4hig26kj6j018qe70tudgpv5f694co.apps.googleusercontent.com`
- **Supabase Callback**: `https://ldmppmnpgdxueebkkpid.supabase.co/auth/v1/callback`

This client is configured in **Supabase Dashboard** → **Authentication** → **Providers** → **Google**, not directly in Google Cloud Console.

## Solution

### Step 1: Verify Google OAuth Client in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Find your OAuth 2.0 Client ID: `410611814888-jf4hig26kj6j018qe70tudgpv5f694co.apps.googleusercontent.com`
4. Verify **Authorized redirect URIs** includes:
   - ✅ `https://ldmppmnpgdxueebkkpid.supabase.co/auth/v1/callback` (Supabase callback - REQUIRED)

5. **REMOVE** any incorrect URIs:
   - ❌ `https://dashboard.thestreetlamp.com/admin` (WRONG - remove this)
   - ❌ `https://dashboard.thestreetlamp.com/auth/admin/callback` (WRONG - Google doesn't redirect here directly)

6. Click **Save**

### Step 2: Add Admin Callback to Supabase Allowed Redirects ⚠️ CRITICAL

**This is the most important step!** Supabase needs to know it can redirect to your admin callback:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `ldmppmnpgdxueebkkpid`
3. Navigate to **Authentication** → **URL Configuration**
4. In **Redirect URLs**, make sure these are listed:
   - ✅ `https://dashboard.thestreetlamp.com/auth/admin/callback` (Admin callback - ADD THIS)
   - ✅ `https://dashboard.thestreetlamp.com/auth/callback` (Vendor callback - should already be there)

5. Click **Save**

**If this URL is missing, Supabase will redirect without the OAuth code, causing the "Missing OAuth code" error.**

### Step 3: Verify Supabase Google Provider Configuration

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Click on **Google**
3. Verify:
   - **Client ID**: `410611814888-jf4hig26kj6j018qe70tudgpv5f694co.apps.googleusercontent.com`
   - **Client Secret**: (should match your Google Cloud Console secret)
   - **Enabled**: ✅ Yes

4. Click **Save** if you made any changes

### How OAuth Flow Works

1. **User clicks "Continue with Google"** on `/admin-login`
2. **App calls** `/api/auth/admin/google/start`
3. **App redirects to Supabase** OAuth URL (with `redirectTo=https://dashboard.thestreetlamp.com/auth/admin/callback`)
4. **Supabase redirects to Google** OAuth consent screen (using client ID: `410611814888-jf4hig26kj6j018qe70tudgpv5f694co`)
5. **Google redirects back to Supabase**: `https://ldmppmnpgdxueebkkpid.supabase.co/auth/v1/callback` ✅
6. **Supabase exchanges code** and redirects to your app: `https://dashboard.thestreetlamp.com/auth/admin/callback?code=...` ✅
7. **Your app processes** the callback and creates admin session

### Important Notes

- **Google OAuth client** (in Google Cloud Console) only needs Supabase callback URLs
- **Supabase** (in Supabase Dashboard) needs your app callback URLs in its allowed redirect list
- The `redirectTo` parameter in the OAuth request tells Supabase where to redirect after authentication
- **Supabase validates that `redirectTo` is in its allowed list before redirecting** - if it's not, the code won't be passed
- Both vendor and admin flows use the same Google OAuth client configured in Supabase

### Verification

After making changes:

1. **Clear your browser cookies** for `dashboard.thestreetlamp.com`
2. Try logging in at `/admin-login`
3. You should be redirected to Google OAuth
4. After approval, you should land on `/auth/admin/callback?code=...` (with a code!)
5. Then be redirected to `/admin/dashboard`
6. Gmail sync should work

### Troubleshooting

**If you still see "Missing OAuth code":**
1. Check Supabase Dashboard → Authentication → URL Configuration
2. Make sure `https://dashboard.thestreetlamp.com/auth/admin/callback` is **exactly** in the allowed list (no trailing slashes, correct protocol)
3. Wait a few minutes after saving (Supabase config can take time to propagate)
4. Try logging out completely and logging back in
5. Check browser console and network tab for redirect URLs

**If you see redirect errors:**
- Verify Google OAuth client has `https://ldmppmnpgdxueebkkpid.supabase.co/auth/v1/callback`
- Verify Supabase has both callback URLs in its allowed list
- Check that the Supabase Google provider is enabled

