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

// Validate and clean access token
function validateToken(token: string): string {
  if (!token) {
    throw new Error("Empty access token")
  }

  // Remove any whitespace that might have been accidentally included
  const cleanToken = token.trim()

  // Basic validation - tokens should be non-empty strings
  if (!cleanToken) {
    throw new Error("Empty access token")
  }

  // Check if token has the expected format (usually starts with EAA)
  if (!cleanToken.startsWith("EAA")) {
    console.warn("Access token doesn't have the expected format (should start with EAA)")
  }

  return cleanToken
}

// Validate Instagram Business ID
function validateBusinessId(id: string): string {
  if (!id) {
    throw new Error("Empty Instagram Business ID")
  }

  const cleanId = id.trim()

  if (!cleanId) {
    throw new Error("Empty Instagram Business ID")
  }

  return cleanId
}

// Get Instagram business account ID from Facebook Page ID
export async function getInstagramBusinessAccountId(pageId: string, accessToken: string): Promise<string | null> {
  try {
    const validToken = validateToken(accessToken)
    const validPageId = validateBusinessId(pageId)

    console.log(`Fetching Instagram Business ID for Page ID: ${validPageId}`)

    const response = await fetch(
      `${GRAPH_API_BASE}/${validPageId}?fields=instagram_business_account&access_token=${validToken}`,
      {
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Facebook API error: ${response.status}`, errorText)
      throw new Error(`Facebook API error: ${response.status}`)
    }

    const data = await response.json()

    if (!data.instagram_business_account?.id) {
      console.error("No Instagram Business Account found for this Page ID")
      return null
    }

    console.log(`Successfully retrieved Instagram Business ID: ${data.instagram_business_account.id}`)
    return data.instagram_business_account.id
  } catch (error) {
    console.error("Error getting Instagram business account ID:", error)
    return null
  }
}

// Get Instagram profile information
export async function getInstagramProfile(igBusinessId: string, accessToken: string): Promise<InstagramProfile | null> {
  try {
    if (!igBusinessId || !accessToken) {
      console.error("Missing required parameters for getInstagramProfile")
      return null
    }

    const validToken = validateToken(accessToken)
    const validBusinessId = validateBusinessId(igBusinessId)

    console.log(`Fetching Instagram profile for Business ID: ${validBusinessId}`)

    const url = `${GRAPH_API_BASE}/${validBusinessId}?fields=username,profile_picture_url,followers_count,media_count,biography,name,website&access_token=${validToken}`

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Instagram API error: ${response.status}`, errorText)

      // Log more details about the request (without exposing the full token)
      console.error(`Request details: Business ID: ${validBusinessId}, Token length: ${validToken.length}`)

      throw new Error(`Instagram API error: ${response.status}`)
    }

    const data = await response.json()
    console.log(`Successfully fetched Instagram profile for: ${data.username || "unknown"}`)

    return data
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
    if (!igBusinessId || !accessToken) {
      console.error("Missing required parameters for getInstagramMedia")
      return []
    }

    const validToken = validateToken(accessToken)
    const validBusinessId = validateBusinessId(igBusinessId)

    console.log(`Fetching Instagram media for Business ID: ${validBusinessId}`)

    const url = `${GRAPH_API_BASE}/${validBusinessId}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&limit=${limit}&access_token=${validToken}`

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Instagram API error: ${response.status}`, errorText)
      throw new Error(`Instagram API error: ${response.status}`)
    }

    const data = await response.json()
    console.log(`Fetched ${data.data?.length || 0} Instagram media items`)

    return data.data || []
  } catch (error) {
    console.error("Error getting Instagram media:", error)
    return []
  }
}

// Get Instagram stories
export async function getInstagramStories(igBusinessId: string, accessToken: string): Promise<InstagramMedia[]> {
  try {
    if (!igBusinessId || !accessToken) {
      console.error("Missing required parameters for getInstagramStories")
      return []
    }

    const validToken = validateToken(accessToken)
    const validBusinessId = validateBusinessId(igBusinessId)

    console.log(`Fetching Instagram stories for Business ID: ${validBusinessId}`)

    const url = `${GRAPH_API_BASE}/${validBusinessId}/stories?fields=id,media_type,media_url,permalink,timestamp&access_token=${validToken}`

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Instagram API error: ${response.status}`, errorText)
      throw new Error(`Instagram API error: ${response.status}`)
    }

    const data = await response.json()
    console.log(`Fetched ${data.data?.length || 0} Instagram stories`)

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
    // Log the environment variables (without revealing the full token)
    const pageId = process.env.FACEBOOK_PAGE_ID || ""
    const igBusinessId = process.env.INSTAGRAM_BUSINESS_ID || ""
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || ""

    console.log("Environment variables check:")
    console.log(`- FACEBOOK_PAGE_ID: ${pageId ? "Set" : "Not set"}`)
    console.log(`- INSTAGRAM_BUSINESS_ID: ${igBusinessId ? "Set" : "Not set"}`)
    console.log(`- INSTAGRAM_ACCESS_TOKEN: ${accessToken ? "Set (length: " + accessToken.length + ")" : "Not set"}`)

    if (!pageId || !igBusinessId || !accessToken) {
      console.warn("Missing one or more required Instagram credentials in environment variables")
    }

    return {
      artist_id: artistId,
      page_id: pageId,
      instagram_business_id: igBusinessId,
      access_token: accessToken,
      token_expiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
      updated_at: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error getting Instagram credentials:", error)
    return null
  }
}

// Test Instagram credentials
export async function testInstagramCredentials(igBusinessId: string, accessToken: string): Promise<boolean> {
  try {
    if (!igBusinessId || !accessToken) {
      return false
    }

    const validToken = validateToken(accessToken)
    const validBusinessId = validateBusinessId(igBusinessId)

    // Make a simple API call to test the credentials
    const response = await fetch(`${GRAPH_API_BASE}/${validBusinessId}?fields=username&access_token=${validToken}`, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error testing Instagram credentials: ${response.status}`, errorText)
    }

    return response.ok
  } catch (error) {
    console.error("Error testing Instagram credentials:", error)
    return false
  }
}

// Debug token information
export async function debugToken(accessToken: string): Promise<any> {
  try {
    if (!accessToken) {
      return { error: "No access token provided" }
    }

    const validToken = validateToken(accessToken)

    // Use the debug_token endpoint to get information about the token
    const response = await fetch(`${GRAPH_API_BASE}/debug_token?input_token=${validToken}&access_token=${validToken}`, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error debugging token: ${response.status}`, errorText)
      return { error: `API error: ${response.status}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error debugging token:", error)
    return { error: error.message }
  }
}
