import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"

export async function GET(request: NextRequest) {
  try {
    // First, get unique product IDs from the database
    const { data: productIds, error: productIdsError } = await supabaseAdmin
      .from("order_line_items")
      .select("product_id")
      .is("product_id", "not.null")
      .order("product_id")
      .distinct()

    if (productIdsError) {
      console.error("Error fetching product IDs:", productIdsError)
      return NextResponse.json({ success: false, message: "Failed to fetch product IDs" }, { status: 500 })
    }

    // If we have product IDs, try to fetch product details from Shopify
    if (productIds && productIds.length > 0) {
      const products = []

      for (const { product_id } of productIds) {
        try {
          // Try to fetch product details from Shopify
          const response = await fetch(`https://${SHOPIFY_SHOP}/admin/api/2023-10/products/${product_id}.json`, {
            method: "GET",
            headers: {
              "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
              "Content-Type": "application/json",
            },
          })

          if (response.ok) {
            const data = await response.json()
            products.push({
              id: product_id,
              title: data.product.title || `Product ${product_id}`,
            })
          } else {
            // If we can't fetch from Shopify, just use the product ID
            products.push({
              id: product_id,
              title: `Product ${product_id}`,
            })
          }
        } catch (error) {
          // If there's an error, just use the product ID
          products.push({
            id: product_id,
            title: `Product ${product_id}`,
          })
        }
      }

      return NextResponse.json({
        success: true,
        products,
      })
    }

    // If we don't have any product IDs, return an empty array
    return NextResponse.json({
      success: true,
      products: [],
    })
  } catch (error: any) {
    console.error("Error in products list API:", error)
    return NextResponse.json({ success: false, message: error.message || "An error occurred" }, { status: 500 })
  }
}
