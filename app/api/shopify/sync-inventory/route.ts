import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"
import { supabase } from "@/lib/supabase"
import type { Json } from "@/types/supabase"

interface ShopifyInventoryItem {
  id: number;
  product_id: number;
  variant_id: number;
  inventory_quantity: number;
  inventory_item_id: number;
  location_id: number;
  available: number;
  updated_at: string;
}

async function fetchInventoryLevels(): Promise<ShopifyInventoryItem[]> {
  let allItems: ShopifyInventoryItem[] = [];
  let hasNextPage = true;
  let nextPageUrl: string | null = null;

  while (hasNextPage) {
    try {
      const url: string = nextPageUrl || 
        `https://${SHOPIFY_SHOP}/admin/api/2024-01/inventory_levels.json?limit=250`;
      
      console.log(`[Inventory Sync] Fetching inventory levels from: ${url}`);
      
      const response: Response = await fetch(url, {
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch inventory levels: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const items = data.inventory_levels || [];
      allItems = allItems.concat(items);

      // Check for pagination
      const linkHeader: string | null = response.headers.get("link");
      if (linkHeader) {
        const match: RegExpMatchArray | null = linkHeader.match(/<([^>]+)>; rel="next"/);
        nextPageUrl = match ? match[1] : null;
        hasNextPage = !!nextPageUrl;
      } else {
        hasNextPage = false;
      }

      console.log(`[Inventory Sync] Fetched ${items.length} inventory items, total: ${allItems.length}`);
    } catch (error) {
      console.error("[Inventory Sync] Error fetching inventory levels:", error);
      throw error;
    }
  }

  return allItems;
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      throw new Error("Database client not initialized");
    }

    const db = supabase;

    // Fetch all inventory levels from Shopify
    const inventoryItems = await fetchInventoryLevels();
    console.log(`[Inventory Sync] Found ${inventoryItems.length} inventory items to sync`);

    let processedCount = 0;
    let errorCount = 0;

    // Process each inventory item
    for (const item of inventoryItems) {
      try {
        // Prepare inventory data
        const inventoryData = {
          product_id: String(item.product_id),
          variant_id: String(item.variant_id),
          inventory_item_id: String(item.inventory_item_id),
          location_id: String(item.location_id),
          quantity: item.inventory_quantity,
          available: item.available,
          updated_at: item.updated_at,
        };

        // Upsert inventory level
        const { error: inventoryError } = await db
          .from("inventory_levels")
          .upsert(inventoryData, {
            onConflict: "product_id,variant_id,location_id",
          });

        if (inventoryError) {
          console.error(`[Inventory Sync] Error syncing inventory for product ${item.product_id}:`, inventoryError);
          errorCount++;
          continue;
        }

        // Update variant inventory quantity
        const { error: variantError } = await db
          .from("product_variants")
          .update({
            inventory_quantity: item.inventory_quantity,
            updated_at: item.updated_at,
          })
          .match({
            product_id: String(item.product_id),
            id: String(item.variant_id),
          });

        if (variantError) {
          console.error(`[Inventory Sync] Error updating variant inventory for product ${item.product_id}:`, variantError);
          errorCount++;
          continue;
        }

        processedCount++;
      } catch (error) {
        console.error(`[Inventory Sync] Error processing inventory item for product ${item.product_id}:`, error);
        errorCount++;
      }
    }

    // Log sync operation
    const syncLog = {
      type: "inventory_sync",
      details: {
        items_synced: processedCount,
        errors: errorCount,
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
      } as Json,
    };

    const { error: logError } = await db.from("sync_logs").insert(syncLog);
    if (logError) {
      console.error("[Inventory Sync] Error logging sync:", logError);
    }

    return NextResponse.json({
      success: true,
      items_synced: processedCount,
      errors: errorCount,
    });
  } catch (error: any) {
    console.error("[Inventory Sync] Error in sync-inventory:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
} 