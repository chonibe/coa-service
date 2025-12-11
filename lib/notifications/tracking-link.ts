import { sendEmail } from '@/lib/email/client'

export interface TrackingEmailOrder {
  orderId: string
  sysOrderId?: string
  recipientName: string
  status?: number
  statusName?: string
  trackStatus?: number
  trackStatusName?: string
  trackingNumber?: string
  shipCountry?: string
}

export interface TrackingEmailPayload {
  token: string
  title: string
  orders: TrackingEmailOrder[]
  primaryColor?: string
  email: string
  baseUrl?: string
}

export function generateTrackingUpdateEmailHtml(data: {
  title: string
  orders: TrackingEmailOrder[]
  primaryColor: string
  trackingUrl: string
}): string {
  const getStatusLabel = (status?: number, statusName?: string) => {
    if (statusName) return statusName
    const statusMap: Record<number, string> = {
      0: 'Approving',
      3: 'Shipped',
      11: 'Uploaded',
      23: 'Canceled',
    }
    return statusMap[status || 0] || `Status ${status}`
  }

  const getTrackStatusLabel = (trackStatus?: number, trackStatusName?: string) => {
    if (trackStatusName) return trackStatusName
    const trackStatusMap: Record<number, string> = {
      0: 'To be updated',
      101: 'In Transit',
      111: 'Pick Up',
      112: 'Out For Delivery',
      121: 'Delivered',
      131: 'Alert',
      132: 'Expired',
    }
    return trackStatusMap[trackStatus || 0] || `Track ${trackStatus}`
  }

  const ordersHtml = data.orders
    .map(
      (order) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 16px; vertical-align: top;">
        <div style="font-weight: 600; color: ${data.primaryColor}; margin-bottom: 4px;">
          ${order.recipientName}
        </div>
        <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">
          Order ${order.orderId}
        </div>
        <div style="margin-bottom: 8px;">
          <span style="display: inline-block; background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-right: 8px;">
            ${getStatusLabel(order.status, order.statusName)}
          </span>
          ${
            order.trackStatus !== undefined
              ? `
            <span style="display: inline-block; background: #dbeafe; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
              ${getTrackStatusLabel(order.trackStatus, order.trackStatusName)}
            </span>
          `
              : ''
          }
        </div>
        ${
          order.trackingNumber
            ? `
          <div style="font-size: 12px; color: #6b7280; font-family: monospace;">
            Tracking: ${order.trackingNumber}
          </div>
        `
            : ''
        }
      </td>
    </tr>
  `,
    )
    .join('')

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Tracking Update</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f9fafb; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 32px;">
          <div style="margin-bottom: 24px;">
            <h1 style="color: ${data.primaryColor}; margin: 0 0 8px 0; font-size: 24px;">
              ${data.title}
            </h1>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              Order Status Update
            </p>
          </div>
          
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0 0 16px 0; font-size: 14px; color: #374151;">
              ${data.orders.length === 1 ? 'Your order status has been updated:' : `${data.orders.length} of your orders have been updated:`}
            </p>
            
            <table style="width: 100%; border-collapse: collapse;">
              ${ordersHtml}
            </table>
          </div>
          
          <div style="text-align: center; margin-top: 32px;">
            <a href="${data.trackingUrl}" 
               style="display: inline-block; background-color: ${data.primaryColor}; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
              View All Orders
            </a>
          </div>
          
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
              You're receiving this email because you enabled email notifications for order tracking updates.
            </p>
          </div>
        </div>
      </body>
    </html>
  `
}

export async function sendTrackingUpdateEmail(payload: TrackingEmailPayload) {
  const primaryColor = payload.primaryColor || '#8217ff'
  const baseUrl = payload.baseUrl || process.env.NEXT_PUBLIC_APP_URL || ''
  const trackingUrl = `${baseUrl}/track/${payload.token}`

  const html = generateTrackingUpdateEmailHtml({
    title: payload.title || 'Order Tracking',
    orders: payload.orders,
    primaryColor,
    trackingUrl,
  })

  return sendEmail({
    to: payload.email,
    subject: `${payload.orders.length === 1 ? 'Order' : `${payload.orders.length} Orders`} Status Update - ${payload.title || 'Tracking'}`,
    html,
  })
}

