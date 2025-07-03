import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env";
// import { supabase } from "/dev/null"; // Uncomment if DB enrichment is needed later

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const { orderId } = params;

  if (!orderId) {
    return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
  }

  if (!SHOPIFY_SHOP || !SHOPIFY_ACCESS_TOKEN) {
    console.error("Shopify credentials are not configured.");
    return NextResponse.json(
      { error: "Shopify credentials not configured" },
      { status: 500 }
    );
  }

  const shopifyOrderUrl = `https://${SHOPIFY_SHOP}/admin/api/2023-10/orders/${orderId}.json`;

  try {
    console.log(`Fetching order details for ID ${orderId} from: ${shopifyOrderUrl}`);
    const response = await fetch(shopifyOrderUrl, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Failed to fetch order ${orderId} from Shopify: ${response.status} ${errorText}`
      );
      if (response.status === 404) {
        return NextResponse.json({ error: "Order not found in Shopify" }, { status: 404 });
      }
      return NextResponse.json(
        { error: `Shopify API Error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const order = data.order;

    if (!order) {
        console.error(`Order object not found in Shopify response for ID ${orderId}`);
        return NextResponse.json({ error: "Order data not found in Shopify response" }, { status: 404 });
    }

    // TODO: Future enhancement - Enrich with local database information if needed
    // For example, fetch related data from your 'order_line_items' or 'products' table
    // using the order.id or line_item.product_id and merge it here.

    console.log(`Successfully fetched order ${orderId} from Shopify.`)
    return NextResponse.json({ order });

  } catch (error: any) {
    console.error(`Error fetching order ${orderId}:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch order details" },
      { status: 500 }
    );
  }
} 