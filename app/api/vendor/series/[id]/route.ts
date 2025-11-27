import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"
import type { SeriesFormData, UnlockType } from "@/types/artwork-series"

export async function GET(
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

    // Fetch series
    const { data: series, error: seriesError } = await supabase
      .from("artwork_series")
      .select("*")
      .eq("id", seriesId)
      .eq("vendor_id", vendor.id)
      .single()

    if (seriesError || !series) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 })
    }

    // Fetch members with artwork details
    const { data: members, error: membersError } = await supabase
      .from("artwork_series_members")
      .select("*")
      .eq("series_id", seriesId)
      .order("display_order", { ascending: true })
      .order("unlock_order", { ascending: true, nullsLast: true })

    if (membersError) {
      console.error("Error fetching series members:", membersError)
    }

    // Enrich members with artwork details
    const enrichedMembers = await Promise.all(
      (members || []).map(async (member) => {
        let artworkTitle = ""
        let artworkImage = ""

        if (member.submission_id) {
          const { data: submission } = await supabase
            .from("vendor_product_submissions")
            .select("product_data")
            .eq("id", member.submission_id)
            .single()

          if (submission?.product_data) {
            artworkTitle = (submission.product_data as any).title || ""
            const images = (submission.product_data as any).images || []
            artworkImage = images[0]?.src || ""
          }
        } else if (member.shopify_product_id) {
          // Could fetch from Shopify API if needed, but for now just use submission_id
        }

        return {
          ...member,
          artwork_title: artworkTitle,
          artwork_image: artworkImage,
        }
      })
    )

    // Get member count
    const { count } = await supabase
      .from("artwork_series_members")
      .select("*", { count: "exact", head: true })
      .eq("series_id", seriesId)

    return NextResponse.json({
      series: {
        ...series,
        member_count: count || 0,
      },
      members: enrichedMembers,
    })
  } catch (error: any) {
    console.error("Error in GET /api/vendor/series/[id]:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

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
      .select("id, name")
      .eq("id", seriesId)
      .eq("vendor_id", vendor.id)
      .single()

    if (checkError || !existingSeries) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 })
    }

    const body = await request.json()
    const seriesData: Partial<SeriesFormData> = body

    // Validate unlock_config if unlock_type is being updated
    if (seriesData.unlock_type && seriesData.unlock_config) {
      const validationError = validateUnlockConfig(seriesData.unlock_type, seriesData.unlock_config)
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 })
      }
    }

    // Check for duplicate name if name is being updated
    if (seriesData.name && seriesData.name.trim() !== existingSeries.name) {
      const { data: duplicate } = await supabase
        .from("artwork_series")
        .select("id")
        .eq("vendor_id", vendor.id)
        .eq("name", seriesData.name.trim())
        .eq("is_active", true)
        .neq("id", seriesId)
        .maybeSingle()

      if (duplicate) {
        return NextResponse.json({ error: "A series with this name already exists" }, { status: 400 })
      }
    }

    // Update series
    const updateData: any = {}
    if (seriesData.name) updateData.name = seriesData.name.trim()
    if (seriesData.description !== undefined) updateData.description = seriesData.description?.trim() || null
    if (seriesData.thumbnail_url !== undefined) updateData.thumbnail_url = seriesData.thumbnail_url || null
    if (seriesData.unlock_type) updateData.unlock_type = seriesData.unlock_type
    if (seriesData.unlock_config) updateData.unlock_config = seriesData.unlock_config
    if (seriesData.display_order !== undefined) updateData.display_order = seriesData.display_order

    const { data: updatedSeries, error: updateError } = await supabase
      .from("artwork_series")
      .update(updateData)
      .eq("id", seriesId)
      .eq("vendor_id", vendor.id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating series:", updateError)
      return NextResponse.json({ error: "Failed to update series" }, { status: 500 })
    }

    return NextResponse.json({ series: updatedSeries })
  } catch (error: any) {
    console.error("Error in PUT /api/vendor/series/[id]:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
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

    // Check if series has members
    const { count } = await supabase
      .from("artwork_series_members")
      .select("*", { count: "exact", head: true })
      .eq("series_id", seriesId)

    if (count && count > 0) {
      // Soft delete - set is_active to false
      const { error: updateError } = await supabase
        .from("artwork_series")
        .update({ is_active: false })
        .eq("id", seriesId)

      if (updateError) {
        console.error("Error soft-deleting series:", updateError)
        return NextResponse.json({ error: "Failed to delete series" }, { status: 500 })
      }
    } else {
      // Hard delete if no members
      const { error: deleteError } = await supabase
        .from("artwork_series")
        .delete()
        .eq("id", seriesId)

      if (deleteError) {
        console.error("Error deleting series:", deleteError)
        return NextResponse.json({ error: "Failed to delete series" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in DELETE /api/vendor/series/[id]:", error)
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
    case "any_purchase":
    case "custom":
      // No specific validation required
      break
    default:
      return `Invalid unlock type: ${unlockType}`
  }

  return null
}

