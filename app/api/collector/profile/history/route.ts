import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/collector/profile/history
 * Get the change history for the current user's collector profile
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the user's profile first to ensure they have one
    const { data: profile, error: profileError } = await supabase
      .from('collector_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json(
        { success: false, message: 'Profile not found' },
        { status: 404 }
      )
    }

    // Get change history
    const { data: changes, error: changesError } = await supabase
      .from('collector_profile_changes')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })

    if (changesError) {
      console.error('Profile history fetch error:', changesError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch profile history' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      history: changes || []
    })
  } catch (error: any) {
    console.error('Profile history GET error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
