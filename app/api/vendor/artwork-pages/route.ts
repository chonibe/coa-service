import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()

    // Get vendor
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, vendor_name")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Get all products for this vendor (accepted/published artworks)
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, img_url, product_id")
      .eq("vendor_name", vendorName)
      .order("created_at", { ascending: false })

    // Also get pending submissions (submitted but not yet accepted)
    const { data: pendingSubmissions, error: submissionsError } = await supabase
      .from("vendor_product_submissions")
      .select("id, product_data, status, shopify_product_id")
      .eq("vendor_name", vendorName)
      .in("status", ["pending", "approved"]) // Include pending and approved (not yet published)
      .order("submitted_at", { ascending: false })

    if (productsError) {
      console.error("Error fetching products:", productsError)
      return NextResponse.json(
        { error: "Failed to fetch products", message: productsError.message },
        { status: 500 },
      )
    }

    // Get content blocks for all products
    const productIds = products?.map((p) => p.id) || []
    const { data: contentBlocks, error: blocksError } = await supabase
      .from("product_benefits")
      .select("product_id, is_published, display_order")
      .in("product_id", productIds)
      .in("benefit_type_id", [
        // Get benefit type IDs for artwork content blocks
        // We'll need to query benefit_types to get the IDs
      ])

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

    // Get content blocks with correct benefit types
    const { data: allContentBlocks } = await supabase
      .from("product_benefits")
      .select("product_id, is_published, display_order")
      .in("product_id", productIds)
      .in("benefit_type_id", artworkBlockTypeIds)

    // Get analytics for products
    const { data: analytics } = await supabase
      .from("artwork_page_analytics")
      .select("product_id, event_type")
      .in("product_id", productIds)

    // Process accepted products
    const acceptedProducts = (products || []).map((product) => {
      const blocks = allContentBlocks?.filter((b) => b.product_id === product.id) || []
      const publishedBlocks = blocks.filter((b) => b.is_published !== false)
      
      // Default template has 6 blocks (signature, bio, text, image, video, audio)
      // But signature and bio are auto-pulled from profile, so we count them as existing if vendor has them
      const hasSignature = true // We'll check vendor signature_url separately
      const hasBio = true // We'll check vendor bio separately
      const templateBlocks = 4 // text, image, video, audio (signature and bio are auto)
      const totalBlocksNeeded = templateBlocks
      const contentBlocksCount = publishedBlocks.length

      let status: "complete" | "incomplete" | "not_started"
      if (contentBlocksCount === 0) {
        status = "not_started"
      } else if (contentBlocksCount >= totalBlocksNeeded) {
        status = "complete"
      } else {
        status = "incomplete"
      }

      // Calculate analytics
      const productAnalytics = analytics?.filter((a) => a.product_id === product.id) || []
      const views = productAnalytics.filter((a) => a.event_type === "page_view").length
      const videoPlays = productAnalytics.filter((a) => a.event_type === "video_play").length
      const audioPlays = productAnalytics.filter((a) => a.event_type === "audio_play").length

      return {
        id: product.id,
        name: product.name,
        img_url: product.img_url,
        shopify_product_id: product.product_id, // product_id is the Shopify product ID
        status,
        content_blocks_count: contentBlocksCount,
        total_blocks_needed: totalBlocksNeeded,
        submission_status: "published" as const, // Accepted products are published
        analytics: {
          views,
          video_plays: videoPlays,
          audio_plays: audioPlays,
        },
      }
    })

    // Process pending submissions
    const pendingProducts = (pendingSubmissions || []).map((submission) => {
      const productData = submission.product_data as any
      const title = productData?.title || "Untitled Artwork"
      const images = productData?.images || []
      const imgUrl = images[0]?.src || null

      // For pending submissions, check if they have content blocks in product_data
      const productDataBenefits = productData?.benefits || []
      const artworkBlocks = productDataBenefits.filter((b: any) => 
        ["Artwork Text Block", "Artwork Image Block", "Artwork Video Block", "Artwork Audio Block"].includes(b.type)
      )
      const contentBlocksCount = artworkBlocks.length
      const totalBlocksNeeded = 4 // text, image, video, audio

      let status: "complete" | "incomplete" | "not_started"
      if (contentBlocksCount === 0) {
        status = "not_started"
      } else if (contentBlocksCount >= totalBlocksNeeded) {
        status = "complete"
      } else {
        status = "incomplete"
      }

      return {
        id: submission.id, // Use submission ID for pending artworks
        name: title,
        img_url: imgUrl,
        shopify_product_id: submission.shopify_product_id,
        status,
        content_blocks_count: contentBlocksCount,
        total_blocks_needed: totalBlocksNeeded,
        submission_status: submission.status as "pending" | "approved",
        is_pending: true, // Flag to indicate this is a pending submission
        analytics: {
          views: 0,
          video_plays: 0,
          audio_plays: 0,
        },
      }
    })

    // Combine accepted and pending products
    const allProducts = [...acceptedProducts, ...pendingProducts]

    return NextResponse.json({
      success: true,
      products: allProducts,
    })
  } catch (error: any) {
    console.error("Error in artwork pages API:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 },
    )
  }
}
