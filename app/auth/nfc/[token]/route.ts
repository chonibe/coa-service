import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "your-secret-key"

    // Verify token using same approach as NFC redirect route
    const base64UrlDecode = (input: string) => {
      const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4)
      return Buffer.from(padded, "base64").toString()
    }

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

    const validateToken = (token: string) => {
      try {
        const [payloadB64, signatureB64] = token.split(".")
        if (!payloadB64 || !signatureB64) return null

        const secret = getSigningSecret()
        const expectedSig = crypto.createHmac("sha256", secret).update(payloadB64).digest("base64")
        const expectedSigUrl = expectedSig.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")

        if (expectedSigUrl !== signatureB64) return null

        const payloadStr = base64UrlDecode(payloadB64)
        const payload = JSON.parse(payloadStr)

        if (payload.exp && Date.now() > payload.exp) {
          return null
        }

        return payload
      } catch (err) {
        console.error("Token validation failed:", err)
        return null
      }
    }

    const payload = validateToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
    }

    const { lineItemId, orderId, editionNumber } = payload

    if (!lineItemId || !orderId) {
      return NextResponse.json({ error: "Invalid token payload" }, { status: 400 })
    }

    const supabase = createClient()

    // Check if already claimed
    const { data: lineItem, error: lineItemError } = await supabase
      .from("order_line_items_v2")
      .select("id, line_item_id, nfc_claimed_at, nfc_tag_id")
      .eq("line_item_id", lineItemId)
      .single()

    if (lineItemError || !lineItem) {
      return NextResponse.json({ error: "Line item not found" }, { status: 404 })
    }

    // If already claimed, redirect to artwork page
    if (lineItem.nfc_claimed_at) {
      redirect(`/collector/artwork/${lineItemId}?authenticated=true`)
    }

    // Get the NFC tag ID from the request (if available)
    // For self-programmed tags, we might need to extract from URL params or headers
    const { searchParams } = new URL(request.url)
    const tagId = searchParams.get("tagId") || `self-programmed-${Date.now()}`

    // Create NFC tag record if it doesn't exist
    const { data: existingTag } = await supabase
      .from("nfc_tags")
      .select("id")
      .eq("tag_id", tagId)
      .single()

    if (!existingTag) {
      await supabase.from("nfc_tags").insert({
        tag_id: tagId,
        line_item_id: lineItemId,
        order_id: orderId,
        claimed_at: new Date().toISOString(),
      })
    }

    // Update line item
    await supabase
      .from("order_line_items_v2")
      .update({
        nfc_tag_id: tagId,
        nfc_claimed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("line_item_id", lineItemId)

    // Redirect to artwork page with success message
    redirect(`/collector/artwork/${lineItemId}?authenticated=true`)
  } catch (error: any) {
    console.error("Error in NFC auth route:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 },
    )
  }
}
