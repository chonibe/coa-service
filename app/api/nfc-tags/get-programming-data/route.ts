import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "/dev/null"

export async function GET(request: NextRequest) {
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
        .from("order_line_items")
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

    // Generate programming data
    const programmingData = {
      tagId: nfcTag.tag_id,
      url: nfcTag.certificate_url,
      // NDEF record for URL
      ndefRecord: {
        type: "URL",
        data: nfcTag.certificate_url,
      },
      // Raw NDEF message (for advanced NFC writers)
      rawNdefMessage: generateRawNdefMessage(nfcTag.certificate_url),
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

// Function to generate raw NDEF message for URL
function generateRawNdefMessage(url: string): string {
  // This is a simplified implementation
  // In a real implementation, you would generate the actual NDEF message bytes
  // For now, we'll return a placeholder

  // URL record type
  const TNF_WELL_KNOWN = 0x01
  const RTD_URI = 0x55

  // URL prefix (https://)
  const URL_PREFIX_HTTPS = 0x03

  // Remove https:// prefix if present
  let urlWithoutPrefix = url
  if (url.startsWith("https://")) {
    urlWithoutPrefix = url.substring(8)
  } else if (url.startsWith("http://")) {
    urlWithoutPrefix = url.substring(7)
  }

  // Convert to hex representation (simplified)
  const hexArray = []
  for (let i = 0; i < urlWithoutPrefix.length; i++) {
    hexArray.push(urlWithoutPrefix.charCodeAt(i).toString(16).padStart(2, "0"))
  }

  // Return a simplified NDEF message structure
  return `${TNF_WELL_KNOWN.toString(16).padStart(2, "0")}${RTD_URI.toString(16).padStart(2, "0")}${URL_PREFIX_HTTPS.toString(16).padStart(2, "0")}${hexArray.join("")}`
}
