# Gmail Authorization for Admin Messaging Templates

## Problem

When admins sign in with Google OAuth normally, they don't get prompted for Gmail API permissions (`gmail.send` scope). This means they can't send test emails from the Email Templates editor because the system lacks the necessary permissions to access Gmail on their behalf.

## Solution

We've implemented a dedicated Gmail authorization flow that prompts admins to grant Gmail permissions when needed.

## How It Works

### 1. Permission Check
When admins visit `/admin/messaging`, the system checks if they have Gmail permissions by:
- Calling `/api/admin/messaging/check-gmail-permissions`
- Checking for `provider_token` or `provider_refresh_token` in the user's `app_metadata`
- These tokens are only present if Gmail scopes were granted during OAuth

### 2. Authorization Banner
If permissions are missing, admins see a prominent banner:
```
⚠️ Gmail permissions required
To send test emails, you need to authorize Gmail access...
[Authorize Gmail] button
```

### 3. Authorization Flow
When the admin clicks "Authorize Gmail":
1. Redirects to `/admin/messaging/authorize-gmail`
2. Shows explanation of required permissions:
   - `gmail.send` - Send emails on your behalf
   - `gmail.readonly` - View email messages (for sync features)
3. Click "Authorize Gmail Access" → redirects to OAuth with `gmail=true` parameter
4. OAuth URL: `/api/auth/google/start?gmail=true&redirect=/admin/messaging`
5. This triggers the OAuth flow with Gmail scopes included

### 4. OAuth with Gmail Scopes
The `/api/auth/google/start` route checks for `gmail=true` parameter and includes Gmail scopes:

```typescript
const scopes = gmailParam
  ? "email profile openid https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send"
  : "email profile openid"
```

### 5. Token Storage
After successful authorization:
- OAuth callback (`/auth/callback`) receives the `provider_token` and `provider_refresh_token`
- These are stored in the user's `app_metadata` in Supabase
- Future requests can use these tokens to send emails via Gmail API

## User Experience

### First Time Admin Login (No Gmail)
1. Admin logs in with Google → goes to `/auth/select-role` → clicks "Admin Dashboard"
2. Navigates to `/admin/messaging` → sees banner "Gmail permissions required"
3. Clicks "Authorize Gmail" → OAuth consent screen → grants permissions
4. Returns to `/admin/messaging` → banner disappears, can now send test emails

### Already Authorized
1. Admin logs in and navigates to `/admin/messaging`
2. No banner shown - can immediately send test emails
3. If they visit `/admin/messaging/authorize-gmail` directly, they see a success message

## Files Created

### UI Components
- **`app/admin/messaging/authorize-gmail/page.tsx`**
  - Dedicated authorization page with permission explanation
  - Checks current permission status
  - Shows success state if already authorized
  - "Authorize Gmail Access" button redirects to OAuth

### API Routes
- **`app/api/admin/messaging/check-gmail-permissions/route.ts`**
  - `GET` endpoint to check if admin has Gmail permissions
  - Returns `{ hasPermission: boolean }` based on presence of provider tokens

### Modified Files
- **`app/admin/messaging/page.tsx`**
  - Added permission check on mount
  - Shows authorization banner if `hasGmailPermission === false`
  - Banner includes link to authorization page

## Existing Infrastructure

The solution leverages existing OAuth logic in:
- **`app/api/auth/google/start/route.ts`** (lines 67-88)
  - Already supports `gmail=true` parameter
  - Already requests Gmail scopes when parameter is present
  - Already includes `prompt=consent` for sensitive permissions

## Testing

### Manual Test Steps
1. **Clear Gmail permissions** (if previously granted):
   - Go to Google Account → Security → Third-party apps → Revoke access for your app
   
2. **Test authorization flow**:
   ```bash
   # 1. Login as admin (without Gmail permissions)
   visit https://app.thestreetcollector.com/admin-login
   
   # 2. Navigate to messaging
   visit https://app.thestreetcollector.com/admin/messaging
   
   # 3. Should see banner with "Authorize Gmail" button
   # 4. Click button → redirects to /admin/messaging/authorize-gmail
   # 5. Click "Authorize Gmail Access"
   # 6. Google consent screen appears
   # 7. Grant permissions
   # 8. Redirects back to /admin/messaging
   # 9. Banner should be gone
   # 10. Can now send test emails
   ```

3. **Test already authorized**:
   ```bash
   # If already authorized, visit:
   visit https://app.thestreetcollector.com/admin/messaging/authorize-gmail
   
   # Should see green success card: "Gmail Permissions Granted"
   ```

## Security Considerations

### Permission Scope
We only request the minimum necessary Gmail scopes:
- `gmail.send` - Required to send test emails
- `gmail.readonly` - Required for CRM Gmail sync features

### Admin-Only Access
- Authorization page and API endpoint check for admin session
- Non-admin users cannot access these pages
- Tokens stored in user's `app_metadata` (not exposed to client)

### Token Storage
- Provider tokens stored securely in Supabase Auth `app_metadata`
- Tokens encrypted at rest by Supabase
- Only service role can access raw tokens
- Client-side checks only verify token existence, not content

## Troubleshooting

### Banner Always Shows
**Problem**: Banner persists even after authorization  
**Solution**: Check that provider tokens are being stored in `app_metadata`:
```sql
SELECT app_metadata FROM auth.users WHERE email = 'admin@example.com';
-- Should contain: provider_token and provider_refresh_token
```

### OAuth Fails
**Problem**: OAuth redirect fails or shows error  
**Solution**: 
- Verify `NEXT_PUBLIC_APP_URL` is set correctly
- Check Google OAuth credentials are valid
- Ensure redirect URI is whitelisted in Google Console

### Test Email Fails
**Problem**: "Failed to send test email" error  
**Solution**:
- Verify Gmail API is enabled in Google Console
- Check provider tokens are valid (not expired)
- Ensure `sendEmail` function uses correct Gmail client

## Related Documentation

- [Gmail Email Sending Setup](./gmail-email-sending-2026-02-03.md)
- [OAuth Configuration](./oauth-setup.md)
- [Admin Messaging Templates](./features/admin-messaging-templates-editor/README.md)

## Version History

- **2026-02-03**: Initial implementation of Gmail authorization flow
