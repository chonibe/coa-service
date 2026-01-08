import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyCollectorSessionToken } from "@/lib/collector-session"
import type { CollectorEdition } from "@/types/collector"

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
        processed_at,
        order_line_items_v2 (
          id,
          line_item_id,
          product_id,
          shopify_product_id,
          name,
          img_url,
          vendor_name,
          edition_number,
          edition_total,
          price,
          certificate_url,
          created_at
        )
      `,
      )
      .eq("customer_id", customerId)
      .order("processed_at", { ascending: false })

    if (ordersError) {
      console.error("collector editions error", ordersError)
      return NextResponse.json(
        { success: false, message: "Failed to load editions" },
        { status: 500 },
      )
    }

    const allLineItems = (orders || []).flatMap((order) => order.order_line_items_v2 || [])

    // Get series information for products
    const productIds = Array.from(
      new Set(
        allLineItems
          .map((li: any) => li.product_id || li.shopify_product_id)
          .filter(Boolean) as string[],
      ),
    )

    let seriesMap = new Map<string, any>()
    if (productIds.length > 0) {
      const { data: seriesMembers } = await supabase
        .from("artwork_series_members")
        .select(
          `
          shopify_product_id,
          series_id,
          artwork_series!inner (
            id,
            name,
            vendor_name
          )
        `,
        )
        .in("shopify_product_id", productIds)

      seriesMembers?.forEach((member: any) => {
        if (member.shopify_product_id && member.artwork_series) {
          seriesMap.set(member.shopify_product_id, member.artwork_series)
        }
      })
    }

    const editions: CollectorEdition[] = allLineItems
      .filter((li: any) => li.edition_number !== null || li.edition_total !== null)
      .map((li: any) => {
        const series = (li.product_id || li.shopify_product_id)
          ? seriesMap.get(li.product_id || li.shopify_product_id)
          : null

        // Determine edition type
        let editionType: "limited" | "open" | null = null
        if (li.edition_total && li.edition_total > 0) {
          editionType = "limited"
        } else if (li.edition_number !== null) {
          editionType = "open"
        }

        // Determine verification source (simplified - would need more logic based on actual data)
        let verificationSource: CollectorEdition["verificationSource"] = null
        if (li.edition_number && li.edition_total) {
          verificationSource = "supabase" // Assume verified if both exist
        }

        return {
          id: li.id,
          lineItemId: li.line_item_id,
          productId: li.product_id || li.shopify_product_id,
          name: li.name,
          editionNumber: li.edition_number,
          editionTotal: li.edition_total,
          editionType,
          verificationSource,
          imgUrl: li.img_url,
          vendorName: li.vendor_name,
          series: series
            ? {
                id: series.id,
                name: series.name,
                vendorName: series.vendor_name,
              }
            : null,
          purchaseDate: li.created_at || new Date().toISOString(),
          price: li.price,
          certificateUrl: li.certificate_url,
        }
      })

    return NextResponse.json({
      success: true,
      editions,
    })
  } catch (error: any) {
    console.error("collector editions unexpected error", error)
    return NextResponse.json(
      { success: false, message: "Unexpected server error" },
      { status: 500 },
    )
  }
}

