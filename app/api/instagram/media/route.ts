import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"
import { fetchInstagramMedia } from "@/lib/instagram-api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get("username")
    const limit = Number.parseInt(searchParams.get("limit") || "12", 10)

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 })
    }

    // Check if we have cached media
    const { data: cachedMedia, error: cacheError } = await supabase
      .from("instagram_media_cache")
      .select("*")
      .eq("username", username)
      .order("timestamp", { ascending: false })
      .limit(limit)

    // If we have recent cached media (less than 1 hour old), return it
    if (cachedMedia && cachedMedia.length > 0 && !cacheError) {
      const newestCachedItem = cachedMedia[0]
      const cacheAge = Date.now() - new Date(newestCachedItem.updated_at).getTime()
      const cacheMaxAge = 60 * 60 * 1000 // 1 hour in milliseconds

      if (cacheAge < cacheMaxAge) {
        return NextResponse.json({
          media: cachedMedia,
          source: "cache",
        })
      }
    }

    // Fetch fresh media data from Instagram API
    const mediaData = await fetchInstagramMedia(username, limit)

    if (!mediaData || mediaData.length === 0) {
      return NextResponse.json({ error: "Failed to fetch Instagram media" }, { status: 500 })
    }

    // Update the media cache
    for (const item of mediaData) {
      const { error: updateError } = await supabase.from("instagram_media_cache").upsert({
        instagram_media_id: item.id,
        username,
        media_type: item.media_type,
        media_url: item.media_url,
        thumbnail_url: item.thumbnail_url || null,
        permalink: item.permalink,
        caption: item.caption || null,
        timestamp: item.timestamp,
        updated_at: new Date().toISOString(),
      })

      if (updateError) {
        console.error("Error updating Instagram media cache:", updateError)
      }
    }

    return NextResponse.json({
      media: mediaData,
      source: "api",
    })
  } catch (error: any) {
    console.error("Error in Instagram media API:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}
