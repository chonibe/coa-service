/**
 * Email template for payout processed notification
 */

export interface PayoutProcessedEmailData {
  vendorName: string
  amount: number
  currency: string
  payoutDate: string
  reference: string
  invoiceNumber?: string
  productCount: number
  payoutBatchId?: string
  invoiceUrl?: string
}

export function generatePayoutProcessedEmail(data: PayoutProcessedEmailData): string {
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
  <title>Payout Processed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Payout Processed</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
    <p style="font-size: 16px; margin-top: 0;">Hi ${data.vendorName},</p>
    
    <p style="font-size: 16px;">Great news! Your payout has been successfully processed.</p>
    
    <div style="background: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <div style="text-align: center;">
        <div style="font-size: 36px; font-weight: bold; color: #10b981; margin-bottom: 10px;">
          ${formattedAmount}
        </div>
        <div style="color: #6b7280; font-size: 14px;">Payout Amount</div>
      </div>
    </div>
    
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #1f2937; font-size: 18px;">Payout Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Reference:</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right;">${data.reference}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date:</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right;">${new Date(data.payoutDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Products:</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right;">${data.productCount}</td>
        </tr>
        ${data.invoiceNumber ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Invoice:</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right;">${data.invoiceNumber}</td>
        </tr>
        ` : ''}
        ${data.payoutBatchId ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Batch ID:</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right; font-size: 12px;">${data.payoutBatchId}</td>
        </tr>
        ` : ''}
      </table>
    </div>
    
    ${data.invoiceUrl ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.invoiceUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Download Invoice</a>
    </div>
    ` : ''}
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      The funds should appear in your account within 1-3 business days, depending on your payment method.
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

