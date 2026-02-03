import { NextRequest, NextResponse } from 'next/server'
import { checkForPolarisUpdates, getPendingUpdates } from '@/lib/polaris-update-checker'
import { createClient } from '@/lib/supabase/server'
import { getAdminEmailFromCookieStore } from '@/lib/admin-session'

/**
 * GET /api/polaris-updates
 * Check for available Polaris updates
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access using admin session cookie
    const adminEmail = getAdminEmailFromCookieStore(request.cookies)
    if (!adminEmail) {
      return NextResponse.json({ error: 'Unauthorized - Admin login required' }, { status: 401 })
    }

    const supabase = createClient()

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
