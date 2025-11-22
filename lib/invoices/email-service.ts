/**
 * Invoice Email Service
 * Handles automated invoice generation and email delivery
 */

import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/client'
import { generateInvoiceBuffer } from './generator'

/**
 * Send invoice email to vendor
 */
export async function sendInvoiceEmail(
  payoutId: number,
  vendorName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    // Get payout details
    const { data: payout, error: payoutError } = await supabase
      .from('vendor_payouts')
      .select('*')
      .eq('id', payoutId)
      .single()

    if (payoutError || !payout) {
      return { success: false, error: 'Payout not found' }
    }

    // Get vendor details
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('vendor_name', vendorName)
      .single()

    if (vendorError || !vendor) {
      return { success: false, error: 'Vendor not found' }
    }

    const vendorEmail = vendor.contact_email || vendor.paypal_email
    if (!vendorEmail) {
      return { success: false, error: 'Vendor email not found' }
    }

    // Generate invoice PDF
    const invoiceUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/vendors/payouts/${payoutId}/invoice`
    
    // Fetch invoice as buffer for attachment
    const invoiceResponse = await fetch(invoiceUrl)
    if (!invoiceResponse.ok) {
      return { success: false, error: 'Failed to generate invoice' }
    }

    const invoiceBuffer = Buffer.from(await invoiceResponse.arrayBuffer())
    const invoiceNumber = payout.invoice_number || `INV-${payoutId}`

    // Create email HTML
    const emailHtml = generateInvoiceEmailHtml({
      vendorName: payout.vendor_name,
      invoiceNumber,
      amount: parseFloat(payout.amount.toString()),
      currency: payout.currency || 'USD',
      payoutDate: payout.payout_date || payout.created_at,
      reference: payout.reference || `PAY-${payoutId}`,
      invoiceUrl,
    })

    // Send email with invoice attachment
    const emailResult = await sendEmail({
      to: vendorEmail,
      subject: `Invoice ${invoiceNumber} - Your Payout Receipt`,
      html: emailHtml,
      attachments: [
        {
          filename: `invoice-${invoiceNumber}.pdf`,
          content: invoiceBuffer,
          contentType: 'application/pdf',
        },
      ],
    })

    if (!emailResult.success) {
      return { success: false, error: emailResult.error }
    }

    // Log email sent
    await supabase.from('email_log').insert({
      recipient_email: vendorEmail,
      recipient_name: vendorName,
      subject: `Invoice ${invoiceNumber} - Your Payout Receipt`,
      email_type: 'invoice',
      status: 'sent',
      message_id: emailResult.messageId,
      metadata: {
        payout_id: payoutId,
        vendor_name: vendorName,
        invoice_number: invoiceNumber,
      },
    })

    return { success: true }
  } catch (error: any) {
    console.error('Error sending invoice email:', error)
    return { success: false, error: error.message || 'Failed to send invoice email' }
  }
}

/**
 * Generate invoice email HTML
 */
function generateInvoiceEmailHtml(data: {
  vendorName: string
  invoiceNumber: string
  amount: number
  currency: string
  payoutDate: string
  reference: string
  invoiceUrl: string
}): string {
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
  <title>Your Invoice</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Your Invoice</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
    <p style="font-size: 16px; margin-top: 0;">Hi ${data.vendorName},</p>
    
    <p style="font-size: 16px;">Please find your invoice attached for your recent payout.</p>
    
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #1f2937; font-size: 18px;">Invoice Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Invoice Number:</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right;">${data.invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Amount:</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right; font-size: 18px; color: #059669;">${formattedAmount}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Reference:</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right;">${data.reference}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date:</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right;">${new Date(data.payoutDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
        </tr>
      </table>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.invoiceUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Download Invoice PDF</a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      The invoice PDF is also attached to this email for your records.
    </p>
    
    <p style="font-size: 14px; color: #6b7280;">
      This is a self-billing invoice for tax purposes. Please keep this for your records.
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

