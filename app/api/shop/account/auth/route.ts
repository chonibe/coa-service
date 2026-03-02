import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createRouteClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@/lib/supabase/server'

/**
 * Shop Account Auth API
 *
 * Checks if the current user is authenticated and returns their profile.
 */

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteClient(cookieStore)
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const serviceClient = createServiceClient()
    const { data: profile } = await serviceClient
      .from('collector_profiles')
      .select('id, email, first_name, last_name, phone')
      .eq('email', session.user.email)
      .maybeSingle()

    return NextResponse.json({
      authenticated: true,
      customer: {
        email: session.user.email,
        firstName: profile?.first_name || session.user.user_metadata?.first_name || '',
        lastName: profile?.last_name || session.user.user_metadata?.last_name || '',
        phone: profile?.phone || session.user.user_metadata?.phone || '',
      },
    })
  } catch (error: any) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'Authentication check failed' },
      { status: 500 }
    )
  }
}
