import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN, CRON_SECRET } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"
import type { Json } from "@/types/supabase"

interface ShopifyLineItem {
  id: number;
  product_id: number;
  variant_id: number | null;
  title: string;
  sku: string | null;
  vendor: string | null;
  quantity: number;
  price: string;
  total_discount: string | null;
  fulfillment_status: string | null;
  tax_lines: any[];
}

interface ShopifyOrder {
  id: number;
  order_number: number;
  name: string;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  financial_status: string;
  fulfillment_status: string | null;
  current_total_price: string | null;
  currency: string;
  email: string | null;
  customer: { id: number } | null;
  subtotal_price: string | null;
  total_tax: string | null;
  checkout_token: string | null;
  cart_token: string | null;
  line_items: ShopifyLineItem[];
  cancelled_at: string | null;
  closed_at: string | null;
  cancel_reason: string | null;
  tags: string | null;
  status: string | null;
}

interface SyncLog {
  created_at: string;
  type: string;
  details: Json;
}

async function fetchAllOrdersFromShopify(startDate: Date): Promise<ShopifyOrder[]> {
  let allOrders: ShopifyOrder[] = [];
  let hasNextPage = true;
  let nextPageUrl: string | null = null;

  while (hasNextPage) {
    try {
      const url: string = nextPageUrl || 
        `https://${SHOPIFY_SHOP}/admin/api/2024-01/orders.json?status=any&created_at_min=${startDate.toISOString()}&limit=250`;
      
      console.log(`[Cron] Fetching orders from: ${url}`);
      
      const response: Response = await fetch(url, {
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch orders: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const orders = data.orders || [];
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

export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  try {
    // Validate cron secret
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    if (token !== CRON_SECRET) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!supabase) {
      throw new Error("Database client not initialized");
    }

    const db = supabase; // Create a non-null reference

    // Get the last sync timestamp from the database
    let startDate = new Date();
    startDate.setHours(startDate.getHours() - 1); // Default to last hour

    const { data: lastSync, error: syncError } = await db
      .from("sync_logs")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1);

    if (!syncError && lastSync && lastSync.length > 0) {
      const lastSyncDate = new Date((lastSync[0] as SyncLog).created_at);
      // Add a small buffer to avoid missing orders
      lastSyncDate.setMinutes(lastSyncDate.getMinutes() - 5);
      startDate = lastSyncDate;
    }

    console.log(`[Cron] Fetching orders since ${startDate.toISOString()}`);

    // Fetch all orders from Shopify
    const orders = await fetchAllOrdersFromShopify(startDate);
    console.log(`[Cron] Found ${orders.length} orders to sync`);

    let processedCount = 0;
    let errorCount = 0;

    // Sync orders to database
    if (orders.length > 0) {
      for (const order of orders) {
        try {
          // Sync order data - Shopify is the source of truth
          // Determine archived status from Shopify
          const shopifyTags = (order.tags || "").toLowerCase()
          const shopifyArchived = 
            shopifyTags.includes("archived") || 
            order.closed_at !== null ||
            order.cancel_reason !== null

          const orderData = {
            id: String(order.id),
            order_number: String(order.order_number),
            processed_at: order.processed_at || order.created_at,
            financial_status: order.financial_status, // Shopify is source of truth
            fulfillment_status: order.fulfillment_status, // Shopify is source of truth
            total_price: order.current_total_price ? parseFloat(order.current_total_price) : null,
            currency_code: order.currency,
            customer_email: order.email,
            updated_at: order.updated_at,
            customer_id: order.customer?.id || null,
            shopify_id: String(order.id),
            subtotal_price: order.subtotal_price ? parseFloat(order.subtotal_price) : null,
            total_tax: order.total_tax ? parseFloat(order.total_tax) : null,
            customer_reference: order.checkout_token || order.cart_token || null,
            raw_shopify_order_data: order as unknown as Json,
            created_at: order.created_at,
            cancelled_at: order.cancelled_at || null, // Shopify is source of truth
            archived: shopifyArchived, // Shopify is source of truth
            shopify_order_status: order.status || null, // Shopify is source of truth
          };

          const { error: orderError } = await db
            .from("orders")
            .upsert(orderData, { onConflict: "id" });

          if (orderError) {
            console.error(`[Cron] Error syncing order ${order.name}:`, orderError);
            errorCount++;
            continue;
          }

          // Update line items based on Shopify cancellation status (Shopify is source of truth)
          const shopifyCancelled = !!order.cancelled_at
          if (shopifyCancelled) {
            // Order is cancelled in Shopify - mark line items as inactive
            const { error: lineItemsError } = await db
              .from("order_line_items_v2")
              .update({ 
                status: "inactive",
                updated_at: new Date().toISOString()
              })
              .eq("order_id", String(order.id))
              .eq("status", "active")

            if (lineItemsError) {
              console.error(`[Cron] Error updating line items for cancelled order ${order.name}:`, lineItemsError);
            }
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

            const lineItemsData = order.line_items.map((li: ShopifyLineItem) => ({
              line_item_id: li.id,
              order_id: order.id,
              product_id: li.product_id,
              variant_id: li.variant_id,
              title: li.title,
              sku: li.sku || null,
              vendor_name: li.vendor,
              quantity: li.quantity,
              price: parseFloat(li.price),
              total_discount: li.total_discount ? parseFloat(li.total_discount) : null,
              fulfillment_status: li.fulfillment_status,
              tax_lines: li.tax_lines as unknown as Json,
              raw_shopify_line_item_data: li as unknown as Json,
              img_url: li.product_id ? productMap.get(li.product_id.toString()) || null : null,
            }));

            // Delete existing line items for this order
            await db
              .from("order_line_items")
              .delete()
              .match({ order_id: order.id });

            // Insert new line items
            const { error: lineItemsError } = await db
              .from("order_line_items")
              .insert(lineItemsData);

            if (lineItemsError) {
              console.error(`[Cron] Error syncing line items for order ${order.name}:`, lineItemsError);
              errorCount++;
              continue;
            }
          }

          processedCount++;
        } catch (error) {
          console.error(`[Cron] Error processing order ${order.name}:`, error);
          errorCount++;
        }
      }

      // Log successful sync
      const syncLog = {
        type: "cron_job",
        details: {
          orders_synced: processedCount,
          errors: errorCount,
          start_date: startDate.toISOString(),
          end_date: new Date().toISOString(),
          period: `${startDate.toISOString()} to ${new Date().toISOString()}`,
        } as Json,
      };

      const { error: logError } = await db.from("sync_logs").insert(syncLog);
      if (logError) {
        console.error("[Cron] Error logging sync:", logError);
      }
    }

    return NextResponse.json({
      success: true,
      orders_synced: processedCount,
      errors: errorCount,
      start_date: startDate.toISOString(),
      end_date: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Cron] Error in sync-shopify-orders:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Replace the entire fetchOrdersFromShopify function with this simplified version
async function fetchOrdersFromShopify(startDate: Date) {
  let allOrders = []

  try {
    // Create a simple URL without pagination parameters
    const url = `https://${SHOPIFY_SHOP}/admin/api/2023-10/orders.json?limit=250&created_at_min=${startDate.toISOString()}&status=any`
    console.log(`Fetching orders from: ${url}`)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch orders: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    allOrders = data.orders || []
    console.log(`Successfully fetched ${allOrders.length} orders`)

    // We'll implement proper pagination in a future update
    // For now, just return the first batch of orders
  } catch (error) {
    console.error("Error in fetchOrdersFromShopify:", error)
    // Return empty array instead of throwing to prevent the entire function from failing
    return []
  }

  return allOrders
}

/**
 * Process a Shopify order and update edition numbers
 */
async function processShopifyOrder(order: any) {
  try {
    console.log(`Processing order ${order.id} (${order.name})`)

    // Check if this order contains any line items for limited edition products
    const limitedEditionItems = order.line_items.filter((item: any) => {
      // Check if this is a limited edition product
      // You may need to adjust this logic based on how you identify limited edition products
      const isLimitedEdition = item.properties?.some(
        (prop: any) => prop.name === "limited_edition" && prop.value === "true",
      )

      return isLimitedEdition
    })

    if (limitedEditionItems.length === 0) {
      console.log(`Order ${order.id} does not contain any limited edition items`)
      return
    }

    console.log(`Found ${limitedEditionItems.length} limited edition items in order ${order.id}`)

    // Process each limited edition item
    for (const item of limitedEditionItems) {
      await processLineItem(order, item)
    }

    console.log(`Finished processing order ${order.id}`)
  } catch (error) {
    console.error(`Error processing order ${order.id}:`, error)
    throw error
  }
}

// Update the generateCertificateUrl function to use query parameters
async function generateCertificateUrl(lineItemId: string, orderId: string) {
  try {
    // Generate the certificate URL with query parameters instead of path
    const baseUrl =
      process.env.NEXT_PUBLIC_CUSTOMER_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com"
    const certificateUrl = `${baseUrl}/pages/certificate?line_item_id=${lineItemId}`

    // Generate a unique access token
    const accessToken = crypto.randomUUID()

    // Store the certificate URL and access token in the database
    const { error: updateError } = await supabase
      .from("order_line_items")
      .update({
        certificate_url: certificateUrl,
        certificate_token: accessToken,
        certificate_generated_at: new Date().toISOString(),
      })
      .eq("line_item_id", lineItemId)
      .eq("order_id", orderId)

    if (updateError) {
      console.error(`Error updating line item with certificate URL:`, updateError)
      return false
    }

    console.log(`Successfully generated certificate URL for line item ${lineItemId}`)
    return true
  } catch (error) {
    console.error(`Error generating certificate URL:`, error)
    return false
  }
}

// Update the processLineItem function to include vendor_name

async function processLineItem(order: any, lineItem: any) {
  try {
    const orderId = order.id.toString()
    const lineItemId = lineItem.id.toString()
    const productId = lineItem.product_id.toString()
    // Extract vendor name from line item properties or vendor field
    const vendorName =
      lineItem.vendor ||
      (lineItem.properties && lineItem.properties.find((p: any) => p.name === "vendor")?.value) ||
      null

    console.log(`Processing line item ${lineItemId} for product ${productId}, vendor: ${vendorName || "Unknown"}`)

    // Fetch product metafields to get edition size
    const { editionSize } = await getProductMetafields(productId)
    console.log(`Edition size for product ${productId}: ${editionSize || "Not set"}`)

    // Check if this line item already exists in the database
    const { data: existingItems, error: queryError } = await supabase
      .from("order_line_items")
      .select("*")
      .eq("order_id", orderId)
      .eq("line_item_id", lineItemId)

    if (queryError) {
      console.error(`Error checking existing line item:`, queryError)
      throw queryError
    }

    if (existingItems && existingItems.length > 0) {
      console.log(`Line item ${lineItemId} already exists in database, skipping`)

      // Update vendor_name if it's available and not set previously
      if (vendorName && !existingItems[0].vendor_name) {
        const { error: updateError } = await supabase
          .from("order_line_items")
          .update({
            vendor_name: vendorName,
            updated_at: new Date().toISOString(),
          })
          .eq("line_item_id", lineItemId)
          .eq("order_id", orderId)

        if (updateError) {
          console.error(`Error updating vendor name:`, updateError)
        } else {
          console.log(`Updated vendor name to ${vendorName} for line item ${lineItemId}`)
        }
      }

      // Check if it has a certificate URL, if not, generate one
      if (!existingItems[0].certificate_url) {
        await generateCertificateUrl(lineItemId, orderId)
      }

      return
    }

    // Insert the new line item
    const { error: insertError } = await supabase.from("order_line_items").insert({
      order_id: orderId,
      order_name: order.name,
      line_item_id: lineItemId,
      product_id: productId,
      variant_id: lineItem.variant_id?.toString(),
      vendor_name: vendorName, // Add vendor name to the insert
      // Don't set edition_number here, it will be assigned during resequencing
      edition_total: editionSize, // Add the edition_total from the metafield
      created_at: new Date(order.created_at).toISOString(),
      updated_at: new Date().toISOString(),
      status: "active",
    })

    if (insertError) {
      console.error(`Error inserting line item:`, insertError)
      throw insertError
    }

    console.log(`Successfully inserted line item ${lineItemId} with vendor ${vendorName || "Unknown"}`)

    // Generate certificate URL for the new line item
    await generateCertificateUrl(lineItemId, orderId)

    // Resequence edition numbers for this product
    await resequenceEditionNumbers(productId)

    console.log(`Successfully processed line item ${lineItemId}`)
  } catch (error) {
    console.error(`Error processing line item:`, error)
    throw error
  }
}

/**
 * Resequence edition numbers for a product
 */
async function resequenceEditionNumbers(productId: string) {
  try {
    console.log(`Resequencing edition numbers for product ${productId}`)

    // Get all active line items for this product, ordered by creation date
    const { data: activeItems, error } = await supabase
      .from("order_line_items")
      .select("*")
      .eq("product_id", productId)
      .eq("status", "active")
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching active items for resequencing:", error)
      throw error
    }

    if (!activeItems || activeItems.length === 0) {
      console.log("No active items found for resequencing")
      return
    }

    console.log(`Found ${activeItems.length} active items to resequence`)

    // Assign new sequential edition numbers starting from 1
    let editionCounter = 1

    for (const item of activeItems) {
      const { error: updateError } = await supabase
        .from("order_line_items")
        .update({
          edition_number: editionCounter,
          // Don't update edition_total here, preserve the existing value
          updated_at: new Date().toISOString(),
        })
        .eq("line_item_id", item.line_item_id)
        .eq("order_id", item.order_id)

      if (updateError) {
        console.error(`Error updating edition number for item ${item.line_item_id}:`, updateError)
      } else {
        console.log(`Updated item ${item.line_item_id} with new edition number ${editionCounter}`)
        editionCounter++
      }
    }

    console.log(`Resequencing complete. Assigned edition numbers 1 through ${editionCounter - 1}`)
  } catch (error) {
    console.error("Error in resequenceEditionNumbers:", error)
    throw error
  }
}

// Add this new function to fetch product metafields including Edition Size
async function getProductMetafields(productId: string) {
  try {
    const url = `https://${SHOPIFY_SHOP}/admin/api/2023-10/products/${productId}/metafields.json`
    console.log(`Fetching metafields for product ${productId}`)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch product metafields: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    const metafields = data.metafields || []

    // Look for Edition Size metafield with various possible keys
    const editionSizeMetafield = metafields.find(
      (meta: any) =>
        meta.key.toLowerCase() === "edition_size" ||
        meta.key.toLowerCase() === "edition size" ||
        meta.key.toLowerCase() === "limited_edition_size" ||
        meta.key.toLowerCase() === "total_edition",
    )

    let editionSize = null
    if (editionSizeMetafield && editionSizeMetafield.value) {
      // Try to parse the edition size as a number
      const sizeValue = Number.parseInt(editionSizeMetafield.value, 10)
      if (!isNaN(sizeValue) && sizeValue > 0) {
        editionSize = sizeValue
      }
    }

    return {
      editionSize,
      allMetafields: metafields,
    }
  } catch (error) {
    console.error(`Error fetching metafields for product ${productId}:`, error)
    return {
      editionSize: null,
      allMetafields: [],
    }
  }
}
