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

async function compareOrders(orderNumber?: string, limit: number = 100) {
  console.log("🔍 Starting order comparison...\n")

  // Fetch orders from database
  let dbQuery = supabase
    .from("orders")
    .select("id, order_number, financial_status, fulfillment_status, raw_shopify_order_data, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (orderNumber) {
    dbQuery = dbQuery.eq("order_number", orderNumber)
    console.log(`📋 Looking for order #${orderNumber}...\n`)
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

  const comparisons: OrderComparison[] = []
  const mismatches: OrderComparison[] = []

  for (const dbOrder of dbOrders) {
    try {
      const shopifyOrderId = dbOrder.id
      let shopifyOrder: any = null

      // Try fetching by order ID
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
        console.error(`⚠️  Error fetching order ${shopifyOrderId} from Shopify:`, fetchError.message)
        console.error(`   Full error:`, fetchError)
        // Try to continue with order number search
      }

      // If not found by ID, try searching by order number
      if (!shopifyOrder && dbOrder.order_number) {
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
          console.error(`⚠️  Error searching for order ${dbOrder.order_number}:`, searchError.message)
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
      const dbCancelled = dbOrder.financial_status === "voided" || dbOrder.financial_status === "refunded"
      const shopifyCancelled = !!shopifyOrder.cancelled_at
      
      const shopifyTags = (shopifyOrder.tags || "").toLowerCase()
      const shopifyArchived = 
        shopifyTags.includes("archived") || 
        shopifyOrder.status === "closed" ||
        false
      const dbArchived = null

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
          status: shopifyOrder.status,
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

      // Special case: Check if order is both paid and cancelled
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
      console.error(`❌ Error processing order ${dbOrder.id}:`, error.message)
    }
  }

  // Print results
  console.log("\n" + "=".repeat(80))
  console.log("📊 COMPARISON RESULTS")
  console.log("=".repeat(80))
  console.log(`Total orders checked: ${comparisons.length}`)
  console.log(`✅ Matches: ${comparisons.length - mismatches.length}`)
  console.log(`❌ Mismatches: ${mismatches.length}`)
  console.log("=".repeat(80) + "\n")

  if (mismatches.length > 0) {
    console.log("🚨 MISMATCHES FOUND:\n")
    mismatches.forEach((comp, idx) => {
      console.log(`${idx + 1}. Order #${comp.order_number} (ID: ${comp.order_id})`)
      console.log(`   DB Financial Status: ${comp.db_financial_status || "null"}`)
      console.log(`   Shopify Financial Status: ${comp.shopify_financial_status || "null"}`)
      console.log(`   DB Fulfillment Status: ${comp.db_fulfillment_status || "null"}`)
      console.log(`   Shopify Fulfillment Status: ${comp.shopify_fulfillment_status || "null"}`)
      console.log(`   DB Cancelled: ${comp.db_cancelled}`)
      console.log(`   Shopify Cancelled: ${comp.shopify_cancelled} (cancelled_at: ${comp.shopify_order_data?.cancelled_at || "null"})`)
      console.log(`   Shopify Archived: ${comp.shopify_archived} (status: ${comp.shopify_order_data?.status || "unknown"})`)
      console.log(`   Issues:`)
      comp.mismatches.forEach((mismatch) => {
        const isCritical = mismatch.includes("CRITICAL")
        console.log(`     ${isCritical ? "🔴" : "⚠️ "} ${mismatch}`)
      })
      console.log("")
    })
  } else {
    console.log("✅ No mismatches found! All orders are in sync.\n")
  }
}

// Run comparison
// Usage: npx tsx scripts/compare-orders.ts [orderNumber] [limit]
// Example: npx tsx scripts/compare-orders.ts 1114
// Example: npx tsx scripts/compare-orders.ts "" 50
const args = process.argv.slice(2)
const orderNumber = args[0] && args[0] !== "" && !isNaN(parseInt(args[0])) ? args[0] : undefined
const limit = args[1] ? parseInt(args[1]) : (args[0] && !orderNumber ? parseInt(args[0]) : 50)

compareOrders(orderNumber, limit).catch(console.error)

