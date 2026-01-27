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

    // Check if productId is a UUID (submission ID) or a product ID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)
    
    let product: { id: string; vendor_name: string } | null = null
    let submission: { id: string; product_data: any; vendor_name: string } | null = null

    if (isUUID) {
      // It's a submission ID - fetch from vendor_product_submissions
      const { data: submissionData, error: submissionError } = await supabase
        .from("vendor_product_submissions")
        .select("id, product_data, vendor_name")
        .eq("id", productId)
        .eq("vendor_name", vendorName)
        .single()

      if (submissionError || !submissionData) {
        console.error(`[Apply Template API] Submission not found: ${productId}`, submissionError)
      } else {
        submission = submissionData
        product = {
          id: submissionData.id,
          vendor_name: submissionData.vendor_name,
        }
      }
    }
    
    if (!product) {
      // It's a product ID - fetch from products table
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("id, vendor_name")
        .eq("id", productId)
        .eq("vendor_name", vendorName)
        .single()

      if (productError || !productData) {
        console.error(`[Apply Template API] Product not found: ${productId}`, productError)
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }

      product = productData
    }

    // Handle submission-based template application
    if (submission) {
      const productData = submission.product_data as any
      const benefits = productData?.benefits || []
      
      // Check if template already exists
      const artworkBlocks = benefits.filter((b: any) => 
        ["Artwork Text Block", "Artwork Image Block", "Artwork Video Block", "Artwork Audio Block"].includes(b.type)
      )
      
      if (artworkBlocks.length > 0) {
        return NextResponse.json(
          { error: "Template already applied. Delete existing blocks first." },
          { status: 400 },
        )
      }
      
      // Create default template blocks for submission
      const templateBlocks = [
        {
          id: "temp-0",
          type: "Artwork Text Block",
          title: "About This Piece",
          description: "Share the inspiration, process, or meaning behind this piece...",
          content_url: null,
          config: {},
          display_order: 0,
        },
        {
          id: "temp-1",
          type: "Artwork Image Block",
          title: "Behind the Scenes",
          description: "Add a behind-the-scenes photo",
          content_url: null,
          config: { caption: "" },
          display_order: 1,
        },
        {
          id: "temp-2",
          type: "Artwork Video Block",
          title: "Artist Message",
          description: "Add a video message (optional)",
          content_url: null,
          config: {},
          display_order: 2,
        },
        {
          id: "temp-3",
          type: "Artwork Audio Block",
          title: "Personal Message",
          description: "Record or upload an audio message (optional)",
          content_url: null,
          config: {},
          display_order: 3,
        },
        {
          id: "temp-4",
          type: "Artwork Soundtrack Block",
          title: "Soundtrack",
          description: "What song captures the energy of this piece? Music creates an emotional connection with your collectors.",
          content_url: null,
          config: {},
          display_order: 4,
        },
        {
          id: "temp-5",
          type: "Artwork Voice Note Block",
          title: "Voice Note",
          description: "Your voice is powerful. A personal message makes collectors feel like they\'re getting a private studio visit.",
          content_url: null,
          config: {},
          display_order: 5,
        },
        {
          id: "temp-6",
          type: "Artwork Process Gallery Block",
          title: "Process Gallery",
          description: "Pull back the curtain. Show early sketches, works in progress, or the tools you used.",
          content_url: null,
          config: { images: [] },
          display_order: 6,
        },
        {
          id: "temp-7",
          type: "Artwork Inspiration Block",
          title: "Inspiration Board",
          description: "What influenced this work? Photos, screenshots, textures - help collectors see through your eyes.",
          content_url: null,
          config: { images: [] },
          display_order: 7,
        },
      ]
      
      // Update submission with template blocks
      const { error: updateError } = await supabase
        .from("vendor_product_submissions")
        .update({
          product_data: {
            ...productData,
            benefits: [...benefits, ...templateBlocks],
          },
        })
        .eq("id", productId)
      
      if (updateError) {
        console.error("Error applying template to submission:", updateError)
        return NextResponse.json(
          { error: "Failed to apply template", message: updateError.message },
          { status: 500 },
        )
      }
      
      return NextResponse.json({
        success: true,
        blocks: templateBlocks,
        message: "Template applied successfully",
      })
    }

    // Handle product-based template application (existing logic)
    // Get benefit type IDs for artwork content blocks
    const { data: benefitTypes, error: typesError } = await supabase
      .from("benefit_types")
      .select("id, name")
      .in("name", [
        "Artwork Text Block",
        "Artwork Image Block",
        "Artwork Video Block",
        "Artwork Audio Block",
        "Artwork Soundtrack Block",
        "Artwork Voice Note Block",
        "Artwork Process Gallery Block",
        "Artwork Inspiration Block",
        "Artwork Soundtrack Block",
        "Artwork Voice Note Block",
        "Artwork Process Gallery Block",
        "Artwork Inspiration Block",
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
      {
        product_id: productId,
        vendor_name: vendorName,
        benefit_type_id: typeMap["Artwork Soundtrack Block"],
        title: "Soundtrack",
        description: "What song captures the energy of this piece? Music creates an emotional connection with your collectors.",
        content_url: null,
        block_config: {},
        display_order: 4,
        is_published: false,
        is_active: true,
      },
      {
        product_id: productId,
        vendor_name: vendorName,
        benefit_type_id: typeMap["Artwork Voice Note Block"],
        title: "Voice Note",
        description: "Your voice is powerful. A personal message makes collectors feel like they're getting a private studio visit.",
        content_url: null,
        block_config: {},
        display_order: 5,
        is_published: false,
        is_active: true,
      },
      {
        product_id: productId,
        vendor_name: vendorName,
        benefit_type_id: typeMap["Artwork Process Gallery Block"],
        title: "Process Gallery",
        description: "Pull back the curtain. Show early sketches, works in progress, or the tools you used.",
        content_url: null,
        block_config: { images: [] },
        display_order: 6,
        is_published: false,
        is_active: true,
      },
      {
        product_id: productId,
        vendor_name: vendorName,
        benefit_type_id: typeMap["Artwork Inspiration Block"],
        title: "Inspiration Board",
        description: "What influenced this work? Photos, screenshots, textures - help collectors see through your eyes.",
        content_url: null,
        block_config: { images: [] },
        display_order: 7,
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
