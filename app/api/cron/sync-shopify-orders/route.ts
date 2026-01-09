import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createChinaDivisionClient } from "@/lib/china-division/client"

// Constants
const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP_DOMAIN
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Types
type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

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
 * Uses the same logic as the admin sync endpoint
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

    // Try fetching by order ID first
    try {
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
        // Order not found in Shopify - mark as archived
        result.errors.push("Order not found in Shopify (may be deleted/archived)")
        // Mark order as archived in database
        await supabase
          .from("orders")
          .update({ archived: true, updated_at: new Date().toISOString() })
          .eq("id", dbOrder.id)
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
                  "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN!,
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
      // Mark as archived
      await supabase
        .from("orders")
        .update({ archived: true, updated_at: new Date().toISOString() })
        .eq("id", dbOrder.id)
      return result
    }

    // Prepare update object - Shopify is the source of truth
    const updates: any = {}
    const changes: string[] = []

    // 1. Sync financial_status from Shopify
    const shopifyFinancialStatus = shopifyOrder.financial_status || null
    if (dbOrder.financial_status !== shopifyFinancialStatus) {
      updates.financial_status = shopifyFinancialStatus
      changes.push(`Financial Status: ${dbOrder.financial_status || "null"} → ${shopifyFinancialStatus || "null"}`)
    }

    // 2. Sync fulfillment_status from Shopify
    const shopifyFulfillmentStatus = shopifyOrder.fulfillment_status || null
    if (dbOrder.fulfillment_status !== shopifyFulfillmentStatus) {
      updates.fulfillment_status = shopifyFulfillmentStatus
      changes.push(`Fulfillment Status: ${dbOrder.fulfillment_status || "null"} → ${shopifyFulfillmentStatus || "null"}`)
    }

    // 3. Sync cancelled_at from Shopify
    const shopifyCancelledAt = shopifyOrder.cancelled_at || null
    const dbCancelledAt = dbOrder.cancelled_at || null
    
    let cancelledAtMatches = false
    if (dbCancelledAt === null && shopifyCancelledAt === null) {
      cancelledAtMatches = true
    } else if (dbCancelledAt !== null && shopifyCancelledAt !== null) {
      const dbTime = new Date(dbCancelledAt).getTime()
      const shopifyTime = new Date(shopifyCancelledAt).getTime()
      cancelledAtMatches = Math.abs(dbTime - shopifyTime) < 1000
    }
    
    if (!cancelledAtMatches) {
      updates.cancelled_at = shopifyCancelledAt
      if (shopifyCancelledAt) {
        changes.push(`Cancelled At: ${dbCancelledAt || "null"} → ${shopifyCancelledAt}`)
      } else {
        changes.push(`Cancelled At: Cleared`)
      }
    }

    // 4. Determine archived status from Shopify
    const shopifyTags = (shopifyOrder.tags || "").toLowerCase()
    const shopifyArchived = 
      shopifyTags.includes("archived") || 
      shopifyOrder.closed_at !== null ||
      shopifyOrder.cancel_reason !== null
    
    if (dbOrder.archived !== shopifyArchived) {
      updates.archived = shopifyArchived
      changes.push(`Archived: ${dbOrder.archived ? "true" : "false"} → ${shopifyArchived ? "true" : "false"}`)
    }

    // 5. Sync shopify_order_status
    const shopifyStatus = shopifyOrder.status || null
    if (dbOrder.shopify_order_status !== shopifyStatus) {
      updates.shopify_order_status = shopifyStatus
      changes.push(`Shopify Status: ${dbOrder.shopify_order_status || "null"} → ${shopifyStatus || "null"}`)
    }

    // 5.5 Set source to shopify (or warehouse if it's a gift)
    const isGift = (shopifyOrder.name || "").toLowerCase().startsWith('simply')
    const targetSource = isGift ? 'warehouse' : 'shopify'
    if (dbOrder.source !== targetSource) {
      updates.source = targetSource
      changes.push(`Source: ${dbOrder.source || "null"} → ${targetSource}`)
    }

    // 5.6 Sync contact info
    const getShopifyName = (order: any) => {
      const sources = [
        order.customer,
        order.shipping_address,
        order.billing_address
      ]
      for (const s of sources) {
        if (s && (s.first_name || s.last_name)) {
          return `${s.first_name || ''} ${s.last_name || ''}`.trim()
        }
      }
      return null
    }

    const shopifyName = getShopifyName(shopifyOrder);
    const shopifyPhone = shopifyOrder.customer?.phone || shopifyOrder.shipping_address?.phone || shopifyOrder.billing_address?.phone || null;
    const shopifyAddress = shopifyOrder.shipping_address || null;

    if (dbOrder.customer_name !== shopifyName) {
      updates.customer_name = shopifyName;
      changes.push(`Name: ${dbOrder.customer_name || "null"} → ${shopifyName || "null"}`);
    }
    if (dbOrder.customer_phone !== shopifyPhone) {
      updates.customer_phone = shopifyPhone;
      changes.push(`Phone: ${dbOrder.customer_phone || "null"} → ${shopifyPhone || "null"}`);
    }
    if (JSON.stringify(dbOrder.shipping_address) !== JSON.stringify(shopifyAddress)) {
      updates.shipping_address = shopifyAddress;
      changes.push(`Address updated`);
    }

    // 6. Always update raw_shopify_order_data and updated_at to keep in sync
    updates.raw_shopify_order_data = shopifyOrder
    updates.updated_at = new Date().toISOString()

    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from("orders")
        .update(updates)
        .eq("id", dbOrder.id)

      if (updateError) {
        result.errors.push(`Error updating database: ${updateError.message}`)
      } else {
        result.updated = true
        result.changes = changes
      }
    }

  } catch (err: any) {
    result.errors.push(`Unhandled error: ${err.message}`)
  }

  return result
}

export async function GET(req: NextRequest) {
  try {
    // Auth Check
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Allow local development without secret
      if (process.env.NODE_ENV !== "development") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const results = {
      synced_shopify: 0,
      updated_database: 0,
      errors: 0,
      details: [] as any[],
    }

    // 1. Fetch new/updated orders from Shopify
    let startDate = new Date();
    startDate.setDate(startDate.getDate() - 1); // Default to last 24 hours

    // Get last sync time from logs
    const { data: lastSync, error: syncError } = await db
      .from("sync_logs")
      .select("created_at")
      .eq("type", "cron_job")
      .order("created_at", { ascending: false })
      .limit(1);

    if (!syncError && lastSync && lastSync.length > 0) {
      const lastSyncDate = new Date((lastSync[0] as SyncLog).created_at);
      // Add a small buffer to avoid missing orders
      lastSyncDate.setMinutes(lastSyncDate.getMinutes() - 5);
      startDate = lastSyncDate;
    }

    console.log(`[Cron] Fetching orders from Shopify since ${startDate.toISOString()}`);

    // Fetch all orders from Shopify
    const orders = await fetchAllOrdersFromShopify(startDate);
    console.log(`[Cron] Found ${orders.length} orders to sync from Shopify`);

    const chinaClient = createChinaDivisionClient()

    // Sync orders to database
    if (orders.length > 0) {
      for (const order of orders) {
        try {
          // Pull PII from Warehouse if possible
          let ownerEmail = order.email?.toLowerCase()?.trim() || null
          
          // Helper to extract name from Shopify data
          const getShopifyName = (order: any) => {
            const sources = [
              order.customer,
              order.shipping_address,
              order.billing_address
            ]
            for (const s of sources) {
              if (s && (s.first_name || s.last_name)) {
                return `${s.first_name || ''} ${s.last_name || ''}`.trim()
              }
            }
            return null
          }

          let ownerName = getShopifyName(order)
          let ownerPhone = order.customer?.phone || order.shipping_address?.phone || order.billing_address?.phone || null;
          let ownerAddress = order.shipping_address || order.billing_address || null;
          
          try {
            console.log(`[Cron] Pulling warehouse PII for order ${order.name}...`);
            const warehouseOrders = await chinaClient.getOrdersInfo(
              new Date(new Date(order.created_at).getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days before
              new Date(new Date(order.created_at).getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]  // 2 days after
            );
            
            const matched = warehouseOrders.find(o => o.order_id === order.name || o.order_id === order.id.toString());
            
            if (matched) {
              ownerEmail = matched.ship_email?.toLowerCase()?.trim() || ownerEmail;
              ownerName = matched.ship_name?.trim() || ownerName;
              ownerPhone = matched.ship_phone || ownerPhone;
              ownerAddress = matched.ship_address || ownerAddress;
              
              // Store in warehouse_orders cache
              await db.from('warehouse_orders').upsert({
                id: matched.sys_order_id || matched.order_id,
                order_id: matched.order_id,
                shopify_order_id: order.id.toString(),
                ship_email: ownerEmail,
                ship_name: ownerName,
                ship_phone: ownerPhone,
                ship_address: ownerAddress as any,
                raw_data: matched as any,
                updated_at: new Date().toISOString()
              }, { onConflict: 'id' });
              
              console.log(`[Cron] Successfully matched warehouse PII for ${order.name}: ${ownerEmail}`);
            }
          } catch (cdError) {
            console.warn(`[Cron] Could not pull warehouse PII for ${order.name}:`, cdError);
          }

          const shopifyTags = (order.tags || "").toLowerCase()
          const shopifyArchived = 
            shopifyTags.includes("archived") || 
            order.closed_at !== null ||
            order.cancel_reason !== null

          const isGift = order.name.toLowerCase().startsWith('simply');
          
          const orderData = {
            id: String(order.id),
            order_number: String(order.order_number),
            order_name: order.name,
            processed_at: order.processed_at || order.created_at,
            financial_status: order.financial_status,
            fulfillment_status: order.fulfillment_status,
            total_price: order.current_total_price ? parseFloat(order.current_total_price) : null,
            currency_code: order.currency,
            customer_email: ownerEmail,
            customer_name: ownerName,
            customer_phone: ownerPhone,
            shipping_address: ownerAddress,
            updated_at: order.updated_at,
            customer_id: order.customer?.id || null,
            shopify_id: String(order.id),
            subtotal_price: order.subtotal_price ? parseFloat(order.subtotal_price) : null,
            total_tax: order.total_tax ? parseFloat(order.total_tax) : null,
            customer_reference: order.checkout_token || order.cart_token || null,
            raw_shopify_order_data: order as unknown as Json,
            created_at: order.created_at,
            cancelled_at: order.cancelled_at || null,
            archived: shopifyArchived,
            shopify_order_status: order.status || null,
            source: isGift ? 'warehouse' : 'shopify',
          };

          const { error: orderError } = await db
            .from("orders")
            .upsert(orderData, { onConflict: "id" });

          if (orderError) {
            console.error(`[Cron] Error syncing order ${order.name}:`, orderError);
            results.errors++;
            continue;
          }

          // Update line items based on Shopify cancellation status
          const shopifyCancelled = !!order.cancelled_at
          if (shopifyCancelled) {
            await db
              .from("order_line_items_v2")
              .update({ 
                status: "inactive",
                updated_at: new Date().toISOString()
              })
              .eq("order_id", String(order.id))
              .eq("status", "active")
          }

          // Sync line items
          if (order.line_items && order.line_items.length > 0) {
            // Get product data for img_urls
            const productIds = order.line_items
              .map((li: ShopifyLineItem) => li.product_id)
              .filter((id): id is number => id !== null);

            const { data: products } = await db
              .from("products")
              .select("id, img_url")
              .in("id", productIds);

            const productMap = new Map(
              products?.map((p) => [p.id.toString(), p.img_url]) || []
            );

            // Sync to v2 table
            const v2LineItemsData = order.line_items.map((li: ShopifyLineItem) => ({
              line_item_id: String(li.id),
              order_id: String(order.id),
              order_name: order.name,
              product_id: String(li.product_id),
              variant_id: String(li.variant_id),
              name: li.title,
              description: li.title,
              sku: li.sku || null,
              vendor_name: li.vendor,
              quantity: li.quantity,
              price: parseFloat(li.price),
              fulfillment_status: li.fulfillment_status,
              status: order.cancelled_at ? "inactive" : "active",
              created_at: order.created_at,
              updated_at: new Date().toISOString(),
              img_url: li.product_id ? productMap.get(li.product_id.toString()) || null : null,
              owner_email: ownerEmail || null,
              owner_name: ownerName || null,
            }));

            await db.from("order_line_items_v2").upsert(v2LineItemsData, { onConflict: "line_item_id" });
          }

          results.synced_shopify++;
        } catch (err) {
          console.error(`[Cron] Error processing order ${order.name}:`, err);
          results.errors++;
        }
      }
    }

    // 2. Also check existing database orders that might need updating
    // Only check orders from the last 7 days that are not archived
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentOrders, error: recentError } = await db
      .from("orders")
      .select("*")
      .eq("archived", false)
      .gte("processed_at", sevenDaysAgo.toISOString())
      .order("processed_at", { ascending: false })
      .limit(50)

    if (!recentError && recentOrders) {
      for (const dbOrder of recentOrders) {
        // Skip orders we already synced in this run
        if (orders.some(o => String(o.id) === dbOrder.id)) continue

        const syncResult = await syncOrderFromDatabaseWithShopify(dbOrder, db)
        if (syncResult.updated) {
          results.updated_database++
        }
        if (syncResult.errors.length > 0) {
          results.errors++
        }
      }
    }

    // 3. Log the sync
    await db.from("sync_logs").insert({
      type: "cron_job",
      details: results,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json(results)
  } catch (error: any) {
    console.error("[Cron] Unhandled error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
