import crypto from "crypto"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

type SignRequestBody = {
  tagId?: string
  lineItemId?: string
  orderId?: string
}

const TOKEN_TTL_MS = 10 * 60 * 1000 // 10 minutes

const base64UrlEncode = (input: string) =>
  Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")

const getSigningSecret = () => {
  const secret =
    process.env.NEXTAUTH_SECRET ||
    process.env.JWT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!secret) {
    throw new Error("Signing secret is not configured")
  }

  return secret
}

const signPayload = (payload: Record<string, any>) => {
  const secret = getSigningSecret()
  const serialized = JSON.stringify(payload)
  const payloadB64 = base64UrlEncode(serialized)
  const signature = crypto.createHmac("sha256", secret).update(payloadB64).digest("base64")
  const signatureB64 = signature.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  return `${payloadB64}.${signatureB64}`
}

export async function POST(request: NextRequest) {
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
    const unlockUrl = `${origin}/nfc/unlock?token=${token}`

    return NextResponse.json({
      success: true,
      token,
      unlockUrl,
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

