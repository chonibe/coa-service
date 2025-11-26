import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/client'

/**
 * POST /api/track/[token]/notifications/send
 * Send email notifications for tracking status updates
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    const body = await request.json()
    const { email, orders } = body

    if (!token || !email || !orders || !Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid request parameters' },
        { status: 400 }
      )
    }

    // Verify the tracking link exists and get preferences
    const supabase = createClient()
    const { data: trackingLink, error: linkError } = await supabase
      .from('shared_order_tracking_links')
      .select('title, logo_url, primary_color')
      .eq('token', token)
      .single()

    if (linkError || !trackingLink) {
      return NextResponse.json(
        { success: false, message: 'Invalid tracking token' },
        { status: 404 }
      )
    }

    const { data: preferences } = await supabase
      .from('tracking_link_notification_preferences')
      .select('email_enabled, notification_email')
      .eq('token', token)
      .single()

    // Verify email matches and notifications are enabled
    if (!preferences?.email_enabled || preferences.notification_email !== email) {
      return NextResponse.json(
        { success: false, message: 'Email notifications not enabled for this address' },
        { status: 403 }
      )
    }

    // Generate email HTML
    const emailHtml = generateTrackingUpdateEmailHtml({
      title: trackingLink.title || 'Order Tracking',
      orders,
      primaryColor: trackingLink.primary_color || '#8217ff',
      trackingUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/track/${token}`,
    })

    // Check if email service is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('Email service not configured. Skipping email notification.')
      return NextResponse.json(
        { 
          success: false, 
          message: 'Email service is not configured. Please set RESEND_API_KEY environment variable.',
          errorCode: 'EMAIL_SERVICE_NOT_CONFIGURED'
        },
        { status: 503 } // Service Unavailable
      )
    }

    // Send email
    const emailResult = await sendEmail({
      to: email,
      subject: `${orders.length === 1 ? 'Order' : `${orders.length} Orders`} Status Update - ${trackingLink.title || 'Tracking'}`,
      html: emailHtml,
    })

    if (!emailResult.success) {
      console.error('Failed to send tracking update email:', emailResult.error)
      return NextResponse.json(
        { 
          success: false, 
          message: emailResult.error || 'Failed to send email',
          errorCode: emailResult.error === 'Email service not configured' ? 'EMAIL_SERVICE_NOT_CONFIGURED' : 'EMAIL_SEND_FAILED'
        },
        { status: 500 }
      )
    }

    // Update last notified statuses
    const lastNotifiedStatus: Record<string, { status?: number; track_status?: number }> = {}
    orders.forEach((order: any) => {
      const orderKey = order.sysOrderId || order.orderId || ''
      if (orderKey) {
        lastNotifiedStatus[orderKey] = {
          status: order.status,
          track_status: order.trackStatus,
        }
      }
    })

    await supabase
      .from('tracking_link_notification_preferences')
      .update({
        last_notified_status: lastNotifiedStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('token', token)

    return NextResponse.json({
      success: true,
      messageId: emailResult.messageId,
    })
  } catch (error: any) {
    console.error('Error in POST /api/track/[token]/notifications/send:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to send notification email',
      },
      { status: 500 }
    )
  }
}

/**
 * Generate HTML email template for tracking updates
 */
function generateTrackingUpdateEmailHtml(data: {
  title: string
  orders: Array<{
    orderId: string
    sysOrderId?: string
    recipientName: string
    status?: number
    statusName?: string
    trackStatus?: number
    trackStatusName?: string
    trackingNumber?: string
    shipCountry?: string
  }>
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

  const ordersHtml = data.orders.map(order => `
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
          ${order.trackStatus !== undefined ? `
            <span style="display: inline-block; background: #dbeafe; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
              ${getTrackStatusLabel(order.trackStatus, order.trackStatusName)}
            </span>
          ` : ''}
        </div>
        ${order.trackingNumber ? `
          <div style="font-size: 12px; color: #6b7280; font-family: monospace;">
            Tracking: ${order.trackingNumber}
          </div>
        ` : ''}
      </td>
    </tr>
  `).join('')

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
              ${data.orders.length === 1 
                ? 'Your order status has been updated:' 
                : `${data.orders.length} of your orders have been updated:`}
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

