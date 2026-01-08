import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyCollectorSessionToken } from "@/lib/collector-session"
import type { CollectorCertification } from "@/types/collector"

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
          nfc_tag_id,
          nfc_claimed_at,
          certificate_url,
          certificate_token,
          edition_number,
          edition_total,
          created_at
        )
      `,
      )
      .eq("customer_id", customerId)
      .order("processed_at", { ascending: false })

    if (ordersError) {
      console.error("collector certifications error", ordersError)
      return NextResponse.json(
        { success: false, message: "Failed to load certifications" },
        { status: 500 },
      )
    }

    const allLineItems = (orders || []).flatMap((order) => order.order_line_items_v2 || [])

    // Get series information
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
            name
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

    const certifications: CollectorCertification[] = allLineItems.map((li: any) => {
      let status: "authenticated" | "pending" | "certificate_available" | "no_nfc" = "no_nfc"
      if (li.nfc_tag_id && li.nfc_claimed_at) {
        status = "authenticated"
      } else if (li.nfc_tag_id && !li.nfc_claimed_at) {
        status = "pending"
      } else if (li.certificate_url) {
        status = "certificate_available"
      }

      const series = (li.product_id || li.shopify_product_id)
        ? seriesMap.get(li.product_id || li.shopify_product_id)
        : null

      return {
        id: li.id,
        lineItemId: li.line_item_id,
        name: li.name,
        vendorName: li.vendor_name,
        seriesName: series?.name || null,
        nfcTagId: li.nfc_tag_id,
        nfcClaimedAt: li.nfc_claimed_at,
        certificateUrl: li.certificate_url,
        certificateToken: li.certificate_token,
        status,
        imgUrl: li.img_url,
        purchaseDate: li.created_at || new Date().toISOString(),
        editionNumber: li.edition_number,
        editionTotal: li.edition_total,
      }
    })

    return NextResponse.json({
      success: true,
      certifications,
    })
  } catch (error: any) {
    console.error("collector certifications unexpected error", error)
    return NextResponse.json(
      { success: false, message: "Unexpected server error" },
      { status: 500 },
    )
  }
}

