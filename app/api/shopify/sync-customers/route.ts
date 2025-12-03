import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createChinaDivisionClient } from "@/lib/chinadivision/client"
import type { Json } from "@/types/supabase"
import type { ChinaDivisionOrderInfo } from "@/lib/chinadivision/client"

interface CustomerProfile {
  email: string
  first_name: string
  last_name: string
  phone?: string
  address?: {
    street1?: string
    street2?: string
    city?: string
    state?: string
    zip?: string
    country?: string
  }
  orderIds: string[]
  totalOrders: number
  totalSpent: number
  firstOrderDate?: Date
  lastOrderDate?: Date
  products: Array<{
    sku: string
    product_name: string
    quantity: number
    order_id: string
  }>
}

/**
 * Build comprehensive customer profiles from ChinaDivision orders
 */
async function buildCustomerProfilesFromOrders(
  orders: ChinaDivisionOrderInfo[]
): Promise<Map<string, CustomerProfile>> {
  const customerMap = new Map<string, CustomerProfile>()

  for (const order of orders) {
    if (!order.ship_email) continue

    const email = order.ship_email.toLowerCase().trim()
    // Use sys_order_id (platform order ID) as the primary identifier
    const platformOrderId = order.sys_order_id || order.order_id || ''
    if (!platformOrderId) continue // Skip orders without platform order ID
    
    const orderDate = order.date_added ? new Date(order.date_added) : new Date()

    // Get or create customer profile
    let profile = customerMap.get(email)
    if (!profile) {
      profile = {
        email: order.ship_email,
        first_name: order.first_name || '',
        last_name: order.last_name || '',
        phone: order.ship_phone || undefined,
        address: {
          street1: order.ship_address1 || undefined,
          street2: order.ship_address2 || undefined,
          city: order.ship_city || undefined,
          state: order.ship_state || undefined,
          zip: order.ship_zip || undefined,
          country: order.ship_country || undefined,
        },
        orderIds: [],
        totalOrders: 0,
        totalSpent: 0,
        products: [],
      }
      customerMap.set(email, profile)
    }

    // Add platform order ID if not already present
    if (platformOrderId && !profile.orderIds.includes(platformOrderId)) {
      profile.orderIds.push(platformOrderId)
      profile.totalOrders++
    }

    // Update dates
    if (!profile.firstOrderDate || orderDate < profile.firstOrderDate) {
      profile.firstOrderDate = orderDate
    }
    if (!profile.lastOrderDate || orderDate > profile.lastOrderDate) {
      profile.lastOrderDate = orderDate
    }

    // Update name if we have more complete info
    if (order.first_name && !profile.first_name) {
      profile.first_name = order.first_name
    }
    if (order.last_name && !profile.last_name) {
      profile.last_name = order.last_name
    }

    // Update address if we have more complete info
    if (order.ship_address1 && !profile.address?.street1) {
      profile.address = {
        street1: order.ship_address1,
        street2: order.ship_address2,
        city: order.ship_city,
        state: order.ship_state,
        zip: order.ship_zip,
        country: order.ship_country,
      }
    }

    // Add products from this order
    if (order.info && Array.isArray(order.info)) {
      for (const item of order.info) {
        profile.products.push({
          sku: item.sku || item.sku_code || '',
          product_name: item.product_name || '',
          quantity: parseInt(item.quantity || '1', 10),
          order_id: platformOrderId, // Use platform order ID
        })
      }
    }
  }

  return customerMap
}

/**
 * Link customer to existing orders in database by platform order ID (sys_order_id)
 */
async function linkToDatabaseOrders(
  supabase: any,
  platformOrderIds: string[]
): Promise<{
  shopifyOrderIds: string[]
  totalSpent: number
  matchedOrders: Array<{
    order_id: string
    source: 'shopify' | 'chinadivision'
    total_price?: number
  }>
}> {
  if (!platformOrderIds || platformOrderIds.length === 0) {
    return { shopifyOrderIds: [], totalSpent: 0, matchedOrders: [] }
  }

  const matchedOrders: Array<{
    order_id: string
    source: 'shopify' | 'chinadivision'
    total_price?: number
  }> = []
  const shopifyOrderIds: string[] = []
  let totalSpent = 0

  // Match by platform order ID in order_line_items_v2
  // The order_id in order_line_items_v2 should match sys_order_id from ChinaDivision
  for (const platformOrderId of platformOrderIds) {
    // Try to find in order_line_items_v2 by order_id (which should be the platform order ID)
    const { data: lineItems } = await supabase
      .from('order_line_items_v2')
      .select('order_id, price, quantity')
      .eq('order_id', platformOrderId)
      .limit(1)

    if (lineItems && lineItems.length > 0) {
      // Found matching order - this is a Shopify order that matches the platform order ID
      const orderId = lineItems[0].order_id
      
      // Get full order details from orders table
      const { data: order } = await supabase
        .from('orders')
        .select('id, total_price, customer_email')
        .eq('id', orderId)
        .single()

      if (order) {
        shopifyOrderIds.push(order.id)
        totalSpent += parseFloat(order.total_price || '0')
        matchedOrders.push({
          order_id: order.id,
          source: 'shopify',
          total_price: parseFloat(order.total_price || '0'),
        })
      } else {
        // Order exists in line items but not in orders table - still track it
        matchedOrders.push({
          order_id: orderId,
          source: 'chinadivision',
        })
      }
    } else {
      // No match found - this is a ChinaDivision-only order
      matchedOrders.push({
        order_id: platformOrderId,
        source: 'chinadivision',
      })
    }
  }

  return { shopifyOrderIds, totalSpent, matchedOrders }
}

/**
 * Sync order history for a customer
 */
async function syncCustomerOrderHistory(
  supabase: any,
  customerId: string,
  orders: ChinaDivisionOrderInfo[],
  customerEmail: string
) {
  for (const order of orders) {
    if (order.ship_email?.toLowerCase() !== customerEmail.toLowerCase()) continue

    // Use sys_order_id (platform order ID) as the primary identifier
    const platformOrderId = order.sys_order_id || order.order_id || ''
    if (!platformOrderId) continue

    // Check if order history already exists by platform order ID
    const { data: existing } = await supabase
      .from('crm_customer_orders')
      .select('id')
      .eq('customer_id', customerId)
      .eq('order_id', platformOrderId)
      .eq('order_source', 'chinadivision')
      .single()

    if (existing) continue

    // Calculate order total (sum of products if available)
    let orderTotal = 0
    const products: any[] = []
    
    if (order.info && Array.isArray(order.info)) {
      for (const item of order.info) {
        products.push({
          sku: item.sku || item.sku_code,
          product_name: item.product_name,
          quantity: parseInt(item.quantity || '1', 10),
        })
      }
    }

    // Insert order history using platform order ID (sys_order_id)
    await supabase
      .from('crm_customer_orders')
      .insert({
        customer_id: customerId,
        order_id: platformOrderId, // Use sys_order_id as the order_id
        order_source: 'chinadivision',
        order_number: order.order_id, // Keep original order_id as order_number
        order_date: order.date_added ? new Date(order.date_added) : new Date(),
        total_amount: orderTotal,
        status: order.status_name || `Status ${order.status}`,
        products: products.length > 0 ? products : null,
        metadata: {
          sys_order_id: order.sys_order_id, // Platform Order ID
          order_id: order.order_id, // Original order_id
          order_detail_id: order.order_detail_id,
          tracking_number: order.tracking_number,
          shipping_method: order.shipping_method,
          status: order.status,
        },
      })
  }
}

export async function POST() {
  const supabase = createClient()

  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const db = supabase

    // Fetch orders from ChinaDivision (last 2 years)
    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - 2)
    const startDateStr = startDate.toISOString().split('T')[0]

    console.log(`[Customer Sync] Fetching orders from ChinaDivision: ${startDateStr} to ${endDate}`)
    
    const orders = await createChinaDivisionClient().getOrdersInfo(startDateStr, endDate, true)
    console.log(`[Customer Sync] Fetched ${orders.length} orders from ChinaDivision`)

    // Build comprehensive customer profiles
    const customerProfiles = await buildCustomerProfilesFromOrders(orders)
    console.log(`[Customer Sync] Built ${customerProfiles.size} customer profiles`)

    let processedCount = 0
    let errorCount = 0
    let createdCount = 0
    let updatedCount = 0

    // Process each customer profile
    for (const [email, profile] of customerProfiles.entries()) {
      try {
        // Link to database orders by platform order ID (sys_order_id)
        const { shopifyOrderIds, totalSpent: shopifyTotalSpent, matchedOrders } = 
          await linkToDatabaseOrders(db, profile.orderIds)

        // Prepare customer data
        const customerData: any = {
          email: profile.email,
          first_name: profile.first_name || null,
          last_name: profile.last_name || null,
          phone: profile.phone || null,
          chinadivision_order_ids: profile.orderIds.length > 0 ? profile.orderIds : null,
          shopify_order_ids: shopifyOrderIds.length > 0 ? shopifyOrderIds : null,
          total_orders: profile.totalOrders + shopifyOrderIds.length,
          first_order_date: profile.firstOrderDate?.toISOString() || null,
          last_order_date: profile.lastOrderDate?.toISOString() || null,
          total_spent: shopifyTotalSpent, // We'll calculate ChinaDivision totals separately if needed
          address: profile.address ? {
            street1: profile.address.street1,
            street2: profile.address.street2,
            city: profile.address.city,
            state: profile.address.state,
            zip: profile.address.zip,
            country: profile.address.country,
          } : null,
          metadata: {
            products_purchased: profile.products.length,
            last_synced: new Date().toISOString(),
          },
        }

        // Check if customer already exists
        const { data: existingCustomer } = await db
          .from("crm_customers")
          .select("id")
          .eq("email", email)
          .single()

        let customerId: string

        if (existingCustomer) {
          // Update existing customer
          // Merge order IDs arrays
          const { data: currentCustomer } = await db
            .from("crm_customers")
            .select("chinadivision_order_ids, shopify_order_ids, total_orders")
            .eq("email", email)
            .single()

          const existingChinaIds = (currentCustomer?.chinadivision_order_ids || []) as string[]
          const existingShopifyIds = (currentCustomer?.shopify_order_ids || []) as string[]
          
          // Merge arrays (remove duplicates) - using platform order IDs
          const mergedChinaIds = Array.from(new Set([...existingChinaIds, ...platformOrderIds]))
          const mergedShopifyIds = Array.from(new Set([...existingShopifyIds, ...shopifyOrderIds]))
          
          customerData.chinadivision_order_ids = mergedChinaIds.length > 0 ? mergedChinaIds : null
          customerData.shopify_order_ids = mergedShopifyIds.length > 0 ? mergedShopifyIds : null
          customerData.total_orders = matchedOrders.length // Use matched orders count

          const { error: updateError, data: updatedCustomer } = await db
            .from("crm_customers")
            .update(customerData)
            .eq("email", email)
            .select()
            .single()

          if (updateError) {
            console.error(`[Customer Sync] Error updating customer ${email}:`, updateError)
            errorCount++
            continue
          }

          customerId = updatedCustomer.id
          updatedCount++
        } else {
          // Insert new customer
          const { error: insertError, data: newCustomer } = await db
            .from("crm_customers")
            .insert(customerData)
            .select()
            .single()

          if (insertError) {
            console.error(`[Customer Sync] Error inserting customer ${email}:`, insertError)
            errorCount++
            continue
          }

          customerId = newCustomer.id
          createdCount++
        }

        // Sync order history for this customer
        const customerOrders = orders.filter(o => 
          o.ship_email?.toLowerCase() === email.toLowerCase()
        )
        await syncCustomerOrderHistory(db, customerId, customerOrders, email)

        processedCount++
      } catch (error) {
        console.error(`[Customer Sync] Error processing customer ${email}:`, error)
        errorCount++
      }
    }

    // Log sync operation
    const syncLog = {
      type: "customer_sync",
      details: {
        customers_synced: processedCount,
        created: createdCount,
        updated: updatedCount,
        errors: errorCount,
        orders_processed: orders.length,
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
      } as Json,
    }

    const { error: logError } = await db.from("sync_logs").insert(syncLog)
    if (logError) {
      console.error("[Customer Sync] Error logging sync:", logError)
    }

    return NextResponse.json({
      success: true,
      customers_synced: processedCount,
      created: createdCount,
      updated: updatedCount,
      errors: errorCount,
      orders_processed: orders.length,
    })
  } catch (error: any) {
    console.error("[Customer Sync] Error in sync-customers:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
