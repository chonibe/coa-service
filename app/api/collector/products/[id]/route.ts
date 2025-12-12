import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()

  try {
    const { data: artwork, error } = await supabase
      .from("vendor_product_submissions")
      .select(
        `
        id,
        product_data,
        series_id,
        submitted_at,
        vendors!inner (
          vendor_name,
          bio,
          profile_image_url,
          website_url,
          instagram_handle
        ),
        artwork_series_members (
          display_order,
          is_locked,
          unlock_order,
          artwork_series (
            id,
            name,
            unlock_type,
            unlock_config,
            thumbnail_url,
            description
          )
        )
      `,
      )
      .eq("id", params.id)
      .eq("status", "published")
      .single()

    if (error || !artwork) {
      return NextResponse.json({ success: false, message: "Artwork not found" }, { status: 404 })
    }

    // related artworks in same series
    let related: any[] = []
    if (artwork.series_id) {
      const { data: rel } = await supabase
        .from("artwork_series_members")
        .select(
          `
          display_order,
          is_locked,
          vendor_product_submissions!inner (
            id,
            product_data,
            submitted_at,
            status
          )
        `,
        )
        .eq("series_id", artwork.series_id)
        .neq("vendor_product_submissions.id", params.id)
        .eq("vendor_product_submissions.status", "published")
        .order("display_order", { ascending: true })

      related =
        rel?.map((m) => ({
          id: m.vendor_product_submissions.id,
          title: m.vendor_product_submissions.product_data?.title || "Untitled",
          image: m.vendor_product_submissions.product_data?.images?.[0]?.src,
          displayOrder: m.display_order,
          isLocked: m.is_locked,
        })) || []
    }

    const productData = artwork.product_data as any
    const seriesMember = artwork.artwork_series_members?.[0]
    const series = seriesMember?.artwork_series
    const variants = productData?.variants || []
    const images = productData?.images || []
    const primaryVariant = variants[0]

    const responseArtwork = {
      id: artwork.id,
      title: productData?.title || "Untitled",
      description: productData?.description || "",
      handle: productData?.handle,
      productType: productData?.product_type,
      tags: productData?.tags || [],
      images: images.map((img: any) => ({
        id: img.id,
        src: img.src,
        alt: img.alt || productData?.title,
        width: img.width,
        height: img.height,
      })),
      variants: variants.map((v: any) => ({
        id: v.id,
        title: v.title,
        sku: v.sku,
        price: parseFloat(v.price),
        compareAtPrice: v.compare_at_price ? parseFloat(v.compare_at_price) : null,
        available: v.available,
        inventoryQuantity: v.inventory_quantity,
        weight: v.weight,
        weightUnit: v.weight_unit,
      })),
      price: primaryVariant ? parseFloat(primaryVariant.price) : null,
      compareAtPrice: primaryVariant?.compare_at_price ? parseFloat(primaryVariant.compare_at_price) : null,
      currency: "USD",
      shopifyProductId: productData?.id,
      vendor: {
        name: artwork.vendors?.vendor_name || "Unknown Artist",
        bio: artwork.vendors?.bio,
        profileImageUrl: artwork.vendors?.profile_image_url,
        websiteUrl: artwork.vendors?.website_url,
        instagramHandle: artwork.vendors?.instagram_handle,
      },
      series: series
        ? {
            id: series.id,
            name: series.name,
            unlockType: series.unlock_type,
            unlockConfig: series.unlock_config,
            thumbnailUrl: series.thumbnail_url,
            description: series.description,
            memberInfo: seriesMember
              ? {
                  displayOrder: seriesMember.display_order,
                  isLocked: seriesMember.is_locked,
                  unlockOrder: seriesMember.unlock_order,
                }
              : null,
          }
        : null,
      relatedArtworks: related,
      submittedAt: artwork.submitted_at,
      isNew: false,
    }

    return NextResponse.json({ success: true, artwork: responseArtwork })
  } catch (err: any) {
    console.error("product detail api error", err)
    return NextResponse.json({ success: false, message: err.message || "Failed to fetch product" }, { status: 500 })
  }
}

