/**
 * Email template for payout pending reminder
 */

export interface PayoutPendingReminderData {
  vendorName: string
  pendingAmount: number
  currency: string
  pendingItems: number
  lastPayoutDate?: string
}

export function generatePayoutPendingReminderEmail(data: PayoutPendingReminderData): string {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: data.currency || 'USD',
    minimumFractionDigits: 2,
  }).format(data.pendingAmount)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pending Payout Reminder</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Pending Payout Reminder</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
    <p style="font-size: 16px; margin-top: 0;">Hi ${data.vendorName},</p>
    
    <p style="font-size: 16px;">You have a pending payout waiting to be processed.</p>
    
    <div style="background: white; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <div style="text-align: center;">
        <div style="font-size: 36px; font-weight: bold; color: #f59e0b; margin-bottom: 10px;">
          ${formattedAmount}
        </div>
        <div style="color: #6b7280; font-size: 14px;">Pending Payout</div>
      </div>
    </div>
    
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #1f2937; font-size: 18px;">Summary</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Pending Items:</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right;">${data.pendingItems}</td>
        </tr>
        ${data.lastPayoutDate ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Last Payout:</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right;">${new Date(data.lastPayoutDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
        </tr>
        ` : `
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Last Payout:</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right;">Never</td>
        </tr>
        `}
      </table>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://coa-service.com'}/vendor/dashboard/payouts" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Payout Details</a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      Your payout will be processed according to your schedule settings. If you have automatic payouts enabled, this will be processed automatically.
    </p>
    
    <p style="font-size: 14px; color: #6b7280;">
      If you have any questions, please contact our support team.
    </p>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      Best regards,<br>
      COA Service Team
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
    <p>This is an automated message. Please do not reply to this email.</p>
  </div>
</body>
</html>
  `.trim()
}

