import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getInstagramProfile } from "@/lib/instagram-api"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get("vendorId")
    const accountId = searchParams.get("accountId")

    if (!vendorId || !accountId) {
      return NextResponse.json({ message: "Vendor ID and Account ID are required" }, { status: 400 })
    }

    // Check if the profile is cached in Supabase
    const { data: cachedProfile, error: cacheError } = await supabase
      .from("instagram_profiles")
      .select("*")
      .eq("vendor_id", vendorId)
      .single()

    if (cacheError) {
      console.error("Error fetching cached Instagram profile:", cacheError)
    }

    // If the profile is cached and not stale, return it
    if (cachedProfile && new Date(cachedProfile.updated_at).getTime() > Date.now() - 3600000) {
      // 1 hour cache
      console.log(`Returning cached Instagram profile for ${vendorId}`)
      return NextResponse.json({ profile: cachedProfile })
    }

    // Fetch the profile from Instagram API
    const profileData = await getInstagramProfile(accountId)

    // Transform the data to match our database schema
    const profile = {
      vendor_id: vendorId,
      account_id: accountId,
      username: profileData.username,
      profile_picture_url: profileData.profile_picture_url,
      biography: profileData.biography,
      followers_count: profileData.followers_count,
      follows_count: profileData.follows_count,
      media_count: profileData.media_count,
    }

    // Update or insert the profile in Supabase
    const { error: upsertError } = await supabase
      .from("instagram_profiles")
      .upsert(profile, { onConflict: "vendor_id" })
      .select()

    if (upsertError) {
      console.error("Error upserting Instagram profile:", upsertError)
    }

    console.log(`Returning fresh Instagram profile for ${vendorId}`)
    return NextResponse.json({ profile })
  } catch (error: any) {
    console.error("Error fetching Instagram profile:", error)
    return NextResponse.json({ message: "Error fetching Instagram profile" }, { status: 500 })
  }
}
