import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  const supabase = createClient()
  
  try {
    const body = await request.json()
    const { tagId, lineItemId, orderId } = body

    if (!tagId || !lineItemId || !orderId) {
      return NextResponse.json(
        { success: false, message: "Tag ID, Line Item ID, and Order ID are required" },
        { status: 400 },
      )
    }

    // Check if the tag exists
    const { data: existingTag, error: tagError } = await supabase
      .from("nfc_tags")
      .select("*")
      .eq("tag_id", tagId)
      .maybeSingle()

    if (tagError) {
      console.error("Error checking tag:", tagError)
      return NextResponse.json({ success: false, message: "Failed to check tag" }, { status: 500 })
    }

    if (!existingTag) {
      return NextResponse.json({ success: false, message: "Tag not found" }, { status: 404 })
    }

    // Check if the certificate exists
    const { data: certificate, error: certError } = await supabase
      .from("order_line_items")
      .select("certificate_url, certificate_token")
      .eq("line_item_id", lineItemId)
      .eq("order_id", orderId)
      .maybeSingle()

    if (certError) {
      console.error("Error checking certificate:", certError)
      return NextResponse.json({ success: false, message: "Failed to check certificate" }, { status: 500 })
    }

    if (!certificate || !certificate.certificate_url) {
      return NextResponse.json(
        { success: false, message: "Certificate not found for the provided line item and order" },
        { status: 404 },
      )
    }

    // Update the NFC tag with the certificate information
    const { data, error } = await supabase
      .from("nfc_tags")
      .update({
        line_item_id: lineItemId,
        order_id: orderId,
        certificate_url: certificate.certificate_url,
        status: "assigned",
        updated_at: new Date().toISOString(),
      })
      .eq("tag_id", tagId)
      .select()

    if (error) {
      console.error("Error assigning NFC tag:", error)
      return NextResponse.json({ success: false, message: "Failed to assign NFC tag" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      nfcTag: data[0],
    })
  } catch (error: any) {
    console.error("Error in assign NFC tag API:", error)
    return NextResponse.json({ success: false, message: error.message || "An error occurred" }, { status: 500 })
  }
}
