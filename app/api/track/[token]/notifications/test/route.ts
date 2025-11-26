import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/client'

/**
 * POST /api/track/[token]/notifications/test
 * Send a test email notification
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = await params
    const body = await request.json()
    const { email, label, orderIds } = body

    if (!token || !email) {
      return NextResponse.json(
        { success: false, message: 'Token and email are required' },
        { status: 400 }
      )
    }

    // Verify the tracking link exists and get preferences
    const supabase = createClient()
    const { data: trackingLink, error: linkError } = await supabase
      .from('shared_order_tracking_links')
      .select('title, logo_url, primary_color, order_ids')
      .eq('token', token)
      .single()

    if (linkError || !trackingLink) {
      return NextResponse.json(
        { success: false, message: 'Invalid tracking token' },
        { status: 404 }
      )
    }

    // Check if preferences exist, but allow test even if not saved yet
    const { data: preferences } = await supabase
      .from('tracking_link_notification_preferences')
      .select('email_enabled, notification_email')
      .eq('token', token)
      .single()

    // If preferences exist, verify they match
    if (preferences) {
      if (!preferences.email_enabled || preferences.notification_email !== email) {
        return NextResponse.json(
          { success: false, message: 'Email notifications not enabled for this address. Please save your settings first.' },
          { status: 403 }
        )
      }
    }
    // If no preferences exist yet, allow test with provided email (user is setting up)

    // Fetch orders for the tracking link
    let orders: any[] = []
    if (label && orderIds && Array.isArray(orderIds) && orderIds.length > 0) {
      // If label and orderIds are provided, fetch only those specific orders
      const { createChinaDivisionClient } = await import('@/lib/chinadivision/client')
      const client = createChinaDivisionClient()
      
      // Verify these order IDs are in the tracking link
      const linkOrderIds = new Set(trackingLink.order_ids || [])
      const validOrderIds = orderIds.filter(id => linkOrderIds.has(id))
      
      if (validOrderIds.length > 0) {
        // Fetch orders from ChinaDivision
        const endDate = new Date().toISOString().split('T')[0]
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 365)
        const startDateStr = startDate.toISOString().split('T')[0]
        
        const allOrders = await client.getOrdersInfo(startDateStr, endDate)
        
        // Filter to only the orders with the label (matching orderIds)
        const labelOrderIdsSet = new Set(validOrderIds)
        orders = allOrders.filter(order => {
          const orderId = order.sys_order_id || order.order_id || ''
          return labelOrderIdsSet.has(orderId)
        })
        
        // Sort by last update time (most recent first)
        // Use updated_at if available, otherwise use created_at or track_status update
        orders.sort((a, b) => {
          const timeA = a.updated_at ? new Date(a.updated_at).getTime() : 
                       (a.track_status && a.track_status > 0 ? Date.now() : 0)
          const timeB = b.updated_at ? new Date(b.updated_at).getTime() : 
                       (b.track_status && b.track_status > 0 ? Date.now() : 0)
          return timeB - timeA
        })
        
        // Limit to top 5 most recently updated orders for the test email
        orders = orders.slice(0, 5)
      }
    } else {
      // No label provided, use sample data
      orders = [
        {
          orderId: '#TEST-001',
          sysOrderId: 'TEST001',
          recipientName: 'Test Recipient',
          status: 3,
          statusName: 'Shipped',
          trackStatus: 112,
          trackStatusName: 'Out For Delivery',
          trackingNumber: 'TEST123456789',
          shipCountry: 'United States',
        },
      ]
    }

    // Format orders for email
    const formattedOrders = orders.map(order => ({
      orderId: order.order_id || order.sys_order_id || 'Unknown',
      sysOrderId: order.sys_order_id,
      recipientName: `${order.first_name || ''} ${order.last_name || ''}`.trim() || 'Unknown Recipient',
      status: order.status,
      statusName: order.status_name,
      trackStatus: order.track_status,
      trackStatusName: order.track_status_name,
      trackingNumber: order.tracking_number,
      shipCountry: order.ship_country || 'Unknown',
    }))

    // Generate test email HTML with real order data
    const emailHtml = generateTrackingUpdateEmailHtml({
      title: trackingLink.title || 'Order Tracking',
      orders: formattedOrders,
      primaryColor: trackingLink.primary_color || '#8217ff',
      trackingUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/track/${token}`,
      isTestEmail: true,
      labelName: label,
    })

    // Check if email service is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Email service is not configured. Please set RESEND_API_KEY environment variable.',
          errorCode: 'EMAIL_SERVICE_NOT_CONFIGURED'
        },
        { status: 503 } // Service Unavailable
      )
    }

    // Send test email
    console.log('[Test Email] Sending test email:', {
      token,
      email,
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    })

    const emailResult = await sendEmail({
      to: email,
      subject: label 
        ? `Test Email - ${label} Label - ${trackingLink.title || 'Order Tracking'} Notification`
        : `Test Email - ${trackingLink.title || 'Order Tracking'} Notification`,
      html: emailHtml,
    })

    if (!emailResult.success) {
      console.error('[Test Email] Failed to send:', {
        error: emailResult.error,
        errorDetails: (emailResult as any).errorDetails,
      })
      
      // Provide more helpful error messages
      let userMessage = emailResult.error || 'Failed to send test email'
      if (emailResult.error?.includes('domain') || emailResult.error?.includes('not verified')) {
        userMessage = 'Email domain not verified. Please verify your domain in Resend or use onboarding@resend.dev for testing.'
      } else if (emailResult.error?.includes('invalid') || emailResult.error?.includes('format')) {
        userMessage = 'Invalid email address or format. Please check the email address.'
      }

      return NextResponse.json(
        { 
          success: false, 
          message: userMessage,
          errorCode: emailResult.error === 'Email service not configured' ? 'EMAIL_SERVICE_NOT_CONFIGURED' : 'EMAIL_SEND_FAILED',
          errorDetails: process.env.NODE_ENV === 'development' ? (emailResult as any).errorDetails : undefined,
        },
        { status: 500 }
      )
    }

    console.log('[Test Email] Success:', {
      messageId: emailResult.messageId,
      email,
    })

    return NextResponse.json({
      success: true,
      messageId: emailResult.messageId,
      message: 'Test email sent successfully. Check your inbox (and spam folder).',
      note: 'If you don\'t see the email, check your spam folder and verify your domain in Resend.',
    })
  } catch (error: any) {
    console.error('Error in POST /api/track/[token]/notifications/test:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to send test email',
      },
      { status: 500 }
    )
  }
}

/**
 * Generate HTML email template for tracking updates (reused from send route)
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
              ${data.isTestEmail ? (data.labelName ? `Test Email - Label: ${data.labelName}` : 'Test Email - Order Status Update') : 'Order Status Update'}
            </p>
          </div>
          
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0 0 16px 0; font-size: 14px; color: #374151;">
              ${data.isTestEmail 
                ? (data.labelName 
                  ? `This is a test email for label "${data.labelName}". Showing the most recently updated orders:` 
                  : 'This is a test email. Your order status has been updated:')
                : data.orders.length === 1 
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
              ${data.isTestEmail 
                ? (data.labelName 
                  ? `This is a test email for label "${data.labelName}". You're receiving this because you enabled email notifications for this label.` 
                  : 'This is a test email. You\'re receiving this because you enabled email notifications for order tracking updates.')
                : 'You\'re receiving this email because you enabled email notifications for order tracking updates.'}
            </p>
          </div>
        </div>
      </body>
    </html>
  `
}

