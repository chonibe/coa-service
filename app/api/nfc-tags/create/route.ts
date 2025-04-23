import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tagId, lineItemId, orderId, notes } = body

    if (!tagId) {
      return NextResponse.json({ success: false, message: "Tag ID is required" }, { status: 400 })
    }

    // Check if tag already exists
    const { data: existingTag, error: checkError } = await supabase
      .from("nfc_tags")
      .select("*")
      .eq("tag_id", tagId)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking existing tag:", checkError)
      return NextResponse.json({ success: false, message: "Failed to check existing tag" }, { status: 500 })
    }

    if (existingTag) {
      return NextResponse.json({ success: false, message: "Tag ID already exists" }, { status: 400 })
    }

    // If lineItemId and orderId are provided, check if the certificate exists
    let certificateUrl = null
    let certificateToken = null

    if (lineItemId && orderId) {
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

      certificateUrl = certificate.certificate_url
      certificateToken = certificate.certificate_token
    }

    // Create a new NFC tag record
    const { data, error } = await supabase
      .from("nfc_tags")
      .insert({
        tag_id: tagId,
        line_item_id: lineItemId || null,
        order_id: orderId || null,
        certificate_url: certificateUrl,
        status: lineItemId && orderId ? "assigned" : "unassigned",
        notes: notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        programmed_at: null,
      })
      .select()

    if (error) {
      console.error("Error creating NFC tag:", error)
      return NextResponse.json({ success: false, message: "Failed to create NFC tag" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      nfcTag: data[0],
    })
  } catch (error: any) {
    console.error("Error in create NFC tag API:", error)
    return NextResponse.json({ success: false, message: error.message || "An error occurred" }, { status: 500 })
  }
}
