import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    console.error("Instagram authentication error:", error)
    return NextResponse.redirect(new URL("/vendor/login?error=instagram_auth_failed", request.url))
  }

  if (code) {
    // Redirect to the /api/auth/instagram route to handle the code exchange
    return NextResponse.redirect(new URL(`/api/auth/instagram?code=${code}`, request.url))
  } else {
    // Redirect user to Instagram's authorization URL
    const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID
    const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + "/api/auth/instagram/callback"
    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${REDIRECT_URI}&scope=user_profile,user_media&response_type=code`
    return NextResponse.redirect(authUrl)
  }
}
