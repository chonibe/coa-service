"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getInstagramBusinessAccountId, storeInstagramCredentials } from "@/lib/services/instagram-graph-api"

// This would be set in your environment variables
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || ""
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || ""
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/facebook/callback` : ""

// Generate the Facebook authorization URL
export async function getFacebookAuthUrl(artistId: string): Promise<string> {
  // Store the artist ID in a cookie for the callback
  cookies().set("facebook_auth_artist_id", artistId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 5, // 5 minutes
    path: "/",
  })

  // Generate the Facebook authorization URL with required permissions
  return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI,
  )}&scope=pages_show_list,instagram_basic,pages_read_engagement&response_type=code&state=${artistId}`
}

// Handle the Facebook callback
export async function handleFacebookCallback(code: string): Promise<void> {
  try {
    // Get the artist ID from the cookie
    const artistId = cookies().get("facebook_auth_artist_id")?.value

    if (!artistId) {
      throw new Error("Artist ID not found in cookie")
    }

    // Exchange the code for an access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        cache: "no-store",
        next: { revalidate: 0 },
      },
      {
        client_id: FACEBOOK_APP_ID,
        client_secret: FACEBOOK_APP_SECRET,
        redirect_uri: REDIRECT_URI,
        code,
      },
    )

    if (!tokenResponse.ok) {
      throw new Error(`Facebook API error: ${tokenResponse.status}`)
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Get the user's Facebook Pages
    const pagesResponse = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`)

    if (!pagesResponse.ok) {
      throw new Error(`Facebook API error: ${pagesResponse.status}`)
    }

    const pagesData = await pagesResponse.json()

    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error("No Facebook Pages found")
    }

    // Use the first page (in a real app, you might want to let the user choose)
    const page = pagesData.data[0]
    const pageId = page.id
    const pageAccessToken = page.access_token

    // Get the Instagram Business Account ID
    const igBusinessId = await getInstagramBusinessAccountId(pageId, pageAccessToken)

    if (!igBusinessId) {
      throw new Error("No Instagram Business Account connected to this Facebook Page")
    }

    // Calculate token expiry (60 days from now)
    const tokenExpiry = new Date()
    tokenExpiry.setDate(tokenExpiry.getDate() + 60)

    // Store the credentials in Supabase
    await storeInstagramCredentials(artistId, pageId, igBusinessId, pageAccessToken, tokenExpiry)

    // Clear the cookie
    cookies().delete("facebook_auth_artist_id")

    // Redirect to the admin dashboard
    redirect("/admin/instagram?success=true")
  } catch (error) {
    console.error("Error handling Facebook callback:", error)
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
