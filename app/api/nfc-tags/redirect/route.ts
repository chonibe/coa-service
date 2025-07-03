import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "/dev/null"

export async function GET(request: NextRequest) {
  let tagId: string | null = null // Declare tagId here

  try {
    const { searchParams } = new URL(request.url)
    tagId = searchParams.get("tagId")

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
