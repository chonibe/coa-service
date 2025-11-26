import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/admin-session'
import { randomBytes } from 'crypto'

/**
 * POST /api/admin/warehouse-orders/share
 * Create a shareable tracking link for selected warehouse orders
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminSessionToken = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value
    const adminSession = verifyAdminSessionToken(adminSessionToken)
    
    if (!adminSession?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { orderIds, title, expiresInDays, logoUrl, primaryColor } = body

    // Validate input
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'orderIds array is required and must not be empty',
        },
        { status: 400 }
      )
    }

    // Generate a secure random token
    const token = randomBytes(32).toString('hex')

    // Calculate expiration date if provided
    let expiresAt: Date | null = null
    if (expiresInDays && typeof expiresInDays === 'number' && expiresInDays > 0) {
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expiresInDays)
    }

    // Validate color format if provided
    if (primaryColor && !/^#[0-9A-Fa-f]{6}$/.test(primaryColor)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid color format. Use hex format (e.g., #8217ff)',
        },
        { status: 400 }
      )
    }

    // Save to database
    const supabase = createClient()
    const { data, error } = await supabase
      .from('shared_order_tracking_links')
      .insert({
        token,
        order_ids: orderIds,
        title: title || null,
        created_by: adminSession.email,
        expires_at: expiresAt ? expiresAt.toISOString() : null,
        logo_url: logoUrl || null,
        primary_color: primaryColor || '#8217ff', // Default purple
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating tracking link:', error)
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to create tracking link',
          error: error.message,
        },
        { status: 500 }
      )
    }

    // Generate the shareable URL using custom domain
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!baseUrl) {
      console.error('NEXT_PUBLIC_APP_URL is not set. Please configure your custom domain in environment variables.')
      return NextResponse.json(
        {
          success: false,
          message: 'Application URL not configured. Please set NEXT_PUBLIC_APP_URL environment variable.',
        },
        { status: 500 }
      )
    }
    const trackingUrl = `${baseUrl}/track/${token}`

    return NextResponse.json({
      success: true,
      link: {
        id: data.id,
        token: data.token,
        url: trackingUrl,
        title: data.title,
        orderCount: orderIds.length,
        expiresAt: data.expires_at,
        createdAt: data.created_at,
      },
    })
  } catch (error: any) {
    console.error('Error creating shareable link:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to create shareable link',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/warehouse-orders/share
 * List all shared tracking links created by the admin
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminSessionToken = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value
    const adminSession = verifyAdminSessionToken(adminSessionToken)
    
    if (!adminSession?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from('shared_order_tracking_links')
      .select('*')
      .eq('created_by', adminSession.email)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tracking links:', error)
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to fetch tracking links',
        },
        { status: 500 }
      )
    }

    // Use custom domain for all links
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!baseUrl) {
      console.error('NEXT_PUBLIC_APP_URL is not set. Please configure your custom domain in environment variables.')
      return NextResponse.json(
        {
          success: false,
          message: 'Application URL not configured. Please set NEXT_PUBLIC_APP_URL environment variable.',
        },
        { status: 500 }
      )
    }
    const links = (data || []).map((link) => ({
      id: link.id,
      token: link.token,
      url: `${baseUrl}/track/${link.token}`,
      title: link.title,
      orderCount: link.order_ids?.length || 0,
      accessCount: link.access_count || 0,
      lastAccessedAt: link.last_accessed_at,
      expiresAt: link.expires_at,
      createdAt: link.created_at,
      logoUrl: link.logo_url,
      primaryColor: link.primary_color,
      orderIds: link.order_ids || [],
    }))

    return NextResponse.json({
      success: true,
      links,
    })
  } catch (error: any) {
    console.error('Error fetching tracking links:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch tracking links',
      },
      { status: 500 }
    )
  }
}

