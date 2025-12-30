import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import * as path from "path"

// Load environment variables from multiple sources
dotenv.config({ path: path.join(process.cwd(), ".env.local") })
dotenv.config({ path: path.join(process.cwd(), ".env") })

const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || process.env.NEXT_PUBLIC_SHOPIFY_SHOP
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SHOPIFY_SHOP || !SHOPIFY_ACCESS_TOKEN) {
  console.error("❌ Missing Shopify credentials. Please set SHOPIFY_SHOP and SHOPIFY_ACCESS_TOKEN")
  process.exit(1)
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface SyncResult {
  order_id: string
  order_number: string
  updated: boolean
  changes: string[]
  errors: string[]
}

async function syncOrderWithShopify(dbOrder: any): Promise<SyncResult> {
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
    const dbCancelled = dbOrder.financial_status === "voided" || dbOrder.financial_status === "refunded"

    // 1. Handle cancelled status - if cancelled in Shopify, ALWAYS set financial_status to voided
    if (shopifyCancelled) {
      // Order is cancelled in Shopify - must be voided in DB
      if (dbOrder.financial_status !== "voided") {
        updates.financial_status = "voided"
        changes.push(`Cancelled Status: Order is cancelled in Shopify (cancelled_at: ${shopifyOrder.cancelled_at}), updating financial_status to voided`)
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

    // 3. Update cancelled_at
    const shopifyCancelledAt = shopifyOrder.cancelled_at || null
    if (dbOrder.cancelled_at !== shopifyCancelledAt) {
      updates.cancelled_at = shopifyCancelledAt
      if (shopifyCancelledAt) {
        changes.push(`Cancelled At: ${shopifyCancelledAt}`)
      } else if (dbOrder.cancelled_at) {
        changes.push(`Cancelled At: cleared (order no longer cancelled)`)
      }
    }

    // 4. Update archived status
    const shopifyTags = (shopifyOrder.tags || "").toLowerCase()
    const shopifyArchived = 
      shopifyTags.includes("archived") || 
      shopifyOrder.status === "closed" ||
      false
    if (dbOrder.archived !== shopifyArchived) {
      updates.archived = shopifyArchived
      changes.push(`Archived: ${dbOrder.archived || false} → ${shopifyArchived}`)
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

    // Only update if there are changes
    if (Object.keys(updates).length > 0) {
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
          result.changes.push(`Updated ${count} line items to inactive status`)
        }
      }
    }

  } catch (error: any) {
    result.errors.push(`Unexpected error: ${error.message}`)
  }

  return result
}

async function syncOrdersWithShopify(orderNumber?: string, limit: number = 100, dryRun: boolean = false) {
  console.log("🔄 Starting order sync with Shopify...\n")
  if (dryRun) {
    console.log("🔍 DRY RUN MODE - No changes will be made\n")
  }

  // Fetch orders from database
  let dbQuery = supabase
    .from("orders")
    .select("id, order_number, financial_status, fulfillment_status, raw_shopify_order_data, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (orderNumber) {
    dbQuery = dbQuery.eq("order_number", orderNumber)
    console.log(`📋 Syncing order #${orderNumber}...\n`)
  } else {
    console.log(`📋 Syncing last ${limit} orders...\n`)
  }

  const { data: dbOrders, error: dbError } = await dbQuery

  if (dbError) {
    console.error("❌ Error fetching orders from database:", dbError)
    return
  }

  if (!dbOrders || dbOrders.length === 0) {
    console.log("ℹ️  No orders found in database")
    return
  }

  console.log(`✅ Found ${dbOrders.length} orders in database\n`)

  const results: SyncResult[] = []
  let updatedCount = 0
  let errorCount = 0

  for (const dbOrder of dbOrders) {
    if (dryRun) {
      // In dry run, just compare without updating
      const result = await syncOrderWithShopify(dbOrder)
      results.push(result)
      if (result.updated) {
        updatedCount++
      }
      if (result.errors.length > 0) {
        errorCount++
      }
    } else {
      // Actually sync
      const result = await syncOrderWithShopify(dbOrder)
      results.push(result)
      if (result.updated) {
        updatedCount++
      }
      if (result.errors.length > 0) {
        errorCount++
      }
    }
  }

  // Print results
  console.log("\n" + "=".repeat(80))
  console.log("📊 SYNC RESULTS")
  console.log("=".repeat(80))
  console.log(`Total orders processed: ${results.length}`)
  console.log(`✅ Updated: ${updatedCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log(`⏭️  No changes needed: ${results.length - updatedCount - errorCount}`)
  console.log("=".repeat(80) + "\n")

  // Show updated orders
  const updatedOrders = results.filter(r => r.updated)
  if (updatedOrders.length > 0) {
    console.log("✅ UPDATED ORDERS:\n")
    updatedOrders.forEach((result, idx) => {
      console.log(`${idx + 1}. Order #${result.order_number} (ID: ${result.order_id})`)
      result.changes.forEach(change => {
        console.log(`   ✓ ${change}`)
      })
      if (result.errors.length > 0) {
        result.errors.forEach(error => {
          console.log(`   ⚠️  ${error}`)
        })
      }
      console.log("")
    })
  }

  // Show errors
  const errorOrders = results.filter(r => r.errors.length > 0)
  if (errorOrders.length > 0) {
    console.log("❌ ORDERS WITH ERRORS:\n")
    errorOrders.forEach((result, idx) => {
      console.log(`${idx + 1}. Order #${result.order_number} (ID: ${result.order_id})`)
      result.errors.forEach(error => {
        console.log(`   ❌ ${error}`)
      })
      console.log("")
    })
  }

  if (dryRun && updatedCount > 0) {
    console.log("\n💡 This was a DRY RUN. Run without --dry-run to apply changes.\n")
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const orderNumber = args.find(arg => arg !== "--dry-run" && !arg.startsWith("--limit=")) || undefined
const limitArg = args.find(arg => arg.startsWith("--limit="))
const limit = limitArg ? parseInt(limitArg.split("=")[1]) : 100
const dryRun = args.includes("--dry-run")

// Run sync
syncOrdersWithShopify(orderNumber, limit, dryRun).catch(console.error)

