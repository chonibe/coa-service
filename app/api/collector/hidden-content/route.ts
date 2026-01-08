import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyCollectorSessionToken } from "@/lib/collector-session"
import type { HiddenContent } from "@/types/collector"

export async function GET(request: NextRequest) {
  const supabase = createClient()

  const collectorSession = verifyCollectorSessionToken(request.cookies.get("collector_session")?.value)
  const customerId = collectorSession?.shopifyCustomerId || request.cookies.get("shopify_customer_id")?.value
  if (!customerId) {
    return NextResponse.json(
      { success: false, message: "Missing customer session" },
      { status: 401 },
    )
  }

  try {
    // Get all orders and line items for this customer
    const { data: orders } = await supabase
      .from("orders")
      .select(
        `
        id,
        processed_at,
        order_line_items_v2 (
          id,
          line_item_id,
          product_id,
          shopify_product_id,
          name,
          created_at
        )
      `,
      )
      .eq("customer_id", customerId)
      .order("processed_at", { ascending: false })

    const allLineItems = (orders || []).flatMap((order) => order.order_line_items_v2 || [])
    const productIds = allLineItems
      .map((li: any) => li.product_id || li.shopify_product_id)
      .filter(Boolean)
      .map((id: string) => parseInt(id))
      .filter((id: number) => !isNaN(id) && id > 0)

    if (productIds.length === 0) {
      return NextResponse.json({
        success: true,
        hiddenContent: {
          hiddenSeries: [],
          bonusContent: [],
        },
      })
    }

    // Query product benefits for hidden series and bonus content
    const { data: benefits, error: benefitsError } = await supabase
      .from("product_benefits")
      .select(
        `
        id,
        benefit_type_id,
        title,
        description,
        content_url,
        access_code,
        starts_at,
        expires_at,
        hidden_series_id,
        benefit_types!inner (
          name
        ),
        vendor_product_submissions!inner (
          id,
          product_data,
          vendor_id,
          vendors (
            vendor_name
          )
        )
      `,
      )
      .in("vendor_product_submissions.id", productIds)

    if (benefitsError) {
      console.error("collector hidden content error", benefitsError)
      // Don't fail, just return empty
    }

    const hiddenSeries: HiddenContent["hiddenSeries"] = []
    const bonusContent: HiddenContent["bonusContent"] = []

    if (benefits) {
      // Extract hidden series
      const hiddenSeriesMap = new Map<string, any>()
      benefits.forEach((benefit: any) => {
        if (benefit.hidden_series_id && benefit.benefit_types?.name?.toLowerCase().includes("hidden")) {
          const key = benefit.hidden_series_id
          const lineItem = allLineItems.find(
            (li: any) =>
              li.product_id === benefit.vendor_product_submissions?.id?.toString() ||
              li.shopify_product_id === benefit.vendor_product_submissions?.id?.toString(),
          )
          if (!hiddenSeriesMap.has(key)) {
            hiddenSeriesMap.set(key, {
              id: benefit.hidden_series_id,
              unlockedVia: {
                artworkId: benefit.vendor_product_submissions?.id?.toString(),
                artworkName: benefit.vendor_product_submissions?.product_data?.title || "Unknown Artwork",
                purchaseDate: lineItem?.created_at || orders?.[0]?.processed_at || new Date().toISOString(),
              },
            })
          }
        }
      })

      // Get hidden series details
      if (hiddenSeriesMap.size > 0) {
        const { data: seriesData } = await supabase
          .from("artwork_series")
          .select("id, name, description, thumbnail_url, teaser_image_url, vendors!inner(vendor_name)")
          .in("id", Array.from(hiddenSeriesMap.keys()))

        if (seriesData) {
          seriesData.forEach((s: any) => {
            const unlockInfo = hiddenSeriesMap.get(s.id)
            if (unlockInfo) {
              hiddenSeries.push({
                id: s.id,
                name: s.name,
                description: s.description,
                thumbnailUrl: s.thumbnail_url,
                teaserImageUrl: s.teaser_image_url,
                vendorName: s.vendors?.vendor_name || "Unknown Artist",
                unlockedAt: unlockInfo.unlockedVia.purchaseDate,
                unlockedVia: unlockInfo.unlockedVia,
              })
            }
          })
        }
      }

      // Extract bonus content
      benefits.forEach((benefit: any) => {
        const benefitTypeName = benefit.benefit_types?.name?.toLowerCase() || ""
        if (
          !benefitTypeName.includes("hidden") &&
          (benefit.content_url || benefit.access_code || benefit.title)
        ) {
          const lineItem = allLineItems.find(
            (li: any) =>
              li.product_id === benefit.vendor_product_submissions?.id?.toString() ||
              li.shopify_product_id === benefit.vendor_product_submissions?.id?.toString(),
          )
          bonusContent.push({
            id: benefit.id,
            benefitType: benefit.benefit_types?.name || "Bonus Content",
            title: benefit.title,
            description: benefit.description,
            contentUrl: benefit.content_url,
            accessCode: benefit.access_code,
            unlockedAt: lineItem?.created_at || orders?.[0]?.processed_at || new Date().toISOString(),
            unlockedVia: {
              artworkId: benefit.vendor_product_submissions?.id?.toString(),
              artworkName: benefit.vendor_product_submissions?.product_data?.title || "Unknown Artwork",
              vendorName: benefit.vendor_product_submissions?.vendors?.vendor_name || "Unknown Artist",
              purchaseDate: lineItem?.created_at || orders?.[0]?.processed_at || new Date().toISOString(),
            },
            expiresAt: benefit.expires_at,
          })
        }
      })
    }

    return NextResponse.json({
      success: true,
      hiddenContent: {
        hiddenSeries,
        bonusContent,
      },
    })
  } catch (error: any) {
    console.error("collector hidden content unexpected error", error)
    return NextResponse.json(
      { success: false, message: "Unexpected server error" },
      { status: 500 },
    )
  }
}

