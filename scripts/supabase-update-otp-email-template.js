#!/usr/bin/env node
/**
 * Update Supabase OTP (Magic Link) email template to Street Collector branding.
 *
 * Requires SUPABASE_ACCESS_TOKEN (personal access token from https://supabase.com/dashboard/account/tokens)
 * and PROJECT_REF (or derived from NEXT_PUBLIC_SUPABASE_URL).
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=xxx PROJECT_REF=ldmppmnpgdxueebkkpid node scripts/supabase-update-otp-email-template.js
 *   Or with dotenv: node -r dotenv/config scripts/supabase-update-otp-email-template.js
 *
 * See docs/SUPABASE_OTP_EMAIL_CUSTOMIZATION.md for Dashboard-based alternative.
 */

const PROJECT_REF =
  process.env.PROJECT_REF ||
  (process.env.NEXT_PUBLIC_SUPABASE_URL
    ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0]
    : null)

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN

const OTP_TEMPLATE = {
  mailer_subjects_magic_link: 'Your OTP for your Artwork Dashboard',
  mailer_templates_magic_link_content: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
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
</div>`,
}

async function main() {
  if (!SUPABASE_ACCESS_TOKEN) {
    console.error('❌ Missing SUPABASE_ACCESS_TOKEN')
    console.error('   Create one at https://supabase.com/dashboard/account/tokens')
    process.exit(1)
  }
  if (!PROJECT_REF) {
    console.error('❌ Missing PROJECT_REF (or set NEXT_PUBLIC_SUPABASE_URL)')
    process.exit(1)
  }

  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(OTP_TEMPLATE),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('❌ API error:', res.status, text)
    process.exit(1)
  }

  console.log('✅ OTP email template updated:')
  console.log('   Subject:', OTP_TEMPLATE.mailer_subjects_magic_link)
  console.log('   Body: Street Collector branded with {{ .Token }}')
  console.log('   Verify at: Supabase Dashboard → Authentication → Email Templates → Magic Link')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
