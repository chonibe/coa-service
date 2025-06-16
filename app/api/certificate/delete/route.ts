import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client using the server-side method
    const supabase = createClient()

    const body = await request.json()
    const { line_item_id, order_id } = body

    // Validate required fields
    if (!line_item_id || !order_id) {
      return NextResponse.json({ error: "Line item ID and Order ID are required" }, { status: 400 })
    }

    // Update the line item to remove certificate details
    const { error } = await supabase
      .from("order_line_items_v2")
      .update({
        certificate_url: null,
        certificate_token: null,
        certificate_generated_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("line_item_id", line_item_id)
      .eq("order_id", order_id)

    if (error) {
      console.error("Error deleting certificate:", error)
      return NextResponse.json({ error: "Failed to delete certificate" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Certificate details removed successfully" 
    })
  } catch (error: any) {
    console.error("Unexpected error deleting certificate:", error)
    return NextResponse.json({ 
      error: error.message || "An unexpected error occurred" 
    }, { status: 500 })
  }
}
