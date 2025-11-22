import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    // Initialize arrays to store history data
    let combinedHistory: any[] = []

    // Try to get sync history from sync_status table
    try {
      const { data: syncStatusHistory, error: syncStatusError } = await supabase
        .from("sync_status")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit)

      if (!syncStatusError && syncStatusHistory) {
        // Add a type field if it doesn't exist
        const processedHistory = syncStatusHistory.map((item) => ({
          ...item,
          type: item.type || "shopify_orders", // Default type if not present
        }))
        combinedHistory = [...combinedHistory, ...processedHistory]
      }
    } catch (error) {
      console.log("Error fetching from sync_status:", error)
    }

    // Try to get sync history from sync_logs table
    try {
      const { data: syncLogsHistory, error: syncLogsError } = await supabase
        .from("sync_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit)

      if (!syncLogsError && syncLogsHistory) {
        // Add a type field if it doesn't exist
        const processedHistory = syncLogsHistory.map((item) => ({
          ...item,
          type: item.type || "shopify_orders", // Default type if not present
        }))
        combinedHistory = [...combinedHistory, ...processedHistory]
      }
    } catch (error) {
      console.log("Error fetching from sync_logs:", error)
    }

    // Get webhook history from the database
    try {
      const { data: webhookHistory, error: webhookError } = await supabase
        .from("webhook_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit)

      if (!webhookError && webhookHistory) {
        combinedHistory = [...combinedHistory, ...webhookHistory]
      }
    } catch (error) {
      console.log("Error fetching webhook history:", error)
    }

    // Sort combined history by date
    combinedHistory.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Limit to the requested number of items
    const limitedHistory = combinedHistory.slice(0, limit)

    return NextResponse.json({
      history: limitedHistory,
    })
  } catch (error: any) {
    console.error("Error fetching sync history:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch sync history" }, { status: 500 })
  }
}
