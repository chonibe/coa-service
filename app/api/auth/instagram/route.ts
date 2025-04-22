import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + "/api/auth/instagram/callback"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    console.error("Instagram authentication error:", error)
    return NextResponse.redirect(new URL("/vendor/login?error=instagram_auth_failed", request.url))
  }

  if (code) {
    try {
      // 1. Exchange code for access token
      const tokenResponse = await fetch("https://api.instagram.com/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: INSTAGRAM_APP_ID || "",
          client_secret: INSTAGRAM_APP_SECRET || "",
          grant_type: "authorization_code",
          redirect_uri: REDIRECT_URI || "",
          code: code,
        }),
      })

      const tokenData = await tokenResponse.json()
      const accessToken = tokenData.access_token
      const userId = tokenData.user_id

      if (!accessToken) {
        throw new Error("Failed to obtain access token from Instagram")
      }

      // 2. Get user information
      const userResponse = await fetch(
        `https://graph.instagram.com/v19.0/${userId}?fields=id,username,account_type&access_token=${accessToken}`,
      )
      const userData = await userResponse.json()

      // 3. Here you would typically create a new user in your database or log them in
      // For this example, we'll just set a cookie
      const cookieStore = cookies()
      cookieStore.set("instagram_session", JSON.stringify(userData), {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })

      // Redirect to a protected route
      return NextResponse.redirect(new URL("/vendor/dashboard", request.url))
    } catch (err: any) {
      console.error("Error during Instagram authentication:", err)
      return NextResponse.redirect(new URL("/vendor/login?error=instagram_auth_failed", request.url))
    }
  } else {
    // Redirect user to Instagram's authorization URL
    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${REDIRECT_URI}&scope=user_profile,user_media&response_type=code`
    return NextResponse.redirect(authUrl)
  }
}
