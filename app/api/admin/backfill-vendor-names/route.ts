import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN, ADMIN_PASSWORD } from "@/lib/env"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    // Verify admin password
    const body = await request.json()
    const { password } = body

    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Starting vendor name backfill process")

    // Get all line items without vendor names
    const { data: lineItems, error: queryError } = await supabase
      .from("order_line_items")
      .select("*")
      .is("vendor_name", null)
      .order("created_at", { ascending: false })
      .limit(100) // Process in batches to avoid timeouts

    if (queryError) {
      console.error("Error fetching line items:", queryError)
      return NextResponse.json({ error: "Failed to fetch line items" }, { status: 500 })
    }

    console.log(`Found ${lineItems?.length || 0} line items without vendor names`)

    if (!lineItems || lineItems.length === 0) {
      return NextResponse.json({ success: true, message: "No line items to process" })
    }

    // Process each line item
    const results = []
    for (const item of lineItems) {
      try {
        const result = await backfillVendorName(item)
        results.push(result)
      } catch (itemError) {
        console.error(`Error processing item ${item.line_item_id}:`, itemError)
        results.push({
          lineItemId: item.line_item_id,
          productId: item.product_id,
          success: false,
          error: itemError.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: lineItems.length,
      results,
    })
  } catch (error: any) {
    console.error("Error in backfill-vendor-names route:", error)
    return NextResponse.json({ error: error.message || "Failed to backfill vendor names" }, { status: 500 })
  }
}

async function backfillVendorName(lineItem: any) {
  const lineItemId = lineItem.line_item_id
  const productId = lineItem.product_id

  console.log(`Processing line item ${lineItemId} for product ${productId}`)

  if (!productId) {
    console.log(`No product ID for line item ${lineItemId}, skipping`)
    return {
      lineItemId,
      success: false,
      message: "No product ID available",
    }
  }

  // Try to fetch the product to get the vendor
  try {
    const productUrl = `https://${SHOPIFY_SHOP}/admin/api/2023-10/products/${productId}.json`
    const productResponse = await fetch(productUrl, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    })

    if (!productResponse.ok) {
      console.log(`Failed to fetch product ${productId}: ${productResponse.status}`)
      return {
        lineItemId,
        productId,
        success: false,
        message: `Failed to fetch product: ${productResponse.status}`,
      }
    }

    const productData = await productResponse.json()
    if (!productData.product || !productData.product.vendor) {
      console.log(`No vendor found for product ${productId}`)
      return {
        lineItemId,
        productId,
        success: false,
        message: "No vendor found in product data",
      }
    }

    const vendorName = productData.product.vendor
    console.log(`Found vendor name "${vendorName}" for product ${productId}`)

    // Update the line item with the vendor name
    const { error: updateError } = await supabase
      .from("order_line_items")
      .update({
        vendor_name: vendorName,
        updated_at: new Date().toISOString(),
      })
      .eq("line_item_id", lineItemId)

    if (updateError) {
      console.error(`Error updating vendor name for line item ${lineItemId}:`, updateError)
      return {
        lineItemId,
        productId,
        success: false,
        message: `Database update failed: ${updateError.message}`,
      }
    }

    console.log(`Successfully updated vendor name for line item ${lineItemId}`)
    return {
      lineItemId,
      productId,
      success: true,
      vendorName,
    }
  } catch (error) {
    console.error(`Error processing vendor name for line item ${lineItemId}:`, error)
    return {
      lineItemId,
      productId,
      success: false,
      message: error.message || "Unknown error",
    }
  }
}
