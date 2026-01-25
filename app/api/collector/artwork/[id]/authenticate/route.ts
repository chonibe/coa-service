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
    const { authCode } = body

    if (!authCode || typeof authCode !== "string") {
      return NextResponse.json({ error: "Authentication code required" }, { status: 400 })
    }

    // Get line item
    const { data: lineItem, error: lineItemError } = await supabase
      .from("order_line_items_v2")
      .select(`
        id,
        line_item_id,
        order_id,
        auth_code,
        nfc_claimed_at,
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

    // Check if already authenticated
    if (lineItem.nfc_claimed_at) {
      return NextResponse.json(
        { error: "Already authenticated", success: true },
        { status: 200 },
      )
    }

    // Verify auth code
    if (!lineItem.auth_code || lineItem.auth_code !== authCode.trim()) {
      return NextResponse.json({ error: "Invalid authentication code" }, { status: 400 })
    }

    // Mark as authenticated (similar to NFC claim)
    const { error: updateError } = await supabase
      .from("order_line_items_v2")
      .update({
        nfc_claimed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("line_item_id", lineItemId)

    if (updateError) {
      console.error("Error updating authentication:", updateError)
      return NextResponse.json(
        { error: "Failed to authenticate", message: updateError.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Artwork authenticated successfully",
    })
  } catch (error: any) {
    console.error("Error in manual authentication API:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 },
    )
  }
}
