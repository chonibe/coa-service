import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"
import type { ArtworkSeries, SeriesFormData, UnlockType } from "@/types/artwork-series"

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

    // Fetch all series for this vendor
    const { data: series, error: seriesError } = await supabase
      .from("artwork_series")
      .select("*")
      .eq("vendor_id", vendor.id)
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })

    if (seriesError) {
      console.error("Error fetching series:", seriesError)
      return NextResponse.json({ error: "Failed to fetch series" }, { status: 500 })
    }

    // Get member count for each series
    const seriesWithCounts = await Promise.all(
      (series || []).map(async (s) => {
        const { count } = await supabase
          .from("artwork_series_members")
          .select("*", { count: "exact", head: true })
          .eq("series_id", s.id)

        return {
          ...s,
          member_count: count || 0,
        }
      })
    )

    return NextResponse.json({ series: seriesWithCounts })
  } catch (error: any) {
    console.error("Error in GET /api/vendor/series:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
    const seriesData: SeriesFormData = body

    // Validate required fields
    if (!seriesData.name || seriesData.name.trim().length === 0) {
      return NextResponse.json({ error: "Series name is required" }, { status: 400 })
    }

    if (!seriesData.unlock_type) {
      return NextResponse.json({ error: "Unlock type is required" }, { status: 400 })
    }

    // Validate unlock_config based on unlock_type
    const validationError = validateUnlockConfig(seriesData.unlock_type, seriesData.unlock_config)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    // Check for duplicate series name
    const { data: existing } = await supabase
      .from("artwork_series")
      .select("id")
      .eq("vendor_id", vendor.id)
      .eq("name", seriesData.name.trim())
      .eq("is_active", true)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "A series with this name already exists" }, { status: 400 })
    }

    // Create series - only include optional fields if they're provided
    const insertData: any = {
      vendor_id: vendor.id,
      vendor_name: vendor.vendor_name,
      name: seriesData.name.trim(),
      description: seriesData.description?.trim() || null,
      thumbnail_url: seriesData.thumbnail_url || null,
      unlock_type: seriesData.unlock_type,
      unlock_config: seriesData.unlock_config || {},
      display_order: seriesData.display_order || 0,
      is_active: true,
    }

    // Only include optional fields if they exist in the data
    if (seriesData.release_date !== undefined) {
      insertData.release_date = seriesData.release_date || null
    }
    if (seriesData.genre_tags !== undefined) {
      insertData.genre_tags = seriesData.genre_tags || null
    }
    if (seriesData.unlock_progress !== undefined) {
      insertData.unlock_progress = seriesData.unlock_progress || {}
    }
    if (seriesData.unlock_milestones !== undefined) {
      insertData.unlock_milestones = seriesData.unlock_milestones || []
    }

    // Extract time-based unlock fields from unlock_config to separate columns
    // Note: unlock_at is stored per member, not per series
    // unlock_schedule is stored at the series level for recurring schedules
    // If columns don't exist (migration not applied), data stays in unlock_config
    if (seriesData.unlock_type === "time_based" && seriesData.unlock_config) {
      if (seriesData.unlock_config.unlock_schedule) {
        insertData.unlock_schedule = seriesData.unlock_config.unlock_schedule
      }
      // unlock_at stays in unlock_config for one-time unlocks (applied per member)
    }

    // Extract VIP unlock fields from unlock_config to separate columns
    // If columns don't exist (migration not applied), data stays in unlock_config
    if (seriesData.unlock_type === "vip" && seriesData.unlock_config) {
      if (seriesData.unlock_config.requires_ownership !== undefined) {
        insertData.requires_ownership = seriesData.unlock_config.requires_ownership
      }
      if (seriesData.unlock_config.vip_tier !== undefined) {
        insertData.vip_tier = seriesData.unlock_config.vip_tier
      }
    }

    let { data: newSeries, error: createError } = await supabase
      .from("artwork_series")
      .insert(insertData)
      .select()
      .single()

    // If error is due to missing columns (PGRST204 or 42703), retry without those fields
    // The data is already in unlock_config, so it will work
    if (createError && (createError.code === "PGRST204" || createError.code === "42703")) {
      console.log(`Columns not available (Code: ${createError.code}), retrying with unlock_config only`)
      // Remove the fields that don't exist and retry
      const retryData = { ...insertData }
      delete retryData.unlock_schedule
      delete retryData.requires_ownership
      delete retryData.vip_tier

      const retryResult = await supabase
        .from("artwork_series")
        .insert(retryData)
        .select()
        .single()

      if (retryResult.error) {
        console.error("Error creating series (retry):", retryResult.error)
        return NextResponse.json({ error: "Failed to create series" }, { status: 500 })
      }

      newSeries = retryResult.data
      createError = null
    }

    if (createError) {
      console.error("Error creating series:", createError)
      return NextResponse.json({ 
        error: "Failed to create series", 
        details: createError.message,
        code: createError.code 
      }, { status: 500 })
    }

    return NextResponse.json({ series: newSeries }, { status: 201 })
  } catch (error: any) {
    console.error("Error in POST /api/vendor/series:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

function validateUnlockConfig(unlockType: UnlockType, config: any): string | null {
  // Allow empty config (will default to {})
  if (!config) {
    return null
  }

  switch (unlockType) {
    case "sequential":
      // Allow empty order array initially - it can be populated when artworks are added
      if (config.order !== undefined && !Array.isArray(config.order)) {
        return "Sequential unlock type requires 'order' to be an array"
      }
      break
    case "threshold":
      // Allow undefined required_count initially, but if provided, must be valid
      if (config.required_count !== undefined) {
        if (typeof config.required_count !== "number" || config.required_count <= 0) {
          return "Threshold unlock type requires a positive 'required_count'"
        }
      }
      // Allow empty unlocks array initially
      if (config.unlocks !== undefined && !Array.isArray(config.unlocks)) {
        return "Threshold unlock type requires 'unlocks' to be an array"
      }
      break
    case "time_based":
      // Must have either unlock_at or unlock_schedule
      if (!config.unlock_at && !config.unlock_schedule) {
        return "Time-based unlock type requires either 'unlock_at' or 'unlock_schedule'"
      }
      if (config.unlock_schedule) {
        if (!config.unlock_schedule.type || !config.unlock_schedule.time) {
          return "Unlock schedule must have 'type' and 'time' fields"
        }
      }
      break
    case "vip":
      // VIP unlocks should have at least one requirement
      if (
        (!config.requires_ownership || config.requires_ownership.length === 0) &&
        config.vip_tier === undefined &&
        config.loyalty_points_required === undefined
      ) {
        return "VIP unlock type requires at least one requirement (ownership, tier, or loyalty points)"
      }
      break
    case "any_purchase":
      // No specific validation required
      break
    case "nfc":
      // No additional validation required for NFC unlocks today
      break
    default:
      return `Invalid unlock type: ${unlockType}`
  }

  return null
}

