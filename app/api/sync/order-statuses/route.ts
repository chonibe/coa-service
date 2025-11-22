import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

/**
 * Sync order statuses from Shopify to ensure financial_status and fulfillment_status are up to date
 * This is especially important for cancelled orders that may have been cancelled in Shopify
 * but still show as active in the database
 */
export async function POST() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    const shop = process.env.SHOPIFY_SHOP
    const token = process.env.SHOPIFY_ACCESS_TOKEN
    
    if (!shop || !token) {
      return NextResponse.json({ error: 'Shopify credentials not set' }, { status: 500 })
    }

    console.log('[sync-order-statuses] Starting order status sync from Shopify...')

    // Fetch ALL orders from Shopify (including cancelled)
    // Use pagination to get all orders
    let allShopifyOrders: any[] = []
    let nextPageUrl: string | null = `https://${shop}/admin/api/2024-01/orders.json?status=any&limit=250`
    let pageCount = 0
    const maxPages = 100 // Safety limit

    while (nextPageUrl && pageCount < maxPages) {
      const response = await fetch(nextPageUrl, {
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.statusText}`)
      }

      const data = await response.json()
      const orders = data.orders || []
      allShopifyOrders = [...allShopifyOrders, ...orders]
      
      // Check for pagination
      const linkHeader = response.headers.get('link')
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const nextMatch = linkHeader.match(/<([^>]+)>; rel="next"/)
        nextPageUrl = nextMatch ? nextMatch[1] : null
      } else {
        nextPageUrl = null
      }
      
      pageCount++
      console.log(`[sync-order-statuses] Fetched page ${pageCount}: ${orders.length} orders (total: ${allShopifyOrders.length})`)
    }

    console.log(`[sync-order-statuses] Total orders fetched from Shopify: ${allShopifyOrders.length}`)

    // Get all existing orders from database
    const { data: existingOrders, error: fetchError } = await supabase
      .from('orders')
      .select('id, financial_status, fulfillment_status')

    if (fetchError) {
      console.error('[sync-order-statuses] Error fetching existing orders:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch existing orders' }, { status: 500 })
    }

    const existingOrdersMap = new Map(
      existingOrders?.map((order: any) => [order.id, order]) || []
    )

    console.log(`[sync-order-statuses] Found ${existingOrdersMap.size} existing orders in database`)

    // Update order statuses
    let updatedCount = 0
    let cancelledCount = 0
    let statusChangedCount = 0
    const errors: string[] = []

    for (const shopifyOrder of allShopifyOrders) {
      try {
        const orderId = shopifyOrder.id.toString()
        const existingOrder = existingOrdersMap.get(orderId)

        // Check if status has changed
        const financialStatusChanged = existingOrder && 
          existingOrder.financial_status !== shopifyOrder.financial_status
        const fulfillmentStatusChanged = existingOrder && 
          existingOrder.fulfillment_status !== (shopifyOrder.fulfillment_status || 'pending')

        if (financialStatusChanged || fulfillmentStatusChanged || !existingOrder) {
          // Update the order status
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              financial_status: shopifyOrder.financial_status,
              fulfillment_status: shopifyOrder.fulfillment_status || 'pending',
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId)

          if (updateError) {
            console.error(`[sync-order-statuses] Error updating order ${orderId}:`, updateError)
            errors.push(`Order ${orderId}: ${updateError.message}`)
            continue
          }

          updatedCount++

          if (shopifyOrder.financial_status === 'voided') {
            cancelledCount++
            console.log(`[sync-order-statuses] Updated order ${orderId} to cancelled (voided)`)
            
            // If order is cancelled, clear edition numbers from its line items
            const { error: clearEditionError } = await supabase
              .from('order_line_items_v2')
              .update({
                edition_number: null,
                edition_total: null,
                status: 'inactive',
                updated_at: new Date().toISOString(),
              })
              .eq('order_id', orderId)

            if (clearEditionError) {
              console.error(`[sync-order-statuses] Error clearing edition numbers for cancelled order ${orderId}:`, clearEditionError)
            } else {
              console.log(`[sync-order-statuses] Cleared edition numbers for cancelled order ${orderId}`)
            }
          }

          if (financialStatusChanged || fulfillmentStatusChanged) {
            statusChangedCount++
            console.log(`[sync-order-statuses] Order ${orderId} status changed: financial_status=${shopifyOrder.financial_status}, fulfillment_status=${shopifyOrder.fulfillment_status || 'pending'}`)
          }
        }
      } catch (error) {
        console.error(`[sync-order-statuses] Error processing order ${shopifyOrder.id}:`, error)
        errors.push(`Order ${shopifyOrder.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    console.log(`[sync-order-statuses] Sync complete:`)
    console.log(`  - Total orders processed: ${allShopifyOrders.length}`)
    console.log(`  - Orders updated: ${updatedCount}`)
    console.log(`  - Orders marked as cancelled: ${cancelledCount}`)
    console.log(`  - Orders with status changes: ${statusChangedCount}`)
    console.log(`  - Errors: ${errors.length}`)

    return NextResponse.json({
      success: true,
      message: `Synced order statuses: ${updatedCount} orders updated, ${cancelledCount} cancelled orders found`,
      stats: {
        totalOrders: allShopifyOrders.length,
        updatedCount,
        cancelledCount,
        statusChangedCount,
        errors: errors.length,
        errorDetails: errors.slice(0, 10) // First 10 errors
      }
    })

  } catch (error) {
    console.error('[sync-order-statuses] Error syncing order statuses:', error)
    return NextResponse.json(
      { 
        error: 'Failed to sync order statuses', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

