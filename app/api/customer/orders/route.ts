import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const accountNumber = searchParams.get('accountnumber')
    const shopifyCustomerId = searchParams.get('shopify_customer_id')

    // If no account number or Shopify customer ID is provided, try to get the authenticated user
    if (!accountNumber && !shopifyCustomerId) {
      const supabase = createRouteHandlerClient({ cookies })
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized - No account number or customer ID provided' },
          { status: 401 }
        )
      }

      // Fetch orders for the authenticated user
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
    }

    // If account number is provided, use it to fetch orders
    const supabase = createRouteHandlerClient({ cookies })
    
    // First, get all orders for this account number
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, name, created_at')
      .eq('account_number', accountNumber)
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    // Then, get all line items for these orders
    const orderIds = orders?.map(order => order.id) || []
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('order_line_items_v2')
      .select(`
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
      `)
      .in('order_id', orderIds)
      .order('created_at', { ascending: false })

    if (lineItemsError) {
      console.error('Error fetching line items:', lineItemsError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch order details' },
        { status: 500 }
      )
    }

    // Combine orders with their line items
    const ordersWithLineItems = orders?.map(order => ({
      ...order,
      line_items: lineItems?.filter(item => item.order_id === order.id) || []
    })) || []

    return NextResponse.json({
      success: true,
      orders: ordersWithLineItems
    })
  } catch (error) {
    console.error('Error in orders API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 