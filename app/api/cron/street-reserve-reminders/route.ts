import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/client'

const shopBase =
  process.env.NEXT_PUBLIC_SHOP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://www.thestreetcollector.com'

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * GET/POST /api/cron/street-reserve-reminders
 * Emails Reserve members whose price lock expires in ~24h (one-day window to avoid duplicate sends).
 * Auth: Authorization: Bearer CRON_SECRET
 */
async function handler(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('[cron/street-reserve-reminders] CRON_SECRET not configured')
      return NextResponse.json({ error: 'Cron secret not configured' }, { status: 500 })
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient() as any
    const now = Date.now()
    const windowStart = new Date(now + 20 * 3600 * 1000).toISOString()
    const windowEnd = new Date(now + 28 * 3600 * 1000).toISOString()

    const { data: locks, error } = await supabase
      .from('street_reserve_locks')
      .select('customer_email, shopify_product_id, locked_price_cents, expires_at')
      .not('customer_email', 'is', null)
      .gte('expires_at', windowStart)
      .lte('expires_at', windowEnd)

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({
          success: true,
          message: 'street_reserve_locks not present — skip',
          sent: 0,
        })
      }
      console.error('[cron/street-reserve-reminders] query', error)
      return NextResponse.json(
        { error: 'Failed to load locks', message: error.message },
        { status: 500 },
      )
    }

    if (!locks?.length) {
      return NextResponse.json({ success: true, message: 'No locks in reminder window', sent: 0 })
    }

    let sent = 0
    const failures: string[] = []

    for (const row of locks as Array<{
      customer_email: string
      shopify_product_id: string
      locked_price_cents: number
      expires_at: string
    }>) {
      const email = row.customer_email?.trim().toLowerCase()
      if (!email) continue

      const usd = Math.round((row.locked_price_cents / 100) * 100) / 100
      const exp = new Date(row.expires_at)
      const expStr = exp.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
      const productUrl = `${shopBase.replace(/\/$/, '')}/shop/experience`

      const html = `
      <div style="font-family: system-ui, sans-serif; max-width: 520px; margin: 0 auto;">
        <h1 style="font-size: 18px;">Your Reserve price lock is ending soon</h1>
        <p style="color: #444; line-height: 1.5;">
          Your locked price of <strong>$${usd}</strong> for artwork
          <strong>#${escapeHtml(row.shopify_product_id)}</strong> expires around
          <strong>${escapeHtml(expStr)}</strong> (your local time may vary).
        </p>
        <p style="color: #444; line-height: 1.5;">
          Complete checkout before it expires to keep this price, or renew your lock from The Reserve if your tier allows.
        </p>
        <p style="margin-top: 20px;">
          <a href="${productUrl}" style="display: inline-block; padding: 12px 20px; background: #047AFF; color: #fff; text-decoration: none; border-radius: 8px;">Open experience</a>
        </p>
        <p style="font-size: 12px; color: #888; margin-top: 24px;">Street Collector — The Reserve</p>
      </div>
    `

      const res = await sendEmail({
        to: email,
        subject: `Your $${usd} artwork lock expires soon`,
        html,
      })

      if (res.success) sent += 1
      else failures.push(`${email}: ${res.error || 'send failed'}`)
    }

    return NextResponse.json({
      success: true,
      sent,
      candidates: locks.length,
      failures: failures.length ? failures : undefined,
    })
  } catch (err: unknown) {
    console.error('[cron/street-reserve-reminders]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  return handler(request)
}

export async function POST(request: NextRequest) {
  return handler(request)
}
