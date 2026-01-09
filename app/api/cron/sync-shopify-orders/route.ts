import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { syncShopifyOrder } from "@/lib/shopify/order-sync-utils"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"

// Constants
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Types
interface ShopifyLineItem {
  id: number
  variant_id: number | null
  product_id: number | null
  title: string
  quantity: number
  sku: string | null
  vendor: string
  price: string
  total_discount: string
  fulfillment_status: string | null
  tax_lines: any[]
}

interface ShopifyOrder {
  id: number
  order_number: number
  name: string
  email: string | null
  processed_at: string
  created_at: string
  updated_at: string
  cancelled_at: string | null
  closed_at: string | null
  cancel_reason: string | null
  financial_status: string
  fulfillment_status: string | null
  current_total_price: string
  subtotal_price: string
  total_tax: string
  currency: string
  tags: string
  status: string
  customer: {
    id: number
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
  } | null
  shipping_address: {
    first_name: string | null
    last_name: string | null
    address1: string | null
    address2: string | null
    city: string | null
    province: string | null
    country: string | null
    zip: string | null
    phone: string | null
  } | null
  billing_address: {
    first_name: string | null
    last_name: string | null
    phone: string | null
  } | null
  line_items: ShopifyLineItem[]
  checkout_token?: string
  cart_token?: string
}

interface SyncLog {
  created_at: string
  type: string
}

interface SyncResult {
  order_id: string
  order_number: string
  updated: boolean
  changes: string[]
  errors: string[]
}

/**
 * Fetch all orders from Shopify since a specific date
 */
async function fetchAllOrdersFromShopify(sinceDate: Date): Promise<ShopifyOrder[]> {
  let allOrders: ShopifyOrder[] = [];
  let hasNextPage = true;
  let nextPageUrl: string | null = `https://${SHOPIFY_SHOP}/admin/api/2024-01/orders.json?status=any&updated_at_min=${sinceDate.toISOString()}&limit=250`;

  while (hasNextPage && nextPageUrl) {
    try {
      const response = await fetch(nextPageUrl, {
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN!,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const orders = data.orders as ShopifyOrder[];
      allOrders = allOrders.concat(orders);

      // Check for pagination
      const linkHeader: string | null = response.headers.get("link");
      if (linkHeader) {
        const match: RegExpMatchArray | null = linkHeader.match(/<([^>]+)>; rel="next"/);
        nextPageUrl = match ? match[1] : null;
        hasNextPage = !!nextPageUrl;
      } else {
        hasNextPage = false;
      }

      console.log(`[Cron] Fetched ${orders.length} orders, total: ${allOrders.length}`);
    } catch (error) {
      console.error("[Cron] Error fetching orders:", error);
      throw error;
    }
  }

  return allOrders;
}

/**
 * Sync a single order from database with Shopify
 */
async function syncOrderFromDatabaseWithShopify(
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

    const response = await fetch(
      `https://${SHOPIFY_SHOP}/admin/api/2024-01/orders/${shopifyOrderId}.json?status=any`,
      {
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN!,
          "Content-Type": "application/json",
        },
      }
    )

    if (response.ok) {
      const data = await response.json()
      shopifyOrder = data.order
    } else if (response.status === 404) {
      result.errors.push("Order not found in Shopify")
      await supabase.from("orders").update({ archived: true, updated_at: new Date().toISOString() }).eq("id", dbOrder.id)
      return result
    }

    if (shopifyOrder) {
      const syncRes = await syncShopifyOrder(supabase, shopifyOrder, { forceWarehouseSync: false })
      if (syncRes.success) {
        result.updated = true
        result.changes = syncRes.results || ["Synced with Shopify"]
      } else {
        result.errors.push(`Sync failed: ${syncRes.error}`)
      }
    }
  } catch (err: any) {
    result.errors.push(`Unhandled error: ${err.message}`)
  }

  return result
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      if (process.env.NODE_ENV !== "development") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const results = {
      synced_shopify: 0,
      updated_database: 0,
      errors: 0,
    }

    let startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);

    const { data: lastSync } = await db
      .from("sync_logs")
      .select("created_at")
      .eq("type", "cron_job")
      .order("created_at", { ascending: false })
      .limit(1);

    if (lastSync && lastSync.length > 0) {
      const lastSyncDate = new Date((lastSync[0] as SyncLog).created_at);
      lastSyncDate.setMinutes(lastSyncDate.getMinutes() - 10);
      startDate = lastSyncDate;
    }

    const orders = await fetchAllOrdersFromShopify(startDate);
    
    if (orders.length > 0) {
      for (const order of orders) {
        const syncRes = await syncShopifyOrder(db, order, { forceWarehouseSync: true })
        if (syncRes.success) {
          results.synced_shopify++;
        } else {
          results.errors++;
        }
      }
    }

    // Check recent non-archived orders for updates
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentOrders } = await db
      .from("orders")
      .select("id, order_number")
      .eq("archived", false)
      .gte("processed_at", sevenDaysAgo.toISOString())
      .limit(100)

    if (recentOrders) {
      for (const dbOrder of recentOrders) {
        if (orders.some(o => String(o.id) === dbOrder.id)) continue
        const syncResult = await syncOrderFromDatabaseWithShopify(dbOrder, db)
        if (syncResult.updated) results.updated_database++
      }
    }

    await db.from("sync_logs").insert({
      type: "cron_job",
      details: results,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json(results)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

