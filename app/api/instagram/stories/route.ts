import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_BUSINESS_ID } from "@/lib/env"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const artistName = searchParams.get("artist")

    if (!artistName) {
      return NextResponse.json({ success: false, message: "Artist name is required" }, { status: 400 })
    }

    // In a real implementation, you would fetch the artist's Instagram ID from your database
    // For demo purposes, we'll use the environment variable

    if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_BUSINESS_ID) {
      // If Instagram credentials are not available, return mock data
      return NextResponse.json({
        success: true,
        stories: getMockStories(artistName),
      })
    }

    // In a real implementation, you would fetch stories from Instagram Graph API
    // Example API call (commented out as it requires actual Instagram credentials)
    /*
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${INSTAGRAM_BUSINESS_ID}/stories?access_token=${INSTAGRAM_ACCESS_TOKEN}`
    )
    
    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`)
    }
    
    const data = await response.json()
    */

    // For demo purposes, return mock data
    return NextResponse.json({
      success: true,
      stories: getMockStories(artistName),
    })
  } catch (error: any) {
    console.error("Error fetching Instagram stories:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch Instagram stories" },
      { status: 500 },
    )
  }
}

function getMockStories(artistName: string) {
  // Generate mock stories based on artist name for demo purposes
  return [
    {
      id: `story-${artistName}-1`,
      imageUrl: "/vibrant-artist-corner.png",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      caption: `Working on a new piece today! #artistlife #${artistName.toLowerCase().replace(/\s+/g, "")}`,
    },
    {
      id: `story-${artistName}-2`,
      imageUrl: "/brushstrokes-texture.png",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
      caption: "Detail shot of the new limited edition print",
    },
    {
      id: `story-${artistName}-3`,
      imageUrl: "/gallery-night.png",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      caption: "At the gallery preparing for the upcoming show",
    },
  ]
}
