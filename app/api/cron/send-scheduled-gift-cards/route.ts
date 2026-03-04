import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/client'

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://app.thestreetcollector.com'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * GET/POST /api/cron/send-scheduled-gift-cards
 * Sends gift card emails for records with status='scheduled' and send_at <= now.
 * Authenticated via CRON_SECRET header.
 */
async function handler(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('CRON_SECRET not configured')
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      )
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createClient()
    const now = new Date().toISOString()

    const { data: scheduled, error } = await supabase
      .from('gift_cards')
      .select('id, code, amount_cents, recipient_email, purchaser_email, sender_name, gift_message, gift_card_type')
      .eq('status', 'scheduled')
      .lte('send_at', now)

    if (error) {
      console.error('[cron/send-scheduled-gift-cards] Error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch scheduled gift cards', message: error.message },
        { status: 500 }
      )
    }

    let sent = 0
    for (const row of scheduled || []) {
      const emailTo = row.recipient_email || row.purchaser_email
      if (!emailTo) continue

      const amountDollars = (row.amount_cents / 100).toFixed(2)
      const productLabel =
        row.gift_card_type === 'street_lamp'
          ? '1 Street Lamp'
          : row.gift_card_type === 'season1_artwork'
            ? 'any Season 1 artwork ($40 value)'
            : `$${amountDollars}`
      const fromBlock = row.sender_name
        ? `<p style="font-size: 14px; color: #555; font-style: italic; margin-bottom: 16px;">From: ${escapeHtml(row.sender_name)}</p>`
        : ''
      const messageBlock = row.gift_message
        ? `<p style="font-size: 16px; color: #444; line-height: 1.6; margin: 16px 0; padding: 16px; background: #f9f9f9; border-radius: 8px; border-left: 4px solid #1a1a1a;">${escapeHtml(row.gift_message)}</p>`
        : ''

      await sendEmail({
        to: emailTo,
        subject: `Your Gift Card from The Street Collector${row.sender_name ? ` — From ${row.sender_name}` : ''}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h1 style="font-size: 24px; font-weight: 700; color: #1a1a1a; margin-bottom: 16px;">
              Your Gift Card
            </h1>
            ${fromBlock}
            <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 16px;">
              You've received a gift card worth ${productLabel}. Use it at checkout when purchasing from The Street Collector.
            </p>
            ${messageBlock}
            <p style="font-size: 20px; font-weight: 700; letter-spacing: 2px; color: #1a1a1a; margin: 24px 0; padding: 16px; background: #f5f5f5; border-radius: 8px; text-align: center;">
              ${row.code}
            </p>
            <p style="font-size: 14px; color: #777; line-height: 1.6;">
              To redeem: Add items to your cart, go to checkout, and enter this code in the "Add Promo Code or Gift Card" field.
            </p>
            <a href="${baseUrl}/shop" style="display: inline-block; background: #1a1a1a; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; margin-top: 16px;">
              Shop Now
            </a>
            <p style="font-size: 12px; color: #999; margin-top: 24px;">
              This code can only be used once. Delivered by email, this gift card never expires. Questions? <a href="${baseUrl}/shop/contact">Contact us</a>
            </p>
          </div>
        `,
      })

      await supabase
        .from('gift_cards')
        .update({ status: 'issued' })
        .eq('id', row.id)

      sent++
      console.log('[cron/send-scheduled-gift-cards] Sent:', row.code)
    }

    return NextResponse.json({ sent, total: scheduled?.length ?? 0 })
  } catch (err: unknown) {
    console.error('[cron/send-scheduled-gift-cards] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return handler(request)
}

export async function POST(request: NextRequest) {
  return handler(request)
}
