import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"
import { fetchInstagramProfile } from "@/lib/instagram-api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get("username")

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 })
    }

    // Check if we have a cached profile
    const { data: cachedProfile, error: cacheError } = await supabase
      .from("instagram_profile_cache")
      .select("*")
      .eq("username", username)
      .single()

    // If we have a recent cached profile (less than 1 hour old), return it
    if (cachedProfile && !cacheError) {
      const cacheAge = Date.now() - new Date(cachedProfile.updated_at).getTime()
      const cacheMaxAge = 60 * 60 * 1000 // 1 hour in milliseconds

      if (cacheAge < cacheMaxAge) {
        return NextResponse.json({
          profile: cachedProfile,
          source: "cache",
        })
      }
    }

    // Fetch fresh profile data from Instagram API
    const profileData = await fetchInstagramProfile(username)

    if (!profileData) {
      return NextResponse.json({ error: "Failed to fetch Instagram profile" }, { status: 500 })
    }

    // Update or insert the profile in the cache
    const { data: updatedProfile, error: updateError } = await supabase
      .from("instagram_profile_cache")
      .upsert({
        username,
        profile_picture_url: profileData.profile_picture_url,
        followers_count: profileData.followers_count,
        media_count: profileData.media_count,
        biography: profileData.biography,
        name: profileData.name,
        website: profileData.website,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (updateError) {
      console.error("Error updating Instagram profile cache:", updateError)
    }

    return NextResponse.json({
      profile: profileData,
      source: "api",
    })
  } catch (error: any) {
    console.error("Error in Instagram profile API:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}
