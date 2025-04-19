import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getInstagramMedia } from "@/lib/instagram-api"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get("vendorId")
    const accountId = searchParams.get("accountId")

    if (!vendorId || !accountId) {
      return NextResponse.json({ message: "Vendor ID and Account ID are required" }, { status: 400 })
    }

    // Fetch the media from Instagram API
    const mediaData = await getInstagramMedia(accountId)

    // Transform the data to match our database schema
    const media = mediaData.data.map((item: any) => ({
      id: item.id,
      vendor_id: vendorId,
      media_type: item.media_type,
      media_url: item.media_url,
      permalink: item.permalink,
      caption: item.caption,
      like_count: item.like_count,
      comments_count: item.comments_count,
    }))

    // Update or insert the media in Supabase
    for (const item of media) {
      const { error: upsertError } = await supabase.from("instagram_media").upsert(item, { onConflict: "id" }).select()

      if (upsertError) {
        console.error("Error upserting Instagram media:", upsertError)
      }
    }

    console.log(`Returning fresh Instagram media for ${vendorId}`)
    return NextResponse.json({ media })
  } catch (error: any) {
    console.error("Error fetching Instagram media:", error)
    return NextResponse.json({ message: "Error fetching Instagram media" }, { status: 500 })
  }
}
