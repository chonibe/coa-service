import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()

    // Get artist details
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select(`
        id,
        vendor_name,
        bio,
        avatar_url,
        social_links,
        products (
          id
        )
      `)
      .eq("id", params.id)
      .single()

    if (vendorError) {
      throw vendorError
    }

    // Get collector count (unique customers who own this vendor's artworks)
    const { count: collectorCount } = await supabase
      .from("line_items")
      .select("customer_id", { count: "exact", head: true })
      .eq("vendor_id", params.id)
      .not("customer_id", "is", null)

    // Get upcoming drops
    const { data: upcomingDrops, error: dropsError } = await supabase
      .from("products")
      .select(`
        id,
        name as title,
        release_date,
        preview_image_url as image_url
      `)
      .eq("vendor_id", params.id)
      .gt("release_date", new Date().toISOString())
      .order("release_date", { ascending: true })
      .limit(5)

    if (dropsError) {
      throw dropsError
    }

    const artist = {
      id: vendor.id,
      name: vendor.vendor_name,
      bio: vendor.bio || "No bio available",
      avatar_url: vendor.avatar_url,
      collector_count: collectorCount || 0,
      social_links: vendor.social_links || {},
      upcoming_drops: upcomingDrops || []
    }

    return NextResponse.json({ artist })
  } catch (error: any) {
    console.error("Error in artist API:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
} 