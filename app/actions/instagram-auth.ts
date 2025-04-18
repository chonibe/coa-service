"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getLongLivedToken, fetchInstagramUser, storeInstagramCredentials } from "@/lib/services/instagram-api"

// This would be set in your environment variables
const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID || ""
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET || ""
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/instagram/callback` : ""

// Generate the Instagram authorization URL
export async function getInstagramAuthUrl(artistId: string): Promise<string> {
  // Store the artist ID in a cookie for the callback
  cookies().set("instagram_auth_artist_id", artistId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 5, // 5 minutes
    path: "/",
  })

  // Generate the Instagram authorization URL
  return `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI,
  )}&scope=user_profile,user_media&response_type=code`
}

// Handle the Instagram callback
export async function handleInstagramCallback(code: string): Promise<void> {
  try {
    // Get the artist ID from the cookie
    const artistId = cookies().get("instagram_auth_artist_id")?.value

    if (!artistId) {
      throw new Error("Artist ID not found in cookie")
    }

    // Exchange the code for an access token
    const tokenResponse = await fetch(`https://api.instagram.com/oauth/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: INSTAGRAM_APP_ID,
        client_secret: INSTAGRAM_APP_SECRET,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
        code,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error(`Instagram API error: ${tokenResponse.status}`)
    }

    const tokenData = await tokenResponse.json()
    const shortLivedToken = tokenData.access_token

    // Exchange the short-lived token for a long-lived token
    const longLivedToken = await getLongLivedToken(shortLivedToken, INSTAGRAM_APP_SECRET)

    if (!longLivedToken) {
      throw new Error("Failed to get long-lived token")
    }

    // Get the user profile
    const user = await fetchInstagramUser(longLivedToken)

    if (!user) {
      throw new Error("Failed to get Instagram user profile")
    }

    // Calculate token expiry (60 days from now)
    const tokenExpiry = new Date()
    tokenExpiry.setDate(tokenExpiry.getDate() + 60)

    // Store the credentials in Supabase
    await storeInstagramCredentials(artistId, longLivedToken, tokenExpiry, user.username)

    // Clear the cookie
    cookies().delete("instagram_auth_artist_id")

    // Redirect to the admin dashboard
    redirect("/admin/instagram")
  } catch (error) {
    console.error("Error handling Instagram callback:", error)
    redirect("/admin/instagram?error=true")
  }
}

// Disconnect Instagram account
export async function disconnectInstagram(artistId: string): Promise<boolean> {
  try {
    // In a real implementation, you would delete the credentials from Supabase
    // For example:
    /*
    const { error } = await supabase
      .from('instagram_credentials')
      .delete()
      .eq('artist_id', artistId)
    
    if (error) throw error
    */

    console.log(`Disconnected Instagram for artist ${artistId}`)
    return true
  } catch (error) {
    console.error("Error disconnecting Instagram:", error)
    return false
  }
}
