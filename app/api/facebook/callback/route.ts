import { type NextRequest, NextResponse } from "next/server"
import { handleFacebookCallback } from "@/app/actions/instagram-graph-auth"

export async function GET(request: NextRequest) {
  try {
    // Get the code from the query parameters
    const url = new URL(request.url)
    const code = url.searchParams.get("code")

    if (!code) {
      return NextResponse.redirect(new URL("/admin/instagram?error=no_code", request.url))
    }

    // Handle the callback
    await handleFacebookCallback(code)

    // The handleFacebookCallback function will handle the redirect
    return NextResponse.next()
  } catch (error) {
    console.error("Error in Facebook callback route:", error)
    return NextResponse.redirect(new URL("/admin/instagram?error=true", request.url))
  }
}
