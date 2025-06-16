import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateCertificate } from "@/lib/certificate-generator"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client using the server-side method
    const supabase = createClient()

    const body = await request.json()
    const { line_item_id, order_id } = body

    // Validate required fields
    if (!line_item_id || !order_id) {
      return NextResponse.json({ error: "Line item ID and Order ID are required" }, { status: 400 })
    }

    // Fetch line item details
    const { data: lineItem, error: lineItemError } = await supabase
      .from("order_line_items_v2")
      .select(`
        line_item_id,
        order_id,
        product_id,
        title,
        quantity,
        status,
        edition_number,
        edition_total,
        certificate_url,
        certificate_token,
        certificate_generated_at,
        nfc_tag_id,
        nfc_claimed_at,
        created_at
      `)
      .eq("line_item_id", line_item_id)
      .eq("order_id", order_id)
      .single()

    if (lineItemError) {
      console.error("Error fetching line item:", lineItemError)
      return NextResponse.json({ error: "Line item not found" }, { status: 404 })
    }

    // Fetch product details
    const { data: product, error: productError } = await supabase
      .from("products")
      .select(`
        id,
        title,
        description,
        vendor_name,
        collection_name,
        image_url
      `)
      .eq("id", lineItem.product_id)
      .single()

    if (productError) {
      console.error("Error fetching product:", productError)
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("name, created_at")
      .eq("id", order_id)
      .single()

    if (orderError) {
      console.error("Error fetching order:", orderError)
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Prepare certificate data
    const certificateData = {
      lineItem: {
        id: lineItem.line_item_id,
        title: lineItem.title,
        quantity: lineItem.quantity,
        editionNumber: lineItem.edition_number,
        editionTotal: lineItem.edition_total,
        nfcTagId: lineItem.nfc_tag_id,
        nfcClaimedAt: lineItem.nfc_claimed_at,
      },
      product: {
        id: product.id,
        title: product.title,
        description: product.description,
        vendorName: product.vendor_name,
        collectionName: product.collection_name,
        imageUrl: product.image_url,
      },
      order: {
        name: order.name,
        createdAt: order.created_at,
      },
      additionalInfo: null,
    }

    // Generate or retrieve certificate
    const certificateUrl = await generateCertificate(certificateData)

    // Generate a new certificate token if not exists
    const certificateToken = lineItem.certificate_token || crypto.randomUUID()

    // Update line item with certificate details
    const { error: updateError } = await supabase
      .from("order_line_items_v2")
      .update({
        certificate_url: certificateUrl,
        certificate_token: certificateToken,
        certificate_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("line_item_id", line_item_id)
      .eq("order_id", order_id)

    if (updateError) {
      console.error("Error updating line item with certificate details:", updateError)
      return NextResponse.json({ error: "Failed to update line item" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      certificateUrl,
      certificateToken,
      lineItem: certificateData.lineItem,
      product: certificateData.product,
      order: certificateData.order,
    })
  } catch (error: any) {
    console.error("Unexpected error generating certificate:", error)
    return NextResponse.json({ 
      error: error.message || "An unexpected error occurred" 
    }, { status: 500 })
  }
}
