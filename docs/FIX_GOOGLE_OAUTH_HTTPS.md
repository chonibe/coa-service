# Fix Google OAuth HTTPS Requirement for Gmail Scopes

## Problem
Google restricts Gmail API scopes (`gmail.readonly`, `gmail.send`) to OAuth clients that **only use HTTPS URLs**. If you have any HTTP (non-HTTPS) redirect URIs configured, you'll see this error.

## Solution: Remove Non-HTTPS URLs from OAuth Client

### Step 1: Go to Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**

### Step 2: Edit Your OAuth Client

1. Find your OAuth 2.0 Client ID (the one mentioned in the error: `410611814888-5j9gj03c42b15o632fipeu60q4lo1lgr`)
2. Click on it to edit

### Step 3: Check Authorized Redirect URIs

In the OAuth client settings, look for **"Authorized redirect URIs"** section.

### Step 4: Remove Non-HTTPS URLs

**Remove any URIs that start with `http://`** (not `https://`)

**Keep only HTTPS URIs**, such as:
- `https://ldmppmnpgdxueebkkpid.supabase.co/auth/v1/callback`
- `https://dashboard.thestreetlamp.com/auth/callback`
- Any other HTTPS URLs you're using

**Remove:**
- `http://localhost:*` (unless you're only using it for local development without Gmail)
- `http://127.0.0.1:*`
- Any other `http://` URLs

### Step 5: Save Changes

1. Click **Save**
2. Wait a few seconds for changes to propagate
3. Try the OAuth flow again

## Important Notes

### For Local Development

If you need to test Gmail sync locally:

1. **Option A**: Use HTTPS locally (recommended)
   - Set up local HTTPS with tools like `mkcert` or `ngrok`
   - Add your local HTTPS URL to authorized redirect URIs

2. **Option B**: Use separate OAuth clients
   - Create a separate OAuth client for local development
   - Don't request Gmail scopes for the local client
   - Use the production client (HTTPS only) for Gmail features

### For Production

Ensure all redirect URIs are HTTPS:
- ✅ `https://dashboard.thestreetlamp.com/auth/callback`
- ✅ `https://ldmppmnpgdxueebkkpid.supabase.co/auth/v1/callback`
- ❌ `http://dashboard.thestreetlamp.com/auth/callback` (remove this)

## Verification

After making changes:

1. Try logging in with Google again
2. You should see the Gmail permission request
3. After approval, Gmail sync should work

## Common Redirect URIs to Check

Based on your setup, make sure these are HTTPS:

- Supabase callback: `https://[your-project-ref].supabase.co/auth/v1/callback`
- Your app callback: `https://dashboard.thestreetlamp.com/auth/callback`
- Any other production URLs

Remove any `http://` versions of these URLs.

