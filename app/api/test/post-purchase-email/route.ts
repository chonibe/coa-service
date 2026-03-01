/**
 * Test endpoint: Send post-purchase "View your order" email to a given address.
 * Uses admin email (chonibe@gmail.com) by default.
 * Only enabled when CRON_SECRET or TEST_EMAIL_SECRET is provided for security.
 *
 * GET /api/test/post-purchase-email?email=chonibe@gmail.com&secret=YOUR_CRON_SECRET
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/client'

const ADMIN_EMAILS = ['choni@thestreetlamp.com', 'chonibe@gmail.com']

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email') || 'chonibe@gmail.com'
    const secret = searchParams.get('secret')

    // Require secret to prevent abuse (use CRON_SECRET or similar from env)
    const validSecret = process.env.CRON_SECRET || process.env.TEST_EMAIL_SECRET
    if (!validSecret || secret !== validSecret) {
      return NextResponse.json({ error: 'Unauthorized: secret required' }, { status: 401 })
    }

    // Only allow sending to admin emails for safety
    if (!ADMIN_EMAILS.includes(email.toLowerCase())) {
      return NextResponse.json(
        { error: `Only admin emails allowed for testing. Use one of: ${ADMIN_EMAILS.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const normalizedEmail = email.toLowerCase().trim()

    // Get userId (from collector_profiles or auth)
    let userId: string | null = null
    const { data: profile } = await supabase
      .from('collector_profiles')
      .select('user_id')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (profile?.user_id) {
      userId = profile.user_id
    } else {
      const { data: listData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const user = listData?.users?.find((u: { email?: string }) => u.email?.toLowerCase() === normalizedEmail)
      if (user) userId = user.id
    }

    let signInUrl: string | null = null
    if (userId) {
      const { data: linkData } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: normalizedEmail,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.thestreetcollector.com'}/collector/dashboard`,
        },
      })
      signInUrl = linkData?.properties?.action_link || (linkData as { action_link?: string })?.action_link || null
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.thestreetcollector.com'
    const ctaUrl = signInUrl || `${baseUrl}/login?email=${encodeURIComponent(normalizedEmail)}&redirect=/collector/dashboard`
    const ctaText = signInUrl ? 'View Your Order & Track Shipping' : 'Log In to View Your Order'
    const creditsToDeposit = 50 // Fake test value
    const itemSummary = '[Test] Sample Artwork (×1)'

    const result = await sendEmail({
      to: normalizedEmail,
      subject: '[TEST] Your artwork is on its way!',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #1a1a1a; margin-bottom: 16px;">
            🧪 [TEST] Your artwork is on its way!
          </h1>
          <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 12px;">
            This is a test of the post-purchase email. You earned <strong>${creditsToDeposit} credits</strong> with this order.
          </p>
          <p style="font-size: 14px; color: #777; margin-bottom: 24px;">
            Items: ${itemSummary}
          </p>
          <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 24px;">
            ${signInUrl ? 'Click below to sign in and track your order (magic link).' : 'Log in with your email to view your order (fallback link).'}
          </p>
          <a href="${ctaUrl}" style="display: inline-block; background: #1a1a1a; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            ${ctaText}
          </a>
          <p style="font-size: 12px; color: #999; margin-top: 24px;">
            ${signInUrl ? 'This link expires in 1 hour.' : 'Go to ' + baseUrl + '/login and enter your email.'}
          </p>
        </div>
      `,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Email send failed' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${normalizedEmail}`,
      hasMagicLink: !!signInUrl,
    })
  } catch (err: any) {
    console.error('[test/post-purchase-email] Error:', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
