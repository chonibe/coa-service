import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()
    const { productId } = params
    const body = await request.json()
    const { sourceProductId } = body

    if (!sourceProductId) {
      return NextResponse.json({ error: "Source product ID required" }, { status: 400 })
    }

    // Verify both products belong to vendor
    const { data: targetProduct, error: targetError } = await supabase
      .from("products")
      .select("id, vendor_name")
      .eq("id", productId)
      .eq("vendor_name", vendorName)
      .single()

    if (targetError || !targetProduct) {
      return NextResponse.json({ error: "Target product not found" }, { status: 404 })
    }

    const { data: sourceProduct, error: sourceError } = await supabase
      .from("products")
      .select("id, vendor_name")
      .eq("id", sourceProductId)
      .eq("vendor_name", vendorName)
      .single()

    if (sourceError || !sourceProduct) {
      return NextResponse.json({ error: "Source product not found" }, { status: 404 })
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

    // Get source content blocks
    const { data: sourceBlocks, error: blocksError } = await supabase
      .from("product_benefits")
      .select("*")
      .eq("product_id", sourceProductId)
      .in("benefit_type_id", artworkBlockTypeIds)
      .order("display_order", { ascending: true })

    if (blocksError) {
      console.error("Error fetching source blocks:", blocksError)
      return NextResponse.json(
        { error: "Failed to fetch source content", message: blocksError.message },
        { status: 500 },
      )
    }

    if (!sourceBlocks || sourceBlocks.length === 0) {
      return NextResponse.json(
        { error: "Source product has no content blocks to copy" },
        { status: 400 },
      )
    }

    // Check if target already has blocks
    const { data: existingBlocks } = await supabase
      .from("product_benefits")
      .select("id")
      .eq("product_id", productId)
      .in("benefit_type_id", artworkBlockTypeIds)

    if (existingBlocks && existingBlocks.length > 0) {
      return NextResponse.json(
        { error: "Target product already has content blocks. Delete them first." },
        { status: 400 },
      )
    }

    // Duplicate blocks for target product
    const newBlocks = sourceBlocks.map((block) => ({
      product_id: productId,
      vendor_name: vendorName,
      benefit_type_id: block.benefit_type_id,
      title: block.title,
      description: block.description,
      content_url: block.content_url,
      block_config: block.block_config,
      display_order: block.display_order,
      is_published: false, // Start as drafts
      is_active: block.is_active,
    }))

    const { data: insertedBlocks, error: insertError } = await supabase
      .from("product_benefits")
      .insert(newBlocks)
      .select()

    if (insertError) {
      console.error("Error copying blocks:", insertError)
      return NextResponse.json(
        { error: "Failed to copy content", message: insertError.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      blocks: insertedBlocks,
      message: `Copied ${insertedBlocks.length} content blocks from source artwork`,
    })
  } catch (error: any) {
    console.error("Error in copy-from API:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 },
    )
  }
}
