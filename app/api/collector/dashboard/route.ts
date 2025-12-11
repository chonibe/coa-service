import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyCollectorSessionToken } from "@/lib/collector-session"

type LineItem = {
  id: number
  line_item_id: string
  product_id: string | null
  name: string
  description: string | null
  price: number
  quantity: number
  img_url: string | null
  vendor_name: string | null
  nfc_tag_id: string | null
  nfc_claimed_at: string | null
  certificate_url: string | null
  certificate_token: string | null
  edition_number: number | null
  status: string | null
}

type Order = {
  id: string
  order_number: number
  processed_at: string
  total_price: number
  financial_status: string | null
  fulfillment_status: string | null
  order_line_items_v2: LineItem[]
}

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
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        processed_at,
        total_price,
        financial_status,
        fulfillment_status,
        order_line_items_v2 (
          id,
          line_item_id,
          product_id,
          name,
          description,
          price,
          quantity,
          img_url,
          vendor_name,
          nfc_tag_id,
          nfc_claimed_at,
          certificate_url,
          certificate_token,
          edition_number,
          status
        )
      `,
      )
      .eq("customer_id", customerId)
      .order("processed_at", { ascending: false })
      .limit(50)

    if (ordersError) {
      console.error("collector dashboard orders error", ordersError)
      return NextResponse.json(
        { success: false, message: "Failed to load orders" },
        { status: 500 },
      )
    }

    const productIds = Array.from(
      new Set(
        (orders || [])
          .flatMap((order) => order.order_line_items_v2 || [])
          .map((li) => li.product_id)
          .filter(Boolean) as string[],
      ),
    )

    let seriesMap = new Map<
      string,
      {
        id: string
        name: string
        vendor_name: string
        thumbnail_url: string | null
        completion_progress: any
      }
    >()

    if (productIds.length > 0) {
      const { data: seriesMembers, error: seriesError } = await supabase
        .from("artwork_series_members")
        .select(
          `
          shopify_product_id,
          series_id,
          artwork_series!inner (
            id,
            name,
            vendor_name,
            thumbnail_url,
            completion_progress
          )
        `,
        )
        .in("shopify_product_id", productIds)

      if (seriesError) {
        console.error("collector dashboard series error", seriesError)
      } else {
        seriesMembers?.forEach((member: any) => {
          if (member.shopify_product_id && member.artwork_series) {
            seriesMap.set(member.shopify_product_id, member.artwork_series)
          }
        })
      }
    }

    const enrichedOrders =
      orders?.map((order) => ({
        id: order.id,
        orderNumber: order.order_number,
        processedAt: order.processed_at,
        totalPrice: order.total_price,
        financialStatus: order.financial_status,
        fulfillmentStatus: order.fulfillment_status,
        lineItems: (order.order_line_items_v2 || []).map((li) => {
          const series = li.product_id ? seriesMap.get(li.product_id) : null
          return {
            id: li.id,
            lineItemId: li.line_item_id,
            productId: li.product_id,
            name: li.name,
            description: li.description,
            price: li.price,
            quantity: li.quantity,
            imgUrl: li.img_url,
            vendorName: li.vendor_name,
            nfcTagId: li.nfc_tag_id,
            nfcClaimedAt: li.nfc_claimed_at,
            certificateUrl: li.certificate_url,
            certificateToken: li.certificate_token,
            editionNumber: li.edition_number,
            status: li.status,
            series: series
              ? {
                  id: series.id,
                  name: series.name,
                  vendorName: series.vendor_name,
                  thumbnailUrl: series.thumbnail_url,
                  completionProgress: series.completion_progress,
                }
              : null,
            productUrl: li.product_id ? `/products/${li.product_id}` : null,
          }
        }),
      })) || []

    const allLineItems = enrichedOrders.flatMap((o) => o.lineItems)
    const authenticatedCount = allLineItems.filter(
      (li) => li.nfcTagId && li.nfcClaimedAt,
    ).length
    const unauthenticatedCount = allLineItems.filter(
      (li) => li.nfcTagId && !li.nfcClaimedAt,
    ).length
    const certificateCount = allLineItems.filter((li) => li.certificateUrl).length

    const artists = Object.values(
      allLineItems.reduce((acc, li) => {
        const vendor = li.vendorName || "Unknown Artist"
        if (!acc[vendor]) {
          acc[vendor] = { vendorName: vendor, artworks: 0, series: new Set<string>() }
        }
        acc[vendor].artworks += 1
        if (li.series?.id) acc[vendor].series.add(li.series.id)
        return acc
      }, {} as Record<string, { vendorName: string; artworks: number; series: Set<string> }>),
    ).map((a) => ({
      vendorName: a.vendorName,
      ownedArtworks: a.artworks,
      seriesCount: a.series.size,
    }))

    const series = Array.from(
      new Map(
        allLineItems
          .filter((li) => li.series)
          .map((li) => [
            li.series!.id,
            {
              id: li.series!.id,
              name: li.series!.name,
              vendorName: li.series!.vendorName,
              thumbnailUrl: li.series!.thumbnailUrl,
              completionProgress: li.series!.completionProgress,
              ownedCount: 0,
            },
          ]),
      ).values(),
    )

    // Count owned per series
    series.forEach((s) => {
      s.ownedCount = allLineItems.filter((li) => li.series?.id === s.id).length
    })

    // Collector identifier for banking
    const origin = request.nextUrl.origin
    let collectorIdentifier: string | null = collectorSession?.collectorIdentifier || null
    let banking: any = null
    let subscriptions: any = null

    try {
      if (!collectorIdentifier) {
        const idRes = await fetch(`${origin}/api/banking/collector-identifier`, {
          headers: { cookie: request.headers.get("cookie") || "" },
          cache: "no-store",
        })
        if (idRes.ok) {
          const idData = await idRes.json()
          collectorIdentifier = idData.collectorIdentifier || null
        }
      }

      if (collectorIdentifier) {
        const [balanceRes, subsRes] = await Promise.all([
          fetch(
            `${origin}/api/banking/balance?collector_identifier=${encodeURIComponent(
              collectorIdentifier,
            )}`,
            { headers: { cookie: request.headers.get("cookie") || "" }, cache: "no-store" },
          ),
          fetch(
            `${origin}/api/banking/subscriptions/manage?collector_identifier=${encodeURIComponent(
              collectorIdentifier,
            )}`,
            { headers: { cookie: request.headers.get("cookie") || "" }, cache: "no-store" },
          ),
        ])

        banking = balanceRes.ok ? await balanceRes.json() : null
        subscriptions = subsRes.ok ? await subsRes.json() : null
      }
    } catch (err) {
      console.error("collector dashboard banking/subscription fetch error", err)
    }

    return NextResponse.json({
      success: true,
      collectorIdentifier,
      orders: enrichedOrders,
      artists,
      series,
      stats: {
        totalOrders: enrichedOrders.length,
        totalArtworksOwned: allLineItems.length,
        authenticatedCount,
        unauthenticatedCount,
        certificatesReady: certificateCount,
      },
      banking,
      subscriptions,
    })
  } catch (error: any) {
    console.error("collector dashboard unexpected error", error)
    return NextResponse.json(
      { success: false, message: "Unexpected server error" },
      { status: 500 },
    )
  }
}

