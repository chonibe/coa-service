import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Helper: look up an NFC tag and return verification info
async function verifyTag(supabase: ReturnType<typeof createClient>, tagId: string) {
  const { data: tag, error: tagError } = await supabase
    .from("nfc_tags")
    .select("*, order_line_items_v2(*)")
    .eq("tag_id", tagId)
    .maybeSingle()

  if (tagError) {
    console.error("Error checking tag:", tagError)
    return { error: "Failed to check tag", status: 500 }
  }

  if (!tag) {
    return { error: "NFC tag not found", status: 404 }
  }

  if (tag.status !== "claimed" || !tag.line_item_id || !tag.certificate_url) {
    return {
      data: {
        success: false,
        message: "This NFC tag has not been claimed or authenticated yet",
        tag: { tag_id: tag.tag_id, status: tag.status, claimed: false },
      },
    }
  }

  return {
    data: {
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
    },
  }
}

// ---- GET /api/nfc-tags/verify?tagId=xxx ----
export async function GET(request: NextRequest) {
  const supabase = createClient()

  try {
    const { searchParams } = new URL(request.url)
    const tagId = searchParams.get("tagId")

    if (!tagId) {
      return NextResponse.json({ success: false, message: "Tag ID is required" }, { status: 400 })
    }

    const result = await verifyTag(supabase, tagId)
    if (result.error) {
      return NextResponse.json({ success: false, message: result.error }, { status: result.status })
    }
    return NextResponse.json(result.data)
  } catch (error: any) {
    console.error("Error verifying NFC tag:", error)
    return NextResponse.json({ success: false, message: error.message || "Failed to verify NFC tag" }, { status: 500 })
  }
}

// ---- POST /api/nfc-tags/verify (used by NFCPairingWizard) ----
export async function POST(request: NextRequest) {
  const supabase = createClient()

  try {
    const body = await request.json()
    const { lineItemId, nfcTagId } = body as { lineItemId?: string; nfcTagId?: string }

    if (!nfcTagId) {
      return NextResponse.json({ success: false, message: "nfcTagId is required" }, { status: 400 })
    }

    // If tag already exists, use standard verification
    const result = await verifyTag(supabase, nfcTagId)
    if (result.error && result.status !== 404) {
      return NextResponse.json({ success: false, message: result.error }, { status: result.status })
    }

    // If tag doesn't exist yet, create an unassigned record so pairing can proceed
    if (result.error && result.status === 404) {
      const { error: createError } = await supabase.from("nfc_tags").insert({
        tag_id: nfcTagId,
        status: "unassigned",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (createError) {
        console.error("Error creating tag during verify:", createError)
        return NextResponse.json({ success: false, message: "Failed to register NFC tag" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        tag: {
          tag_id: nfcTagId,
          status: "unassigned",
          claimed: false,
        },
        lineItemId,
      })
    }

    // Tag exists — return its data along with the lineItemId context
    return NextResponse.json({ ...result.data, lineItemId })
  } catch (error: any) {
    console.error("Error verifying NFC tag (POST):", error)
    return NextResponse.json({ success: false, message: error.message || "Failed to verify NFC tag" }, { status: 500 })
  }
}
