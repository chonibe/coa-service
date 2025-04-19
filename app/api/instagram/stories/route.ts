import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getInstagramStories } from "@/lib/instagram-api"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get("vendorId")
    const accountId = searchParams.get("accountId")

    if (!vendorId || !accountId) {
      return NextResponse.json({ message: "Vendor ID and Account ID are required" }, { status: 400 })
    }

    // Fetch the stories from Instagram API
    const storiesData = await getInstagramStories(accountId)

    // Transform the data to match our database schema
    const stories = storiesData.data.map((item: any) => ({
      id: item.id,
      vendor_id: vendorId,
      media_type: item.media_type,
      media_url: item.media_url,
      permalink: item.permalink,
      timestamp: item.timestamp,
      expires_at: new Date(new Date(item.timestamp).getTime() + 86400000).toISOString(), // Stories expire after 24 hours
    }))

    // Update or insert the stories in Supabase
    for (const item of stories) {
      const { error: upsertError } = await supabase
        .from("instagram_stories")
        .upsert(item, { onConflict: "id" })
        .select()

      if (upsertError) {
        console.error("Error upserting Instagram story:", upsertError)
      }
    }

    console.log(`Returning fresh Instagram stories for ${vendorId}`)
    return NextResponse.json({ stories })
  } catch (error: any) {
    console.error("Error fetching Instagram stories:", error)
    return NextResponse.json({ message: "Error fetching Instagram stories" }, { status: 500 })
  }
}
