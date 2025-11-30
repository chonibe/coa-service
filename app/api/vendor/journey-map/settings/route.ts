import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"
import type { JourneyMapSettings } from "@/types/artwork-series"

/**
 * GET /api/vendor/journey-map/settings
 * Get vendor's journey map settings
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()

    // Get vendor info
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, vendor_name")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Get or create journey map settings
    let { data: settings, error: settingsError } = await supabase
      .from("journey_map_settings")
      .select("*")
      .eq("vendor_id", vendor.id)
      .single()

    if (settingsError && settingsError.code === "PGRST116") {
      // Settings don't exist, create default
      const { data: newSettings, error: createError } = await supabase
        .from("journey_map_settings")
        .insert({
          vendor_id: vendor.id,
          map_style: "island",
          theme_colors: {},
          default_series_position: {},
        })
        .select()
        .single()

      if (createError) {
        console.error("Error creating journey map settings:", createError)
        return NextResponse.json({ error: "Failed to create settings" }, { status: 500 })
      }

      settings = newSettings
    } else if (settingsError) {
      console.error("Error fetching journey map settings:", settingsError)
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
    }

    return NextResponse.json({ settings })
  } catch (error: any) {
    console.error("Error in GET /api/vendor/journey-map/settings:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

/**
 * PUT /api/vendor/journey-map/settings
 * Update vendor's journey map settings
 */
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()

    // Get vendor info
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, vendor_name")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    const body = await request.json()
    const { map_style, background_image_url, theme_colors, default_series_position } = body

    // Validate map_style
    const validMapStyles = ["island", "timeline", "level", "custom"]
    if (map_style && !validMapStyles.includes(map_style)) {
      return NextResponse.json(
        { error: `map_style must be one of: ${validMapStyles.join(", ")}` },
        { status: 400 }
      )
    }

    // Update or create settings
    const updateData: any = {}
    if (map_style !== undefined) updateData.map_style = map_style
    if (background_image_url !== undefined) updateData.background_image_url = background_image_url
    if (theme_colors !== undefined) updateData.theme_colors = theme_colors
    if (default_series_position !== undefined) updateData.default_series_position = default_series_position

    const { data: settings, error: upsertError } = await supabase
      .from("journey_map_settings")
      .upsert(
        {
          vendor_id: vendor.id,
          ...updateData,
        },
        { onConflict: "vendor_id" }
      )
      .select()
      .single()

    if (upsertError) {
      console.error("Error updating journey map settings:", upsertError)
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
    }

    return NextResponse.json({ settings })
  } catch (error: any) {
    console.error("Error in PUT /api/vendor/journey-map/settings:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
