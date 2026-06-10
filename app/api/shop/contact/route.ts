import { NextRequest, NextResponse } from 'next/server'

const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'info@thestreetlamp.com'

interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

export async function POST(request: NextRequest) {
  try {
    const data: ContactFormData = await request.json()

    // Basic validation
    if (!data.name || !data.email || !data.subject || !data.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Send email via your email service (e.g., SendGrid, Resend, Mailgun, etc.)
    // For now, we'll log it and return success
    // You can implement your preferred email service here

    console.log('Contact form submission:', {
      timestamp: new Date().toISOString(),
      to: CONTACT_EMAIL,
      ...data,
    })

    // TODO: Replace with your actual email service
    // Example with Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({
    //   from: 'noreply@thestreetcollector.com',
    //   to: CONTACT_EMAIL,
    //   subject: `Contact Form: ${data.subject}`,
    //   html: `
    //     <h2>${data.subject}</h2>
    //     <p><strong>From:</strong> ${data.name} (${data.email})</p>
    //     <p><strong>Message:</strong></p>
    //     <p>${data.message.replace(/\n/g, '<br>')}</p>
    //   `,
    // })

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
