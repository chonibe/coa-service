import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Shop Account Auth API
 * 
 * Checks if the current user is authenticated and returns their profile.
 */

export async function GET() {
  try {
    const supabase = createClient()
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get customer profile from collectors table
    const { data: collector, error: collectorError } = await supabase
      .from('collectors')
      .select('id, email, first_name, last_name, phone')
      .eq('email', session.user.email)
      .single()

    if (collectorError && collectorError.code !== 'PGRST116') {
      console.error('Error fetching collector:', collectorError)
    }

    return NextResponse.json({
      authenticated: true,
      customer: {
        email: session.user.email,
        firstName: collector?.first_name || session.user.user_metadata?.first_name || '',
        lastName: collector?.last_name || session.user.user_metadata?.last_name || '',
        phone: collector?.phone || session.user.user_metadata?.phone || '',
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
