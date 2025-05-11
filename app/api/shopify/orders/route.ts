import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"
import type { Json } from "@/types/supabase"; // Assuming Json type is exported from supabase types

interface ShopifyCustomer {
  id: number;
  // We will still receive other fields from Shopify within the order object,
  // but we won't map them to our 'customers' table columns other than 'id'.
  // The 'raw_shopify_customer_data' was also removed from DB sync.
  created_at?: string; // Keep if your DB table has this and it's non-nullable
  updated_at?: string; // Keep if your DB table has this and it's non-nullable
  [key: string]: any; // Allow other properties from Shopify's response
}

interface ShopifyAddress {
  address1: string | null;
  address2: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  zip: string | null;
  phone: string | null;
  name: string | null;
  // other address fields
  [key: string]: any;
}


interface ShopifyLineItem {
  id: number;
  variant_id: number;
  title: string;
  quantity: number;
  price: string;
  sku: string;
  vendor: string;
  properties: any[];
}

interface ShopifyOrder {
  id: number; // Shopify Order ID
  name: string; // Shopify Order Name (e.g., #1260)
  order_number: number; // Shopify order_number field
  processed_at: string | null; // Added for mapping
  email: string | null; // Added for mapping (top-level email on order)
  created_at: string;
  updated_at: string;
  financial_status: string;
  fulfillment_status: string | null;
  currency: string; // Will be mapped to currency_code
  current_total_price: string; // Comes as string
  subtotal_price: string; // Comes as string
  total_tax: string | null; // Comes as string
  total_discounts: string; // Source for total_discounts if needed, but not in user's final table schema
  order_status_url: string | null; // Source for order_status_url if needed, but not in user's table
  customer: ShopifyCustomer | null;
  line_items: Array<ShopifyLineItem>;
  checkout_token: string | null; // Added for mapping to customer_reference
  cart_token: string | null; // Alternative for customer_reference
  shipping_lines?: Array<{price: string; [key:string]: any}>; // Keep for total_shipping_price calculation if ever re-added
  [key: string]: any; // Allow other properties from Shopify
}

interface DatabaseOrder { // For your local 'orders' table, if you enrich top-level info
  order_id: string;
  order_name: string;
  // other fields you might sync to your main 'orders' table
  created_at: string;
  updated_at: string;
  financial_status?: string;
  email?: string;
}

interface LineItemData {
  order_id: string;
  shopify_line_item_id: number;
  variant_id: number;
  title: string;
  quantity: number;
  price: number;
  sku: string;
  vendor: string;
  properties: any[];
  product_id?: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";
    const cursor = searchParams.get("cursor") || null;
    const limit = parseInt(searchParams.get("limit") || "20");
    const lastUpdated = searchParams.get("lastUpdated") || null;

    // First, try to get orders from Supabase
    if (supabase) {
      let query = supabase
        .from("order_items")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      // Apply filters
      if (status !== "all") {
        query = query.eq("status", status);
      }
      if (search) {
        query = query.ilike("order_name", `%${search}%`);
      }
      if (lastUpdated) {
        query = query.gt("updated_at", lastUpdated);
      }

      const { data: supabaseData, error: supabaseError } = await query;

      if (!supabaseError && supabaseData) {
        // Transform Supabase data to match the expected format
        const transformedOrders = transformSupabaseDataToOrders(supabaseData);
        return NextResponse.json({
          orders: transformedOrders,
          pagination: {
            nextCursor: null,
            hasNextPage: false
          }
        });
      }
    }

    // If Supabase fails or is not available, fall back to Shopify API
    const shopifyOrders = await fetchOrdersFromShopify();
    const transformedOrders = transformShopifyOrdersToOrders(shopifyOrders);
    
    // Sync to Supabase in the background
    if (supabase) {
      syncShopifyDataToSupabase(shopifyOrders).catch(error => {
        console.error("Background sync failed:", error);
      });
    }

    return NextResponse.json({
      orders: transformedOrders,
      pagination: {
        nextCursor: null,
        hasNextPage: false
      }
    });
  } catch (error: any) {
    console.error("Error in orders API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// New endpoint for checking updates
export async function POST(request: NextRequest) {
  try {
    const { lastUpdated } = await request.json();
    
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 503 }
      );
    }

    const { data, error } = await supabase
      .from("order_items")
      .select("*")
      .gt("updated_at", lastUpdated)
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    const transformedOrders = transformSupabaseDataToOrders(data || []);
    return NextResponse.json({
      orders: transformedOrders,
      hasUpdates: transformedOrders.length > 0
    });
  } catch (error: any) {
    console.error("Error checking for updates:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

async function syncShopifyDataToSupabase(orders: ShopifyOrder[]) {
  if (!supabase) {
    console.error("Supabase client is not initialized. Cannot sync data.");
    return;
  }
  console.log(`[DB Sync] Starting sync for ${orders.length} orders.`);

  let errors = 0;

  for (const shopifyOrder of orders) {
    try {
      let customerIdForOrderTable: number | null = null;
      if (shopifyOrder.customer && typeof shopifyOrder.customer.id === 'number') {
        customerIdForOrderTable = shopifyOrder.customer.id;
      }

      const orderData = {
        id: String(shopifyOrder.id),
        order_number: String(shopifyOrder.order_number),
        processed_at: shopifyOrder.processed_at || shopifyOrder.created_at,
        financial_status: shopifyOrder.financial_status,
        fulfillment_status: shopifyOrder.fulfillment_status,
        total_price: shopifyOrder.current_total_price ? parseFloat(shopifyOrder.current_total_price) : null,
        currency_code: shopifyOrder.currency,
        customer_email: shopifyOrder.email,
        updated_at: shopifyOrder.updated_at,
        customer_id: customerIdForOrderTable,
        shopify_id: String(shopifyOrder.id),
        subtotal_price: shopifyOrder.subtotal_price ? parseFloat(shopifyOrder.subtotal_price) : null,
        total_tax: shopifyOrder.total_tax ? parseFloat(shopifyOrder.total_tax) : null,
        customer_reference: shopifyOrder.checkout_token || shopifyOrder.cart_token || null,
        raw_shopify_order_data: shopifyOrder as unknown as Json,
        created_at: shopifyOrder.created_at,
      };
      
      const { data: syncedOrder, error: orderError } = await supabase
        .from('orders')
        .upsert(orderData)
        .select()
        .single();

      if (orderError || !syncedOrder) {
        console.error('[Order Sync] Error syncing order:', orderError);
        errors++;
        continue;
      }

      // Process line items
      for (const lineItem of shopifyOrder.line_items) {
        const lineItemData: Record<string, unknown> = {
          order_id: syncedOrder.id,
          shopify_line_item_id: lineItem.id,
          variant_id: lineItem.variant_id,
          title: lineItem.title,
          quantity: lineItem.quantity,
          price: parseFloat(lineItem.price),
          sku: lineItem.sku || '',
          vendor: lineItem.vendor || '',
          properties: lineItem.properties || []
        };

        // Try to find the associated product
        if (lineItem.variant_id) {
          const { data: product } = await supabase
            .from('products')
            .select('id')
            .eq('variant_id', lineItem.variant_id)
            .single();

          if (product?.id) {
            lineItemData.product_id = product.id;
          }
        }

        const { error: lineItemError } = await supabase
          .from('order_items')
          .upsert(lineItemData);

        if (lineItemError) {
          console.error('[Order Sync] Error syncing line item:', lineItemError);
          errors++;
        }
      }
    } catch (e: any) {
      console.error(`[DB Sync] Overall error processing order ${shopifyOrder.name}: ${e.message}`, e);
    }
  }
  console.log("[DB Sync] Finished sync process. Errors:", errors);
}

// Helper function to fetch orders from Shopify
async function fetchOrdersFromShopify() {
  const response = await fetch(
    `https://${SHOPIFY_SHOP}/admin/api/2024-01/orders.json?status=any&limit=250`,
    {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch orders from Shopify: ${response.statusText}`);
  }

  const data = await response.json();
  return data.orders;
}

// Helper function to transform Shopify orders to our format
function transformShopifyOrdersToOrders(shopifyOrders: any[]) {
  return shopifyOrders.map(order => ({
    id: order.id.toString(),
    order_id: order.id.toString(),
    order_name: order.name,
    created_at: order.created_at,
    updated_at: order.updated_at,
    financial_status: order.financial_status,
    customer: order.customer ? {
      first_name: order.customer.first_name,
      last_name: order.customer.last_name
    } : null,
    line_items: order.line_items.map((li: any) => ({
      id: li.id.toString(),
      line_item_id: li.id.toString(),
      product_id: li.product_id.toString(),
      title: li.title,
      quantity: li.quantity,
      price: li.price,
      total: (parseFloat(li.price) * li.quantity).toFixed(2),
      vendor: li.vendor,
      image: li.image?.src || "/placeholder.svg?height=400&width=400",
      tags: [],
      fulfillable: li.fulfillable_quantity > 0,
      is_limited_edition: true,
      total_inventory: "100",
      inventory_quantity: li.fulfillable_quantity,
      status: "active",
      order_info: {
        order_id: order.id.toString(),
        order_number: order.name.replace("#", ""),
        processed_at: order.processed_at,
        fulfillment_status: order.fulfillment_status,
        financial_status: order.financial_status,
      },
    })),
  }));
}

// Helper function to transform Supabase data to orders format
function transformSupabaseDataToOrders(supabaseData: any[]) {
  const orderMap = new Map();

  supabaseData.forEach((item) => {
    if (!orderMap.has(item.order_id)) {
      orderMap.set(item.order_id, {
        id: item.order_id,
        order_id: item.order_id,
        order_name: item.order_name,
        created_at: item.created_at,
        updated_at: item.updated_at,
        financial_status: "paid", // Default value
        line_items: [],
      });
    }

    const order = orderMap.get(item.order_id);
    order.line_items.push({
      id: item.line_item_id,
      line_item_id: item.line_item_id,
      product_id: item.product_id,
      title: `Product ${item.product_id}`,
      quantity: 1,
      price: "0.00",
      total: "0.00",
      vendor: item.vendor_name || "Unknown Vendor",
      image: "/placeholder.svg?height=400&width=400",
      tags: [],
      fulfillable: item.status === "active",
      is_limited_edition: true,
      total_inventory: item.edition_total?.toString() || "100",
      inventory_quantity: 0,
      status: item.status,
      removed_reason: item.removed_reason,
      order_info: {
        order_id: item.order_id,
        order_number: item.order_name?.replace("#", "") || item.order_id,
        processed_at: item.created_at,
        fulfillment_status: "fulfilled",
        financial_status: "paid",
      },
    });
  });

  return Array.from(orderMap.values());
}

// Removed the old mergeOrders and DatabaseOrder/Product enrichment from this file as it's simplified.
// The detailed enrichment now happens in the single order detail API if needed. 