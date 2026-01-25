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

    // Verify product belongs to vendor
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, vendor_name")
      .eq("id", productId)
      .eq("vendor_name", vendorName)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Get benefit type IDs for artwork content blocks
    const { data: benefitTypes, error: typesError } = await supabase
      .from("benefit_types")
      .select("id, name")
      .in("name", [
        "Artwork Text Block",
        "Artwork Image Block",
        "Artwork Video Block",
        "Artwork Audio Block",
      ])

    if (typesError || !benefitTypes || benefitTypes.length === 0) {
      return NextResponse.json(
        { error: "Benefit types not found. Please run migrations." },
        { status: 500 },
      )
    }

    const typeMap: Record<string, number> = {}
    benefitTypes.forEach((bt) => {
      typeMap[bt.name] = bt.id
    })

    // Check if template already exists
    const { data: existingBlocks } = await supabase
      .from("product_benefits")
      .select("id")
      .eq("product_id", productId)
      .in("benefit_type_id", Object.values(typeMap))

    if (existingBlocks && existingBlocks.length > 0) {
      return NextResponse.json(
        { error: "Template already applied. Delete existing blocks first." },
        { status: 400 },
      )
    }

    // Create default template blocks
    const templateBlocks = [
      {
        product_id: productId,
        vendor_name: vendorName,
        benefit_type_id: typeMap["Artwork Text Block"],
        title: "About This Piece",
        description: "Share the inspiration, process, or meaning behind this piece...",
        display_order: 0,
        is_published: false,
        is_active: true,
      },
      {
        product_id: productId,
        vendor_name: vendorName,
        benefit_type_id: typeMap["Artwork Image Block"],
        title: "Behind the Scenes",
        description: "Add a behind-the-scenes photo",
        content_url: null,
        block_config: { caption: "" },
        display_order: 1,
        is_published: false,
        is_active: true,
      },
      {
        product_id: productId,
        vendor_name: vendorName,
        benefit_type_id: typeMap["Artwork Video Block"],
        title: "Artist Message",
        description: "Add a video message (optional)",
        content_url: null,
        block_config: {},
        display_order: 2,
        is_published: false,
        is_active: true,
      },
      {
        product_id: productId,
        vendor_name: vendorName,
        benefit_type_id: typeMap["Artwork Audio Block"],
        title: "Personal Message",
        description: "Record or upload an audio message (optional)",
        content_url: null,
        block_config: {},
        display_order: 3,
        is_published: false,
        is_active: true,
      },
    ]

    const { data: insertedBlocks, error: insertError } = await supabase
      .from("product_benefits")
      .insert(templateBlocks)
      .select()

    if (insertError) {
      console.error("Error inserting template blocks:", insertError)
      return NextResponse.json(
        { error: "Failed to apply template", message: insertError.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      blocks: insertedBlocks,
      message: "Template applied successfully",
    })
  } catch (error: any) {
    console.error("Error in apply-template API:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 },
    )
  }
}
