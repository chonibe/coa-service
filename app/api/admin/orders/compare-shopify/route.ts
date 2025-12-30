import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"

interface OrderComparison {
  order_id: string
  order_number: string
  db_financial_status: string | null
  shopify_financial_status: string | null
  db_fulfillment_status: string | null
  shopify_fulfillment_status: string | null
  db_cancelled: boolean
  shopify_cancelled: boolean
  db_archived: boolean | null
  shopify_archived: boolean
  mismatches: string[]
  shopify_order_data?: any
}

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const adminSessionToken = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value
    const adminSession = verifyAdminSessionToken(adminSessionToken)
    if (!adminSession?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient()
    const searchParams = request.nextUrl.searchParams
    const orderNumber = searchParams.get("orderNumber") // e.g., "1114"
    const limit = parseInt(searchParams.get("limit") || "100")

    // Fetch orders from database
    let dbQuery = supabase
      .from("orders")
      .select("id, order_number, financial_status, fulfillment_status, raw_shopify_order_data, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (orderNumber) {
      dbQuery = dbQuery.eq("order_number", orderNumber)
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
        comparisons: [],
        summary: {
          total_checked: 0,
          mismatches: 0,
          matches: 0,
        },
        message: "No orders found in database",
      })
    }

    // Fetch corresponding orders from Shopify
    const comparisons: OrderComparison[] = []
    const mismatches: OrderComparison[] = []

    for (const dbOrder of dbOrders) {
      try {
        // Try to get Shopify order by ID first
        const shopifyOrderId = dbOrder.id
        let shopifyOrder: any = null

          // Try fetching by order ID (include status=any to get archived/closed orders)
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
            // Order not found in Shopify - might be deleted
            comparisons.push({
              order_id: dbOrder.id,
              order_number: dbOrder.order_number?.toString() || "N/A",
              db_financial_status: dbOrder.financial_status,
              shopify_financial_status: null,
              db_fulfillment_status: dbOrder.fulfillment_status,
              shopify_fulfillment_status: null,
              db_cancelled: false,
              shopify_cancelled: false,
              db_archived: null,
              shopify_archived: false,
              mismatches: ["Order not found in Shopify (may be deleted)"],
            })
            mismatches.push(comparisons[comparisons.length - 1])
            continue
          }
        } catch (fetchError: any) {
          console.error(`Error fetching order ${shopifyOrderId} from Shopify:`, fetchError)
          // Continue to next order
          continue
        }

        // If not found by ID, try searching by order number
        if (!shopifyOrder && dbOrder.order_number) {
          try {
            // Try with # prefix and without
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
            console.error(`Error searching for order ${dbOrder.order_number}:`, searchError)
          }
        }

        if (!shopifyOrder) {
          comparisons.push({
            order_id: dbOrder.id,
            order_number: dbOrder.order_number?.toString() || "N/A",
            db_financial_status: dbOrder.financial_status,
            shopify_financial_status: null,
            db_fulfillment_status: dbOrder.fulfillment_status,
            shopify_fulfillment_status: null,
            db_cancelled: false,
            shopify_cancelled: false,
            db_archived: null,
            shopify_archived: false,
            mismatches: ["Order not found in Shopify"],
          })
          mismatches.push(comparisons[comparisons.length - 1])
          continue
        }

        // Compare order data
        // Check cancelled status - in Shopify, cancelled_at is the definitive field
        const dbCancelled = dbOrder.financial_status === "voided" || dbOrder.financial_status === "refunded"
        const shopifyCancelled = !!shopifyOrder.cancelled_at
        
        // Check archived status - archived orders in Shopify may have tags or be in a different state
        // Also check if order is in closed status (which includes archived)
        const shopifyTags = (shopifyOrder.tags || "").toLowerCase()
        const shopifyArchived = 
          shopifyTags.includes("archived") || 
          shopifyOrder.status === "closed" ||
          false
        const dbArchived = null // We don't store archived status in DB currently

        const comparison: OrderComparison = {
          order_id: dbOrder.id,
          order_number: shopifyOrder.name?.replace("#", "") || dbOrder.order_number?.toString() || "N/A",
          db_financial_status: dbOrder.financial_status,
          shopify_financial_status: shopifyOrder.financial_status,
          db_fulfillment_status: dbOrder.fulfillment_status,
          shopify_fulfillment_status: shopifyOrder.fulfillment_status || null,
          db_cancelled: dbCancelled,
          shopify_cancelled: shopifyCancelled,
          db_archived: dbArchived,
          shopify_archived: shopifyArchived,
          mismatches: [],
          shopify_order_data: {
            id: shopifyOrder.id,
            name: shopifyOrder.name,
            cancelled_at: shopifyOrder.cancelled_at,
            tags: shopifyOrder.tags,
            note: shopifyOrder.note,
            status: shopifyOrder.status, // closed, open, etc.
            closed_at: shopifyOrder.closed_at,
          },
        }

        // Check for mismatches
        if (comparison.db_financial_status !== comparison.shopify_financial_status) {
          comparison.mismatches.push(
            `Financial Status: DB="${comparison.db_financial_status}" vs Shopify="${comparison.shopify_financial_status}"`
          )
        }

        if (comparison.db_fulfillment_status !== comparison.shopify_fulfillment_status) {
          comparison.mismatches.push(
            `Fulfillment Status: DB="${comparison.db_fulfillment_status || "null"}" vs Shopify="${comparison.shopify_fulfillment_status || "null"}"`
          )
        }

        if (comparison.db_cancelled !== comparison.shopify_cancelled) {
          comparison.mismatches.push(
            `Cancelled Status: DB=${comparison.db_cancelled} vs Shopify=${comparison.shopify_cancelled} (cancelled_at: ${shopifyOrder.cancelled_at || "null"})`
          )
        }

        if (comparison.shopify_archived && !comparison.db_archived) {
          comparison.mismatches.push(
            `Archived Status: Order is archived in Shopify but not marked in DB`
          )
        }

        // Special case: Check if order is both paid and cancelled (the issue mentioned)
        if (
          comparison.shopify_financial_status === "paid" &&
          comparison.shopify_cancelled &&
          comparison.shopify_fulfillment_status !== "fulfilled"
        ) {
          comparison.mismatches.push(
            `⚠️ CRITICAL: Order is PAID + CANCELLED + UNFULFILLED in Shopify (this may need manual review)`
          )
        }

        comparisons.push(comparison)

        if (comparison.mismatches.length > 0) {
          mismatches.push(comparison)
        }
      } catch (error: any) {
        console.error(`Error processing order ${dbOrder.id}:`, error)
        comparisons.push({
          order_id: dbOrder.id,
          order_number: dbOrder.order_number?.toString() || "N/A",
          db_financial_status: dbOrder.financial_status,
          shopify_financial_status: null,
          db_fulfillment_status: dbOrder.fulfillment_status,
          shopify_fulfillment_status: null,
          db_cancelled: false,
          shopify_cancelled: false,
          db_archived: null,
          shopify_archived: false,
          mismatches: [`Error comparing: ${error.message}`],
        })
        mismatches.push(comparisons[comparisons.length - 1])
      }
    }

    return NextResponse.json({
      success: true,
      comparisons,
      mismatches,
      summary: {
        total_checked: comparisons.length,
        mismatches: mismatches.length,
        matches: comparisons.length - mismatches.length,
      },
    })
  } catch (error: any) {
    console.error("Error in order comparison:", error)
    return NextResponse.json(
      { success: false, message: "Failed to compare orders", error: error.message },
      { status: 500 }
    )
  }
}

