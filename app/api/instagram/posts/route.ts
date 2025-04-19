import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.SUPABASE_CONNECTION_STRING!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendor = searchParams.get("vendor")

    if (!vendor) {
      return NextResponse.json({ error: "Vendor parameter is required" }, { status: 400 })
    }

    // Get the vendor's Instagram URL
    const urlResult = await sql`
      SELECT instagram_url FROM vendor_instagram_urls
      WHERE vendor = ${vendor}
    `

    if (urlResult.length === 0 || !urlResult[0].instagram_url) {
      return NextResponse.json({ posts: [] })
    }

    const instagramUrl = urlResult[0].instagram_url

    // Extract Instagram username from URL
    let username = ""
    try {
      const url = new URL(instagramUrl)
      const pathParts = url.pathname.split("/").filter(Boolean)
      username = pathParts[0]
    } catch (error) {
      console.error("Error parsing Instagram URL:", error)
      return NextResponse.json({ error: "Invalid Instagram URL" }, { status: 400 })
    }

    if (!username) {
      return NextResponse.json({ error: "Could not extract Instagram username" }, { status: 400 })
    }

    // Check if we have an Instagram access token
    if (!process.env.INSTAGRAM_ACCESS_TOKEN) {
      // Return mock data for demonstration purposes
      return NextResponse.json({
        posts: [
          {
            id: "1",
            media_url: `/placeholder.svg?height=400&width=400&query=Instagram post by ${username}`,
            permalink: instagramUrl,
            caption: "This is a placeholder post. Configure Instagram API for real posts.",
            timestamp: new Date().toISOString(),
          },
          {
            id: "2",
            media_url: `/placeholder.svg?height=400&width=400&query=Another Instagram post by ${username}`,
            permalink: instagramUrl,
            caption: "Another placeholder post. Set up Instagram API integration.",
            timestamp: new Date(Date.now() - 86400000).toISOString(),
          },
        ],
      })
    }

    // If we have an access token, fetch real Instagram posts
    // This is a simplified example - real implementation would use the Instagram Graph API
    const response = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_url,permalink,timestamp&access_token=${process.env.INSTAGRAM_ACCESS_TOKEN}`,
    )

    if (!response.ok) {
      throw new Error("Failed to fetch Instagram posts")
    }

    const data = await response.json()
    return NextResponse.json({ posts: data.data || [] })
  } catch (error) {
    console.error("Error fetching Instagram posts:", error)
    return NextResponse.json({ error: "Failed to fetch Instagram posts" }, { status: 500 })
  }
}
