import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email/client'

const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'info@thestreetlamp.com'

interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function buildContactFormHtml(data: ContactFormData): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
      <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 24px;">Contact Form Submission</h1>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Name:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(data.name)}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Email:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(data.email)}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Subject:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(data.subject)}</td></tr>
      </table>
      <h2 style="font-size: 18px; font-weight: 600; margin-top: 24px; margin-bottom: 12px;">Message</h2>
      <p style="white-space: pre-wrap; line-height: 1.6;">${escapeHtml(data.message)}</p>
      <p style="margin-top: 24px; font-size: 12px; color: #666;">Submitted via Street Collector contact page</p>
    </div>
  `
}

export async function POST(request: NextRequest) {
  try {
    const rawData: ContactFormData = await request.json()
    const data: ContactFormData = {
      name: rawData.name?.trim() || '',
      email: rawData.email?.trim() || '',
      subject: rawData.subject?.trim() || '',
      message: rawData.message?.trim() || '',
    }

    // Basic validation
    if (!data.name || !data.email || !data.subject || !data.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    const result = await sendEmail({
      to: CONTACT_EMAIL,
      subject: `Contact Form: ${data.subject}`,
      html: buildContactFormHtml(data),
      replyTo: data.email,
    })

    if (!result.success) {
      console.error('[Contact Form] Email send failed:', result.error)
      return NextResponse.json(
        { error: 'Failed to send message. Please try again or email us directly.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Your message has been sent' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to process contact form' },
      { status: 500 }
    )
  }
}
