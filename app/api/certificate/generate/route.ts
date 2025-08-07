import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  const supabase = createClient()
  
  try {
    const body = await request.json()
    const { lineItemId } = body

    if (!lineItemId) {
      return NextResponse.json({ success: false, message: "Line item ID is required" }, { status: 400 })
    }

    // Check if the line item exists in the database
    const { data: lineItemData, error: lineItemError } = await supabase
      .from("order_line_items")
      .select("*")
      .eq("line_item_id", lineItemId)
      .single()

    if (lineItemError) {
      console.error("Error fetching line item:", lineItemError)
      return NextResponse.json({ success: false, message: "Line item not found" }, { status: 404 })
    }

    // Generate the certificate URL - use the public customer app URL if available
    // MODIFIED: Changed from path-based to query parameter-based URL
    const baseUrl =
      process.env.NEXT_PUBLIC_CUSTOMER_APP_URL || process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const certificateUrl = `${baseUrl}/pages/certificate?line_item_id=${lineItemId}`

    // Generate a unique access token for additional security (optional)
    const accessToken = crypto.randomUUID()

    // Store the certificate URL and access token in the database
    const { error: updateError } = await supabase
      .from("order_line_items")
      .update({
        certificate_url: certificateUrl,
        certificate_token: accessToken,
        certificate_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("line_item_id", lineItemId)
      .eq("order_id", lineItemData.order_id)

    if (updateError) {
      console.error("Error updating line item with certificate URL:", updateError)
      return NextResponse.json({ success: false, message: "Failed to store certificate URL" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      certificateUrl,
      accessToken,
      lineItemId,
      orderId: lineItemData.order_id,
    })
  } catch (error: any) {
    console.error("Error generating certificate URL:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to generate certificate URL" },
      { status: 500 },
    )
  }
}
