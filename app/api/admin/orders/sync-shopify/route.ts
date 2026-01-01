import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"

interface SyncResult {
  order_id: string
  order_number: string
  updated: boolean
  changes: string[]
  errors: string[]
}

async function syncOrderWithShopify(
  dbOrder: any,
  supabase: any
): Promise<SyncResult> {
  const result: SyncResult = {
    order_id: dbOrder.id,
    order_number: dbOrder.order_number?.toString() || "N/A",
    updated: false,
    changes: [],
    errors: [],
  }

  try {
    // Fetch order from Shopify
    let shopifyOrder: any = null
    const shopifyOrderId = dbOrder.id

    // Try fetching by order ID first
    try {
      const response = await fetch(
        `https://${SHOPIFY_SHOP}/admin/api/2024-01/orders/${shopifyOrderId}.json?status=any`,
        {
          headers: {
            "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
            "Content-Type": "application/json",
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        shopifyOrder = data.order
      } else if (response.status === 404) {
        // Order not found in Shopify - might be deleted/archived
        result.errors.push("Order not found in Shopify (may be deleted/archived)")
        return result
      }
    } catch (fetchError: any) {
      // If ID fetch fails, try searching by order number
      if (dbOrder.order_number) {
        try {
          const orderNumberStr = dbOrder.order_number.toString()
          const searchTerms = [`#${orderNumberStr}`, orderNumberStr]
          
          for (const searchTerm of searchTerms) {
            const searchResponse = await fetch(
              `https://${SHOPIFY_SHOP}/admin/api/2024-01/orders.json?name=${encodeURIComponent(searchTerm)}&status=any&limit=1`,
              {
                headers: {
                  "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
                  "Content-Type": "application/json",
                },
              }
            )

            if (searchResponse.ok) {
              const searchData = await searchResponse.json()
              if (searchData.orders && searchData.orders.length > 0) {
                shopifyOrder = searchData.orders[0]
                break
              }
            }
          }
        } catch (searchError: any) {
          result.errors.push(`Error searching for order: ${searchError.message}`)
          return result
        }
      } else {
        result.errors.push(`Error fetching order: ${fetchError.message}`)
        return result
      }
    }

    if (!shopifyOrder) {
      result.errors.push("Order not found in Shopify")
      return result
    }

    // Prepare update object
    const updates: any = {}
    const changes: string[] = []

    // Check cancelled status first - this takes priority
    const shopifyCancelled = !!shopifyOrder.cancelled_at
    const dbCancelled = !!dbOrder.cancelled_at // Use cancelled_at column, not financial_status

    // 1. Handle cancelled status - if cancelled in Shopify, ALWAYS set financial_status to voided
    if (shopifyCancelled) {
      // Order is cancelled in Shopify - must be voided in DB
      if (dbOrder.financial_status !== "voided") {
        updates.financial_status = "voided"
        changes.push(`Financial Status: ${dbOrder.financial_status} → voided (Order cancelled in Shopify)`)
      }
    } else {
      // Order is NOT cancelled in Shopify - sync financial_status from Shopify
      if (dbOrder.financial_status !== shopifyOrder.financial_status) {
        updates.financial_status = shopifyOrder.financial_status
        changes.push(`Financial Status: ${dbOrder.financial_status} → ${shopifyOrder.financial_status}`)
      }
    }

    // 2. Check and update fulfillment_status
    const shopifyFulfillmentStatus = shopifyOrder.fulfillment_status || null
    if (dbOrder.fulfillment_status !== shopifyFulfillmentStatus) {
      updates.fulfillment_status = shopifyFulfillmentStatus
      changes.push(`Fulfillment Status: ${dbOrder.fulfillment_status || "null"} → ${shopifyFulfillmentStatus || "null"}`)
    }

    // 3. Update cancelled_at (must always sync this field)
    const shopifyCancelledAt = shopifyOrder.cancelled_at || null
    const dbCancelledAt = dbOrder.cancelled_at || null
    
    // Compare: both null = match, both have values = compare, one null one not = mismatch
    const cancelledAtMatches = (dbCancelledAt === null && shopifyCancelledAt === null) ||
      (dbCancelledAt !== null && shopifyCancelledAt !== null && 
       new Date(dbCancelledAt).getTime() === new Date(shopifyCancelledAt).getTime())
    
    if (!cancelledAtMatches) {
      updates.cancelled_at = shopifyCancelledAt
      if (shopifyCancelledAt) {
        changes.push(`Cancelled At: ${shopifyCancelledAt}`)
      } else if (dbOrder.cancelled_at) {
        changes.push(`Cancelled At: cleared (order no longer cancelled)`)
      }
    }

    // 4. Update archived status (must match comparison logic)
    const shopifyTags = (shopifyOrder.tags || "").toLowerCase()
    const shopifyArchived = 
      shopifyTags.includes("archived") || 
      shopifyOrder.closed_at !== null ||
      shopifyOrder.cancel_reason !== null
    const dbArchived = dbOrder.archived ?? false
    if (dbArchived !== shopifyArchived) {
      updates.archived = shopifyArchived
      changes.push(`Archived: ${dbArchived} → ${shopifyArchived}`)
    }

    // 5. Update shopify_order_status
    const shopifyOrderStatus = shopifyOrder.status || null
    if (dbOrder.shopify_order_status !== shopifyOrderStatus) {
      updates.shopify_order_status = shopifyOrderStatus
      changes.push(`Shopify Status: ${dbOrder.shopify_order_status || "null"} → ${shopifyOrderStatus || "null"}`)
    }

    // 6. Update raw_shopify_order_data to keep it in sync
    updates.raw_shopify_order_data = shopifyOrder
    updates.updated_at = new Date().toISOString()

    // Only update if there are actual changes (excluding raw_shopify_order_data and updated_at)
    const actualChanges = Object.keys(updates).filter(key => 
      key !== 'raw_shopify_order_data' && key !== 'updated_at'
    )
    
    if (actualChanges.length > 0) {
      const { error: updateError } = await supabase
        .from("orders")
        .update(updates)
        .eq("id", dbOrder.id)

      if (updateError) {
        result.errors.push(`Database update error: ${updateError.message}`)
      } else {
        result.updated = true
        result.changes = changes
      }
    }

    // 5. Also update line items if order is cancelled
    if (shopifyCancelled) {
      // Update line items status to inactive if order is cancelled
      const { error: lineItemsError } = await supabase
        .from("order_line_items_v2")
        .update({ 
          status: "inactive",
          updated_at: new Date().toISOString()
        })
        .eq("order_id", dbOrder.id)
        .eq("status", "active")

      if (lineItemsError) {
        result.errors.push(`Line items update error: ${lineItemsError.message}`)
      } else {
        // Check if any line items were updated
        const { count } = await supabase
          .from("order_line_items_v2")
          .select("*", { count: "exact", head: true })
          .eq("order_id", dbOrder.id)
          .eq("status", "inactive")

        if (count && count > 0) {
          result.changes.push(`Updated line items to inactive status`)
        }
      }
    }

  } catch (error: any) {
    result.errors.push(`Unexpected error: ${error.message}`)
  }

  return result
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const adminSessionToken = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value
    const adminSession = verifyAdminSessionToken(adminSessionToken)
    if (!adminSession?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient()
    const body = await request.json()
    const { orderNumber, orderId, orderIds, limit = 100, dryRun = false } = body

    // Fetch orders from database
    let dbQuery = supabase
      .from("orders")
      .select("id, order_number, financial_status, fulfillment_status, raw_shopify_order_data, created_at, updated_at, cancelled_at, archived, shopify_order_status")
      .order("created_at", { ascending: false })

    if (orderIds && Array.isArray(orderIds) && orderIds.length > 0) {
      // Sync specific orders by IDs
      dbQuery = dbQuery.in("id", orderIds)
    } else if (orderNumber) {
      dbQuery = dbQuery.eq("order_number", orderNumber)
    } else if (orderId) {
      dbQuery = dbQuery.eq("id", orderId)
    } else {
      // Default: limit to recent orders
      dbQuery = dbQuery.limit(limit)
    }

    const { data: dbOrders, error: dbError } = await dbQuery

    if (dbError) {
      console.error("Error fetching orders from database:", dbError)
      return NextResponse.json(
        { success: false, message: "Failed to fetch orders from database", error: dbError.message },
        { status: 500 }
      )
    }

    if (!dbOrders || dbOrders.length === 0) {
      return NextResponse.json({
        success: true,
        results: [],
        summary: {
          total_processed: 0,
          updated: 0,
          errors: 0,
        },
        message: "No orders found in database",
      })
    }

    const results: SyncResult[] = []
    let updatedCount = 0
    let errorCount = 0

    for (const dbOrder of dbOrders) {
      const result = await syncOrderWithShopify(dbOrder, supabase)
      results.push(result)
      if (result.updated) {
        updatedCount++
      }
      if (result.errors.length > 0) {
        errorCount++
      }
    }

    // Transform results to match UI expectations
    const updatedOrders = results
      .filter(r => r.updated)
      .map(r => ({
        order_id: r.order_id,
        order_number: r.order_number,
        changes: r.changes,
      }))
    
    const errors = results
      .filter(r => r.errors.length > 0)
      .flatMap(r => r.errors.map(err => `Order #${r.order_number}: ${err}`))

    return NextResponse.json({
      success: true,
      results,
      updatedOrders, // For UI compatibility
      errors, // For UI compatibility
      summary: {
        total_processed: results.length,
        updated: updatedCount,
        errors: errorCount,
        no_changes: results.length - updatedCount - errorCount,
      },
      dryRun,
    })
  } catch (error: any) {
    console.error("Error in order sync:", error)
    return NextResponse.json(
      { success: false, message: "Failed to sync orders", error: error.message },
      { status: 500 }
    )
  }
}

