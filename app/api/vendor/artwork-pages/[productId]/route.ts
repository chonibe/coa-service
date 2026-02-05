import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

// GET: Fetch content blocks for product (with template defaults if none exist)
export async function GET(
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
    
    let product: { id: string; name: string; vendor_name: string } | null = null
    let submission: { id: string; product_data: any; vendor_name: string } | null = null

    if (isUUID) {
      // It's a UUID - could be a submission ID OR a product ID (products table also uses UUIDs)
      // Try vendor_product_submissions first
      const { data: submissionData, error: submissionError } = await supabase
        .from("vendor_product_submissions")
        .select("id, product_data, vendor_name")
        .eq("id", productId)
        .eq("vendor_name", vendorName)
        .maybeSingle() // Use maybeSingle to avoid PGRST116 error

      if (submissionData) {
        // Found as a submission
        submission = submissionData
        const productData = submissionData.product_data as any
        product = {
          id: submissionData.id,
          name: productData?.title || "Untitled Artwork",
          vendor_name: submissionData.vendor_name,
        }
        console.log(`[Artwork Pages API] Found submission: ${productId}`)
      } else if (submissionError && submissionError.code !== 'PGRST116') {
        // Real database error (not just "not found")
        console.error(`[Artwork Pages API] Database error looking up submission: ${productId}`, submissionError)
      } else {
        // Not found in submissions - will fall through to try products table
        console.log(`[Artwork Pages API] UUID ${productId} not found in submissions, will try products table`)
      }
    }
    
    if (!product) {
      // Try products table - handle both UUIDs and numeric Shopify IDs
      const isNumericId = /^\d+$/.test(productId)
      
      let query = supabase
        .from("products")
        .select("id, name, vendor_name, product_id")
        .eq("vendor_name", vendorName)
      
      // Use appropriate field based on ID format
      if (isNumericId) {
        query = query.eq("product_id", productId)
        console.log(`[Artwork Pages API] Looking up by numeric product_id: ${productId}`)
      } else {
        query = query.eq("id", productId)
        console.log(`[Artwork Pages API] Looking up by UUID id: ${productId}`)
      }
      
      const { data: productData, error: productError } = await query.maybeSingle()

      if (productError) {
        console.error(`[Artwork Pages API] Database error looking up product: ${productId}`, productError)
        return NextResponse.json({ 
          error: "Database error",
          message: productError.message
        }, { status: 500 })
      }

      if (!productData) {
        console.error(`[Artwork Pages API] Neither submission nor product found: ${productId}`)
        return NextResponse.json({ 
          error: "Product not found",
          message: `No product or submission found with ID: ${productId}. This may have been deleted or the ID is incorrect.`,
          productId
        }, { status: 404 })
      }

      product = {
        id: productData.id,
        name: productData.name,
        vendor_name: productData.vendor_name
      }
    }

    // Get benefit type IDs for artwork content blocks (including immersive types and section groups)
    const { data: benefitTypes } = await supabase
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
        "Artwork Artist Note Block",
        "Artwork Section Group Block",
        "Artwork Map Block",
      ])

    const artworkBlockTypeIds = benefitTypes?.map((bt) => bt.id) || []

    // Get existing content blocks
    // For submissions, check product_data first; for products, check product_benefits table
    let contentBlocks: any[] = []
    
    if (submission) {
      // For pending submissions, get content blocks from product_data
      const productData = submission.product_data as any
      const productDataBenefits = productData?.benefits || []
      const artworkBlocks = productDataBenefits.filter((b: any) => 
        [
          "Artwork Text Block", 
          "Artwork Image Block", 
          "Artwork Video Block", 
          "Artwork Audio Block",
          "Artwork Soundtrack Block",
          "Artwork Voice Note Block",
          "Artwork Process Gallery Block",
          "Artwork Inspiration Block",
          "Artwork Artist Note Block",
          "Artwork Section Group Block",
          "Artwork Map Block",
        ].includes(b.type)
      )
      
      // Map to content block format
      contentBlocks = artworkBlocks.map((block: any, index: number) => ({
        id: -index - 1, // Negative IDs for submission blocks (-1, -2, -3, etc.)
        benefit_type_id: 0, // Will be resolved by block_type
        title: block.title || "",
        description: block.description || null,
        content_url: block.content_url || null,
        block_config: block.config || {},
        display_order: block.display_order || index,
        parent_block_id: block.parent_block_id || null,
        display_order_in_parent: block.display_order_in_parent || 0,
        is_published: true,
        block_type: block.type,
      }))
    } else {
      // For accepted products, get from product_benefits table
      // Try to order by display_order, but if column doesn't exist, order by id instead
      let { data: dbBlocks, error: blocksError } = await supabase
        .from("product_benefits")
        .select(`
          *,
          benefit_types:benefit_type_id (
            name
          )
        `)
        .eq("product_id", productId)
        .in("benefit_type_id", artworkBlockTypeIds)
        .order("display_order", { ascending: true })

      // If display_order column doesn't exist, retry without ordering by it
      if (blocksError && blocksError.message?.includes("display_order")) {
        console.warn("display_order column not found, ordering by id instead. Please run migration 20260125000001_ensure_content_block_fields.sql")
        const retryResult = await supabase
          .from("product_benefits")
          .select(`
            *,
            benefit_types:benefit_type_id (
              name
            )
          `)
          .eq("product_id", productId)
          .in("benefit_type_id", artworkBlockTypeIds)
          .order("id", { ascending: true })
        
        dbBlocks = retryResult.data
        blocksError = retryResult.error
      }

      if (blocksError) {
        console.error("Error fetching content blocks:", blocksError)
        return NextResponse.json(
          { 
            error: "Failed to fetch content blocks", 
            message: blocksError.message,
            hint: blocksError.message?.includes("display_order") 
              ? "Please run migration 20260125000001_ensure_content_block_fields.sql to add required columns."
              : undefined
          },
          { status: 500 },
        )
      }

      contentBlocks = dbBlocks || []
    }

    // Get vendor profile for signature and bio
    const { data: vendor } = await supabase
      .from("vendors")
      .select("signature_url, bio")
      .eq("vendor_name", vendorName)
      .single()

    // Get series information and unlock relationships if this artwork is part of a series
    let seriesInfo = null
    let unlockRelationships = null
    if (!submission) {
      const { data: productRecord } = await supabase
        .from("products")
        .select("product_id")
        .eq("id", product.id)
        .single()
      
      if (productRecord?.product_id) {
        const { data: seriesMember } = await supabase
          .from("artwork_series_members")
          .select(`
            series_id,
            display_order,
            artwork_series:series_id (
              id,
              name,
              slug
            )
          `)
          .eq("shopify_product_id", productRecord.product_id)
          .single()
        
        if (seriesMember && seriesMember.artwork_series) {
          const series = seriesMember.artwork_series as any
          
          // Get total count in series
          const { count } = await supabase
            .from("artwork_series_members")
            .select("id", { count: "exact", head: true })
            .eq("series_id", seriesMember.series_id)
          
          seriesInfo = {
            id: series.id,
            name: series.name,
            slug: series.slug,
            position: seriesMember.display_order,
            totalCount: count || 0,
          }
        }
        
        // Get unlock relationships for this product
        const { data: benefitRelationships } = await supabase
          .from("product_benefits")
          .select(`
            id,
            hidden_series_id,
            vip_artwork_id,
            vip_series_id,
            artwork_series!hidden_series_id (id, name),
            products!vip_artwork_id (id, name),
            vip_series:artwork_series!vip_series_id (id, name)
          `)
          .eq("product_id", product.id)
          .or("hidden_series_id.not.is.null,vip_artwork_id.not.is.null,vip_series_id.not.is.null")
        
        if (benefitRelationships && benefitRelationships.length > 0) {
          unlockRelationships = {
            unlocks: benefitRelationships.map((rel: any) => {
              if (rel.hidden_series_id && rel.artwork_series) {
                return {
                  type: "hidden_series" as const,
                  id: rel.artwork_series.id,
                  name: rel.artwork_series.name,
                }
              }
              if (rel.vip_artwork_id && rel.products) {
                return {
                  type: "vip_artwork" as const,
                  id: rel.products.id,
                  name: rel.products.name,
                }
              }
              if (rel.vip_series_id && rel.vip_series) {
                return {
                  type: "vip_series" as const,
                  id: rel.vip_series.id,
                  name: rel.vip_series.name,
                }
              }
              return null
            }).filter(Boolean),
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
      },
      vendor: {
        signature_url: vendor?.signature_url || null,
        bio: vendor?.bio || null,
      },
      contentBlocks: contentBlocks.filter((block: any) => block && typeof block === 'object' && block.id !== undefined).map((block: any) => ({
        ...block,
        block_type: block.block_type || block.benefit_types?.name || null,
      })),
      seriesInfo,
      unlockRelationships,
      hasTemplate: contentBlocks.length > 0,
      isPendingSubmission: !!submission,
    })
  } catch (error: any) {
    console.error("Error in content blocks GET API:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 },
    )
  }
}

// POST: Add new content block
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

    // Check if productId is a UUID (submission ID) or a product ID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)
    
    let product: { id: string; vendor_name: string } | null = null
    let submission: { id: string; product_data: any; vendor_name: string } | null = null

    if (isUUID) {
      // It's a UUID - could be a submission ID OR a product ID
      // Try vendor_product_submissions first
      const { data: submissionData, error: submissionError } = await supabase
        .from("vendor_product_submissions")
        .select("id, product_data, vendor_name")
        .eq("id", productId)
        .eq("vendor_name", vendorName)
        .maybeSingle()

      if (submissionData) {
        submission = submissionData
        product = {
          id: submissionData.id,
          vendor_name: submissionData.vendor_name,
        }
        console.log(`[Artwork Pages API POST] Found submission: ${productId}`)
      } else if (submissionError && submissionError.code !== 'PGRST116') {
        console.error(`[Artwork Pages API POST] Database error looking up submission: ${productId}`, submissionError)
      } else {
        console.log(`[Artwork Pages API POST] UUID ${productId} not found in submissions, will try products table`)
      }
    }
    
    if (!product) {
      // Try products table - handle both UUIDs and numeric Shopify IDs
      const isNumericId = /^\d+$/.test(productId)
      
      let query = supabase
        .from("products")
        .select("id, vendor_name, product_id")
        .eq("vendor_name", vendorName)
      
      // Use appropriate field based on ID format
      if (isNumericId) {
        query = query.eq("product_id", productId)
        console.log(`[Artwork Pages API POST] Looking up by numeric product_id: ${productId}`)
      } else {
        query = query.eq("id", productId)
        console.log(`[Artwork Pages API POST] Looking up by UUID id: ${productId}`)
      }
      
      const { data: productData, error: productError } = await query.maybeSingle()

      if (productError) {
        console.error(`[Artwork Pages API POST] Database error looking up product: ${productId}`, productError)
        return NextResponse.json({ error: "Database error" }, { status: 500 })
      }

      if (!productData) {
        console.error(`[Artwork Pages API POST] Neither submission nor product found: ${productId}`)
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }

      product = {
        id: productData.id,
        vendor_name: productData.vendor_name
      }
    }

    // Handle submission-based content blocks
    if (submission) {
      // For submissions, store blocks in product_data.benefits array
      const productData = submission.product_data as any
      const benefits = productData?.benefits || []
      
      // Generate next negative ID (for submission blocks)
      const existingIds = benefits
        .filter((b: any) => b.id && typeof b.id === 'number' && b.id < 0)
        .map((b: any) => Math.abs(b.id))
      const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1

      // Get max display_order
      const displayOrders = benefits.map((b: any) => b.display_order || 0)
      const nextOrder = displayOrders.length > 0 ? Math.max(...displayOrders) + 1 : 0

      // Create new block
      const newBlock = {
        id: -nextId, // Negative ID for submission blocks
        type: body.blockType,
        title: body.title || "",
        description: body.description || "",
        content_url: body.content_url || null,
        config: body.block_config || {},
        display_order: nextOrder,
      }
      
      // Update submission with new block
      const updatedBenefits = [...benefits, newBlock]
      const { error: updateError } = await supabase
        .from("vendor_product_submissions")
        .update({
          product_data: {
            ...productData,
            benefits: updatedBenefits,
          },
        })
        .eq("id", productId)
      
      if (updateError) {
        console.error("Error adding block to submission:", updateError)
        return NextResponse.json(
          { error: "Failed to add content block", message: updateError.message },
          { status: 500 },
        )
      }
      
      return NextResponse.json({
        success: true,
        contentBlock: {
          ...newBlock,
          block_type: body.blockType,
          is_published: true, // Submissions don't have draft state
        },
      })
    }

    // Handle product-based content blocks (existing logic)
    // Get benefit type ID
    const { data: benefitType, error: typeError } = await supabase
      .from("benefit_types")
      .select("id")
      .eq("name", body.blockType)
      .single()

    if (typeError || !benefitType) {
      console.error(`[Artwork Pages API POST] Benefit type not found: ${body.blockType}`, typeError)
      
      // Check if this is a new immersive block type that hasn't been migrated
      const immersiveTypes = [
        "Artwork Soundtrack Block",
        "Artwork Voice Note Block",
        "Artwork Process Gallery Block",
        "Artwork Inspiration Block",
        "Artwork Artist Note Block",
        "Artwork Section Group Block",
        "Artwork Map Block",
      ]
      
      if (immersiveTypes.includes(body.blockType)) {
        return NextResponse.json({ 
          error: "Block type not found in database",
          message: `The immersive block type "${body.blockType}" has not been added to the database yet. Please run the migration: supabase/migrations/20260128100000_add_section_group_block.sql`,
          blockType: body.blockType,
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: "Invalid block type",
        message: `Block type "${body.blockType}" not found`,
        blockType: body.blockType,
      }, { status: 400 })
    }

    // Get max display_order for this product
    // If display_order column doesn't exist, default to 0
    let nextOrder = 0
    try {
      const { data: existingBlocks, error: orderError } = await supabase
        .from("product_benefits")
        .select("display_order")
        .eq("product_id", productId)
        .order("display_order", { ascending: false })
        .limit(1)

      if (!orderError && existingBlocks && existingBlocks.length > 0) {
        nextOrder = (existingBlocks[0].display_order || 0) + 1
      }
    } catch (err: any) {
      // If display_order column doesn't exist, default to 0
      console.warn("display_order column not found, using default order. Please run migration 20260125000001_ensure_content_block_fields.sql")
      nextOrder = 0
    }

    // Create content block
    const { data: newBlock, error: insertError } = await supabase
      .from("product_benefits")
      .insert({
        product_id: productId,
        vendor_name: vendorName,
        benefit_type_id: benefitType.id,
        title: body.title || "",
        description: body.description || "",
        content_url: body.content_url || null,
        block_config: body.block_config || {},
        display_order: nextOrder,
        is_published: false, // New blocks start as drafts
        is_active: true,
      })
      .select(`
        *,
        benefit_types:benefit_type_id (
          name
        )
      `)
      .single()

    if (insertError) {
      console.error("Error creating content block:", insertError)
      return NextResponse.json(
        { error: "Failed to create content block", message: insertError.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      contentBlock: {
        ...newBlock,
        block_type: newBlock.benefit_types?.name || null,
      },
    })
  } catch (error: any) {
    console.error("Error in content blocks POST API:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 },
    )
  }
}

// PUT: Update content block
export async function PUT(
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

    // Check if productId is a UUID (submission ID) or a product ID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)
    
    let product: { id: string; vendor_name: string } | null = null
    let submission: { id: string; product_data: any; vendor_name: string } | null = null

    if (isUUID) {
      // It's a UUID - could be a submission ID OR a product ID
      // Try vendor_product_submissions first
      const { data: submissionData, error: submissionError } = await supabase
        .from("vendor_product_submissions")
        .select("id, product_data, vendor_name")
        .eq("id", productId)
        .eq("vendor_name", vendorName)
        .maybeSingle()

      if (submissionData) {
        submission = submissionData
        product = {
          id: submissionData.id,
          vendor_name: submissionData.vendor_name,
        }
        console.log(`[Artwork Pages API PUT] Found submission: ${productId}`)
      } else if (submissionError && submissionError.code !== 'PGRST116') {
        console.error(`[Artwork Pages API PUT] Database error looking up submission: ${productId}`, submissionError)
      } else {
        console.log(`[Artwork Pages API PUT] UUID ${productId} not found in submissions, will try products table`)
      }
    }
    
    if (!product) {
      // Try products table - handle both UUIDs and numeric Shopify IDs
      const isNumericId = /^\d+$/.test(productId)
      
      let query = supabase
        .from("products")
        .select("id, vendor_name, product_id")
        .eq("vendor_name", vendorName)
      
      // Use appropriate field based on ID format
      if (isNumericId) {
        query = query.eq("product_id", productId)
        console.log(`[Artwork Pages API PUT] Looking up by numeric product_id: ${productId}`)
      } else {
        query = query.eq("id", productId)
        console.log(`[Artwork Pages API PUT] Looking up by UUID id: ${productId}`)
      }
      
      const { data: productData, error: productError } = await query.maybeSingle()

      if (productError) {
        console.error(`[Artwork Pages API PUT] Database error looking up product: ${productId}`, productError)
        return NextResponse.json({ error: "Database error" }, { status: 500 })
      }

      if (!productData) {
        console.error(`[Artwork Pages API PUT] Neither submission nor product found: ${productId}`)
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }

      product = {
        id: productData.id,
        vendor_name: productData.vendor_name
      }
    }

    // Handle submission-based content blocks
    if (submission) {
      // For submissions, update block in product_data.benefits array
      const productData = submission.product_data as any
      const benefits = productData?.benefits || []
      
      // Find and update the block
      const blockIndex = benefits.findIndex((b: any) => b.id === body.blockId)
      if (blockIndex === -1) {
        return NextResponse.json({ error: "Block not found" }, { status: 404 })
      }
      
      const updatedBlock = { ...benefits[blockIndex] }
      if (body.title !== undefined) updatedBlock.title = body.title
      if (body.description !== undefined) updatedBlock.description = body.description
      if (body.content_url !== undefined) updatedBlock.content_url = body.content_url
      if (body.block_config !== undefined) updatedBlock.config = body.block_config
      if (body.display_order !== undefined) updatedBlock.display_order = body.display_order
      
      benefits[blockIndex] = updatedBlock
      
      // Update submission
      const { error: updateError } = await supabase
        .from("vendor_product_submissions")
        .update({
          product_data: {
            ...productData,
            benefits,
          },
        })
        .eq("id", productId)
      
      if (updateError) {
        console.error("Error updating block in submission:", updateError)
        return NextResponse.json(
          { error: "Failed to update content block", message: updateError.message },
          { status: 500 },
        )
      }
      
      return NextResponse.json({
        success: true,
        contentBlock: {
          ...updatedBlock,
          block_type: updatedBlock.type,
          is_published: true, // Submissions don't have draft state
        },
      })
    }

    // Handle product-based content blocks (existing logic)
    // Update content block
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.content_url !== undefined) updateData.content_url = body.content_url
    if (body.block_config !== undefined) updateData.block_config = body.block_config
    if (body.display_order !== undefined) updateData.display_order = body.display_order
    if (body.is_published !== undefined) updateData.is_published = body.is_published

    const { data: updatedBlock, error: updateError } = await supabase
      .from("product_benefits")
      .update(updateData)
      .eq("id", body.blockId)
      .eq("product_id", productId)
      .select(`
        *,
        benefit_types:benefit_type_id (
          name
        )
      `)
      .single()

    if (updateError) {
      console.error("Error updating content block:", updateError)
      return NextResponse.json(
        { error: "Failed to update content block", message: updateError.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      contentBlock: {
        ...updatedBlock,
        block_type: updatedBlock.benefit_types?.name || null,
      },
    })
  } catch (error: any) {
    console.error("Error in content blocks PUT API:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 },
    )
  }
}

// DELETE: Remove content block
export async function DELETE(
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
    const { searchParams } = new URL(request.url)
    const blockId = searchParams.get("blockId")

    if (!blockId) {
      return NextResponse.json({ error: "Block ID required" }, { status: 400 })
    }

    // Check if productId is a UUID (submission ID) or a product ID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)
    
    let product: { id: string; vendor_name: string } | null = null
    let submission: { id: string; product_data: any; vendor_name: string } | null = null

    if (isUUID) {
      // It's a UUID - could be a submission ID OR a product ID
      // Try vendor_product_submissions first
      const { data: submissionData, error: submissionError } = await supabase
        .from("vendor_product_submissions")
        .select("id, product_data, vendor_name")
        .eq("id", productId)
        .eq("vendor_name", vendorName)
        .maybeSingle()

      if (submissionData) {
        submission = submissionData
        product = {
          id: submissionData.id,
          vendor_name: submissionData.vendor_name,
        }
        console.log(`[Artwork Pages API DELETE] Found submission: ${productId}`)
      } else if (submissionError && submissionError.code !== 'PGRST116') {
        console.error(`[Artwork Pages API DELETE] Database error looking up submission: ${productId}`, submissionError)
      } else {
        console.log(`[Artwork Pages API DELETE] UUID ${productId} not found in submissions, will try products table`)
      }
    }
    
    if (!product) {
      // Try products table - handle both UUIDs and numeric Shopify IDs
      const isNumericId = /^\d+$/.test(productId)
      
      let query = supabase
        .from("products")
        .select("id, vendor_name, product_id")
        .eq("vendor_name", vendorName)
      
      // Use appropriate field based on ID format
      if (isNumericId) {
        query = query.eq("product_id", productId)
        console.log(`[Artwork Pages API DELETE] Looking up by numeric product_id: ${productId}`)
      } else {
        query = query.eq("id", productId)
        console.log(`[Artwork Pages API DELETE] Looking up by UUID id: ${productId}`)
      }
      
      const { data: productData, error: productError } = await query.maybeSingle()

      if (productError) {
        console.error(`[Artwork Pages API DELETE] Database error looking up product: ${productId}`, productError)
        return NextResponse.json({ error: "Database error" }, { status: 500 })
      }

      if (!productData) {
        console.error(`[Artwork Pages API DELETE] Neither submission nor product found: ${productId}`)
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }

      product = {
        id: productData.id,
        vendor_name: productData.vendor_name
      }
    }

    // Handle submission-based content blocks
    if (submission) {
      // For submissions, remove block from product_data.benefits array
      const productData = submission.product_data as any
      const benefits = productData?.benefits || []
      
      // Filter out the block
      const updatedBenefits = benefits.filter((b: any) => b.id !== blockId)
      
      if (updatedBenefits.length === benefits.length) {
        return NextResponse.json({ error: "Block not found" }, { status: 404 })
      }
      
      // Update submission
      const { error: updateError } = await supabase
        .from("vendor_product_submissions")
        .update({
          product_data: {
            ...productData,
            benefits: updatedBenefits,
          },
        })
        .eq("id", productId)
      
      if (updateError) {
        console.error("Error deleting block from submission:", updateError)
        return NextResponse.json(
          { error: "Failed to delete content block", message: updateError.message },
          { status: 500 },
        )
      }
      
      return NextResponse.json({
        success: true,
      })
    }

    // Handle product-based content blocks (existing logic)
    // Delete content block
    const { error: deleteError } = await supabase
      .from("product_benefits")
      .delete()
      .eq("id", blockId)
      .eq("product_id", productId)

    if (deleteError) {
      console.error("Error deleting content block:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete content block", message: deleteError.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error("Error in content blocks DELETE API:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 },
    )
  }
}
