import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN, CRON_SECRET } from "@/lib/env"
import { supabase } from "/dev/null"
import type { Json } from "@/types/supabase"

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

    if (!supabase) {
      throw new Error("Database client not initialized");
    }

    const db = supabase;

    // Get the last sync timestamp from the database
    let startDate = new Date();
    startDate.setHours(startDate.getHours() - 1); // Default to last hour

    const { data: lastSync, error: syncError } = await db
      .from("sync_logs")
      .select("created_at")
      .eq("type", "product_sync")
      .order("created_at", { ascending: false })
      .limit(1);

    if (!syncError && lastSync && lastSync.length > 0) {
      const lastSyncDate = new Date((lastSync[0] as any).created_at);
      // Add a small buffer to avoid missing products
      lastSyncDate.setMinutes(lastSyncDate.getMinutes() - 5);
      startDate = lastSyncDate;
    }

    console.log(`[Cron] Fetching products since ${startDate.toISOString()}`);

    // Call the sync-products endpoint
    const response = await fetch(`${request.nextUrl.origin}/api/shopify/sync-products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to sync products: ${response.status}`);
    }

    const result = await response.json();

    // Log sync operation
    const syncLog = {
      type: "product_sync",
      details: {
        products_synced: result.products_synced,
        errors: result.errors,
        start_date: startDate.toISOString(),
        end_date: new Date().toISOString(),
      } as Json,
    };

    const { error: logError } = await db.from("sync_logs").insert(syncLog);
    if (logError) {
      console.error("[Cron] Error logging sync:", logError);
    }

    return NextResponse.json({
      success: true,
      products_synced: result.products_synced,
      errors: result.errors,
      start_date: startDate.toISOString(),
      end_date: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Cron] Error in sync-shopify-products:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
} 