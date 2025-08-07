import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  const supabase = createClient()
  
  try {
    const body = await request.json()
    const { lineItemId, orderId } = body

    if (!lineItemId || !orderId) {
      return NextResponse.json({ success: false, message: "Line item ID and order ID are required" }, { status: 400 })
    }

    // Update the line item to remove certificate fields
    const { error } = await supabase
      .from("order_line_items")
      .update({
        certificate_url: null,
        certificate_token: null,
        certificate_generated_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("line_item_id", lineItemId)
      .eq("order_id", orderId)

    if (error) {
      console.error("Error deleting certificate:", error)
      return NextResponse.json({ success: false, message: "Failed to delete certificate" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Certificate deleted successfully",
    })
  } catch (error: any) {
    console.error("Error in certificate delete API:", error)
    return NextResponse.json({ success: false, message: error.message || "An error occurred" }, { status: 500 })
  }
}
