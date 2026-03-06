# Customizing the OTP Email (Street Collector Branding)

This guide explains how to change the Supabase OTP email so it appears from **Street Collector** instead of **Supabase Auth**, with a custom subject and body.

## Current Default (Supabase)

- **Subject**: Generic “Your one-time password (OTP) is…”
- **From**: `Supabase Auth <noreply@mail.app.supabase.io>`
- **Footer**: “You're receiving this email because you signed up for an application powered by Supabase ⚡️”

## Target (Street Collector)

- **Subject**: `Your OTP for your Artwork Dashboard`
- **From**: `Street Collector <noreply@thestreetcollector.com>` (or your domain)
- **Body**: Street Collector–branded message with the 6-digit code

---

## Step 1: Customize the Email Template (Supabase Dashboard)

1. Open **Supabase Dashboard** → [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Email Templates**
4. Select **Magic Link** (OTP uses the same template)

### Subject Line

Set:

```
Your OTP for your Artwork Dashboard
```

### Body (HTML)

Replace the default content with:

```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <img src="https://cdn.shopify.com/s/files/1/0659/7925/2963/files/LOGO_New_Black_19113602-ced0-4687-9162-435cf4e311d6.png?v=1764246239" alt="Street Collector" width="180" height="auto" style="max-width: 180px; height: auto;" />
  </div>
  <h1 style="font-size: 22px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px;">Your login code</h1>
  <p style="color: #4a4a4a; font-size: 16px; line-height: 1.5; margin: 0 0 24px;">Enter this code to sign in to your Street Collector Artwork Dashboard:</p>
  <div style="background: #f8f8f8; border-radius: 12px; padding: 20px 24px; text-align: center; margin: 0 0 24px; border: 1px solid #eee;">
    <span style="font-size: 28px; font-weight: 700; letter-spacing: 0.25em; color: #1a1a1a;">{{ .Token }}</span>
  </div>
  <p style="color: #888; font-size: 14px; line-height: 1.5; margin: 0 0 8px;">This code expires in 10 minutes.</p>
  <p style="color: #888; font-size: 14px; line-height: 1.5; margin: 0;">If you didn't request this, you can safely ignore this email.</p>
  <p style="margin-top: 32px; font-size: 13px; color: #aaa;">— Street Collector</p>
</div>
```

**Important**: Keep `{{ .Token }}` in the template. Do not remove it; it is the 6-digit OTP.

5. Click **Save**

---

## Step 2: Custom Sender (SMTP)

To send from `Street Collector <noreply@thestreetcollector.com>` instead of `Supabase Auth <noreply@mail.app.supabase.io>`:

1. Go to **Project Settings** → **Authentication** → **SMTP Settings**
2. Enable **Custom SMTP**
3. Configure your provider, e.g.:
   - **Resend**: host `smtp.resend.com`, port `465`
   - **SendGrid**: host `smtp.sendgrid.net`, port `587`, user `apikey`
   - **Postmark, Mailgun**, etc.
4. Set:
   - **Sender email**: `noreply@thestreetcollector.com` (or your verified domain)
   - **Sender name**: `Street Collector`
5. Save

Without custom SMTP, the From address will remain `noreply@mail.app.supabase.io`.

---

## Step 3: OTP Expiry (Optional)

The default expiry is 1 hour. To use “10 minutes” as in the template text:

1. Go to **Authentication** → **Providers** → **Email**
2. Set **Email OTP Expiration** to `600` (seconds)

---

## Self-Hosted / Local (config.toml)

If you use self-hosted Supabase or `supabase/config.toml`:

1. Create a template file, e.g. `supabase/templates/otp-magic-link.html`
2. Add the same HTML body as above
3. In `supabase/config.toml`, under `[auth.email]`:

```toml
[auth.email.template.magic_link]
subject = "Your OTP for your Artwork Dashboard"
content_path = "./supabase/templates/otp-magic-link.html"
```

4. Configure SMTP in `config.toml`:

```toml
[auth.email.smtp]
enabled = true
host = "smtp.resend.com"
port = 465
user = "resend"
pass = "env(RESEND_API_KEY)"
admin_email = "noreply@thestreetcollector.com"
sender_name = "Street Collector"
```

---

## Management API (Script)

Use the project script to update the OTP template via the Supabase Management API:

```bash
# Add SUPABASE_ACCESS_TOKEN to .env (get from https://supabase.com/dashboard/account/tokens)
# PROJECT_REF is auto-derived from NEXT_PUBLIC_SUPABASE_URL, or set explicitly

npm run supabase:update-otp-email
```

Or manually:

```bash
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="your-project-ref"

curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mailer_subjects_magic_link": "Your OTP for your Artwork Dashboard",
    "mailer_templates_magic_link_content": "<h2>Your login code</h2><p>Use this code to sign in to your Street Collector Artwork Dashboard:</p><p style=\"font-size: 24px; font-weight: bold; letter-spacing: 0.2em;\">{{ .Token }}</p><p style=\"color: #666; font-size: 14px;\">This code expires in 10 minutes.</p><p style=\"margin-top: 24px; font-size: 12px; color: #999;\">— Street Collector</p>"
  }'
```

**Note**: The Supabase MCP (Model Context Protocol) does not expose a tool to update auth email templates. Use the Dashboard, this script, or curl above.

---

## Summary Checklist

- [ ] **Email Templates** → Magic Link: subject + body updated
- [ ] **SMTP Settings** → Custom SMTP enabled, sender set
- [ ] **Providers** → Email: OTP expiry set to 600s (optional)
- [ ] Verify with a test sign-in and check inbox

---

## References

- [Supabase Email Templates docs](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Auth Slide-up Menu README](./features/auth-slideup-menu/README.md)
