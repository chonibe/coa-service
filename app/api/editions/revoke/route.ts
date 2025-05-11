import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { lineItemId } = await request.json()

    if (!lineItemId) {
      return NextResponse.json(
        { error: 'Line item ID is required' },
        { status: 400 }
      )
    }

    // Call the function to revoke and reassign editions
    const { error } = await supabase.rpc('revoke_and_reassign_editions', {
      p_line_item_id: lineItemId
    })

    if (error) {
      console.error('Error revoking edition:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in revoke edition endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to revoke edition' },
      { status: 500 }
    )
  }
} 