import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"

export async function GET() {
  const supabase = createClient()
  
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get("productId")

  if (!productId) {
    return NextResponse.json({ success: false, message: "Product ID is required" }, { status: 400 })
  }

  try {
    // First, get product information from Shopify
    const productInfo = await getProductInfo(productId)

    // Then, get all line items with edition numbers for this product from Supabase
    const { data: lineItems, error } = await supabase
      .from("order_line_items_v2")
      .select("*")
      .eq("product_id", productId)
      .order("edition_number", { ascending: true })

    if (error) {
      console.error("Error fetching line items:", error)
      throw new Error("Failed to fetch line items from database")
    }

    // Get the current highest edition number from active items only
    const activeItems = lineItems.filter((item) => item.status === "active")
    const currentEditionNumber =
      activeItems.length > 0 ? Math.max(...activeItems.map((item) => Number(item.edition_number) || 0)) : 0

    // This ensures the frontend still gets the edition_total even if it's not in the database
    const lineItemsWithTotal = (lineItems || []).map((item) => ({
      ...item,
      edition_total: productInfo.editionTotal || null,
    }))

    return NextResponse.json({
      success: true,
      productInfo: {
        ...productInfo,
        productId,
        currentEditionNumber,
      },
      lineItems: lineItemsWithTotal,
    })
  } catch (error: any) {
    console.error("Error getting edition numbers:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to get edition numbers" },
      { status: 500 },
    )
  }
}

// Update the getProductInfo function to fetch the Edition Size metafield
async function getProductInfo(productId: string) {
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
    const product = data.product

    // Fetch metafields to get edition size
    const metafieldsResponse = await fetch(
      `https://${SHOPIFY_SHOP}/admin/api/2023-10/products/${productId}/metafields.json`,
      {
        method: "GET",
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
      },
    )

    let editionTotal = null
    if (metafieldsResponse.ok) {
      const metafieldsData = await metafieldsResponse.json()
      const metafields = metafieldsData.metafields || []

      // Look for Edition Size metafield with various possible keys
      const editionSizeMetafield = metafields.find(
        (meta: any) =>
          meta.key.toLowerCase() === "edition_size" ||
          meta.key.toLowerCase() === "edition size" ||
          meta.key.toLowerCase() === "limited_edition_size" ||
          meta.key.toLowerCase() === "total_edition",
      )

      if (editionSizeMetafield && editionSizeMetafield.value) {
        // Try to parse the edition size as a number
        const sizeValue = Number.parseInt(editionSizeMetafield.value, 10)
        if (!isNaN(sizeValue) && sizeValue > 0) {
          editionTotal = sizeValue
        }
      }
    }

    return {
      productTitle: product.title,
      productId: product.id,
      editionTotal: editionTotal,
      vendor: product.vendor,
      productType: product.product_type,
      handle: product.handle,
      status: product.status,
      tags: product.tags,
    }
  } catch (error) {
    console.error("Error fetching product info:", error)
    // Return minimal info if we can't fetch from Shopify
    return {
      productTitle: "Unknown Product",
      productId: productId,
      editionTotal: null,
    }
  }
}
