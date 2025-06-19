import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { serialNumber, itemId } = await request.json()

    if (!serialNumber || !itemId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Start a transaction to ensure data consistency
    const { data: client } = await supabase.auth.getSession()
    const { error: transactionError } = await supabase.rpc('pair_nfc_tag', {
      p_serial_number: serialNumber,
      p_item_id: itemId,
      p_user_id: client?.session?.user?.id
    })

    if (transactionError) {
      console.error('Error in pairing transaction:', transactionError)
      return NextResponse.json(
        { error: transactionError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error in pair endpoint:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 