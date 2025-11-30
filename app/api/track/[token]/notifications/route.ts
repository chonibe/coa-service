import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/track/[token]/notifications
 * Get notification preferences for a tracking link
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Tracking token is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const { data: preferences, error } = await supabase
      .from('tracking_link_notification_preferences')
      .select('*')
      .eq('token', token)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching notification preferences:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      emailEnabled: preferences?.email_enabled || false,
      notificationEmail: preferences?.notification_email || '',
    })
  } catch (error: any) {
    console.error('Error in GET /api/track/[token]/notifications:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch notification preferences',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/track/[token]/notifications
 * Save or update notification preferences for a tracking link
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    const body = await request.json()
    const { emailEnabled, notificationEmail } = body

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Tracking token is required' },
        { status: 400 }
      )
    }

    // Validate email if notifications are enabled
    if (emailEnabled && (!notificationEmail || !notificationEmail.includes('@'))) {
      return NextResponse.json(
        { success: false, message: 'Valid email address is required when notifications are enabled' },
        { status: 400 }
      )
    }

    // Verify the tracking link exists
    const supabase = createClient()
    const { data: trackingLink, error: linkError } = await supabase
      .from('shared_order_tracking_links')
      .select('token')
      .eq('token', token)
      .single()

    if (linkError || !trackingLink) {
      return NextResponse.json(
        { success: false, message: 'Invalid tracking token' },
        { status: 404 }
      )
    }

    // Upsert notification preferences
    const { data: preferences, error } = await supabase
      .from('tracking_link_notification_preferences')
      .upsert({
        token,
        email_enabled: emailEnabled || false,
        notification_email: emailEnabled ? notificationEmail : null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'token',
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving notification preferences:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to save preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      emailEnabled: preferences.email_enabled,
      notificationEmail: preferences.notification_email,
    })
  } catch (error: any) {
    console.error('Error in POST /api/track/[token]/notifications:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to save notification preferences',
      },
      { status: 500 }
    )
  }
}



