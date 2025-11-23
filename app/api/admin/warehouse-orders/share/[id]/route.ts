import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/admin-session'

/**
 * PATCH /api/admin/warehouse-orders/share/[id]
 * Update a shareable tracking link (Admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
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

    // Handle both sync and async params (Next.js 15 compatibility)
    const resolvedParams = params instanceof Promise ? await params : params
    const linkId = resolvedParams.id

    if (!linkId) {
      return NextResponse.json(
        { success: false, message: 'Link ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { title, logoUrl, primaryColor, expiresInDays, orderIds } = body

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

    const supabase = createClient()
    
    // First, verify the link exists and belongs to this admin
    const { data: existingLink, error: fetchError } = await supabase
      .from('shared_order_tracking_links')
      .select('id, created_by')
      .eq('id', linkId)
      .single()

    if (fetchError || !existingLink) {
      return NextResponse.json(
        { success: false, message: 'Tracking link not found' },
        { status: 404 }
      )
    }

    // Verify the link belongs to this admin
    if (existingLink.created_by !== adminSession.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized to update this link' },
        { status: 403 }
      )
    }

    // Build update object
    const updateData: any = {}
    if (title !== undefined) updateData.title = title || null
    if (logoUrl !== undefined) updateData.logo_url = logoUrl || null
    if (primaryColor !== undefined) updateData.primary_color = primaryColor || '#8217ff'
    
    // Handle order IDs update
    if (orderIds !== undefined) {
      if (!Array.isArray(orderIds)) {
        return NextResponse.json(
          {
            success: false,
            message: 'orderIds must be an array',
          },
          { status: 400 }
        )
      }
      if (orderIds.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'At least one order ID is required',
          },
          { status: 400 }
        )
      }
      updateData.order_ids = orderIds
    }
    
    // Handle expiration update
    if (expiresInDays !== undefined) {
      if (expiresInDays && typeof expiresInDays === 'number' && expiresInDays > 0) {
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + expiresInDays)
        updateData.expires_at = expiresAt.toISOString()
      } else {
        updateData.expires_at = null
      }
    }

    // Update the link
    const { data: updatedLink, error: updateError } = await supabase
      .from('shared_order_tracking_links')
      .update(updateData)
      .eq('id', linkId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating tracking link:', updateError)
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to update tracking link',
          error: updateError.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      link: {
        id: updatedLink.id,
        token: updatedLink.token,
        title: updatedLink.title,
        logoUrl: updatedLink.logo_url,
        primaryColor: updatedLink.primary_color,
        expiresAt: updatedLink.expires_at,
        orderIds: updatedLink.order_ids,
        orderCount: updatedLink.order_ids?.length || 0,
      },
    })
  } catch (error: any) {
    console.error('Error updating shareable link:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to update shareable link',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/warehouse-orders/share/[id]
 * Delete a shareable tracking link (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
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

    // Handle both sync and async params (Next.js 15 compatibility)
    const resolvedParams = params instanceof Promise ? await params : params
    const linkId = resolvedParams.id

    if (!linkId) {
      return NextResponse.json(
        { success: false, message: 'Link ID is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    
    // First, verify the link exists and belongs to this admin
    const { data: existingLink, error: fetchError } = await supabase
      .from('shared_order_tracking_links')
      .select('id, created_by')
      .eq('id', linkId)
      .single()

    if (fetchError || !existingLink) {
      return NextResponse.json(
        { success: false, message: 'Tracking link not found' },
        { status: 404 }
      )
    }

    // Verify the link belongs to this admin
    if (existingLink.created_by !== adminSession.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized to delete this link' },
        { status: 403 }
      )
    }

    // Delete the link
    const { error: deleteError } = await supabase
      .from('shared_order_tracking_links')
      .delete()
      .eq('id', linkId)

    if (deleteError) {
      console.error('Error deleting tracking link:', deleteError)
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to delete tracking link',
          error: deleteError.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Tracking link deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting shareable link:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to delete shareable link',
      },
      { status: 500 }
    )
  }
}

