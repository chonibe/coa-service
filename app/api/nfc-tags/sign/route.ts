import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { signPayload } from "@/lib/nfc/token"
import { guardAdminRequest } from "@/lib/auth-guards"

type SignRequestBody = {
  tagId?: string
  lineItemId?: string
  orderId?: string
}

const TOKEN_TTL_MS = 10 * 60 * 1000 // 10 minutes

export async function POST(request: NextRequest) {
  const guard = guardAdminRequest(request)
  if (guard.kind !== "ok") return guard.response

  try {
    const body = (await request.json()) as SignRequestBody
    const tagId = body.tagId?.trim()
    const lineItemId = body.lineItemId?.trim()
    const orderId = body.orderId?.trim()

    if (!tagId || !lineItemId || !orderId) {
      return NextResponse.json(
        { success: false, message: "tagId, lineItemId, and orderId are required" },
        { status: 400 },
      )
    }

    const supabase = createClient()

    // Fetch certificate URL for context (best-effort)
    const { data: certificate, error: certificateError } = await supabase
      .from("order_line_items_v2")
      .select("certificate_url, name, product_id, submission_id, series_id")
      .eq("line_item_id", lineItemId)
      .eq("order_id", orderId)
      .maybeSingle()

    if (certificateError) {
      console.error("Error fetching certificate for signing:", certificateError)
    }

    const expiresAt = Date.now() + TOKEN_TTL_MS
    const payload = {
      tagId,
      lineItemId,
      orderId,
      certificateUrl: certificate?.certificate_url || null,
      exp: expiresAt,
    }

    const token = signPayload(payload)
    const origin = request.nextUrl.origin

    // Signed URL (10-min TTL) — for one-time auth flows
    const unlockUrl = `${origin}/nfc/unlock?token=${token}`

    // Permanent URL — this is what should be written to the physical NFC tag
    // so the tag never expires. The redirect route looks up the tag by ID.
    const permanentUrl = `${origin}/api/nfc-tags/redirect?tagId=${tagId}`

    return NextResponse.json({
      success: true,
      token,
      unlockUrl,
      permanentUrl,
      expiresAt,
      context: {
        certificateUrl: certificate?.certificate_url || null,
        artworkName: certificate?.name || null,
      },
    })
  } catch (error: any) {
    console.error("Error in POST /api/nfc-tags/sign:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to sign NFC payload" },
      { status: 500 },
    )
  }
}

