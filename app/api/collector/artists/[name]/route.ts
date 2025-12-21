import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCollectorSession } from "@/lib/collector-session"

export async function GET(_req: NextRequest, { params }: { params: { name: string } }) {
  const supabase = createClient()
  const artistName = decodeURIComponent(params.name)
  const collectorSession = getCollectorSession(_req.cookies)
  const shopifyCustomerId = collectorSession?.shopifyCustomerId

  try {
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, vendor_name, bio, profile_image, website, instagram_url")
      .eq("vendor_name", artistName)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ success: false, message: "Artist not found" }, { status: 404 })
    }

    const { data: artworksData } = await supabase
      .from("vendor_product_submissions")
      .select(
        `
        id,
        product_data,
        series_id,
        submitted_at,
        artwork_series_members (
          display_order,
          is_locked,
          artwork_series (
            id,
            name,
            unlock_type,
            thumbnail_url,
            description
          )
        )
      `,
      )
      .eq("vendor_id", vendor.id)
      .eq("status", "published")
      .order("submitted_at", { ascending: false })

    const artworks =
      artworksData?.map((a) => {
        const pd = a.product_data as any
        const seriesMember = a.artwork_series_members?.[0]
        const series = seriesMember?.artwork_series
        const variants = pd?.variants || []
        const price = variants.length > 0 ? parseFloat(variants[0].price) : null
        return {
          id: a.id,
          handle: pd?.handle,
          title: pd?.title || "Untitled",
          description: pd?.description || "",
          price,
          currency: "USD",
          images: pd?.images || [],
          vendor: {
            name: vendor.vendor_name,
            bio: vendor.bio,
            profileImageUrl: vendor.profile_image,
          },
          shopifyProductId: pd?.id,
          submittedAt: a.submitted_at,
          isNew: false,
          series: series
            ? {
                id: series.id,
                name: series.name,
                unlockType: series.unlock_type,
                thumbnailUrl: series.thumbnail_url,
                description: series.description,
              }
            : null,
          seriesMember: seriesMember
            ? {
                displayOrder: seriesMember.display_order,
                isLocked: seriesMember.is_locked,
              }
            : null,
        }
      }) || []

    const { data: seriesData } = await supabase
      .from("artwork_series")
      .select(
        `
        id,
        name,
        description,
        thumbnail_url,
        unlock_type,
        is_active,
        is_private,
        teaser_image_url,
        artwork_series_members (
          id,
          shopify_product_id,
          vendor_product_submissions (id)
        )
      `,
      )
      .eq("vendor_id", vendor.id)
      .order("display_order", { ascending: true })

    const ownedMap = new Map<string, boolean>()
    if (shopifyCustomerId) {
      const { data: owned } = await supabase
        .from("order_line_items")
        .select("product_id, shopify_product_id")
        .eq("customer_id", shopifyCustomerId)
      owned?.forEach((item) => {
        if (item.product_id) ownedMap.set(item.product_id.toString(), true)
        if (item.shopify_product_id) ownedMap.set(item.shopify_product_id.toString(), true)
      })
    }

    const series =
      seriesData?.map((s) => {
        const total = s.artwork_series_members?.length || 0
        const owned = s.artwork_series_members?.filter((m: any) => {
          const sid = m.vendor_product_submissions?.id
          const pid = m.shopify_product_id
          return (sid && ownedMap.has(sid)) || (pid && ownedMap.has(pid))
        }).length || 0
        return {
          id: s.id,
          name: s.name,
          description: s.description,
          thumbnailUrl: s.thumbnail_url,
          unlockType: s.unlock_type,
          isActive: s.is_active,
          isPrivate: s.is_private || false,
          teaserImageUrl: s.teaser_image_url,
          totalPieces: total,
          ownedPieces: owned,
          isUnlocked: owned > 0,
        }
      }) || []

    return NextResponse.json({
      success: true,
      artist: {
        id: vendor.id,
        name: vendor.vendor_name,
        bio: vendor.bio,
        profileImageUrl: vendor.profile_image,
        websiteUrl: vendor.website,
        instagramHandle: vendor.instagram_url,
      },
      artworks,
      series,
    })
  } catch (err: any) {
    console.error("artist profile api error", err)
    return NextResponse.json({ success: false, message: err.message || "Failed to fetch artist profile" }, { status: 500 })
  }
}


