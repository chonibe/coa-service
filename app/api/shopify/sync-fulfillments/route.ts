import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import type { Json } from "@/types/supabase"

interface ShopifyFulfillment {
  id: number;
  order_id: number;
  status: string;
  created_at: string;
  updated_at: string;
  tracking_number: string | null;
  tracking_url: string | null;
  tracking_company: string | null;
  line_items: Array<{
    id: number;
    quantity: number;
  }>;
}

async function fetchFulfillments(startDate: Date): Promise<ShopifyFulfillment[]> {
  let allFulfillments: ShopifyFulfillment[] = [];
  let hasNextPage = true;
  let nextPageUrl: string | null = null;

  while (hasNextPage) {
    try {
      const url: string = nextPageUrl || 
        `https://${SHOPIFY_SHOP}/admin/api/2024-01/fulfillments.json?created_at_min=${startDate.toISOString()}&limit=250`;
      
      console.log(`[Fulfillment Sync] Fetching fulfillments from: ${url}`);
      
      const response: Response = await fetch(url, {
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch fulfillments: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const fulfillments = data.fulfillments || [];
      allFulfillments = allFulfillments.concat(fulfillments);

      // Check for pagination
      const linkHeader: string | null = response.headers.get("link");
      if (linkHeader) {
        const match: RegExpMatchArray | null = linkHeader.match(/<([^>]+)>; rel="next"/);
        nextPageUrl = match ? match[1] : null;
        hasNextPage = !!nextPageUrl;
      } else {
        hasNextPage = false;
      }

      console.log(`[Fulfillment Sync] Fetched ${fulfillments.length} fulfillments, total: ${allFulfillments.length}`);
    } catch (error) {
      console.error("[Fulfillment Sync] Error fetching fulfillments:", error);
      throw error;
    }
  }

  return allFulfillments;
}

export async function POST() {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized");
    }

    const db = supabase;

    // Get the last sync timestamp
    let startDate = new Date();
    startDate.setHours(startDate.getHours() - 1); // Default to last hour

    const { data: lastSync, error: syncError } = await db
      .from("sync_logs")
      .select("created_at")
      .eq("type", "fulfillment_sync")
      .order("created_at", { ascending: false })
      .limit(1);

    if (!syncError && lastSync && lastSync.length > 0) {
      const lastSyncDate = new Date(lastSync[0].created_at);
      // Add a small buffer to avoid missing fulfillments
      lastSyncDate.setMinutes(lastSyncDate.getMinutes() - 5);
      startDate = lastSyncDate;
    }

    // Fetch all fulfillments from Shopify
    const fulfillments = await fetchFulfillments(startDate);
    console.log(`[Fulfillment Sync] Found ${fulfillments.length} fulfillments to sync`);

    let processedCount = 0;
    let errorCount = 0;

    // Process each fulfillment
    for (const fulfillment of fulfillments) {
      try {
        // Update order fulfillment status
        const { error: orderError } = await db
          .from("orders")
          .update({
            fulfillment_status: fulfillment.status,
            updated_at: fulfillment.updated_at,
          })
          .match({ id: String(fulfillment.order_id) });

        if (orderError) {
          console.error(`[Fulfillment Sync] Error updating order ${fulfillment.order_id}:`, orderError);
          errorCount++;
          continue;
        }

        // Update line items fulfillment status
        if (fulfillment.line_items && fulfillment.line_items.length > 0) {
          for (const lineItem of fulfillment.line_items) {
            const { error: lineItemError } = await db
              .from("order_line_items")
              .update({
                fulfillment_status: fulfillment.status,
                tracking_number: fulfillment.tracking_number,
                tracking_url: fulfillment.tracking_url,
                tracking_company: fulfillment.tracking_company,
                updated_at: fulfillment.updated_at,
              })
              .match({
                order_id: String(fulfillment.order_id),
                line_item_id: String(lineItem.id),
              });

            if (lineItemError) {
              console.error(`[Fulfillment Sync] Error updating line item ${lineItem.id}:`, lineItemError);
              errorCount++;
              continue;
            }
          }
        }

        processedCount++;
      } catch (error) {
        console.error(`[Fulfillment Sync] Error processing fulfillment ${fulfillment.id}:`, error);
        errorCount++;
      }
    }

    // Log sync operation
    const syncLog = {
      type: "fulfillment_sync",
      details: {
        fulfillments_synced: processedCount,
        errors: errorCount,
        start_date: startDate.toISOString(),
        end_date: new Date().toISOString(),
      } as Json,
    };

    const { error: logError } = await db.from("sync_logs").insert(syncLog);
    if (logError) {
      console.error("[Fulfillment Sync] Error logging sync:", logError);
    }

    return NextResponse.json({
      success: true,
      fulfillments_synced: processedCount,
      errors: errorCount,
    });
  } catch (error: any) {
    console.error("[Fulfillment Sync] Error in sync-fulfillments:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
} 