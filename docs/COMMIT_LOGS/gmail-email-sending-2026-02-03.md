# Gmail Email Sending Integration

**Date:** 2026-02-03  
**Feature:** Use Gmail API for sending emails (better deliverability)

## Summary

Implemented Gmail API as the primary email sending method with Resend as fallback. This improves email deliverability by sending from your actual Gmail account rather than a third-party service.

## Implementation Checklist

- [x] [Create Gmail send module](../../../lib/gmail/send.ts)
- [x] [Update email client to use Gmail primary with Resend fallback](../../../lib/email/client.ts)
- [x] [Ensure Gmail scopes only requested for admin login](../../../app/api/auth/google/start/route.ts)
- [x] [Update login client to pass admin param explicitly](../../../app/login/login-client.tsx)

## Files Created

| File | Purpose |
|------|---------|
| `lib/gmail/send.ts` | Gmail API email sending with OAuth token management |

## Files Modified

| File | Changes |
|------|---------|
| `lib/email/client.ts` | Primary Gmail sending with Resend fallback |
| `app/api/auth/google/start/route.ts` | Gmail scopes only for admin=true AND admin redirect |
| `app/login/login-client.tsx` | Passes admin=true param for admin login |

## How It Works

### Email Sending Flow

```
sendEmail() called
    ↓
Is Gmail enabled? (USE_GMAIL_PRIMARY && GMAIL_ENABLED)
    ↓ Yes                              ↓ No
Try Gmail API                     Use Resend directly
    ↓
Success?
    ↓ Yes                              ↓ No
Return success                    Fallback to Resend
```

### Gmail Token Management

1. **Token Retrieval**: Finds admin user with Gmail OAuth tokens in `app_metadata`
2. **Token Refresh**: Automatically refreshes expired tokens using refresh token
3. **Token Caching**: Caches valid tokens for 5 minutes to avoid repeated DB lookups

### OAuth Scope Flow

| Login Type | Endpoint | Gmail Scopes |
|------------|----------|--------------|
| Admin | `/api/auth/google/start?admin=true&redirect=/admin/dashboard` | Yes |
| Vendor | `/api/auth/google/start?redirect=/vendor/dashboard` | No |
| Collector | `/api/auth/collector/google/start` | No |

## Configuration

### Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `EMAIL_USE_GMAIL` | Enable Gmail as primary sender | `true` |
| `SUPABASE_GOOGLE_CLIENT_ID` | Google OAuth client ID | Required for Gmail |
| `SUPABASE_GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Required for Gmail |
| `GMAIL_SEND_FROM` | Override sender email | Uses authenticated user's email |
| `EMAIL_FROM` | Fallback sender email | `onboarding@resend.dev` |
| `RESEND_API_KEY` | Resend API key for fallback | Optional but recommended |

### To Disable Gmail Sending

Set environment variable:
```
EMAIL_USE_GMAIL=false
```

## Gmail Scopes Required

```
https://www.googleapis.com/auth/gmail.send
https://www.googleapis.com/auth/gmail.readonly
```

These are already configured in the admin OAuth flow.

## Testing

1. **Admin Login**: Go to `/login?admin=true` and complete OAuth
2. **Verify Gmail Tokens**: Check user's `app_metadata` for `provider_refresh_token`
3. **Test Email**: Trigger any email (e.g., shipping notification)
4. **Check Logs**: Look for `[Email] Sent via Gmail successfully`

## Fallback Behavior

If Gmail fails (no tokens, expired, API error), the system automatically falls back to Resend:

```
[Email] Gmail send failed, trying Resend fallback: No Gmail tokens available
[Email] Sending via Resend...
[Email] Sent via Resend successfully
```

## Limitations

1. **Attachments**: Emails with attachments go directly to Resend (Gmail API attachment handling is complex)
2. **Daily Limit**: Gmail has ~500 emails/day limit (2000 for Google Workspace)
3. **Admin Required**: At least one admin must have completed OAuth with Gmail permissions

## Related Documentation

- [Gmail OAuth Setup](../GMAIL_OAUTH_SETUP.md)
- [Shipping Notifications System](./shipping-notifications-system-2026-02-03.md)
