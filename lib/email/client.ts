/**
 * Email Service Client
 * Primary: Gmail API (better deliverability, sends from your Gmail account)
 * Fallback: Resend (when Gmail is unavailable)
 */

import { Resend } from 'resend'
import { logEmail } from '@/lib/crm/log-email'
import { sendGmailEmail } from '@/lib/gmail/send'

// Configuration
const USE_GMAIL_PRIMARY = process.env.EMAIL_USE_GMAIL !== 'false' // Default: true
const GMAIL_ENABLED = process.env.SUPABASE_GOOGLE_CLIENT_ID && process.env.SUPABASE_GOOGLE_CLIENT_SECRET

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY not configured. Email fallback will be disabled.')
}

if (!GMAIL_ENABLED) {
  console.warn('Gmail OAuth not configured. Using Resend only.')
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
 * Send an email using Gmail API (primary) with Resend fallback
 * Gmail provides better deliverability as emails come from your actual Gmail account
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const recipients = Array.isArray(options.to) ? options.to : [options.to]
  
  console.log('[Email] Attempting to send email:', {
    to: recipients,
    subject: options.subject,
    useGmail: USE_GMAIL_PRIMARY && GMAIL_ENABLED,
    hasAttachments: !!options.attachments?.length,
  })

  // Try Gmail first if enabled and no attachments (Gmail API attachment handling is complex)
  if (USE_GMAIL_PRIMARY && GMAIL_ENABLED && !options.attachments?.length) {
    try {
      const gmailResult = await sendGmailEmail({
        to: options.to,
        subject: options.subject,
        html: options.html,
        from: options.from,
        replyTo: options.replyTo,
      })

      if (gmailResult.success) {
        console.log('[Email] Sent via Gmail successfully:', {
          messageId: gmailResult.messageId,
          to: recipients,
        })

        // Log email to CRM
        await logEmailToCRM(recipients, options, gmailResult.messageId, 'gmail')

        return {
          success: true,
          messageId: gmailResult.messageId,
        }
      }

      // Gmail failed, log and try fallback
      console.warn('[Email] Gmail send failed, trying Resend fallback:', gmailResult.error)
    } catch (gmailError: any) {
      console.warn('[Email] Gmail exception, trying Resend fallback:', gmailError.message)
    }
  }

  // Fallback to Resend
  return sendViaResend(options)
}

function extractAllowedTestRecipient(errorMessage: string): string | null {
  const match = errorMessage.match(/\(([^)@\s]+@[^)\s]+)\)/)
  return match?.[1] ?? null
}

function isResendQuotaError(error?: { message?: string; name?: string } | null): boolean {
  const msg = (error?.message || '').toLowerCase()
  return (
    msg.includes('daily quota') ||
    msg.includes('quota limit') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests')
  )
}

/**
 * Send email via Resend (fallback method)
 */
async function sendViaResend(options: EmailOptions): Promise<EmailResult> {
  if (!resend) {
    console.error('[Email] Resend not configured. Email not sent:', options.subject)
    return {
      success: false,
      error: 'Email service not configured (no Gmail tokens and Resend not configured)',
    }
  }

  try {
    const primaryFromEmail = options.from || process.env.EMAIL_FROM || 'onboarding@resend.dev'
    const recipients = Array.isArray(options.to) ? options.to : [options.to]
    
    console.log('[Email] Sending via Resend:', {
      from: primaryFromEmail,
      to: recipients,
      subject: options.subject,
    })
    
    const sendResendEmail = async (fromEmail: string) =>
      resend.emails.send({
        from: fromEmail,
        to: recipients,
        subject: options.subject,
        html: options.html,
        reply_to: options.replyTo,
        attachments: options.attachments?.map((att) => ({
          filename: att.filename,
          content: typeof att.content === 'string' ? att.content : att.content.toString('base64'),
          content_type: att.contentType,
        })),
      })

    let result = await sendResendEmail(primaryFromEmail)
    let deliveredRecipients = recipients

    const shouldRetryWithResendDefault =
      !!result.error &&
      result.error.name === 'validation_error' &&
      typeof result.error.message === 'string' &&
      result.error.message.toLowerCase().includes('domain is not verified') &&
      primaryFromEmail.toLowerCase() !== 'onboarding@resend.dev'

    if (shouldRetryWithResendDefault) {
      const fallbackFromEmail = 'onboarding@resend.dev'
      console.warn('[Email] Retrying Resend with fallback sender:', {
        previousFrom: primaryFromEmail,
        fallbackFrom: fallbackFromEmail,
      })
      result = await sendResendEmail(fallbackFromEmail)
    }

    const resendErrorMessage = result.error?.message || ''
    const allowedTestRecipient = extractAllowedTestRecipient(resendErrorMessage)
    const shouldRetryWithAllowedTestRecipient =
      !!result.error &&
      result.error.name === 'validation_error' &&
      resendErrorMessage.toLowerCase().includes('you can only send testing emails to your own email address') &&
      process.env.NODE_ENV !== 'production' &&
      !!allowedTestRecipient

    if (shouldRetryWithAllowedTestRecipient && allowedTestRecipient) {
      console.warn('[Email] Retrying Resend to allowed test recipient in non-production:', {
        allowedTestRecipient,
        originalRecipients: recipients,
      })
      const singleTestRecipient = [allowedTestRecipient]
      const resultFromAllowedRecipient = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: singleTestRecipient,
        subject: `[TEST FALLBACK] ${options.subject}`,
        html: `${options.html}<hr/><p style="font-size:12px;color:#666;">Original recipients: ${recipients.join(', ')}</p>`,
        reply_to: options.replyTo,
      })
      result = resultFromAllowedRecipient
      deliveredRecipients = singleTestRecipient
    }

    if (result.error) {
      // Automatic fallback: when Resend quota is exhausted, try Gmail if available.
      if (isResendQuotaError(result.error) && GMAIL_ENABLED && !options.attachments?.length) {
        console.warn('[Email] Resend quota reached, attempting Gmail fallback:', result.error.message)
        const gmailResult = await sendGmailEmail({
          to: options.to,
          subject: options.subject,
          html: options.html,
          from: options.from,
          replyTo: options.replyTo,
        })

        if (gmailResult.success) {
          await logEmailToCRM(recipients, options, gmailResult.messageId, 'gmail')
          return {
            success: true,
            messageId: gmailResult.messageId,
          }
        }

        console.error('[Email] Gmail fallback after Resend quota failed:', gmailResult.error)
      }

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

    const deliveredFrom = shouldRetryWithResendDefault ? 'onboarding@resend.dev' : primaryFromEmail

    console.log('[Email] Sent via Resend successfully:', {
      messageId: result.data?.id,
      from: deliveredFrom,
      to: deliveredRecipients,
    })

    // Log email to CRM
    await logEmailToCRM(
      deliveredRecipients,
      { ...options, from: deliveredFrom },
      result.data?.id,
      'resend'
    )

    return {
      success: true,
      messageId: result.data?.id,
    }
  } catch (error: any) {
    console.error('[Email] Resend exception:', {
      error: error,
      message: error.message,
    })
    return {
      success: false,
      error: error.message || 'Unknown error sending email',
    }
  }
}

/**
 * Log email to CRM system
 */
async function logEmailToCRM(
  recipients: string[],
  options: EmailOptions,
  messageId: string | undefined,
  method: 'gmail' | 'resend'
): Promise<void> {
  const fromEmail = options.from || process.env.EMAIL_FROM || 'noreply@thestreetlamp.com'
  
  for (const recipient of recipients) {
    // Only log if it's not a system email
    if (recipient && !recipient.includes('@resend.dev')) {
      logEmail({
        customerEmail: recipient,
        subject: options.subject,
        content: options.html,
        direction: 'outbound',
        externalId: messageId,
        metadata: {
          from: fromEmail,
          messageId: messageId,
          sendMethod: method,
        },
      }).catch((error) => {
        // Don't fail email send if CRM logging fails
        console.error('[Email] Failed to log email to CRM:', error)
      })
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

