import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"
import type { JourneyPosition } from "@/types/artwork-series"

/**
 * PUT /api/vendor/series/[id]/journey-position
 * Update journey map position for a series
 * Updates x, y coordinates, level/island_group, and connections to other series
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const seriesId = params.id

    // Verify series belongs to vendor
    const { data: existingSeries, error: checkError } = await supabase
      .from("artwork_series")
      .select("id")
      .eq("id", seriesId)
      .eq("vendor_id", vendor.id)
      .single()

    if (checkError || !existingSeries) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 })
    }

    const body = await request.json()
    const {
      journey_position,
      connected_series_ids,
      unlocks_series_ids,
      level,
      island_group,
    } = body

    // Validate journey_position if provided
    if (journey_position) {
      if (typeof journey_position.x !== "number" || typeof journey_position.y !== "number") {
        return NextResponse.json(
          { error: "journey_position must have numeric x and y coordinates" },
          { status: 400 }
        )
      }
    }

    // Validate connected_series_ids if provided
    if (connected_series_ids !== undefined) {
      if (!Array.isArray(connected_series_ids)) {
        return NextResponse.json(
          { error: "connected_series_ids must be an array" },
          { status: 400 }
        )
      }

      // Verify all connected series belong to the same vendor
      if (connected_series_ids.length > 0) {
        const { data: connectedSeries, error: connectedError } = await supabase
          .from("artwork_series")
          .select("id")
          .in("id", connected_series_ids)
          .eq("vendor_id", vendor.id)

        if (connectedError) {
          return NextResponse.json(
            { error: "Failed to validate connected series" },
            { status: 500 }
          )
        }

        if (connectedSeries.length !== connected_series_ids.length) {
          return NextResponse.json(
            { error: "Some connected series do not belong to this vendor" },
            { status: 400 }
          )
        }
      }
    }

    // Validate unlocks_series_ids if provided
    if (unlocks_series_ids !== undefined) {
      if (!Array.isArray(unlocks_series_ids)) {
        return NextResponse.json(
          { error: "unlocks_series_ids must be an array" },
          { status: 400 }
        )
      }

      // Verify all unlocked series belong to the same vendor
      if (unlocks_series_ids.length > 0) {
        const { data: unlockedSeries, error: unlockedError } = await supabase
          .from("artwork_series")
          .select("id")
          .in("id", unlocks_series_ids)
          .eq("vendor_id", vendor.id)

        if (unlockedError) {
          return NextResponse.json(
            { error: "Failed to validate unlocked series" },
            { status: 500 }
          )
        }

        if (unlockedSeries.length !== unlocks_series_ids.length) {
          return NextResponse.json(
            { error: "Some unlocked series do not belong to this vendor" },
            { status: 400 }
          )
        }
      }
    }

    // Build update data
    const updateData: any = {}

    if (journey_position) {
      // Merge with existing position if needed, or set new position
      const position: JourneyPosition = {
        x: journey_position.x,
        y: journey_position.y,
        ...(level !== undefined && { level }),
        ...(island_group !== undefined && { island_group }),
      }
      updateData.journey_position = position
    } else if (level !== undefined || island_group !== undefined) {
      // Update level/island_group in existing position
      const { data: currentSeries } = await supabase
        .from("artwork_series")
        .select("journey_position")
        .eq("id", seriesId)
        .single()

      const currentPosition = (currentSeries?.journey_position as JourneyPosition) || {
        x: 0,
        y: 0,
      }

      updateData.journey_position = {
        ...currentPosition,
        ...(level !== undefined && { level }),
        ...(island_group !== undefined && { island_group }),
      }
    }

    if (connected_series_ids !== undefined) {
      updateData.connected_series_ids = connected_series_ids
    }

    if (unlocks_series_ids !== undefined) {
      updateData.unlocks_series_ids = unlocks_series_ids
    }

    // Update series
    const { data: updatedSeries, error: updateError } = await supabase
      .from("artwork_series")
      .update(updateData)
      .eq("id", seriesId)
      .eq("vendor_id", vendor.id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating journey position:", updateError)
      return NextResponse.json({ error: "Failed to update journey position" }, { status: 500 })
    }

    return NextResponse.json({ series: updatedSeries })
  } catch (error: any) {
    console.error("Error in PUT /api/vendor/series/[id]/journey-position:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
