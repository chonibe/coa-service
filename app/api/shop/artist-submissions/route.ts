import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email/client'
import { createClient } from '@/lib/supabase/server'
import { getArtistApplicationNotifyRecipients } from '@/lib/constants/artist-application-notify'

function sanitize(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const name = sanitize(body.name)
  const email = sanitize(body.email)?.toLowerCase() ?? null
  const message = sanitize(body.message)
  const instagram = sanitize(body.instagram)
  const portfolio = sanitize(body.portfolio)

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }
  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  const bioWithSource = `[Submitted via /shop/artist-submissions]\n\n${message}`

  try {
    const supabase = createClient()

    const { error: insertError } = await supabase.from('artist_applications').insert({
      name,
      email,
      instagram,
      portfolio_url: portfolio,
      bio: bioWithSource,
    })

    if (insertError) {
      console.error('[Artist Submissions] DB insert failed:', insertError)
      return NextResponse.json(
        { error: "We couldn't save your submission. Please try again or email us directly." },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error('[Artist Submissions] Unexpected DB error:', error)
    return NextResponse.json(
      { error: "We couldn't save your submission. Please try again or email us directly." },
      { status: 500 },
    )
  }

  const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 24px;">New Artist Submission</h1>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Name:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(name)}</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Email:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(email)}</td></tr>
          ${instagram ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Instagram:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(instagram)}</td></tr>` : ''}
          ${portfolio ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Portfolio:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><a href="${escapeHtml(portfolio)}">${escapeHtml(portfolio)}</a></td></tr>` : ''}
        </table>
        <h2 style="font-size: 18px; font-weight: 600; margin-top: 24px; margin-bottom: 12px;">Message</h2>
        <p style="white-space: pre-wrap; line-height: 1.6;">${escapeHtml(message)}</p>
        <p style="margin-top: 24px; font-size: 12px; color: #666;">Submitted via Street Collector Artist Submissions form (also saved to artist applications)</p>
      </div>
    `

  try {
    const result = await sendEmail({
      to: getArtistApplicationNotifyRecipients(),
      subject: `Artist Submission: ${name}`,
      html,
      replyTo: email,
    })
    if (!result.success) {
      console.warn('[Artist Submissions] Email notify failed (submission already saved):', result.error)
    }
  } catch (emailError) {
    console.warn('[Artist Submissions] Email notify error (submission already saved):', emailError)
  }

  return NextResponse.json({ success: true })
}
