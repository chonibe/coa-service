import { NextRequest, NextResponse } from 'next/server'
import { checkForPolarisUpdates, getPendingUpdates } from '@/lib/polaris-update-checker'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/polaris-updates
 * Check for available Polaris updates
 */
export async function GET(request: NextRequest) {
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
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Check for updates
    const updates = await checkForPolarisUpdates()
    const pending = await getPendingUpdates()
    
    return NextResponse.json({
      success: true,
      updates: pending,
      newUpdatesFound: updates.length,
    })
  } catch (error) {
    console.error('Error checking Polaris updates:', error)
    return NextResponse.json(
      { error: 'Failed to check for updates' },
      { status: 500 }
    )
  }
}
