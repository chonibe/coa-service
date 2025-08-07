import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createClient()
  
  try {
    const { searchParams } = new URL(request.url)
    const tagId = searchParams.get("tagId")

    if (!tagId) {
      return NextResponse.json({ success: false, message: "Tag ID is required" }, { status: 400 })
    }

    // Check if the tag exists and is claimed
    const { data: tag, error: tagError } = await supabase
      .from("nfc_tags")
      .select("*, order_line_items(*)")
      .eq("tag_id", tagId)
      .maybeSingle()

    if (tagError) {
      console.error("Error checking tag:", tagError)
      return NextResponse.json({ success: false, message: "Failed to check tag" }, { status: 500 })
    }

    if (!tag) {
      return NextResponse.json({ success: false, message: "NFC tag not found" }, { status: 404 })
    }

    // Check if the tag is claimed
    if (tag.status !== "claimed" || !tag.line_item_id || !tag.certificate_url) {
      return NextResponse.json({
        success: false,
        message: "This NFC tag has not been claimed or authenticated yet",
        tag: {
          tag_id: tag.tag_id,
          status: tag.status,
          claimed: false,
        },
      })
    }

    // Return the certificate information
    return NextResponse.json({
      success: true,
      tag: {
        tag_id: tag.tag_id,
        status: tag.status,
        claimed: true,
        claimed_at: tag.claimed_at,
        certificate_url: tag.certificate_url,
        line_item_id: tag.line_item_id,
        order_id: tag.order_id,
      },
    })
  } catch (error: any) {
    console.error("Error verifying NFC tag:", error)
    return NextResponse.json({ success: false, message: error.message || "Failed to verify NFC tag" }, { status: 500 })
  }
}
