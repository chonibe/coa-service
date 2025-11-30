import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"
import type { MilestoneConfig, CompletionType } from "@/types/artwork-series"
import { checkAndCompleteSeries } from "@/lib/series/completion-calculator"

/**
 * PUT /api/vendor/series/[id]/completion-config
 * Update completion settings for a series
 * Sets completion_type (all_sold, percentage_sold, manual), completion_threshold, and auto_complete
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
      .select("id, milestone_config")
      .eq("id", seriesId)
      .eq("vendor_id", vendor.id)
      .single()

    if (checkError || !existingSeries) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 })
    }

    const body = await request.json()
    const { completion_type, completion_threshold, auto_complete } = body

    // Validate completion_type
    const validCompletionTypes: CompletionType[] = ["all_sold", "percentage_sold", "manual"]
    if (completion_type && !validCompletionTypes.includes(completion_type)) {
      return NextResponse.json(
        { error: `completion_type must be one of: ${validCompletionTypes.join(", ")}` },
        { status: 400 }
      )
    }

    // Validate completion_threshold for percentage_sold
    if (completion_type === "percentage_sold" || body.completion_type === "percentage_sold") {
      const threshold = completion_threshold ?? body.completion_threshold
      if (threshold === undefined || threshold === null) {
        return NextResponse.json(
          { error: "completion_threshold is required for percentage_sold type" },
          { status: 400 }
        )
      }
      if (typeof threshold !== "number" || threshold < 0 || threshold > 100) {
        return NextResponse.json(
          { error: "completion_threshold must be a number between 0 and 100" },
          { status: 400 }
        )
      }
    }

    // Build milestone_config
    const currentConfig = (existingSeries.milestone_config as MilestoneConfig) || {
      completion_type: "all_sold",
      auto_complete: true,
    }

    const updatedConfig: MilestoneConfig = {
      completion_type: completion_type || currentConfig.completion_type,
      auto_complete:
        auto_complete !== undefined ? Boolean(auto_complete) : currentConfig.auto_complete,
      ...(completion_threshold !== undefined && { completion_threshold }),
      ...(completion_type === "percentage_sold" &&
        completion_threshold !== undefined && { completion_threshold }),
    }

    // Update series
    const { data: updatedSeries, error: updateError } = await supabase
      .from("artwork_series")
      .update({ milestone_config: updatedConfig })
      .eq("id", seriesId)
      .eq("vendor_id", vendor.id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating completion config:", updateError)
      return NextResponse.json({ error: "Failed to update completion config" }, { status: 500 })
    }

    // If auto_complete is enabled and series is not already completed, check if it should be completed now
    if (updatedConfig.auto_complete && !updatedSeries.completed_at) {
      try {
        await checkAndCompleteSeries(seriesId)
        // Refresh series data after potential completion
        const { data: refreshedSeries } = await supabase
          .from("artwork_series")
          .select("*")
          .eq("id", seriesId)
          .single()

        if (refreshedSeries) {
          return NextResponse.json({ series: refreshedSeries })
        }
      } catch (completionError) {
        console.error("Error checking series completion:", completionError)
        // Continue - config was updated successfully
      }
    }

    return NextResponse.json({ series: updatedSeries })
  } catch (error: any) {
    console.error("Error in PUT /api/vendor/series/[id]/completion-config:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
