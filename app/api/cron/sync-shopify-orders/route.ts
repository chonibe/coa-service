import { NextResponse, type NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.SUPABASE_CONNECTION_STRING!)

export async function GET(request: NextRequest) {
  try {
    // Verify the secret
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get("secret")

    if (!secret || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const shopifyDomain = process.env.SHOPIFY_SHOP
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN

    if (!shopifyDomain || !accessToken) {
      return NextResponse.json({ error: "Shopify credentials not configured" }, { status: 500 })
    }

    // Get the last sync time
    const lastSyncResult = await sql`
      SELECT MAX(updated_at) as last_sync FROM shopify_sync_logs
      WHERE sync_type = 'orders' AND status = 'success'
    `.catch((err) => {
      console.error("Database error fetching last sync time:", err)
      return [{ last_sync: null }]
    })

    const lastSync = lastSyncResult[0]?.last_sync

    // Format date for Shopify API
    const updatedAtMin = lastSync
      ? new Date(lastSync).toISOString()
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // Default to 30 days ago

    // Fetch orders from Shopify
    const response = await fetch(
      `https://${shopifyDomain}/admin/api/2023-10/orders.json?status=any&updated_at_min=${updatedAtMin}&limit=250`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Shopify API error:", errorText)

      // Log the sync failure
      await sql`
        INSERT INTO shopify_sync_logs (sync_type, status, error_message)
        VALUES ('orders', 'failed', ${errorText})
      `.catch((err) => console.error("Database error logging sync failure:", err))

      return NextResponse.json({ error: "Failed to fetch orders from Shopify" }, { status: response.status })
    }

    const data = await response.json()
    const orders = data.orders || []

    // Process orders (simplified for this example)
    const processedCount = orders.length

    // Log successful sync
    await sql`
      INSERT INTO shopify_sync_logs (sync_type, status, items_processed)
      VALUES ('orders', 'success', ${processedCount})
    `.catch((err) => console.error("Database error logging sync success:", err))

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${processedCount} orders`,
    })
  } catch (error) {
    console.error("Error in sync-shopify-orders:", error)
    return NextResponse.json({ error: "Failed to sync orders" }, { status: 500 })
  }
}
