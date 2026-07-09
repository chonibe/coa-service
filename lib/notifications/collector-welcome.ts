/**
 * Collector Welcome Email Notification
 * Sends welcome email to new collectors after signup
 */

import { sendEmail } from '@/lib/email/client'

export interface WelcomeEmailData {
  email: string
  name?: string
  creditsAmount?: number
}

/**
 * Generate welcome email HTML template
 */
function generateWelcomeEmailHtml(data: WelcomeEmailData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thestreetcollector.com'
  const creditsAmount = data.creditsAmount || 100
  const firstName = data.name?.split(' ')[0] || 'there'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Street Collector</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Welcome to Street Collector</h1>
  </div>
  
  <div style="background: white; padding: 40px 20px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${firstName},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Welcome to Street Collector. Your account is ready.
    </p>
    
    <div style="background: #f7fafc; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 4px;">
      <h2 style="margin-top: 0; color: #667eea; font-size: 20px;">You have ${creditsAmount} credits</h2>
      <p style="margin-bottom: 0; color: #4a5568;">
        We added ${creditsAmount} credits to your account. You can use them now or save them for a later order.
      </p>
    </div>
    
    <h2 style="font-size: 20px; margin-top: 30px; margin-bottom: 15px;">Next steps</h2>
    
    <div style="margin: 20px 0;">
      <div style="margin-bottom: 15px;">
        <strong style="color: #667eea;">1. Browse the collection</strong>
        <p style="margin: 5px 0; color: #4a5568;">
          Browse street art from independent artists around the world.
        </p>
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong style="color: #667eea;">2. Add your first work</strong>
        <p style="margin: 5px 0; color: #4a5568;">
          Add artworks to your collection and earn credits with every purchase.
        </p>
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong style="color: #667eea;">3. Authenticate physical works</strong>
        <p style="margin: 5px 0; color: #4a5568;">
          Use NFC scanning to verify and authenticate your physical artworks.
        </p>
      </div>
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="${appUrl}/collector/discover" 
         style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Browse collection →
      </a>
    </div>
    
    <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; color: #718096; font-size: 14px;">
      <p style="margin-bottom: 10px;">
        <strong>Need help?</strong><br>
        Check out our <a href="${appUrl}/collector/help" style="color: #667eea;">Help Center</a> or contact us at <a href="mailto:support@thestreetcollector.com" style="color: #667eea;">support@thestreetcollector.com</a>
      </p>
      
      <p style="margin: 0; font-size: 12px; color: #a0aec0;">
        You are receiving this email because you signed up for a Street Collector account.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Send welcome email to new collector
 */
export async function sendCollectorWelcomeEmail(data: WelcomeEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await sendEmail({
      to: data.email,
      subject: 'Welcome to Street Collector',
      html: generateWelcomeEmailHtml(data),
    })

    if (!result.success) {
      console.error('[Collector Welcome Email] Failed to send:', result.error)
      return {
        success: false,
        error: result.error || 'Failed to send welcome email',
      }
    }

    console.log('[Collector Welcome Email] Sent successfully to:', data.email)
    return { success: true }
  } catch (error: any) {
    console.error('[Collector Welcome Email] Exception:', error)
    return {
      success: false,
      error: error.message || 'Unknown error sending welcome email',
    }
  }
}
