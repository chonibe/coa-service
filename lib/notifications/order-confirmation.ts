import { sendEmail } from '@/lib/email/client'
import { renderTemplate } from '@/lib/email/template-service'

export interface OrderConfirmationPayload {
  orderName: string
  customerName: string
  customerEmail: string
  trackingToken: string
  lineItems?: Array<{
    name: string
    quantity: number
    price: string
  }>
  totalPrice?: string
  currency?: string
  primaryColor?: string
  baseUrl?: string
}

export function generateOrderConfirmationEmailHtml(data: {
  orderName: string
  customerName: string
  trackingUrl: string
  lineItems?: Array<{
    name: string
    quantity: number
    price: string
  }>
  totalPrice?: string
  currency?: string
  primaryColor: string
}): string {
  const lineItemsHtml = data.lineItems && data.lineItems.length > 0
    ? `
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #374151;">Order Items</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${data.lineItems.map(item => `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px 0; vertical-align: top;">
                <div style="font-weight: 500; color: #1f2937;">${item.name}</div>
                <div style="font-size: 14px; color: #6b7280;">Qty: ${item.quantity}</div>
              </td>
              <td style="padding: 12px 0; text-align: right; vertical-align: top; color: #374151;">
                ${data.currency || '$'}${item.price}
              </td>
            </tr>
          `).join('')}
          ${data.totalPrice ? `
            <tr>
              <td style="padding: 16px 0 0 0; font-weight: 600; color: #1f2937;">Total</td>
              <td style="padding: 16px 0 0 0; text-align: right; font-weight: 600; color: #1f2937;">
                ${data.currency || '$'}${data.totalPrice}
              </td>
            </tr>
          ` : ''}
        </table>
      </div>
    `
    : ''

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f9fafb; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 32px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="width: 64px; height: 64px; background-color: ${data.primaryColor}15; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 32px;">✓</span>
            </div>
            <h1 style="color: ${data.primaryColor}; margin: 0 0 8px 0; font-size: 28px;">
              Thank You for Your Order!
            </h1>
            <p style="color: #6b7280; margin: 0; font-size: 16px;">
              Order ${data.orderName}
            </p>
          </div>
          
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 14px; color: #166534;">
              Hi ${data.customerName}, we've received your order and it's being processed. 
              You'll receive updates as your order makes its way to you.
            </p>
          </div>

          ${lineItemsHtml}
          
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #374151;">Track Your Order</h3>
            <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280;">
              Click the button below to track your order in real-time. You'll see updates as your package moves through each stage of delivery.
            </p>
            <a href="${data.trackingUrl}" 
               style="display: inline-block; background-color: ${data.primaryColor}; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 14px;">
              Track Your Order
            </a>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
            <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #374151;">What's Next?</h4>
            <ul style="margin: 0; padding: 0 0 0 20px; color: #6b7280; font-size: 14px;">
              <li style="margin-bottom: 8px;">We'll send you an email when your order ships</li>
              <li style="margin-bottom: 8px;">You'll receive updates when it's out for delivery</li>
              <li>A final confirmation when it's delivered</li>
            </ul>
          </div>
          
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
              Questions about your order? Reply to this email and we'll help you out.
            </p>
          </div>
        </div>
      </body>
    </html>
  `
}

export async function sendOrderConfirmationWithTracking(payload: OrderConfirmationPayload) {
  const primaryColor = payload.primaryColor || '#8217ff'
  const baseUrl = payload.baseUrl || process.env.NEXT_PUBLIC_APP_URL || ''
  const trackingUrl = `${baseUrl}/track/${payload.trackingToken}`

  // Try to use the database template first
  const templateResult = await renderTemplate('order_confirmation', {
    orderName: payload.orderName,
    customerName: payload.customerName || 'Customer',
    trackingUrl,
  })

  // If template service returned content, use it
  if (templateResult.subject && templateResult.html) {
    return sendEmail({
      to: payload.customerEmail,
      subject: templateResult.subject,
      html: templateResult.html,
    })
  }

  // Fallback to the original code-based template
  const html = generateOrderConfirmationEmailHtml({
    orderName: payload.orderName,
    customerName: payload.customerName || 'Customer',
    trackingUrl,
    lineItems: payload.lineItems,
    totalPrice: payload.totalPrice,
    currency: payload.currency,
    primaryColor,
  })

  return sendEmail({
    to: payload.customerEmail,
    subject: `Order Confirmed - ${payload.orderName}`,
    html,
  })
}
