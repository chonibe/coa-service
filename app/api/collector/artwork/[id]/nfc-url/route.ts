import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

// Get Shopify customer ID from cookie
function getShopifyCustomerId(cookieStore: any): string | null {
  const shopifyCustomerId = cookieStore.get("shopify_customer_id")
  return shopifyCustomerId?.value || null
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const shopifyCustomerId = getShopifyCustomerId(cookieStore)

    if (!shopifyCustomerId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()
    const lineItemId = params.id

    // Get line item
    const { data: lineItem, error: lineItemError } = await supabase
      .from("order_line_items_v2")
      .select(`
        id,
        line_item_id,
        order_id,
        edition_number,
        orders:order_id (
          shopify_customer_id
        )
      `)
      .eq("line_item_id", lineItemId)
      .single()

    if (lineItemError || !lineItem) {
      return NextResponse.json({ error: "Artwork not found" }, { status: 404 })
    }

    // Verify ownership
    const order = lineItem.orders as any
    if (!order || order.shopify_customer_id !== shopifyCustomerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Generate signed token using same approach as NFC sign route
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

    const expiresAt = Date.now() + 60 * 60 * 24 * 365 * 1000 // 1 year expiration
    const payload = {
      lineItemId: lineItem.line_item_id,
      orderId: lineItem.order_id,
      editionNumber: lineItem.edition_number,
      exp: expiresAt,
    }

    const token = signPayload(payload)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.thestreetcollector.com"
    const nfcUrl = `${baseUrl}/auth/nfc/${token}`

    return NextResponse.json({
      success: true,
      nfcUrl,
      instructions: [
        "1. Download an NFC writing app (NFC Tools, TagWriter, etc.)",
        "2. Create a new 'URL' record",
        "3. Paste this URL",
        "4. Write to your NTAG215 or similar tag",
        "5. Tap your new tag to authenticate",
      ],
    })
  } catch (error: any) {
    console.error("Error generating NFC URL:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 },
    )
  }
}
