import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

// Get Shopify customer ID from cookie
function getShopifyCustomerId(cookieStore: any): string | null {
  const shopifyCustomerId = cookieStore.get("shopify_customer_id")
  return shopifyCustomerId?.value || null
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const shopifyCustomerId = getShopifyCustomerId(cookieStore)

    if (!shopifyCustomerId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()
    const lineItemId = params.id

    // Get line item with order and product info
    const { data: lineItem, error: lineItemError } = await supabase
      .from("order_line_items_v2")
      .select(`
        id,
        line_item_id,
        order_id,
        order_name,
        product_id,
        name,
        img_url,
        edition_number,
        edition_total,
        nfc_tag_id,
        nfc_claimed_at,
        auth_code,
        created_at,
        orders:order_id (
          shopify_customer_id,
          created_at
        ),
        product_benefits:product_id (
          hidden_series_id,
          vip_artwork_id,
          vip_series_id
        )
      `)
      .eq("line_item_id", lineItemId)
      .single()

    if (lineItemError || !lineItem) {
      console.error(`[Artwork API] Line item not found: ${lineItemId}`, lineItemError)
      return NextResponse.json({ 
        error: "Artwork not found",
        message: `No artwork found with ID: ${lineItemId}. Please check your order history or contact support.`,
        lineItemId 
      }, { status: 404 })
    }

    // Verify ownership - check if order belongs to this customer
    const order = lineItem.orders as any
    if (!order || order.shopify_customer_id !== shopifyCustomerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get product info
    const { data: product } = await supabase
      .from("products")
      .select("id, name, img_url, vendor_name")
      .eq("id", lineItem.product_id)
      .single()

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Get vendor/artist info
    const { data: vendor } = await supabase
      .from("vendors")
      .select("id, vendor_name, bio, signature_url, profile_image")
      .eq("vendor_name", product.vendor_name)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 })
    }

    // Get content blocks only if NFC authenticated
    let contentBlocks: any[] = []
    let lockedContentPreview: any[] = []
    const isAuthenticated = !!lineItem.nfc_claimed_at

    // Get benefit type IDs for artwork content blocks
    const { data: benefitTypes } = await supabase
      .from("benefit_types")
      .select("id, name")
      .in("name", [
        "Artwork Text Block",
        "Artwork Image Block",
        "Artwork Video Block",
        "Artwork Audio Block",
        "Artwork Soundtrack Block", // New
        "Artwork Voice Note Block", // New
        "Artwork Process Gallery Block", // New
        "Artwork Inspiration Block", // New
        "Artwork Artist Note Block", // New
      ])

    const artworkBlockTypeIds = benefitTypes?.map((bt) => bt.id) || []

    // First, try to get product-specific content blocks
    const { data: productBlocks } = await supabase
      .from("product_benefits")
      .select(`
        *,
        benefit_types:benefit_type_id (
          name
        )
      `)
      .eq("product_id", product.id)
      .is("series_id", null) // Product-specific blocks have null series_id
      .in("benefit_type_id", artworkBlockTypeIds)
      .eq("is_published", true)
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    let availableBlocks = productBlocks || []

    // Fall back to series-level template if product has no specific blocks
    if (!availableBlocks.length) {
      const { data: seriesMember } = await supabase
        .from("artwork_series_members")
        .select("series_id")
        .eq("shopify_product_id", product.id)
        .single()

      if (seriesMember?.series_id) {
        const { data: seriesBlocks } = await supabase
          .from("product_benefits")
          .select(`
            *,
            benefit_types:benefit_type_id (
              name
            )
          `)
          .eq("series_id", seriesMember.series_id)
          .in("benefit_type_id", artworkBlockTypeIds)
          .eq("is_published", true)
          .eq("is_active", true)
          .order("display_order", { ascending: true })

        availableBlocks = seriesBlocks || []
      }
    }

    // Create locked preview (simplified metadata)
    lockedContentPreview = availableBlocks.map((block: any) => ({
      type: block.benefit_types?.name || "text",
      label: block.title || "Content",
    }))

    // Full content blocks only if authenticated
    if (isAuthenticated) {
      contentBlocks = availableBlocks.map((block: any) => ({
        ...block,
        block_type: block.benefit_types?.name || null,
      }))
    }

    // Get series info if applicable
    const { data: seriesMember } = await supabase
      .from("artwork_series_members")
      .select("series_id, artwork_series:series_id (id, name)")
      .eq("shopify_product_id", product.id)
      .single()

    const series = seriesMember?.artwork_series as any

    return NextResponse.json({
      success: true,
      artwork: {
        id: lineItem.line_item_id,
        lineItemId: lineItem.line_item_id,
        orderId: lineItem.order_id,
        name: lineItem.name,
        imgUrl: lineItem.img_url || product.img_url,
        editionNumber: lineItem.edition_number,
        editionTotal: lineItem.edition_total,
        purchaseDate: order?.created_at || lineItem.created_at,
        orderNumber: lineItem.order_name || lineItem.order_id,
        certificateUrl: null, // Can be added later
        nfcTagId: lineItem.nfc_tag_id,
        nfcClaimedAt: lineItem.nfc_claimed_at,
        authCode: lineItem.auth_code,
      },
      artist: {
        name: vendor.vendor_name,
        bio: vendor.bio,
        signatureUrl: vendor.signature_url,
        profileImageUrl: vendor.profile_image,
      },
      contentBlocks: isAuthenticated ? contentBlocks : [],
      lockedContentPreview: !isAuthenticated ? lockedContentPreview : [],
      series: series ? { id: series.id, name: series.name } : null,
      isAuthenticated,
    })
  } catch (error: any) {
    console.error("Error in collector artwork API:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 },
    )
  }
}
