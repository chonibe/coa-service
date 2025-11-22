/**
 * Email template for payout failed notification
 */

export interface PayoutFailedEmailData {
  vendorName: string
  amount: number
  currency: string
  reference: string
  errorMessage: string
  payoutBatchId?: string
}

export function generatePayoutFailedEmail(data: PayoutFailedEmailData): string {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: data.currency || 'USD',
    minimumFractionDigits: 2,
  }).format(data.amount)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payout Failed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Payout Failed</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
    <p style="font-size: 16px; margin-top: 0;">Hi ${data.vendorName},</p>
    
    <p style="font-size: 16px;">We encountered an issue processing your payout.</p>
    
    <div style="background: white; border: 2px solid #ef4444; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <div style="text-align: center;">
        <div style="font-size: 36px; font-weight: bold; color: #ef4444; margin-bottom: 10px;">
          ${formattedAmount}
        </div>
        <div style="color: #6b7280; font-size: 14px;">Failed Payout Amount</div>
      </div>
    </div>
    
    <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #991b1b; font-size: 16px;">Error Details</h3>
      <p style="color: #7f1d1d; font-size: 14px; margin: 0;">${data.errorMessage}</p>
    </div>
    
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #1f2937; font-size: 18px;">Payout Information</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Reference:</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right;">${data.reference}</td>
        </tr>
        ${data.payoutBatchId ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Batch ID:</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right; font-size: 12px;">${data.payoutBatchId}</td>
        </tr>
        ` : ''}
      </table>
    </div>
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #92400e; font-size: 16px;">What Happens Next?</h3>
      <ul style="color: #78350f; font-size: 14px; padding-left: 20px;">
        <li>Our team has been notified and will investigate the issue</li>
        <li>We will retry the payout automatically if possible</li>
        <li>You may need to verify your payment details</li>
        <li>We will contact you if additional information is needed</li>
      </ul>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      Please check your payment method settings and ensure your PayPal email is correct and verified.
    </p>
    
    <p style="font-size: 14px; color: #6b7280;">
      If you have any questions, please contact our support team immediately.
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

