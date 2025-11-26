/**
 * Email Service Client using Resend
 * Handles all email sending for the platform
 */

import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY not configured. Email sending will be disabled.')
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
  errorDetails?: any
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  if (!resend) {
    console.error('Resend not configured. Email not sent:', options.subject)
    return {
      success: false,
      error: 'Email service not configured',
    }
  }

  try {
    const fromEmail = options.from || process.env.EMAIL_FROM || 'onboarding@resend.dev'
    
    console.log('[Email] Attempting to send email:', {
      from: fromEmail,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      hasHtml: !!options.html,
    })
    
    const result = await resend.emails.send({
      from: fromEmail,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      reply_to: options.replyTo,
      attachments: options.attachments?.map((att) => ({
        filename: att.filename,
        content: typeof att.content === 'string' ? att.content : att.content.toString('base64'),
        content_type: att.contentType,
      })),
    })

    if (result.error) {
      console.error('[Email] Resend API error:', {
        error: result.error,
        message: result.error.message,
        name: result.error.name,
      })
      return {
        success: false,
        error: result.error.message || 'Failed to send email',
        errorDetails: result.error,
      }
    }

    console.log('[Email] Email sent successfully:', {
      messageId: result.data?.id,
      to: Array.isArray(options.to) ? options.to : [options.to],
    })

    return {
      success: true,
      messageId: result.data?.id,
    }
  } catch (error: any) {
    console.error('[Email] Exception sending email:', {
      error: error,
      message: error.message,
      stack: error.stack,
    })
    return {
      success: false,
      error: error.message || 'Unknown error sending email',
    }
  }
}

/**
 * Send email to multiple recipients
 */
export async function sendBulkEmail(
  recipients: string[],
  subject: string,
  html: string,
  options?: Omit<EmailOptions, 'to' | 'subject' | 'html'>
): Promise<EmailResult[]> {
  const results = await Promise.all(
    recipients.map((to) => sendEmail({ ...options, to, subject, html }))
  )
  return results
}

export { resend }

