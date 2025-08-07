import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"

export async function GET() {
  const supabase = createClient()
  
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get("customerId")

    if (!customerId) {
      return NextResponse.json({ success: false, message: "Customer ID is required" }, { status: 400 })
    }

    // Fetch customer's orders from Shopify
    const shopifyResponse = await fetch(
      `https://${SHOPIFY_SHOP}/admin/api/2023-10/customers/${customerId}/orders.json?status=any`,
      {
        method: "GET",
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
      },
    )

    if (!shopifyResponse.ok) {
      throw new Error(`Failed to fetch customer orders: ${shopifyResponse.status}`)
    }

    const shopifyData = await shopifyResponse.json()
    const orders = shopifyData.orders || []

    // Extract all line items with certificates
    const lineItems = []
    const orderIds = []

    for (const order of orders) {
      orderIds.push(order.id.toString())

      for (const item of order.line_items) {
        // Check if this is a limited edition product
        const isLimitedEdition =
          item.properties?.some((prop: any) => prop.name === "limited_edition" && prop.value === "true") || false

        if (isLimitedEdition) {
          lineItems.push({
            line_item_id: item.id.toString(),
            order_id: order.id.toString(),
            order_number: order.order_number,
            processed_at: order.processed_at,
            title: item.title,
            product_id: item.product_id,
            variant_id: item.variant_id,
          })
        }
      }
    }

    // Fetch certificate information from Supabase
    const { data: certificates, error: certError } = await supabase
      .from("order_line_items")
      .select("*")
      .in("order_id", orderIds)
      .in(
        "line_item_id",
        lineItems.map((item) => item.line_item_id),
      )

    if (certError) {
      console.error("Error fetching certificates:", certError)
      throw new Error("Failed to fetch certificates")
    }

    // Merge certificate data with line items
    const certificatesWithDetails = lineItems.map((item) => {
      const certificate = certificates?.find(
        (cert) => cert.line_item_id === item.line_item_id && cert.order_id === item.order_id,
      )

      return {
        ...item,
        certificate_url: certificate?.certificate_url || null,
        edition_number: certificate?.edition_number || null,
        edition_total: certificate?.edition_total || null,
        nfc_tag_id: certificate?.nfc_tag_id || null,
        nfc_claimed_at: certificate?.nfc_claimed_at || null,
        is_claimed: !!certificate?.nfc_claimed_at,
      }
    })

    return NextResponse.json({
      success: true,
      certificates: certificatesWithDetails,
    })
  } catch (error: any) {
    console.error("Error fetching customer certificates:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch certificates" },
      { status: 500 },
    )
  }
}
