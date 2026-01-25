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
  const email = collectorSession?.email

  if (!customerId && !email) {
    return NextResponse.json(
      { success: false, message: "Missing customer session" },
      { status: 401 },
    )
  }

  try {
    // 1. Get comprehensive profile data first
    const { data: profile } = await supabase
      .from("collector_profile_comprehensive")
      .select("*")
      .or(`user_email.eq.${email?.toLowerCase()},user_id.eq.${collectorSession?.userId || 'null'}`)
      .maybeSingle()

    // Use the authoritative email from the profile if found, otherwise fallback to session email
    const authoritativeEmail = profile?.user_email || email?.toLowerCase()

    let query = supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        processed_at,
        total_price,
        financial_status,
        fulfillment_status,
        customer_id,
        customer_email,
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
          edition_total,
          status,
          created_at,
          owner_name,
          owner_email,
          owner_id
        )
      `,
      )
      .order("processed_at", { ascending: false })
      .limit(100)

    // Filter by customer ID or authoritative email
    if (customerId && authoritativeEmail) {
      query = query.or(`customer_id.eq.${customerId},customer_email.eq.${authoritativeEmail}`)
    } else if (customerId) {
      query = query.eq("customer_id", customerId)
    } else if (authoritativeEmail) {
      query = query.eq("customer_email", authoritativeEmail)
    }

    const { data: orders, error: ordersError } = await query

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
            orderId: order.id,
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
            editionTotal: li.edition_total,
            status: li.status,
            purchaseDate: order.processed_at,
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
    
    // Use comprehensive profile stats if available, otherwise calculate from fetched orders
    const authenticatedCount = profile?.authenticated_editions ?? allLineItems.filter(
      (li) => li.nfcTagId && li.nfcClaimedAt && li.editionNumber,
    ).length
    const totalArtworksOwned = profile?.total_editions ?? allLineItems.filter(li => li.editionNumber).length
    const unauthenticatedCount = profile 
      ? (profile.total_editions - profile.authenticated_editions) 
      : allLineItems.filter((li) => li.nfcTagId && !li.nfcClaimedAt && li.editionNumber).length
    const certificateCount = allLineItems.filter((li) => li.certificateUrl && li.editionNumber).length
    const totalOrdersCount = profile?.total_orders ?? enrichedOrders.length

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

    // Get hidden series unlocked through product benefits
    const lineItemIds = allLineItems.map((li) => li.lineItemId).filter(Boolean)
    let hiddenSeries: any[] = []
    let bonusContent: any[] = []

    if (lineItemIds.length > 0) {
      // Query product benefits for hidden series and bonus content
      const { data: benefits } = await supabase
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
        .in(
          "vendor_product_submissions.id",
          allLineItems
            .map((li) => li.productId)
            .filter(Boolean)
            .map((id) => parseInt(id || "0"))
            .filter((id) => id > 0),
        )

      if (benefits) {
        // Extract hidden series
        const hiddenSeriesMap = new Map<string, any>()
        benefits.forEach((benefit: any) => {
          if (benefit.hidden_series_id && benefit.benefit_types?.name?.toLowerCase().includes("hidden")) {
            const key = benefit.hidden_series_id
            if (!hiddenSeriesMap.has(key)) {
              hiddenSeriesMap.set(key, {
                id: benefit.hidden_series_id,
                unlockedVia: {
                  artworkId: benefit.vendor_product_submissions?.id,
                  artworkName: benefit.vendor_product_submissions?.product_data?.title || "Unknown Artwork",
                  purchaseDate: allLineItems.find(
                    (li) => li.productId === benefit.vendor_product_submissions?.id?.toString(),
                  )?.purchaseDate || new Date().toISOString(),
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
            hiddenSeries = seriesData.map((s: any) => ({
              id: s.id,
              name: s.name,
              description: s.description,
              thumbnailUrl: s.thumbnail_url,
              teaserImageUrl: s.teaser_image_url,
              vendorName: s.vendors?.vendor_name || "Unknown Artist",
              unlockedAt: hiddenSeriesMap.get(s.id)?.unlockedVia?.purchaseDate || new Date().toISOString(),
              unlockedVia: hiddenSeriesMap.get(s.id)?.unlockedVia,
            }))
          }
        }

        // Extract bonus content
        bonusContent = benefits
          .filter(
            (b: any) =>
              b.benefit_types?.name &&
              !b.benefit_types.name.toLowerCase().includes("hidden") &&
              (b.content_url || b.access_code || b.title),
          )
          .map((benefit: any) => {
            const lineItem = allLineItems.find(
              (li) => li.productId === benefit.vendor_product_submissions?.id?.toString(),
            )
            return {
              id: benefit.id,
              benefitType: benefit.benefit_types?.name || "Bonus Content",
              title: benefit.title,
              description: benefit.description,
              contentUrl: benefit.content_url,
              accessCode: benefit.access_code,
              unlockedAt: lineItem?.purchaseDate || new Date().toISOString(),
              unlockedVia: {
                artworkId: benefit.vendor_product_submissions?.id,
                artworkName: benefit.vendor_product_submissions?.product_data?.title || "Unknown Artwork",
                vendorName: benefit.vendor_product_submissions?.vendors?.vendor_name || "Unknown Artist",
                purchaseDate: lineItem?.purchaseDate || new Date().toISOString(),
              },
              expiresAt: benefit.expires_at,
            }
          })
      }
    }

    // Group purchases by artist
    const purchasesByArtist = allLineItems.reduce((acc, li) => {
      const vendor = li.vendorName || "Unknown Artist"
      if (!acc[vendor]) {
        acc[vendor] = []
      }
      acc[vendor].push(li)
      return acc
    }, {} as Record<string, typeof allLineItems>)

    // Group purchases by series
    const purchasesBySeries = allLineItems.reduce((acc, li) => {
      if (li.series) {
        const seriesId = li.series.id
        if (!acc[seriesId]) {
          acc[seriesId] = {
            series: li.series,
            items: [],
          }
        }
        acc[seriesId].items.push(li)
      }
      return acc
    }, {} as Record<string, { series: any; items: typeof allLineItems }>)

    // Enhanced artist collection stats
    const artistStats = Object.entries(purchasesByArtist).map(([vendorName, items]) => {
      const vendorPurchases = items
      const seriesSet = new Set<string>()
      const seriesDetails: any[] = []
      const seriesMap = new Map<string, any>()

      vendorPurchases.forEach((item) => {
        if (item.series?.id) {
          seriesSet.add(item.series.id)
          if (!seriesMap.has(item.series.id)) {
            seriesMap.set(item.series.id, {
              seriesId: item.series.id,
              seriesName: item.series.name,
              ownedCount: 0,
              thumbnailUrl: item.series.thumbnailUrl,
            })
          }
          const seriesInfo = seriesMap.get(item.series.id)
          seriesInfo.ownedCount++
        }
      })

      seriesMap.forEach((info) => {
        seriesDetails.push({
          ...info,
          totalPieces: 0, // Would need additional query to get total
          completionPercentage: 0, // Would need additional query
        })
      })

      const purchaseDates = vendorPurchases
        .map((item) => item.purchaseDate)
        .filter(Boolean)
        .sort()
      const totalSpent = vendorPurchases.reduce((sum, item) => sum + (item.price || 0), 0)

      return {
        vendorName,
        totalArtworksOwned: vendorPurchases.length,
        totalSeriesCollected: seriesSet.size,
        seriesDetails,
        hiddenSeriesUnlocked: hiddenSeries.filter((hs) => hs.vendorName === vendorName).length,
        firstPurchaseDate: purchaseDates[0] || null,
        lastPurchaseDate: purchaseDates[purchaseDates.length - 1] || null,
        totalSpent,
        completionRate: 0, // Would need additional calculation
        recentPurchases: vendorPurchases
          .slice(0, 5)
          .map((item) => ({
            id: item.id,
            name: item.name,
            purchaseDate: item.purchaseDate,
            price: item.price,
          })),
      }
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

    // Certification summary
    const certifications = allLineItems.map((li) => {
      let status: "authenticated" | "pending" | "certificate_available" | "no_nfc" = "no_nfc"
      if (li.nfcTagId && li.nfcClaimedAt) {
        status = "authenticated"
      } else if (li.nfcTagId && !li.nfcClaimedAt) {
        status = "pending"
      } else if (li.certificateUrl) {
        status = "certificate_available"
      }

      return {
        id: li.id,
        lineItemId: li.lineItemId,
        name: li.name,
        vendorName: li.vendorName,
        seriesName: li.series?.name || null,
        nfcTagId: li.nfcTagId,
        nfcClaimedAt: li.nfcClaimedAt,
        certificateUrl: li.certificateUrl,
        certificateToken: li.certificateToken,
        status,
        imgUrl: li.imgUrl,
        purchaseDate: li.purchaseDate,
        editionNumber: li.editionNumber,
        editionTotal: li.editionTotal,
      }
    })

    return NextResponse.json({
      success: true,
      collectorIdentifier,
      orders: enrichedOrders,
      artists,
      series,
      profile: profile ? {
        display_name: profile.display_name,
        display_phone: profile.display_phone,
        user_email: profile.user_email,
        avatar_url: profile.avatar_url,
      } : null,
      stats: {
        totalOrders: profile?.total_orders ?? enrichedOrders.length,
        totalArtworksOwned: profile?.total_editions ?? allLineItems.length,
        authenticatedCount: profile?.authenticated_editions ?? authenticatedCount,
        unauthenticatedCount: profile ? (profile.total_editions - profile.authenticated_editions) : unauthenticatedCount,
        certificatesReady: certificateCount,
      },
      purchasesByArtist,
      purchasesBySeries,
      hiddenContent: {
        hiddenSeries,
        bonusContent,
      },
      certifications,
      artistStats,
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

