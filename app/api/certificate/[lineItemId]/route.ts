import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN, CERTIFICATE_METAFIELD_ID } from "@/lib/env"

export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  const lineItemId = params.lineItemId
  const isPreview = request.headers.get("x-preview-mode") === "true"

  // CORS headers for accessing from any domain
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-preview-mode",
  }

  if (!supabase) {
    return NextResponse.json(
      { success: false, message: "Database connection not available" },
      { status: 500, headers: corsHeaders },
    )
  }

  try {
    // Get the line item data from the database
    const { data: lineItemData, error: lineItemError } = await supabase
      .from("order_line_items_v2")
      .select("*")
      .eq("line_item_id", lineItemId)
      .single()

    if (lineItemError) {
      console.error("Error fetching line item:", lineItemError)
      return NextResponse.json(
        { success: false, message: "Line item not found" },
        { status: 404, headers: corsHeaders },
      )
    }

    if (!lineItemData) {
      return NextResponse.json(
        { success: false, message: "Line item not found" },
        { status: 404, headers: corsHeaders },
      )
    }

    // Get product data from Shopify
    const productData = await fetchProductData(lineItemData.product_id as string)

    // Get order data from Shopify
    const orderData = await fetchOrderData(lineItemData.order_id as string)

    // Check if we have a stored certificate URL
    const certificateUrl =
      lineItemData.certificate_url ||
      `${process.env.NEXT_PUBLIC_CUSTOMER_APP_URL || request.nextUrl.origin}/certificate/${lineItemData.line_item_id}`

    // Format the certificate data
    const certificateData = {
      lineItem: {
        id: lineItemData.line_item_id,
        editionNumber: lineItemData.edition_number,
        editionTotal: lineItemData.edition_total,
        status: lineItemData.status,
        createdAt: lineItemData.created_at,
        updatedAt: lineItemData.updated_at,
        certificateGeneratedAt: lineItemData.certificate_generated_at,
        accessToken: lineItemData.certificate_token,
      },
      product: productData,
      order: {
        id: lineItemData.order_id,
        orderName: lineItemData.order_name,
        customer: orderData.customer
          ? {
              firstName: orderData.customer.first_name,
              lastName: orderData.customer.last_name,
              email: orderData.customer.email,
            }
          : null,
        createdAt: orderData.created_at,
        processedAt: orderData.processed_at,
      },
      certificateUrl: certificateUrl,
      verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/api/certificate/${lineItemData.line_item_id}`,
    }

    // Only log certificate access if not in preview mode
    if (!isPreview) {
      try {
        await supabase.from("certificate_access_logs").insert({
          line_item_id: lineItemId,
          order_id: lineItemData.order_id,
          product_id: lineItemData.product_id,
          accessed_at: new Date().toISOString(),
          ip_address: request.headers.get("x-forwarded-for") || "unknown",
          user_agent: request.headers.get("user-agent") || "unknown",
        })
      } catch (logError) {
        console.error("Error logging certificate access:", logError)
        // Continue even if logging fails
      }
    }

    return NextResponse.json({ success: true, certificate: certificateData }, { status: 200, headers: corsHeaders })
  } catch (error: any) {
    console.error("Error generating certificate:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Error generating certificate" },
      { status: 500, headers: corsHeaders },
    )
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
  const supabase = createClient()
  
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
