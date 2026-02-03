import { sendEmail } from '@/lib/email/client'
import { renderTemplate, SHIPPING_STAGE_TO_TEMPLATE } from '@/lib/email/template-service'

// Shipping stage constants
export const TRACK_STATUS_STAGES = {
  TO_BE_UPDATED: 0,
  IN_TRANSIT: 101,
  PICK_UP: 111,
  OUT_FOR_DELIVERY: 112,
  DELIVERED: 121,
  ALERT: 131,
  EXPIRED: 132,
} as const

export const WAREHOUSE_STATUS = {
  APPROVING: 0,
  SHIPPED: 3,
  UPLOADED: 11,
  CANCELED: 23,
} as const

// Stage-specific messaging configuration
export const STAGE_MESSAGES: Record<number, { 
  emoji: string
  headline: string 
  subject: string 
  description: string 
  badgeColor: string 
}> = {
  // Warehouse status 3 = Shipped
  3: {
    emoji: '📦',
    headline: 'Your Order Has Shipped!',
    subject: 'Your order has shipped',
    description: 'Great news! Your order is on its way.',
    badgeColor: '#3b82f6',
  },
  // Track status 101 = In Transit
  101: {
    emoji: '🚚',
    headline: 'Your Package Is In Transit',
    subject: 'Your package is in transit',
    description: 'Your package is moving through our delivery network.',
    badgeColor: '#8b5cf6',
  },
  // Track status 111 = Pick Up
  111: {
    emoji: '📬',
    headline: 'Package Picked Up',
    subject: 'Your package has been picked up',
    description: 'Your package has been picked up by the carrier.',
    badgeColor: '#06b6d4',
  },
  // Track status 112 = Out for Delivery
  112: {
    emoji: '🏃',
    headline: 'Out for Delivery Today!',
    subject: 'Out for delivery today',
    description: 'Exciting news! Your package is out for delivery and should arrive today.',
    badgeColor: '#f59e0b',
  },
  // Track status 121 = Delivered
  121: {
    emoji: '✅',
    headline: 'Your Package Has Been Delivered!',
    subject: 'Your package has been delivered',
    description: 'Your package has arrived! We hope you love it.',
    badgeColor: '#22c55e',
  },
  // Track status 131 = Alert
  131: {
    emoji: '⚠️',
    headline: 'Delivery Alert - Action May Be Required',
    subject: 'Delivery alert - action may be required',
    description: 'There\'s an update about your delivery that may require your attention.',
    badgeColor: '#ef4444',
  },
  // Track status 132 = Expired
  132: {
    emoji: '⏰',
    headline: 'Tracking Update',
    subject: 'Tracking update for your order',
    description: 'There\'s an update about your package tracking.',
    badgeColor: '#6b7280',
  },
}

// Get the primary stage to use for messaging (prioritize track_status over warehouse status)
export function getStageForNotification(trackStatus?: number, warehouseStatus?: number): number | null {
  // Prioritize meaningful track statuses
  if (trackStatus && STAGE_MESSAGES[trackStatus]) {
    return trackStatus
  }
  // Fall back to warehouse shipped status
  if (warehouseStatus === WAREHOUSE_STATUS.SHIPPED) {
    return WAREHOUSE_STATUS.SHIPPED
  }
  return null
}

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
  /** Optional: specify a stage to use stage-specific messaging */
  stage?: number
}

export function getStatusLabel(status?: number, statusName?: string): string {
  if (statusName) return statusName
  const statusMap: Record<number, string> = {
    0: 'Approving',
    3: 'Shipped',
    11: 'Uploaded',
    23: 'Canceled',
  }
  return statusMap[status || 0] || `Status ${status}`
}

export function getTrackStatusLabel(trackStatus?: number, trackStatusName?: string): string {
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

export function generateTrackingUpdateEmailHtml(data: {
  title: string
  orders: TrackingEmailOrder[]
  primaryColor: string
  trackingUrl: string
  /** Optional: stage code for stage-specific messaging */
  stage?: number
}): string {
  // Get stage-specific messaging if a stage is provided
  const stageMessage = data.stage ? STAGE_MESSAGES[data.stage] : null

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
            <span style="display: inline-block; background: ${stageMessage ? stageMessage.badgeColor + '20' : '#dbeafe'}; color: ${stageMessage ? stageMessage.badgeColor : '#1e40af'}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">
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

  // Use stage-specific headline if available
  const headline = stageMessage ? stageMessage.headline : data.title
  const description = stageMessage 
    ? stageMessage.description 
    : (data.orders.length === 1 ? 'Your order status has been updated:' : `${data.orders.length} of your orders have been updated:`)

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
          <div style="text-align: center; margin-bottom: 24px;">
            ${stageMessage ? `
              <div style="font-size: 48px; margin-bottom: 16px;">${stageMessage.emoji}</div>
            ` : ''}
            <h1 style="color: ${data.primaryColor}; margin: 0 0 8px 0; font-size: 24px;">
              ${headline}
            </h1>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              ${data.title}
            </p>
          </div>
          
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0 0 16px 0; font-size: 14px; color: #374151;">
              ${description}
            </p>
            
            <table style="width: 100%; border-collapse: collapse;">
              ${ordersHtml}
            </table>
          </div>
          
          <div style="text-align: center; margin-top: 32px;">
            <a href="${data.trackingUrl}" 
               style="display: inline-block; background-color: ${data.primaryColor}; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
              Track Your Order
            </a>
          </div>
          
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
              You're receiving this email because you have order tracking notifications enabled.
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

  // Determine the stage for messaging
  const stage = payload.stage ?? (payload.orders.length === 1 
    ? getStageForNotification(payload.orders[0].trackStatus, payload.orders[0].status) 
    : null)

  // Try to use the database template based on the shipping stage
  if (stage && SHIPPING_STAGE_TO_TEMPLATE[stage]) {
    const templateKey = SHIPPING_STAGE_TO_TEMPLATE[stage]
    const order = payload.orders[0] // For single order emails
    
    const templateResult = await renderTemplate(templateKey, {
      orderName: order?.orderId || payload.title || 'Order',
      recipientName: order?.recipientName || 'Customer',
      trackingNumber: order?.trackingNumber || '',
      trackingUrl,
    })

    // If template service returned content, use it
    if (templateResult.subject && templateResult.html) {
      return sendEmail({
        to: payload.email,
        subject: templateResult.subject,
        html: templateResult.html,
      })
    }
  }

  // Fallback to the original code-based template
  const html = generateTrackingUpdateEmailHtml({
    title: payload.title || 'Order Tracking',
    orders: payload.orders,
    primaryColor,
    trackingUrl,
    stage: stage ?? undefined,
  })

  // Use stage-specific subject if available
  const stageMessage = stage ? STAGE_MESSAGES[stage] : null
  const subject = stageMessage 
    ? `${stageMessage.subject} - ${payload.title || 'Order Update'}`
    : `${payload.orders.length === 1 ? 'Order' : `${payload.orders.length} Orders`} Status Update - ${payload.title || 'Tracking'}`

  return sendEmail({
    to: payload.email,
    subject,
    html,
  })
}

