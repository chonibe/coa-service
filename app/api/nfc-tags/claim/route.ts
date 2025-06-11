import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tagId, lineItemId, orderId, customerId } = body

    if (!tagId || !lineItemId || !orderId || !customerId) {
      return NextResponse.json(
        { success: false, message: "Tag ID, Line Item ID, Order ID, and Customer ID are required" },
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

    // If tag doesn't exist, create it
    if (!existingTag) {
      const { error: createError } = await supabase.from("nfc_tags").insert({
        tag_id: tagId,
        status: "unassigned",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (createError) {
        console.error("Error creating tag:", createError)
        return NextResponse.json({ success: false, message: "Failed to create tag" }, { status: 500 })
      }
    } else if (existingTag.status === "claimed" && existingTag.line_item_id) {
      // Check if tag is already claimed
      return NextResponse.json({ success: false, message: "This NFC tag has already been claimed" }, { status: 400 })
    }

    // Check if the certificate exists
    const { data: certificate, error: certError } = await supabase
      .from("order_line_items_v2")
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
        customer_id: customerId,
        certificate_url: certificate.certificate_url,
        status: "claimed",
        updated_at: new Date().toISOString(),
        claimed_at: new Date().toISOString(),
      })
      .eq("tag_id", tagId)
      .select()

    if (error) {
      console.error("Error claiming NFC tag:", error)
      return NextResponse.json({ success: false, message: "Failed to claim NFC tag" }, { status: 500 })
    }

    // Also update the order_line_items_v2 table to mark this certificate as claimed
    const { error: updateError } = await supabase
      .from("order_line_items_v2")
      .update({
        nfc_tag_id: tagId,
        nfc_claimed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("line_item_id", lineItemId)
      .eq("order_id", orderId)

    if (updateError) {
      console.error("Error updating line item with NFC claim:", updateError)
      // Continue anyway since the tag was successfully claimed
    }

    return NextResponse.json({
      success: true,
      nfcTag: data[0],
    })
  } catch (error: any) {
    console.error("Error in claim NFC tag API:", error)
    return NextResponse.json({ success: false, message: error.message || "An error occurred" }, { status: 500 })
  }
}
