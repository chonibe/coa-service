import { NextRequest, NextResponse } from 'next/server'
import { rejectPolarisUpdate } from '@/lib/polaris-update-checker'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/polaris-updates/reject
 * Reject a Polaris update
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verify admin role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (userRole?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { updateId, reason } = body

    if (!updateId || !reason) {
      return NextResponse.json(
        { error: 'Update ID and reason required' },
        { status: 400 }
      )
    }

    // Reject in database
    const result = await rejectPolarisUpdate(updateId, user.id, reason)
    
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    })
  } catch (error) {
    console.error('Error rejecting update:', error)
    return NextResponse.json(
      { error: 'Failed to reject update' },
      { status: 500 }
    )
  }
}
