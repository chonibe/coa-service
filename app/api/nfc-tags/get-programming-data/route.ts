import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { guardAdminRequest } from "@/lib/auth-guards"

export async function GET(request: NextRequest) {
  const guard = guardAdminRequest(request)
  if (guard.kind !== "ok") return guard.response

  const supabase = createClient()
  
  try {
    const { searchParams } = new URL(request.url)
    const tagId = searchParams.get("tagId")

    if (!tagId) {
      return NextResponse.json({ success: false, message: "Tag ID is required" }, { status: 400 })
    }

    // Get the NFC tag data
    const { data: nfcTag, error: tagError } = await supabase
      .from("nfc_tags")
      .select("*")
      .eq("tag_id", tagId)
      .maybeSingle()

    if (tagError) {
      console.error("Error fetching NFC tag:", tagError)
      return NextResponse.json({ success: false, message: "Failed to fetch NFC tag" }, { status: 500 })
    }

    if (!nfcTag) {
      return NextResponse.json({ success: false, message: "NFC tag not found" }, { status: 404 })
    }

    if (!nfcTag.certificate_url) {
      return NextResponse.json({ success: false, message: "NFC tag is not assigned to a certificate" }, { status: 400 })
    }

    // Get additional certificate information if needed
    let certificateInfo = null
    if (nfcTag.line_item_id && nfcTag.order_id) {
      const { data: lineItem, error: lineItemError } = await supabase
        .from("order_line_items_v2")
        .select("*")
        .eq("line_item_id", nfcTag.line_item_id)
        .eq("order_id", nfcTag.order_id)
        .maybeSingle()

      if (!lineItemError && lineItem) {
        certificateInfo = {
          editionNumber: lineItem.edition_number,
          editionTotal: lineItem.edition_total,
          status: lineItem.status,
          createdAt: lineItem.created_at,
          updatedAt: lineItem.updated_at,
        }
      }
    }

    // Build the permanent redirect URL for physical tags
    const permanentUrl = `/api/nfc-tags/redirect?tagId=${nfcTag.tag_id}`

    // Generate programming data
    const programmingData = {
      tagId: nfcTag.tag_id,
      url: nfcTag.certificate_url,
      // Permanent URL to write to the physical tag (no expiry)
      permanentUrl,
      // NDEF record for URL — the client-side NDEFReader.write() handles
      // the actual NDEF framing; we just provide the URL string.
      ndefRecord: {
        type: "url",
        data: permanentUrl,
      },
      certificateInfo,
      qrCodeData: nfcTag.certificate_url,
    }

    return NextResponse.json({
      success: true,
      programmingData,
    })
  } catch (error: any) {
    console.error("Error in get NFC programming data API:", error)
    return NextResponse.json({ success: false, message: error.message || "An error occurred" }, { status: 500 })
  }
}
