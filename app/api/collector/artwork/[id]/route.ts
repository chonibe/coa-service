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

    // Get benefit type IDs for artwork content blocks (including new immersive types)
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
      // First, get top-level blocks (those without parent_block_id)
      const topLevelBlocks = availableBlocks.filter((b: any) => !b.parent_block_id)
      
      // Map blocks and attach child blocks for Section Groups
      contentBlocks = topLevelBlocks.map((block: any) => {
        const blockType = block.benefit_types?.name || null
        
        // If this is a Section Group, find its child blocks
        if (blockType === "Artwork Section Group Block") {
          const childBlocks = availableBlocks
            .filter((b: any) => b.parent_block_id === block.id)
            .map((child: any) => ({
              ...child,
              block_type: child.benefit_types?.name || null,
            }))
            .sort((a: any, b: any) => (a.display_order_in_parent || 0) - (b.display_order_in_parent || 0))
          
          return {
            ...block,
            block_type: blockType,
            childBlocks,
          }
        }
        
        return {
          ...block,
          block_type: blockType,
        }
      })
    }

    // Get series info if applicable
    const { data: seriesMember } = await supabase
      .from("artwork_series_members")
      .select(`
        series_id,
        position,
        artwork_series:series_id (
          id, 
          name,
          unlock_type,
          unlock_config
        )
      `)
      .eq("shopify_product_id", product.id)
      .single()

    const series = seriesMember?.artwork_series as any
    
    // Build special chips
    const specialChips: Array<{ type: string; label: string; sublabel?: string }> = []
    
    // Edition chip
    if (lineItem.edition_number && lineItem.edition_total) {
      specialChips.push({
        type: "limited_edition",
        label: `#${lineItem.edition_number} of ${lineItem.edition_total}`,
      })
    }
    
    // Authenticated chip
    if (lineItem.nfc_claimed_at) {
      specialChips.push({
        type: "authenticated",
        label: "Verified",
        sublabel: new Date(lineItem.nfc_claimed_at).toLocaleDateString(),
      })
    }
    
    // Series chip
    if (seriesMember && series) {
      // Get series total count
      const { count: seriesTotal } = await supabase
        .from("artwork_series_members")
        .select("*", { count: "exact", head: true })
        .eq("series_id", seriesMember.series_id)
      
      specialChips.push({
        type: "series",
        label: `${series.name} ${seriesMember.position || 1}/${seriesTotal || "?"}`,
      })
      
      // Timed release chip
      if (series.unlock_type === "time_based") {
        specialChips.push({
          type: "timed_release",
          label: "Timed Release",
        })
      }
    }
    
    // Check for unlock relationships
    const { data: unlockBenefits } = await supabase
      .from("product_benefits")
      .select("hidden_series_id, vip_artwork_id, vip_series_id")
      .eq("product_id", product.id)
      .not("hidden_series_id", "is", null)
      .limit(1)
      .single()
    
    if (unlockBenefits?.hidden_series_id) {
      specialChips.push({
        type: "unlocks_hidden",
        label: "Unlocks Hidden Series",
      })
    } else if (unlockBenefits?.vip_artwork_id) {
      specialChips.push({
        type: "unlocks_hidden",
        label: "Unlocks VIP Artwork",
      })
    }
    
    if (unlockBenefits?.vip_series_id) {
      specialChips.push({
        type: "vip_access",
        label: "VIP Access",
      })
    }
    
    // Build discovery data
    let discoveryData: any = {}
    
    // Series info for discovery
    if (seriesMember && series) {
      // Get all artworks in series with ownership status
      const { data: seriesArtworks } = await supabase
        .from("artwork_series_members")
        .select(`
          shopify_product_id,
          position,
          products:shopify_product_id (
            id,
            name,
            img_url
          )
        `)
        .eq("series_id", seriesMember.series_id)
        .order("position", { ascending: true })
      
      // Check which artworks the collector owns
      const { data: ownedLineItems } = await supabase
        .from("order_line_items_v2")
        .select("product_id")
        .in("product_id", seriesArtworks?.map((a: any) => a.shopify_product_id) || [])
        .eq("orders.shopify_customer_id", shopifyCustomerId)
      
      const ownedProductIds = new Set(ownedLineItems?.map((li: any) => li.product_id) || [])
      
      const formattedArtworks = seriesArtworks?.map((a: any) => ({
        id: a.shopify_product_id,
        name: a.products?.name || "Unknown",
        imgUrl: a.products?.img_url || "",
        isOwned: ownedProductIds.has(a.shopify_product_id),
        position: a.position,
      })) || []
      
      const ownedCount = formattedArtworks.filter(a => a.isOwned).length
      
      // Find next artwork in series
      const nextArtwork = formattedArtworks.find(a => !a.isOwned)
      
      discoveryData.seriesInfo = {
        name: series.name,
        totalCount: formattedArtworks.length,
        ownedCount,
        artworks: formattedArtworks,
        nextArtwork: nextArtwork ? {
          id: nextArtwork.id,
          name: nextArtwork.name,
          imgUrl: nextArtwork.imgUrl,
        } : undefined,
        unlockType: series.unlock_type || "any_order",
      }
    }
    
    // More from artist
    const { data: moreArtworks } = await supabase
      .from("products")
      .select("id, name, img_url")
      .eq("vendor_name", product.vendor_name)
      .neq("id", product.id)
      .limit(4)
    
    if (moreArtworks && moreArtworks.length > 0) {
      discoveryData.moreFromArtist = moreArtworks.map((a: any) => ({
        id: a.id,
        name: a.name,
        imgUrl: a.img_url,
      }))
    }

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
      specialChips,
      discoveryData,
    })
  } catch (error: any) {
    console.error("Error in collector artwork API:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 },
    )
  }
}
