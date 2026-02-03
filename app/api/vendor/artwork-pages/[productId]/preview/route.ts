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

    // Try to find product in published products table first
    let product: { id: string; name: string; img_url: string | null; product_id: string | null; vendor_name: string } | null = null
    let isSubmission = false

    const { data: publishedProduct, error: productError } = await supabase
      .from("products")
      .select("id, name, img_url, product_id, vendor_name")
      .eq("id", productId)
      .eq("vendor_name", vendorName)
      .maybeSingle()

    if (publishedProduct) {
      product = publishedProduct
    } else {
      // If not found in products, check vendor_product_submissions table
      // This handles artworks in submission/pending/approved stage
      const { data: submission, error: submissionError } = await supabase
        .from("vendor_product_submissions")
        .select("id, product_data, shopify_product_id, vendor_name")
        .eq("id", productId)
        .eq("vendor_name", vendorName)
        .maybeSingle()

      if (submission) {
        isSubmission = true
        const productData = submission.product_data as any
        const firstImage = productData?.images?.[0]?.src || productData?.images?.[0] || null
        
        product = {
          id: submission.id,
          name: productData?.title || "Untitled Artwork",
          img_url: firstImage,
          product_id: submission.shopify_product_id?.toString() || null,
          vendor_name: submission.vendor_name,
        }
      }
    }

    if (!product) {
      console.error(`[Preview API] Product not found: ${productId}`)
      return NextResponse.json({ 
        error: "Artwork not found",
        message: `No artwork found with ID: ${productId}. This submission may have been deleted or the ID is incorrect.`,
        productId
      }, { status: 404 })
    }

    // Get vendor/artist info
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, vendor_name, bio, signature_url, profile_image")
      .eq("vendor_name", vendorName)
      .maybeSingle()

    if (vendorError || !vendor) {
      console.error(`[Preview API] Vendor not found: ${vendorName}`, vendorError)
      return NextResponse.json({ 
        error: "Artist not found",
        message: `Artist profile not found for: ${vendorName}`,
      }, { status: 404 })
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

    let contentBlocks: any[] = []

    // For submissions, get blocks from product_data.benefits
    if (isSubmission) {
      const { data: submissionData } = await supabase
        .from("vendor_product_submissions")
        .select("product_data")
        .eq("id", productId)
        .maybeSingle()

      if (submissionData) {
        const productData = submissionData.product_data as any
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
          id: block.id || -index - 1,
          benefit_type_id: 0,
          title: block.title || "",
          description: block.description || null,
          content_url: block.content_url || null,
          block_config: block.config || {},
          display_order: block.display_order || index,
          is_published: true,
          block_type: block.type,
        }))
      }
    } else {
      // For published products, get ALL content blocks from product_benefits
      // This allows vendors to see their work-in-progress
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
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      if (productBlocks && productBlocks.length > 0) {
        // Use product-specific blocks
        contentBlocks = productBlocks.map((block: any) => ({
          ...block,
          block_type: block.benefit_types?.name || null,
        }))
      } else if (product.product_id) {
      // Fall back to series-level template if product has no specific blocks
      // Only try this if we have a shopify product_id
      const { data: seriesMemberForBlocks } = await supabase
        .from("artwork_series_members")
        .select("series_id")
        .eq("shopify_product_id", product.product_id)
        .maybeSingle()

      if (seriesMemberForBlocks?.series_id) {
        const { data: seriesBlocks } = await supabase
          .from("product_benefits")
          .select(`
            *,
            benefit_types:benefit_type_id (
              name
            )
          `)
          .eq("series_id", seriesMemberForBlocks.series_id)
          .in("benefit_type_id", artworkBlockTypeIds)
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
    }

    // Get series info with full details if applicable (only if we have a product_id)
    let seriesData = null
    
    if (product.product_id) {
      const { data: seriesMember } = await supabase
        .from("artwork_series_members")
        .select(`
          series_id,
          display_order,
          artwork_series:series_id (
            id,
            name,
            description,
            unlock_type,
            total_artworks
          )
        `)
        .eq("shopify_product_id", product.product_id)
        .maybeSingle()

      if (seriesMember?.artwork_series) {
        const seriesInfo = seriesMember.artwork_series as any

        // Get all artworks in this series for the collection grid
        const { data: seriesArtworks } = await supabase
          .from("artwork_series_members")
          .select(`
            id,
            display_order,
            shopify_product_id,
            products:shopify_product_id (
              id,
              name,
              img_url
            )
          `)
          .eq("series_id", seriesInfo.id)
          .order("display_order", { ascending: true })

        // Map artworks with mock ownership data for preview
        const artworks = (seriesArtworks || []).map((artwork: any, index: number) => ({
          id: artwork.products?.id || artwork.shopify_product_id,
          name: artwork.products?.name || `Artwork ${index + 1}`,
          imgUrl: artwork.products?.img_url || product.img_url,
          isOwned: artwork.shopify_product_id === product.product_id, // Current artwork is "owned"
          isLocked: false, // In preview, show all as accessible
          displayOrder: artwork.display_order || index + 1,
          position: index + 1,
        }))

        // Find next artwork (the one after current)
        const currentIndex = artworks.findIndex((a: any) => a.id === product.id)
        const nextArtwork = currentIndex < artworks.length - 1 ? artworks[currentIndex + 1] : null

        seriesData = {
          id: seriesInfo.id,
          name: seriesInfo.name,
          description: seriesInfo.description,
          unlockType: seriesInfo.unlock_type || "any_purchase",
          totalCount: seriesInfo.total_artworks || artworks.length,
          ownedCount: 1, // In preview, current artwork is "owned"
          artworks: artworks,
          nextArtwork: nextArtwork ? {
            id: nextArtwork.id,
            name: nextArtwork.name,
            imgUrl: nextArtwork.imgUrl,
            displayOrder: nextArtwork.displayOrder,
            handle: null,
            shopifyProductId: nextArtwork.id,
          } : null,
          currentPosition: currentIndex + 1,
          // Mock milestones for preview
          milestones: [
            {
              threshold: Math.ceil(artworks.length * 0.3),
              type: "text",
              title: "Exclusive Text Block",
              isUnlocked: false,
            },
            {
              threshold: Math.ceil(artworks.length * 0.6),
              type: "image",
              title: "Behind-the-Scenes Photos",
              isUnlocked: false,
            },
            {
              threshold: artworks.length,
              type: "video",
              title: "Exclusive Artist Video",
              isUnlocked: false,
            },
          ],
        }
      }
    } // End of if (product.product_id)

    // Generate mock locked content preview (shows what's behind the lock)
    const lockedContentPreview = contentBlocks.map((block: any) => ({
      type: block.block_type?.replace("Artwork ", "").replace(" Block", "").toLowerCase() || "content",
      label: block.title || block.block_type?.replace("Artwork ", "").replace(" Block", "") || "Content",
    }))

    // For preview, we'll show both locked and unlocked states
    // Return data structure similar to collector API
    return NextResponse.json({
      success: true,
      artwork: {
        id: product.id,
        name: product.name,
        imgUrl: product.img_url,
        editionNumber: 1, // Mock edition for preview
        editionTotal: 50, // Mock total for preview
        purchaseDate: new Date().toISOString(), // Mock purchase date
        orderNumber: "TSC-PREVIEW-001", // Mock order number
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
      lockedContentPreview: lockedContentPreview,
      series: seriesData,
      isAuthenticated: true, // For preview, show as authenticated so vendor can see all content
      isPreview: true, // Flag to indicate this is a vendor preview
      isSubmission: isSubmission, // Flag to indicate this is a submission-stage artwork (not yet published)
    })
  } catch (error: any) {
    console.error("Error in vendor artwork preview API:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 },
    )
  }
}
