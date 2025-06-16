import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateCertificate } from "@/lib/certificate-generator"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN, CERTIFICATE_METAFIELD_ID } from "@/lib/env"

export async function GET(
  request: NextRequest,
  { params }: { params: { lineItemId: string } }
) {
  try {
    // Create Supabase client using the server-side method
    const supabase = createClient()

    const { lineItemId } = params
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get("token")

    // Validate line item
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
        nfc_claimed_at
      `)
      .eq("line_item_id", lineItemId)
      .single()

    if (lineItemError) {
      if (lineItemError.code === "PGRST116") {
        return NextResponse.json({ error: "Line item not found" }, { status: 404 })
      }
      throw lineItemError
    }

    // Validate certificate token if provided
    if (token && token !== lineItem.certificate_token) {
      return NextResponse.json({ error: "Invalid certificate token" }, { status: 403 })
    }

    // Get product details
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
      if (productError.code === "PGRST116") {
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }
      throw productError
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("name, created_at")
      .eq("id", lineItem.order_id)
      .single()

    if (orderError) {
      if (orderError.code === "PGRST116") {
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }
      throw orderError
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

    // Update certificate URL if not already set
    if (!lineItem.certificate_url) {
      await supabase
        .from("order_line_items_v2")
        .update({
          certificate_url: certificateUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("line_item_id", lineItemId)
    }

    return NextResponse.json({
      success: true,
      certificateUrl,
      lineItem: certificateData.lineItem,
      product: certificateData.product,
      order: certificateData.order,
    })
  } catch (error: any) {
    console.error("Error generating certificate:", error)
    return NextResponse.json({ 
      error: error.message || "An unexpected error occurred" 
    }, { status: 500 })
  }
}

async function fetchProductData(productId: string) {
  try {
    const response = await fetch(`https://${SHOPIFY_SHOP}/admin/api/2023-10/products/${productId}.json`, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.status}`)
    }

    const data = await response.json()

    // Enhance the product data with any certificate-specific metafields
    let certificateMetafield = null
    if (CERTIFICATE_METAFIELD_ID) {
      try {
        const metafieldResponse = await fetch(
          `https://${SHOPIFY_SHOP}/admin/api/2023-10/metafields/${CERTIFICATE_METAFIELD_ID}.json`,
          {
            method: "GET",
            headers: {
              "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
              "Content-Type": "application/json",
            },
          },
        )

        if (metafieldResponse.ok) {
          const metafieldData = await metafieldResponse.json()
          certificateMetafield = metafieldData.metafield
        }
      } catch (error) {
        console.error("Error fetching certificate metafield:", error)
      }
    }

    return {
      id: data.product.id,
      title: data.product.title,
      description: data.product.body_html,
      handle: data.product.handle,
      vendor: data.product.vendor,
      productType: data.product.product_type,
      tags: data.product.tags,
      images: data.product.images.map((image: any) => ({
        id: image.id,
        src: image.src,
        alt: image.alt || data.product.title,
      })),
      certificateMetafield,
    }
  } catch (error) {
    console.error("Error fetching product data:", error)
    return {
      id: productId,
      title: "Unknown Product",
    }
  }
}

async function fetchOrderData(orderId: string) {
  try {
    const response = await fetch(`https://${SHOPIFY_SHOP}/admin/api/2023-10/orders/${orderId}.json`, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch order: ${response.status}`)
    }

    const data = await response.json()
    return data.order
  } catch (error) {
    console.error("Error fetching order data:", error)
    return {
      id: orderId,
      orderName: `Order #${orderId}`,
    }
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    },
  )
}
