import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

// Get Shopify customer ID from cookie
function getShopifyCustomerId(cookieStore: any): string | null {
  const shopifyCustomerId = cookieStore.get("shopify_customer_id")
  return shopifyCustomerId?.value || null
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const shopifyCustomerId = getShopifyCustomerId(cookieStore)

    if (!shopifyCustomerId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()
    const lineItemId = params.id
    const body = await request.json()
    const { eventType, eventData } = body

    if (!eventType) {
      return NextResponse.json({ error: "Event type required" }, { status: 400 })
    }

    // Validate event type
    const validEventTypes = ["page_view", "video_play", "audio_play", "time_spent"]
    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json({ error: "Invalid event type" }, { status: 400 })
    }

    // Get line item to verify ownership and get product_id
    const { data: lineItem, error: lineItemError } = await supabase
      .from("order_line_items_v2")
      .select(`
        id,
        line_item_id,
        product_id,
        orders:order_id (
          shopify_customer_id
        )
      `)
      .eq("line_item_id", lineItemId)
      .single()

    if (lineItemError || !lineItem) {
      return NextResponse.json({ error: "Artwork not found" }, { status: 404 })
    }

    // Verify ownership
    const order = lineItem.orders as any
    if (!order || order.shopify_customer_id !== shopifyCustomerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Only track analytics if NFC authenticated
    const { data: authenticatedItem } = await supabase
      .from("order_line_items_v2")
      .select("nfc_claimed_at")
      .eq("line_item_id", lineItemId)
      .single()

    if (!authenticatedItem?.nfc_claimed_at) {
      return NextResponse.json(
        { error: "Artwork must be authenticated to track analytics" },
        { status: 403 },
      )
    }

    // Insert analytics event
    const { data: analyticsEvent, error: insertError } = await supabase
      .from("artwork_page_analytics")
      .insert({
        product_id: lineItem.product_id,
        line_item_id: lineItemId,
        event_type: eventType,
        event_data: eventData || {},
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error inserting analytics:", insertError)
      return NextResponse.json(
        { error: "Failed to track analytics", message: insertError.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      event: analyticsEvent,
    })
  } catch (error: any) {
    console.error("Error in analytics API:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 },
    )
  }
}
