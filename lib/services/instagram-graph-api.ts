// This service handles Instagram integration using the Graph API

interface InstagramMedia {
  id: string
  caption?: string
  media_type: string
  media_url: string
  permalink: string
  thumbnail_url?: string
  timestamp: string
}

interface InstagramProfile {
  username: string
  profile_picture_url: string
  followers_count: number
  media_count: number
  biography?: string
  name?: string
  website?: string
}

// Base URL for Graph API
const GRAPH_API_BASE = "https://graph.facebook.com/v19.0"

// Get Instagram business account ID from Facebook Page ID
export async function getInstagramBusinessAccountId(pageId: string, accessToken: string): Promise<string | null> {
  try {
    const response = await fetch(
      `${GRAPH_API_BASE}/${pageId}?fields=instagram_business_account&access_token=${accessToken}`,
    )

    if (!response.ok) {
      throw new Error(`Facebook API error: ${response.status}`)
    }

    const data = await response.json()
    return data.instagram_business_account?.id || null
  } catch (error) {
    console.error("Error getting Instagram business account ID:", error)
    return null
  }
}

// Get Instagram profile information
export async function getInstagramProfile(igBusinessId: string, accessToken: string): Promise<InstagramProfile | null> {
  try {
    const response = await fetch(
      `${GRAPH_API_BASE}/${igBusinessId}?fields=username,profile_picture_url,followers_count,media_count,biography,name,website&access_token=${accessToken}`,
    )

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error getting Instagram profile:", error)
    return null
  }
}

// Get Instagram media
export async function getInstagramMedia(
  igBusinessId: string,
  accessToken: string,
  limit = 10,
): Promise<InstagramMedia[]> {
  try {
    const response = await fetch(
      `${GRAPH_API_BASE}/${igBusinessId}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&limit=${limit}&access_token=${accessToken}`,
    )

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`)
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error("Error getting Instagram media:", error)
    return []
  }
}

// Get Instagram stories
export async function getInstagramStories(igBusinessId: string, accessToken: string): Promise<InstagramMedia[]> {
  try {
    const response = await fetch(
      `${GRAPH_API_BASE}/${igBusinessId}/stories?fields=id,media_type,media_url,permalink,timestamp&access_token=${accessToken}`,
    )

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`)
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error("Error getting Instagram stories:", error)
    return []
  }
}

// Store Instagram credentials in Supabase
export async function storeInstagramCredentials(
  artistId: string,
  pageId: string,
  igBusinessId: string,
  accessToken: string,
  tokenExpiry: Date,
): Promise<boolean> {
  try {
    // In a real implementation, you would store this in Supabase
    console.log(`Stored Instagram credentials for artist ${artistId}`)
    return true
  } catch (error) {
    console.error("Error storing Instagram credentials:", error)
    return false
  }
}

// Get Instagram credentials from Supabase
export async function getInstagramCredentials(artistId: string): Promise<any | null> {
  try {
    // For now, return hardcoded credentials for streetcollector_
    return {
      artist_id: artistId,
      page_id: process.env.FACEBOOK_PAGE_ID || "mock_page_id",
      instagram_business_id: process.env.INSTAGRAM_BUSINESS_ID || "mock_ig_business_id",
      access_token: process.env.INSTAGRAM_ACCESS_TOKEN || "mock_access_token",
      token_expiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
      updated_at: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error getting Instagram credentials:", error)
    return null
  }
}
