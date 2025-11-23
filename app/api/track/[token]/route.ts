import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createChinaDivisionClient } from '@/lib/chinadivision/client'

/**
 * GET /api/track/[token]
 * Public endpoint to fetch orders for a tracking token (no authentication required)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Tracking token is required' },
        { status: 400 }
      )
    }

    // Fetch the tracking link from database
    const supabase = createClient()
    const { data: trackingLink, error: linkError } = await supabase
      .from('shared_order_tracking_links')
      .select('*')
      .eq('token', token)
      .single()

    if (linkError || !trackingLink) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid or expired tracking link',
        },
        { status: 404 }
      )
    }

    // Check if link has expired
    if (trackingLink.expires_at) {
      const expiresAt = new Date(trackingLink.expires_at)
      if (expiresAt < new Date()) {
        return NextResponse.json(
          {
            success: false,
            message: 'This tracking link has expired',
          },
          { status: 410 } // 410 Gone
        )
      }
    }

    // Increment access count
    await supabase.rpc('increment_tracking_link_access', {
      token_param: token,
    })

    // Fetch orders from ChinaDivision API
    const orderIds = trackingLink.order_ids || []
    
    if (orderIds.length === 0) {
      return NextResponse.json({
        success: true,
        title: trackingLink.title,
        orders: [],
        count: 0,
      })
    }

    // Get date range (last 180 days to ensure we capture the orders)
    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 180)
    const startDateStr = startDate.toISOString().split('T')[0]

    // Fetch all orders from ChinaDivision
    const client = createChinaDivisionClient()
    const allOrders = await client.getOrdersInfo(startDateStr, endDate)

    // Filter to only the orders specified in the link
    // Keep orders separate if Platform Order ID (order_id) is different
    const matchedOrders = allOrders.filter((order) => {
      const orderId = order.sys_order_id || order.order_id || order.order_detail_id || ''
      return orderId && orderIds.includes(orderId)
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

    // Enrich orders with product names
    const enrichedOrders = matchedOrders.map(order => ({
      ...order,
      info: order.info?.map(pkg => ({
        ...pkg,
        // Use product name from database if available, otherwise use existing product_name or SKU
        product_name: productNameMap.get(pkg.sku || '') || 
                     productNameMap.get(pkg.sku_code || '') || 
                     pkg.product_name || 
                     pkg.sku || 
                     'Unknown Product'
      }))
    }))

    return NextResponse.json({
      success: true,
      title: trackingLink.title,
      orders: enrichedOrders,
      count: enrichedOrders.length,
      totalOrderIds: orderIds.length,
      createdAt: trackingLink.created_at,
      logoUrl: trackingLink.logo_url,
      primaryColor: trackingLink.primary_color || '#8217ff',
    })
  } catch (error: any) {
    console.error('Error fetching tracking orders:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch tracking orders',
      },
      { status: 500 }
    )
  }
}

