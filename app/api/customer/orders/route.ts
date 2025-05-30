import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const accountNumber = searchParams.get('accountnumber')
    const shopifyCustomerId = searchParams.get('shopify_customer_id')

    // If no account number or Shopify customer ID is provided, return a prompt for account number
    if (!accountNumber && !shopifyCustomerId) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Please provide an account number',
          requiresInput: true,
          inputType: 'accountnumber',
          prompt: 'Please enter your account number to view your orders'
        },
        { status: 400 }
      )
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

    // If no orders found, return a message
    if (!orders || orders.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'No orders found for this account number',
          accountNumber
        },
        { status: 404 }
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
      orders: ordersWithLineItems,
      accountNumber
    })
  } catch (error) {
    console.error('Error in orders API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 