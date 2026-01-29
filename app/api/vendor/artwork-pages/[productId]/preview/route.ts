import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

// GET: Preview artwork page as vendor (shows what collectors will see)
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

    // Verify product belongs to vendor
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, img_url, product_id, vendor_name")
      .eq("id", productId)
      .eq("vendor_name", vendorName)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Get vendor/artist info
    const { data: vendor } = await supabase
      .from("vendors")
      .select("id, vendor_name, bio, signature_url, profile_image")
      .eq("vendor_name", vendorName)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 })
    }

    // Get benefit type IDs for artwork content blocks (all 9 types)
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
      ])

    const artworkBlockTypeIds = benefitTypes?.map((bt) => bt.id) || []

    // Get published content blocks (what collectors see when authenticated)
    // First, try to get product-specific content blocks
    const { data: productBlocks } = await supabase
      .from("product_benefits")
      .select(`
        *,
        benefit_types:benefit_type_id (
          name
        )
      `)
      .eq("product_id", productId)
      .is("series_id", null) // Product-specific blocks have null series_id
      .in("benefit_type_id", artworkBlockTypeIds)
      .eq("is_published", true)
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    let contentBlocks: any[] = []

    if (productBlocks && productBlocks.length > 0) {
      // Use product-specific blocks
      contentBlocks = productBlocks.map((block: any) => ({
        ...block,
        block_type: block.benefit_types?.name || null,
      }))
    } else {
      // Fall back to series-level template if product has no specific blocks
      const { data: seriesMember } = await supabase
        .from("artwork_series_members")
        .select("series_id")
        .eq("shopify_product_id", product.product_id) // product_id is the Shopify product ID
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

        if (seriesBlocks && seriesBlocks.length > 0) {
          contentBlocks = seriesBlocks.map((block: any) => ({
            ...block,
            block_type: block.benefit_types?.name || null,
          }))
        }
      }
    }

    // Get series info if applicable
    const { data: seriesMember } = await supabase
      .from("artwork_series_members")
      .select("series_id, artwork_series:series_id (id, name)")
      .eq("shopify_product_id", product.product_id) // product_id is the Shopify product ID
      .single()

    const series = seriesMember?.artwork_series as any

    // For preview, we'll show both locked and unlocked states
    // Return data structure similar to collector API
    return NextResponse.json({
      success: true,
      artwork: {
        id: product.id,
        name: product.name,
        imgUrl: product.img_url,
        editionNumber: null, // Not applicable for vendor preview
        editionTotal: null,
        purchaseDate: null,
        orderNumber: null,
        nfcTagId: null,
        nfcClaimedAt: null, // For preview, we can toggle this
        authCode: null,
      },
      artist: {
        name: vendor.vendor_name,
        bio: vendor.bio,
        signatureUrl: vendor.signature_url,
        profileImageUrl: vendor.profile_image,
      },
      contentBlocks: contentBlocks,
      series: series ? { id: series.id, name: series.name } : null,
      isAuthenticated: true, // For preview, show as authenticated so vendor can see all content
      isPreview: true, // Flag to indicate this is a vendor preview
    })
  } catch (error: any) {
    console.error("Error in vendor artwork preview API:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 },
    )
  }
}
