import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createChinaDivisionClient } from '@/lib/chinadivision/client'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/customer/warehouse-orders/all
 * Get ALL warehouse orders linked to the customer's Shopify orders
 * This is for customers who ordered gifts for multiple recipients
 * Links warehouse orders to Shopify orders by matching order_id
 */
export async function GET(request: NextRequest) {
  try {
    // Get customer ID from cookie (Shopify customer authentication)
    const shopifyCustomerId = request.cookies.get('shopify_customer_id')?.value

    if (!shopifyCustomerId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required',
          errorCode: 'AUTH_NO_CUSTOMER_ID',
        },
        { status: 401 }
      )
    }

    // Validate customer ID
    const customerIdNumber = parseInt(shopifyCustomerId)
    if (isNaN(customerIdNumber)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid customer ID format',
          errorCode: 'AUTH_INVALID_CUSTOMER_ID',
        },
        { status: 400 }
      )
    }

    // Get all Shopify orders for this customer from Supabase
    const supabase = createClient()
    const { data: customerOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, shopify_id, customer_email, processed_at')
      .eq('customer_id', customerIdNumber)
      .order('processed_at', { ascending: false })

    if (ordersError) {
      console.error('Error fetching customer orders:', ordersError)
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to fetch customer orders',
          errorCode: 'DB_QUERY_FAILED',
        },
        { status: 500 }
      )
    }

    if (!customerOrders || customerOrders.length === 0) {
      return NextResponse.json({
        success: true,
        orders: [],
        count: 0,
        message: 'No Shopify orders found for this customer',
      })
    }

    // Get query parameters for date range (optional, defaults to last 180 days for gift orders)
    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start') || getDateDaysAgo(180)
    const end = searchParams.get('end') || new Date().toISOString().split('T')[0]

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(start) || !dateRegex.test(end)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD',
        },
        { status: 400 }
      )
    }

    // Create ChinaDivision client and fetch all warehouse orders
    const client = createChinaDivisionClient()
    const allWarehouseOrders = await client.getOrdersInfo(start, end)

    // Create a set of Shopify order IDs and order numbers for quick lookup
    const shopifyOrderIds = new Set<string>()
    const shopifyOrderNumbers = new Set<string>()
    
    customerOrders.forEach((order) => {
      // Add Shopify ID (as string)
      if (order.shopify_id) {
        shopifyOrderIds.add(order.shopify_id)
      }
      // Add order ID (as string)
      if (order.id) {
        shopifyOrderIds.add(order.id)
      }
      // Add order number (may need to remove # prefix)
      if (order.order_number) {
        const orderNum = order.order_number.toString().replace('#', '')
        shopifyOrderNumbers.add(orderNum)
        shopifyOrderIds.add(orderNum)
      }
    })

    // Match warehouse orders to customer's Shopify orders
    // Keep orders separate if Platform Order ID (order_id) is different
    const matchedOrders = allWarehouseOrders.filter((warehouseOrder) => {
      const warehouseOrderId = warehouseOrder.sys_order_id || warehouseOrder.order_id?.toString()
      
      if (!warehouseOrderId) return false

      // Check if warehouse order_id matches any Shopify order ID or number
      return (
        shopifyOrderIds.has(warehouseOrderId) ||
        shopifyOrderNumbers.has(warehouseOrderId) ||
        shopifyOrderIds.has(warehouseOrderId.replace('#', '')) ||
        shopifyOrderIds.has(warehouseOrder.order_id?.toString() || '') ||
        shopifyOrderNumbers.has(warehouseOrder.order_id?.toString() || '')
      )
    })

    // Collect all SKUs from all packages in matched orders
    const allSkus = new Set<string>()
    matchedOrders.forEach(order => {
      order.info?.forEach(pkg => {
        if (pkg.sku) allSkus.add(pkg.sku)
        if (pkg.sku_code) allSkus.add(pkg.sku_code)
      })
    })

    // Fetch product names from Supabase by SKU
    const productNameMap = new Map<string, string>()
    if (allSkus.size > 0) {
      const { data: products } = await supabase
        .from('products')
        .select('sku, name')
        .in('sku', Array.from(allSkus))

      if (products) {
        products.forEach(product => {
          if (product.sku && product.name) {
            productNameMap.set(product.sku, product.name)
          }
        })
      }
    }

    // Enrich orders with Shopify order information and product names
    const enrichedOrders = matchedOrders.map((warehouseOrder) => {
      // Find the matching Shopify order
      const matchingShopifyOrder = customerOrders.find((shopifyOrder) => {
        const warehouseId = warehouseOrder.order_id?.toString()
        return (
          shopifyOrder.shopify_id === warehouseId ||
          shopifyOrder.id === warehouseId ||
          shopifyOrder.order_number?.toString().replace('#', '') === warehouseId
        )
      })

      return {
        ...warehouseOrder,
        shopify_order: matchingShopifyOrder
          ? {
              id: matchingShopifyOrder.id,
              order_number: matchingShopifyOrder.order_number,
              shopify_id: matchingShopifyOrder.shopify_id,
              processed_at: matchingShopifyOrder.processed_at,
            }
          : null,
        // Enrich packages with product names
        info: warehouseOrder.info?.map(pkg => ({
          ...pkg,
          product_name: productNameMap.get(pkg.sku || '') || 
                       productNameMap.get(pkg.sku_code || '') || 
                       pkg.product_name || 
                       pkg.sku || 
                       'Unknown Product'
        }))
      }
    })

    return NextResponse.json({
      success: true,
      orders: enrichedOrders,
      count: enrichedOrders.length,
      shopify_orders_count: customerOrders.length,
      matched_count: enrichedOrders.length,
    })
  } catch (error: any) {
    console.error('Error fetching all customer warehouse orders:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch warehouse orders',
      },
      { status: 500 }
    )
  }
}

/**
 * Helper function to get date string N days ago
 */
function getDateDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0]
}

