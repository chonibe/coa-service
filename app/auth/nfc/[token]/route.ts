import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { validateToken } from "@/lib/nfc/token"

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    const payload = validateToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
    }

    const { lineItemId, orderId, editionNumber } = payload

    if (!lineItemId || !orderId) {
      return NextResponse.json({ error: "Invalid token payload" }, { status: 400 })
    }

    const supabase = createClient()

    // Check if already claimed
    const { data: lineItem, error: lineItemError } = await supabase
      .from("order_line_items_v2")
      .select("id, line_item_id, nfc_claimed_at, nfc_tag_id")
      .eq("line_item_id", lineItemId)
      .single()

    if (lineItemError || !lineItem) {
      return NextResponse.json({ error: "Line item not found" }, { status: 404 })
    }

    // If already claimed, redirect to artwork page
    if (lineItem.nfc_claimed_at) {
      redirect(`/collector/artwork/${lineItemId}?authenticated=true`)
    }

    // Get the NFC tag ID from the request (if available)
    // For self-programmed tags, we might need to extract from URL params or headers
    const { searchParams } = new URL(request.url)
    const tagId = searchParams.get("tagId") || `self-programmed-${Date.now()}`

    // Create NFC tag record if it doesn't exist
    const { data: existingTag } = await supabase
      .from("nfc_tags")
      .select("id")
      .eq("tag_id", tagId)
      .single()

    if (!existingTag) {
      await supabase.from("nfc_tags").insert({
        tag_id: tagId,
        line_item_id: lineItemId,
        order_id: orderId,
        claimed_at: new Date().toISOString(),
      })
    }

    // Update line item
    await supabase
      .from("order_line_items_v2")
      .update({
        nfc_tag_id: tagId,
        nfc_claimed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("line_item_id", lineItemId)

    // Redirect to artwork page with success message
    redirect(`/collector/artwork/${lineItemId}?authenticated=true`)
  } catch (error: any) {
    console.error("Error in NFC auth route:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 },
    )
  }
}
