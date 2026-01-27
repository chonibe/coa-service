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

    // === DISCOVERY DATA ===
    // Gather data for the Discovery Section
    const discoveryData: any = {}
    const specialChips: any[] = []

    // Check for unlocked content (hidden series, VIP artwork, VIP series)
    const productBenefits = lineItem.product_benefits as any
    if (productBenefits) {
      if (productBenefits.hidden_series_id) {
        const { data: hiddenSeries } = await supabase
          .from("artwork_series")
          .select("id, name, thumbnail_url")
          .eq("id", productBenefits.hidden_series_id)
          .single()

        if (hiddenSeries) {
          discoveryData.unlockedContent = {
            type: "hidden_series",
            id: hiddenSeries.id,
            name: hiddenSeries.name,
            thumbnailUrl: hiddenSeries.thumbnail_url,
          }
          specialChips.push({
            type: "unlocks_hidden",
            label: "Unlocks Hidden Series",
            sublabel: hiddenSeries.name,
          })
        }
      } else if (productBenefits.vip_artwork_id) {
        const { data: vipArtwork } = await supabase
          .from("products")
          .select("id, name, img_url")
          .eq("id", productBenefits.vip_artwork_id)
          .single()

        if (vipArtwork) {
          discoveryData.unlockedContent = {
            type: "vip_artwork",
            id: vipArtwork.id,
            name: vipArtwork.name,
            thumbnailUrl: vipArtwork.img_url,
          }
          specialChips.push({
            type: "unlocks_hidden",
            label: "Unlocks VIP Artwork",
            sublabel: vipArtwork.name,
          })
        }
      } else if (productBenefits.vip_series_id) {
        const { data: vipSeries } = await supabase
          .from("artwork_series")
          .select("id, name, thumbnail_url")
          .eq("id", productBenefits.vip_series_id)
          .single()

        if (vipSeries) {
          discoveryData.unlockedContent = {
            type: "vip_series",
            id: vipSeries.id,
            name: vipSeries.name,
            thumbnailUrl: vipSeries.thumbnail_url,
          }
          specialChips.push({
            type: "vip_access",
            label: "VIP Series Access",
            sublabel: vipSeries.name,
          })
        }
      }
    }

    // Check for series info
    if (seriesMember?.series_id && !discoveryData.unlockedContent) {
      const { data: seriesDetails } = await supabase
        .from("artwork_series")
        .select("id, name, unlock_type, unlock_config")
        .eq("id", seriesMember.series_id)
        .single()

      if (seriesDetails) {
        // Get all artworks in series
        const { data: seriesArtworks } = await supabase
          .from("artwork_series_members")
          .select("shopify_product_id, products:shopify_product_id (id, name, img_url)")
          .eq("series_id", seriesDetails.id)
          .order("position", { ascending: true })

        if (seriesArtworks && seriesArtworks.length > 0) {
          // Check which artworks customer owns
          const { data: customerArtworks } = await supabase
            .from("order_line_items_v2")
            .select("product_id")
            .eq("orders.shopify_customer_id", shopifyCustomerId)
            .in("product_id", seriesArtworks.map((a: any) => a.shopify_product_id))

          const ownedProductIds = new Set(customerArtworks?.map((a: any) => a.product_id) || [])

          const artworksWithStatus = seriesArtworks.map((artwork: any) => ({
            id: artwork.products?.id,
            name: artwork.products?.name,
            imgUrl: artwork.products?.img_url,
            isOwned: ownedProductIds.has(artwork.shopify_product_id),
            isLocked: false, // Can add logic for locked artworks
          }))

          const ownedCount = artworksWithStatus.filter((a) => a.isOwned).length
          const nextArtwork = artworksWithStatus.find((a) => !a.isOwned)

          discoveryData.seriesInfo = {
            name: seriesDetails.name,
            totalCount: seriesArtworks.length,
            ownedCount,
            artworks: artworksWithStatus,
            nextArtwork: nextArtwork
              ? {
                  id: nextArtwork.id,
                  name: nextArtwork.name,
                  imgUrl: nextArtwork.imgUrl,
                }
              : undefined,
            unlockType: seriesDetails.unlock_type || "any_purchase",
          }

          // Add series chip
          specialChips.push({
            type: "series",
            label: seriesDetails.name,
            sublabel: `${ownedCount}/${seriesArtworks.length}`,
          })

          // Check for time-based unlock
          if (seriesDetails.unlock_type === "time_based" && seriesDetails.unlock_config) {
            specialChips.push({
              type: "timed_release",
              label: "Timed Release",
            })

            // Add countdown if there's a next unlock time
            const unlockConfig = seriesDetails.unlock_config as any
            if (unlockConfig?.unlock_at) {
              discoveryData.countdown = {
                unlockAt: unlockConfig.unlock_at,
                artworkName: nextArtwork?.name || "Next Artwork",
                artworkImgUrl: nextArtwork?.imgUrl,
              }
            }
          }
        }
      }
    }

    // Get more artworks from the same artist (if no series or unlocked content)
    if (!discoveryData.unlockedContent && !discoveryData.seriesInfo && !discoveryData.countdown) {
      const { data: moreArtworks } = await supabase
        .from("products")
        .select("id, name, img_url")
        .eq("vendor_name", vendor.vendor_name)
        .neq("id", product.id)
        .limit(6)

      if (moreArtworks && moreArtworks.length > 0) {
        discoveryData.moreFromArtist = moreArtworks.map((artwork: any) => ({
          id: artwork.id,
          name: artwork.name,
          imgUrl: artwork.img_url,
        }))
      }
    }

    // === SPECIAL CHIPS ===
    // Add limited edition chip
    if (lineItem.edition_number && lineItem.edition_total) {
      specialChips.push({
        type: "limited_edition",
        label: `#${lineItem.edition_number} of ${lineItem.edition_total}`,
      })
    }

    // Add authenticated chip
    if (lineItem.nfc_claimed_at) {
      specialChips.push({
        type: "authenticated",
        label: "Verified",
        sublabel: new Date(lineItem.nfc_claimed_at).toLocaleDateString(),
      })
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
      discoveryData: Object.keys(discoveryData).length > 0 ? discoveryData : null,
      specialChips: specialChips.length > 0 ? specialChips : null,
    })
  } catch (error: any) {
    console.error("Error in collector artwork API:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 },
    )
  }
}
