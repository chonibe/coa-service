# Update Supabase Google OAuth Client ID

## Problem
Supabase needs to use your specific Google OAuth client ID: `410611814888-jf4hig26kj6j018qe70tudgpv5f694co.apps.googleusercontent.com`

## Solution: Update in Supabase Dashboard

### Step 1: Go to Supabase Dashboard

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Providers**

### Step 2: Update Google Provider Settings

1. Find **Google** in the providers list
2. Click to edit
3. Update the **Client ID** to: `410611814888-jf4hig26kj6j018qe70tudgpv5f694co.apps.googleusercontent.com`
4. Make sure the **Client Secret** matches your Google Cloud Console secret
5. Click **Save**

### Step 3: Verify Redirect URIs

Make sure these redirect URIs are configured in your Google OAuth client:
- `https://ldmppmnpgdxueebkkpid.supabase.co/auth/v1/callback`
- `https://dashboard.thestreetlamp.com/auth/callback`

## Alternative: Update via Environment Variables

If you're using environment variables, update:

```bash
SUPABASE_GOOGLE_CLIENT_ID=410611814888-jf4hig26kj6j018qe70tudgpv5f694co.apps.googleusercontent.com
```

Then run the enable script:
```bash
npm run supabase:enable-google
```

## Verify Configuration

After updating:

1. Try logging in with Google again
2. The OAuth flow should use your specified client ID
3. Check the OAuth URL - it should show: `client_id=410611814888-jf4hig26kj6j018qe70tudgpv5f694co.apps.googleusercontent.com`

