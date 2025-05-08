import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { supabaseEnv } from '@/lib/supabase-env'

export async function GET() {
  try {
    // Test regular client
    const { data: publicData, error: publicError } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (publicError) throw publicError

    // Test admin client
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1)

    if (adminError) throw adminError

    return NextResponse.json({
      status: 'success',
      message: 'Successfully connected to Supabase',
      publicClient: publicData,
      adminClient: adminData,
      env: {
        hasSupabaseUrl: !!supabaseEnv.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!supabaseEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceRoleKey: !!supabaseEnv.SUPABASE_SERVICE_ROLE_KEY,
      }
    })
  } catch (error) {
    console.error('Supabase connection test failed:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to connect to Supabase',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 