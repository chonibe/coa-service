import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch orders for the current user
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        name,
        created_at,
        line_items:order_line_items_v2 (
          id,
          order_id,
          name,
          description,
          price,
          quantity,
          vendor_name,
          status,
          created_at,
          img_url,
          edition_number,
          edition_total,
          nfc_tag_id,
          nfc_claimed_at
        )
      `)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      orders: orders || []
    })
  } catch (error) {
    console.error('Error in orders API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 