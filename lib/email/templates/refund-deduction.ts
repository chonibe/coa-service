/**
 * Email template for refund deduction notification
 */

export interface RefundDeductionEmailData {
  vendorName: string
  refundAmount: number
  currency: string
  orderId: string
  orderName?: string
  refundType: 'full' | 'partial'
  deductionAmount: number
  newBalance: number
}

export function generateRefundDeductionEmail(data: RefundDeductionEmailData): string {
  const formattedRefund = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: data.currency || 'USD',
    minimumFractionDigits: 2,
  }).format(data.refundAmount)

  const formattedDeduction = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: data.currency || 'USD',
    minimumFractionDigits: 2,
  }).format(data.deductionAmount)

  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: data.currency || 'USD',
    minimumFractionDigits: 2,
  }).format(data.newBalance)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Refund Deduction Notice</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Refund Deduction Notice</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
    <p style="font-size: 16px; margin-top: 0;">Hi ${data.vendorName},</p>
    
    <p style="font-size: 16px;">A refund has been processed for an order that included your products. As per our payout policy, your share of the refund has been deducted from your pending payout balance.</p>
    
    <div style="background: white; border: 2px solid #8b5cf6; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <div style="text-align: center;">
        <div style="font-size: 32px; font-weight: bold; color: #8b5cf6; margin-bottom: 10px;">
          ${formattedDeduction}
        </div>
        <div style="color: #6b7280; font-size: 14px;">Deduction Amount</div>
      </div>
    </div>
    
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #1f2937; font-size: 18px;">Refund Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Order:</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right;">${data.orderName || data.orderId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Refund Type:</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right; text-transform: capitalize;">${data.refundType}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Refund Amount:</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right;">${formattedRefund}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Your Deduction:</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right; color: #dc2626;">-${formattedDeduction}</td>
        </tr>
        <tr style="border-top: 2px solid #e5e7eb;">
          <td style="padding: 12px 0; color: #1f2937; font-size: 16px; font-weight: 600;">New Balance:</td>
          <td style="padding: 12px 0; font-weight: 700; text-align: right; font-size: 18px; color: ${data.newBalance < 0 ? '#dc2626' : '#059669'};">${formattedBalance}</td>
        </tr>
      </table>
    </div>
    
    ${data.newBalance < 0 ? `
    <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #991b1b; font-size: 16px;">⚠️ Negative Balance</h3>
      <p style="color: #7f1d1d; font-size: 14px; margin: 0;">
        Your account now has a negative balance. This amount will be deducted from your next positive payout.
      </p>
    </div>
    ` : ''}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://coa-service.com'}/vendor/dashboard/payouts" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Payout Details</a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      This deduction is automatic and ensures fair handling of refunds. The amount will be deducted from your next payout.
    </p>
    
    <p style="font-size: 14px; color: #6b7280;">
      If you have any questions about this refund, please contact our support team.
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

