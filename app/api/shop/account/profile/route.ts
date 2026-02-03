import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Shop Account Profile API
 * 
 * Update customer profile information.
 */

export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { firstName, lastName, phone } = body

    // Update user metadata in Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        first_name: firstName,
        last_name: lastName,
        phone: phone,
      },
    })

    if (updateError) {
      console.error('Error updating user metadata:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    // Also update collectors table if exists
    const { data: collector } = await supabase
      .from('collectors')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (collector) {
      await supabase
        .from('collectors')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', collector.id)
    }

    return NextResponse.json({
      success: true,
      customer: {
        email: session.user.email,
        firstName,
        lastName,
        phone,
      },
    })
  } catch (error: any) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
