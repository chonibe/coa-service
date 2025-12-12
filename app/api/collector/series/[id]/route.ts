import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCollectorSession } from "@/lib/collector-session"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const collectorSession = getCollectorSession(request.cookies)
  const shopifyCustomerId = collectorSession?.shopifyCustomerId

  try {
    const { data: series, error } = await supabase
      .from("artwork_series")
      .select(
        `
        id,
        name,
        description,
        thumbnail_url,
        unlock_type,
        unlock_config,
        display_order,
        is_active,
        is_private,
        teaser_image_url,
        unlock_message,
        created_at,
        updated_at,
        vendors!inner (
          vendor_name,
          bio,
          profile_image_url
        ),
        artwork_series_members (
          id,
          display_order,
          is_locked,
          unlock_order,
          vendor_product_submissions (
            id,
            product_data,
            submitted_at,
            status
          )
        )
      `,
      )
      .eq("id", params.id)
      .single()

    if (error || !series) {
      return NextResponse.json({ success: false, message: "Series not found" }, { status: 404 })
    }

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

    const artworks =
      series.artwork_series_members
        ?.filter((m: any) => m.vendor_product_submissions && m.vendor_product_submissions.status === "published")
        .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .map((m: any) => {
          const pd = m.vendor_product_submissions.product_data as any
          const shopifyProductId = pd?.id
          const isOwned =
            ownedMap.has(m.vendor_product_submissions.id) || (shopifyProductId && ownedMap.has(shopifyProductId))
          return {
            id: m.vendor_product_submissions.id,
            title: pd?.title || "Untitled",
            description: pd?.description || "",
            image: pd?.images?.[0]?.src,
            shopifyProductId,
            displayOrder: m.display_order,
            isLocked: m.is_locked,
            unlockOrder: m.unlock_order,
            submittedAt: m.vendor_product_submissions.submitted_at,
            isOwned,
          }
        }) || []

    const transformed = {
      id: series.id,
      name: series.name,
      description: series.description,
      thumbnailUrl: series.thumbnail_url,
      unlockType: series.unlock_type,
      unlockConfig: series.unlock_config,
      displayOrder: series.display_order,
      isActive: series.is_active,
      isPrivate: series.is_private || false,
      teaserImageUrl: series.teaser_image_url,
      unlockMessage: series.unlock_message,
      vendor: {
        name: series.vendors?.vendor_name || "Unknown Artist",
        bio: series.vendors?.bio,
        profileImageUrl: series.vendors?.profile_image_url,
      },
      artworks,
      createdAt: series.created_at,
      updatedAt: series.updated_at,
    }

    return NextResponse.json({ success: true, series: transformed })
  } catch (err: any) {
    console.error("series detail api error", err)
    return NextResponse.json({ success: false, message: err.message || "Failed to fetch series" }, { status: 500 })
  }
}

