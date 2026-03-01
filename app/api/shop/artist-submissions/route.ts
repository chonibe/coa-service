import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email/client'

const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'info@thestreetlamp.com'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, instagram, portfolio, message } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 24px;">New Artist Submission</h1>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Name:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(name.trim())}</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Email:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(email.trim())}</td></tr>
          ${instagram ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Instagram:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(String(instagram).trim())}</td></tr>` : ''}
          ${portfolio ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Portfolio:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><a href="${escapeHtml(String(portfolio).trim())}">${escapeHtml(String(portfolio).trim())}</a></td></tr>` : ''}
        </table>
        <h2 style="font-size: 18px; font-weight: 600; margin-top: 24px; margin-bottom: 12px;">Message</h2>
        <p style="white-space: pre-wrap; line-height: 1.6;">${escapeHtml(message.trim())}</p>
        <p style="margin-top: 24px; font-size: 12px; color: #666;">Submitted via Street Collector Artist Submissions form</p>
      </div>
    `

    const result = await sendEmail({
      to: CONTACT_EMAIL,
      subject: `Artist Submission: ${name.trim()}`,
      html,
      replyTo: email.trim(),
    })

    if (!result.success) {
      console.error('[Artist Submissions] Email send failed:', result.error)
      return NextResponse.json(
        { error: 'Failed to submit. Please try again or email us directly.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Artist Submissions] Error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
