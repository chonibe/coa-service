import crypto from "crypto"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  let tagId: string | null = null

  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")
    tagId = searchParams.get("tagId")

    // If token exists, validate and redirect to artist unlock page
    if (token) {
      const payload = validateToken(token)
      if (!payload) {
        return NextResponse.redirect(new URL("/pages/authenticate?error=invalid_token", request.url))
      }

      tagId = payload.tagId || tagId

      if (payload.tagId) {
        try {
          await supabase.from("nfc_tag_scans").insert({
            tag_id: payload.tagId,
            scanned_at: new Date().toISOString(),
            ip_address: request.headers.get("x-forwarded-for") || "unknown",
            user_agent: request.headers.get("user-agent") || "unknown",
          })
        } catch (logError) {
          console.error("Error logging NFC tag scan (token path):", logError)
        }
      }

      // Redirect to artist unlock landing page with the token
      return NextResponse.redirect(new URL(`/nfc/unlock?token=${token}`, request.url))
    }

    if (!tagId) {
      // Redirect to the authentication page if no tag ID is provided
      return NextResponse.redirect(new URL("/pages/authenticate", request.url))
    }

    // Check if the tag exists and is claimed
    const { data: tag, error: tagError } = await supabase.from("nfc_tags").select("*").eq("tag_id", tagId).maybeSingle()

    if (tagError) {
      console.error("Error checking tag:", tagError)
      // Redirect to the authentication page with an error
      return NextResponse.redirect(new URL(`/pages/authenticate?error=database_error&tagId=${tagId}`, request.url))
    }

    if (!tag) {
      // Redirect to the authentication page with an error
      return NextResponse.redirect(new URL(`/pages/authenticate?error=tag_not_found&tagId=${tagId}`, request.url))
    }

    // If the tag is claimed and has a certificate URL, redirect to the certificate
    if (tag.status === "claimed" && tag.certificate_url) {
      // Log the access
      try {
        await supabase.from("nfc_tag_scans").insert({
          tag_id: tagId,
          scanned_at: new Date().toISOString(),
          ip_address: request.headers.get("x-forwarded-for") || "unknown",
          user_agent: request.headers.get("user-agent") || "unknown",
        })
      } catch (logError) {
        console.error("Error logging NFC tag scan:", logError)
        // Continue anyway
      }

      // Redirect to the certificate URL
      return NextResponse.redirect(new URL(tag.certificate_url))
    }

    // If the tag is not claimed, redirect to the authentication page
    return NextResponse.redirect(new URL(`/pages/authenticate?tagId=${tagId}`, request.url))
  } catch (error: any) {
    console.error("Error in NFC redirect:", error)
    // Redirect to the authentication page with an error
    return NextResponse.redirect(
      new URL(`/pages/authenticate?error=server_error&tagId=${tagId || "unknown"}`, request.url),
    )
  }
}
