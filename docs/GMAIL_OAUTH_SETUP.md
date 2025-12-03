# Gmail OAuth Setup Verification

## ✅ Current Configuration

Your OAuth request includes the correct Gmail scopes:
- `https://www.googleapis.com/auth/gmail.readonly` ✅
- `https://www.googleapis.com/auth/gmail.send` ✅

## 🔍 Important Notes

### 1. Google Cloud Console Configuration

Make sure your Google OAuth Client has these scopes enabled:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **OAuth consent screen**
3. Ensure the following scopes are added:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`

### 2. Supabase Provider Token Storage

Supabase may not automatically store provider tokens. If Gmail sync fails with "Gmail access not available", you may need to:

**Option A: Re-authenticate after adding Gmail scopes**
- Users who authenticated before Gmail scopes were added need to re-authenticate
- The OAuth flow will now request Gmail permissions

**Option B: Check Supabase Auth Settings**
- Ensure your Supabase project allows storing provider tokens
- Check if `provider_token` is available in the session after OAuth

### 3. Testing the Gmail Sync

After completing OAuth with Gmail scopes:

1. Go to `/admin/crm`
2. Click "Sync Gmail" button
3. The sync should fetch emails from the last 30 days

### 4. Troubleshooting

If you see "Gmail access not available":

1. **Check if user re-authenticated**: Users need to log out and log back in after Gmail scopes were added
2. **Verify scopes in Google Cloud Console**: Ensure scopes are approved
3. **Check Supabase session**: The `provider_token` should be in the session after OAuth

### 5. OAuth URL Verification

Your OAuth URL shows:
- ✅ Correct redirect URI: `https://ldmppmnpgdxueebkkpid.supabase.co/auth/v1/callback`
- ✅ Gmail scopes included
- ✅ PKCE flow enabled
- ✅ Account selection prompt (if needed)

Everything looks correct! The OAuth flow should work once users complete authentication.

