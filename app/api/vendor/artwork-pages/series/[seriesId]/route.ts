import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

// GET: Fetch series-level template content blocks
export async function GET(
  request: NextRequest,
  { params }: { params: { seriesId: string } }
) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()
    const { seriesId } = params

    // Verify series belongs to vendor
    const { data: series, error: seriesError } = await supabase
      .from("artwork_series")
      .select("id, vendor_name")
      .eq("id", seriesId)
      .eq("vendor_name", vendorName)
      .single()

    if (seriesError || !series) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 })
    }

    // Get benefit type IDs for artwork content blocks
    const { data: benefitTypes } = await supabase
      .from("benefit_types")
      .select("id, name")
      .in("name", [
        "Artwork Text Block",
        "Artwork Image Block",
        "Artwork Video Block",
        "Artwork Audio Block",
      ])

    const artworkBlockTypeIds = benefitTypes?.map((bt) => bt.id) || []

    // Get series-level content blocks (where series_id is set)
    const { data: contentBlocks, error: blocksError } = await supabase
      .from("product_benefits")
      .select(`
        *,
        benefit_types:benefit_type_id (
          name
        )
      `)
      .eq("series_id", seriesId)
      .in("benefit_type_id", artworkBlockTypeIds)
      .order("display_order", { ascending: true })

    if (blocksError) {
      console.error("Error fetching series template:", blocksError)
      return NextResponse.json(
        { error: "Failed to fetch template", message: blocksError.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      contentBlocks: (contentBlocks || []).map((block: any) => ({
        ...block,
        block_type: block.benefit_types?.name || null,
      })),
    })
  } catch (error: any) {
    console.error("Error in series template GET API:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 },
    )
  }
}

// POST: Create or update series-level template
export async function POST(
  request: NextRequest,
  { params }: { params: { seriesId: string } }
) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()
    const { seriesId } = params
    const body = await request.json()
    const { blocks } = body

    // Verify series belongs to vendor
    const { data: series, error: seriesError } = await supabase
      .from("artwork_series")
      .select("id, vendor_name")
      .eq("id", seriesId)
      .eq("vendor_name", vendorName)
      .single()

    if (seriesError || !series) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 })
    }

    // Get benefit type IDs
    const { data: benefitTypes } = await supabase
      .from("benefit_types")
      .select("id, name")
      .in("name", [
        "Artwork Text Block",
        "Artwork Image Block",
        "Artwork Video Block",
        "Artwork Audio Block",
      ])

    const typeMap: Record<string, number> = {}
    benefitTypes?.forEach((bt) => {
      typeMap[bt.name] = bt.id
    })

    // Delete existing series template blocks
    await supabase
      .from("product_benefits")
      .delete()
      .eq("series_id", seriesId)
      .in("benefit_type_id", Object.values(typeMap))

    // Insert new template blocks
    if (blocks && blocks.length > 0) {
      const templateBlocks = blocks.map((block: any) => ({
        series_id: seriesId,
        vendor_name: vendorName,
        benefit_type_id: typeMap[block.block_type] || block.benefit_type_id,
        title: block.title || "",
        description: block.description || "",
        content_url: block.content_url || null,
        block_config: block.block_config || {},
        display_order: block.display_order || 0,
        is_published: true, // Series templates are published by default
        is_active: true,
      }))

      const { error: insertError } = await supabase
        .from("product_benefits")
        .insert(templateBlocks)

      if (insertError) {
        console.error("Error inserting series template:", insertError)
        return NextResponse.json(
          { error: "Failed to save template", message: insertError.message },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: "Series template saved successfully",
    })
  } catch (error: any) {
    console.error("Error in series template POST API:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 },
    )
  }
}
