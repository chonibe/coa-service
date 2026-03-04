import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email/client'

const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'info@thestreetlamp.com'

type InquiryType = 'gifting' | 'hospitality' | 'offices' | 'galleries'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function buildContactFormHtml(
  type: string,
  data: {
    name: string
    companyName: string
    desiredTiles: string
    email: string
    phone?: string
    additionalInfo?: string
  }
): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
      <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 24px;">For Business Inquiry: ${escapeHtml(type)}</h1>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Name:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(data.name)}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Company:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(data.companyName)}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Desired amount of tiles:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(data.desiredTiles)}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Email:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(data.email)}</td></tr>
        ${data.phone ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Phone:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(data.phone)}</td></tr>` : ''}
      </table>
      ${data.additionalInfo ? `<h2 style="font-size: 18px; font-weight: 600; margin-top: 24px; margin-bottom: 12px;">Additional information</h2><p style="white-space: pre-wrap; line-height: 1.6;">${escapeHtml(data.additionalInfo)}</p>` : ''}
      <p style="margin-top: 24px; font-size: 12px; color: #666;">Submitted via Street Collector For Business form</p>
    </div>
  `
}

function buildGiftingFormHtml(data: {
  cardValue: string
  employeesCount: string
  company: string
  sendToday: string
  sendDate: string
  giftMessage: string
  emails: string
  hasCsv: boolean
}): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
      <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 24px;">For Business: B2B Gift Card Request</h1>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Card value:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(data.cardValue)}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Employees to be gifted:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(data.employeesCount)}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Company:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(data.company)}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Send when:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.sendToday === 'true' ? 'Today' : escapeHtml(data.sendDate)}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>CSV uploaded:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.hasCsv ? 'Yes' : 'No'}</td></tr>
      </table>
      ${data.emails ? `<h2 style="font-size: 18px; font-weight: 600; margin-top: 24px; margin-bottom: 12px;">Recipient emails</h2><p style="white-space: pre-wrap; line-height: 1.6;">${escapeHtml(data.emails)}</p>` : ''}
      ${data.giftMessage ? `<h2 style="font-size: 18px; font-weight: 600; margin-top: 24px; margin-bottom: 12px;">Gift message</h2><p style="white-space: pre-wrap; line-height: 1.6;">${escapeHtml(data.giftMessage)}</p>` : ''}
      <p style="margin-top: 24px; font-size: 12px; color: #666;">Submitted via Street Collector For Business form</p>
    </div>
  `
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const type = formData.get('type') as string
      if (type !== 'gifting') {
        return NextResponse.json({ error: 'Invalid type for FormData' }, { status: 400 })
      }

      const cardValue = String(formData.get('cardValue') || '')
      const employeesCount = String(formData.get('employeesCount') || '')
      const company = String(formData.get('company') || '')
      const sendToday = String(formData.get('sendToday') || 'true')
      const sendDate = String(formData.get('sendDate') || '')
      const giftMessage = String(formData.get('giftMessage') || '')
      const emails = String(formData.get('emails') || '')
      const csvFile = formData.get('csvFile') as File | null

      const html = buildGiftingFormHtml({
        cardValue,
        employeesCount,
        company,
        sendToday,
        sendDate,
        giftMessage,
        emails,
        hasCsv: !!(csvFile && csvFile.size > 0),
      })

      const emailOptions: Parameters<typeof sendEmail>[0] = {
        to: CONTACT_EMAIL,
        subject: `For Business: B2B Gift Card Request - ${company || 'Unknown company'}`,
        html,
      }

      if (csvFile && csvFile.size > 0) {
        const buffer = Buffer.from(await csvFile.arrayBuffer())
        emailOptions.attachments = [
          {
            filename: csvFile.name || 'recipients.csv',
            content: buffer,
            contentType: 'text/csv',
          },
        ]
      }

      const result = await sendEmail(emailOptions)

      if (!result.success) {
        console.error('[For Business] Email send failed:', result.error)
        return NextResponse.json(
          { error: 'Failed to submit. Please try again or email us directly.' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true })
    }

    const body = await request.json()
    const { type, name, companyName, desiredTiles, email, phone, additionalInfo } = body

    const validTypes: InquiryType[] = ['hospitality', 'offices', 'galleries']
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid inquiry type' }, { status: 400 })
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!companyName || typeof companyName !== 'string' || !companyName.trim()) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }
    if (!desiredTiles || typeof desiredTiles !== 'string' || !desiredTiles.trim()) {
      return NextResponse.json({ error: 'Desired amount of tiles is required' }, { status: 400 })
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1)
    const html = buildContactFormHtml(typeLabel, {
      name: name.trim(),
      companyName: companyName.trim(),
      desiredTiles: desiredTiles.trim(),
      email: email.trim(),
      phone: phone?.trim() || undefined,
      additionalInfo: additionalInfo?.trim() || undefined,
    })

    const result = await sendEmail({
      to: CONTACT_EMAIL,
      subject: `For Business (${typeLabel}): ${companyName.trim()}`,
      html,
      replyTo: email.trim(),
    })

    if (!result.success) {
      console.error('[For Business] Email send failed:', result.error)
      return NextResponse.json(
        { error: 'Failed to submit. Please try again or email us directly.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[For Business] Error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
