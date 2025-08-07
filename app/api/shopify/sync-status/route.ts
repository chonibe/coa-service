import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createClient()
  
  try {
    // Get the last sync timestamp from the database
    // First try sync_status table
    let syncData = null
    let syncError = null

    try {
      const result = await supabase.from("sync_status").select("*").order("created_at", { ascending: false }).limit(1)

      syncData = result.data
      syncError = result.error
    } catch (error) {
      console.error("Error with sync_status table:", error)
      syncError = error
    }

    // If there was an error with sync_status, try sync_logs
    if (syncError) {
      try {
        const result = await supabase.from("sync_logs").select("*").order("created_at", { ascending: false }).limit(1)

        syncData = result.data
        syncError = result.error
      } catch (error) {
        console.error("Error with sync_logs table:", error)
        syncError = error
      }
    }

    // Get the count of orders processed in the last sync
    let ordersProcessed = 0
    let lastSync = null
    let isActive = false
    let lastSyncDetails = null

    if (syncData && syncData.length > 0) {
      lastSync = syncData[0].created_at
      ordersProcessed = syncData[0].details?.ordersProcessed || 0
      lastSyncDetails = syncData[0].details || {}

      // Check if the last sync was within the last 24 hours
      const lastSyncDate = new Date(lastSync)
      const now = new Date()
      const diffHours = (now.getTime() - lastSyncDate.getTime()) / (1000 * 60 * 60)
      isActive = diffHours < 24
    }

    // Get the last synced order
    const { data: lastOrderData, error: lastOrderError } = await supabase
      .from("order_line_items")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)

    if (lastOrderError) {
      console.error("Error fetching last order:", lastOrderError)
    }

    let lastOrder = null
    if (lastOrderData && lastOrderData.length > 0) {
      lastOrder = {
        orderId: lastOrderData[0].order_id,
        orderName: lastOrderData[0].order_name,
        lineItemId: lastOrderData[0].line_item_id,
        productId: lastOrderData[0].product_id,
        editionNumber: lastOrderData[0].edition_number,
        status: lastOrderData[0].status,
        updatedAt: lastOrderData[0].updated_at,
      }
    }

    return NextResponse.json({
      lastSync,
      ordersProcessed,
      isActive,
      lastSyncDetails,
      lastOrder,
    })
  } catch (error: any) {
    console.error("Error fetching sync status:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch sync status" }, { status: 500 })
  }
}
