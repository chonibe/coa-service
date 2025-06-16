import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN, CRON_SECRET } from "@/lib/env"
import { getSupabaseAdmin } from "@/lib/supabase"
import crypto from "crypto"
import type { Json } from "@/types/supabase"

// Simplified type definitions with more explicit typing
type LineItemProperty = {
  name: string;
  value: string;
}

type ShopifyLineItem = {
  id: number;
  product_id: number | null;
  variant_id: number | null;
  title: string;
  sku: string | null;
  vendor: string | null;
  quantity: number;
  price: string;
  total_discount: string | null;
  fulfillment_status: string | null;
  tax_lines: unknown[];
  properties?: LineItemProperty[];
}

type ShopifyOrder = {
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
}

interface SyncLog {
  created_at: string;
  type: string;
  details: Json;
}

// Utility function to extract vendor name
function extractVendorName(lineItem: ShopifyLineItem): string | null {
  const vendorFromProperties = lineItem.properties?.find(
    prop => prop.name.toLowerCase() === 'vendor'
  )?.value;

  return vendorFromProperties || lineItem.vendor || null;
}

// Fetch orders from Shopify
async function fetchAllOrdersFromShopify(startDate: Date): Promise<ShopifyOrder[]> {
  let allOrders: ShopifyOrder[] = [];
  let hasNextPage = true;
  let nextPageUrl: string | null = null;

  while (hasNextPage) {
    try {
      const url = nextPageUrl || 
        `https://${SHOPIFY_SHOP}/admin/api/2024-01/orders.json?status=any&created_at_min=${startDate.toISOString()}&limit=250`;
      
      const response = await fetch(url, {
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
      const linkHeader = response.headers.get("link");
      if (linkHeader) {
        const match = linkHeader.match(/<([^>]+)>; rel="next"/);
        nextPageUrl = match ? match[1] : null;
        hasNextPage = !!nextPageUrl;
      } else {
        hasNextPage = false;
      }
    } catch (error) {
      console.error("[Cron] Error fetching orders:", error);
      throw error;
    }
  }

  return allOrders;
}

export async function GET(request: NextRequest) {
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

    const db = getSupabaseAdmin();
    if (!db) {
      throw new Error("Database client not initialized");
    }

    // Get the last sync timestamp from the database
    let startDate = new Date();
    startDate.setHours(startDate.getHours() - 1); // Default to last hour

    const { data: lastSync, error: syncError } = await db
      .from("sync_logs")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1);

    if (syncError) {
      console.error("Error fetching last sync:", syncError);
      throw syncError;
    }

    // Adjust start date based on last sync
    if (lastSync && lastSync.length > 0 && lastSync[0].created_at) {
      const lastSyncDate = new Date(lastSync[0].created_at);
      lastSyncDate.setMinutes(lastSyncDate.getMinutes() - 5);
      startDate = lastSyncDate;
    }

    // Fetch orders from Shopify
    const orders = await fetchAllOrdersFromShopify(startDate);

    let processedCount = 0;
    let errorCount = 0;

    for (const order of orders) {
      try {
        // Sync order data
        const orderData = {
          id: String(order.id),
          order_number: String(order.order_number),
          processed_at: order.processed_at || order.created_at,
          financial_status: order.financial_status,
          fulfillment_status: order.fulfillment_status,
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
        };

        const { error: orderError } = await db
          .from("orders")
          .upsert(orderData, { onConflict: "id" });

        if (orderError) {
          console.error(`Error syncing order ${order.name}:`, orderError);
          errorCount++;
          continue;
        }

        // Sync line items
        if (order.line_items && order.line_items.length > 0) {
          // Fetch product data for img_urls
          const productIds = order.line_items
            .map(li => li.product_id)
            .filter((id): id is number => id !== null);

          const { data: products } = await db
            .from("products")
            .select("id, img_url")
            .in("id", productIds);

          const productMap = new Map(
            products?.map(p => [String(p.id), p.img_url || null]) || []
          );

          // Process each line item
          for (const lineItem of order.line_items) {
            try {
              const lineItemData = {
                line_item_id: String(lineItem.id),
                order_id: String(order.id),
                order_name: order.name,
                product_id: lineItem.product_id ? String(lineItem.product_id) : null,
                title: lineItem.title,
                vendor_name: extractVendorName(lineItem),
                quantity: lineItem.quantity,
                price: parseFloat(lineItem.price),
                status: 'active',
                img_url: lineItem.product_id 
                  ? productMap.get(String(lineItem.product_id)) || null 
                  : null,
              };

              const { error: lineItemError } = await db
                .from("order_line_items")
                .upsert(lineItemData, { onConflict: "line_item_id" });

              if (lineItemError) {
                console.error(`Error syncing line item ${lineItem.id}:`, lineItemError);
                errorCount++;
              } else {
                processedCount++;
              }
            } catch (lineItemProcessError) {
              console.error(`Error processing line item ${lineItem.id}:`, lineItemProcessError);
              errorCount++;
            }
          }
        }
      } catch (orderProcessError) {
        console.error(`Error processing order ${order.name}:`, orderProcessError);
        errorCount++;
      }
    }

    // Log sync results
    const syncLog = {
      type: "cron_job",
      details: {
        orders_synced: processedCount,
        errors: errorCount,
        start_date: startDate.toISOString(),
        end_date: new Date().toISOString(),
      } as Json,
    };

    const { error: logError } = await db.from("sync_logs").insert(syncLog);
    if (logError) {
      console.error("Error logging sync:", logError);
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      errors: errorCount,
    });
  } catch (error) {
    console.error("[Cron] Sync error:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "An unexpected error occurred",
        details: error 
      }, 
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
    const { error: updateError } = await getSupabaseAdmin()
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

async function processLineItem(order: ShopifyOrder, lineItem: ShopifyLineItem) {
  const db = getSupabaseAdmin();
  if (!db) {
    throw new Error("Database client not initialized");
  }

  try {
    const orderId = order.id.toString()
    const lineItemId = lineItem.id.toString()
    const productId = lineItem.product_id?.toString() || null
    // Extract vendor name from line item properties or vendor field
    const vendorName = 
      lineItem.properties?.find(prop => prop.name.toLowerCase() === 'vendor')?.value || 
      lineItem.vendor || 
      null

    console.log(`Processing line item ${lineItemId} for product ${productId}, vendor: ${vendorName || "Unknown"}`)

    // Fetch product metafields to get edition size
    const { editionSize } = await getProductMetafields(productId)
    console.log(`Edition size for product ${productId}: ${editionSize || "Not set"}`)

    // Check if this line item already exists in the database
    const { data: existingItems, error: queryError } = await db
      .from("order_line_items")
      .select("*")
      .eq("line_item_id", lineItemId)
      .single();

    if (queryError && queryError.code !== 'PGRST116') {
      throw queryError;
    }

    if (existingItems) {
      console.log(`Line item ${lineItemId} already exists in database, skipping`)

      // Update vendor_name if it's available and not set previously
      if (vendorName && !existingItems.vendor_name) {
        const { error: updateError } = await db
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
      if (!existingItems.certificate_url) {
        await generateCertificateUrl(lineItemId, orderId)
      }

      return
    }

    // Insert the new line item
    const { error: insertError } = await db.from("order_line_items").insert({
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
    const { data: activeItems, error } = await getSupabaseAdmin()
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
      const { error: updateError } = await getSupabaseAdmin()
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
