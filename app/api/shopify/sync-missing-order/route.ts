import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  const supabase = createClient()
  
  try {
    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    // Fetch the order from Shopify
    const order = await fetchOrderFromShopify(orderId)

    if (!order) {
      return NextResponse.json({ error: "Order not found in Shopify" }, { status: 404 })
    }

    // Process the order
    const result = await processShopifyOrder(order)

    return NextResponse.json({
      success: true,
      message: `Order ${order.name} processed successfully`,
      result,
    })
  } catch (error: any) {
    console.error("Error syncing missing order:", error)
    return NextResponse.json({ error: error.message || "Failed to sync missing order" }, { status: 500 })
  }
}

/**
 * Fetch an order from Shopify API
 */
async function fetchOrderFromShopify(orderId: string) {
  const url = `https://${SHOPIFY_SHOP}/admin/api/2023-10/orders/${orderId}.json`

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    if (response.status === 404) {
      return null
    }
    const errorText = await response.text()
    throw new Error(`Failed to fetch order: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  return data.order
}

/**
 * Process a Shopify order and update edition numbers
 */
async function processShopifyOrder(order: any) {
  try {
    console.log(`Processing order ${order.id} (${order.name})`)

    // Check if this order contains any line items for limited edition products
    const limitedEditionItems = order.line_items.filter((item: any) => {
      // Check if this is a limited edition product based on properties or tags
      const isLimitedEdition =
        (item.properties &&
          item.properties.some((prop: any) => prop.name === "limited_edition" && prop.value === "true")) ||
        (item.product &&
          item.product.tags &&
          typeof item.product.tags === "string" &&
          item.product.tags.toLowerCase().includes("limited"))

      return isLimitedEdition
    })

    if (limitedEditionItems.length === 0) {
      console.log(`Order ${order.id} does not contain any limited edition items`)
      return {
        orderId: order.id,
        orderName: order.name,
        limitedEditionItems: 0,
        message: "No limited edition items found",
      }
    }

    console.log(`Found ${limitedEditionItems.length} limited edition items in order ${order.id}`)

    // Process each limited edition item
    const processedItems = []
    for (const item of limitedEditionItems) {
      const result = await processLineItem(order, item)
      processedItems.push(result)
    }

    console.log(`Finished processing order ${order.id}`)

    return {
      orderId: order.id,
      orderName: order.name,
      limitedEditionItems: limitedEditionItems.length,
      processedItems,
    }
  } catch (error) {
    console.error(`Error processing order ${order.id}:`, error)
    throw error
  }
}

// Add the getProductMetafields function to this file as well
async function getProductMetafields(productId: string) {
  try {
    const url = `https://${SHOPIFY_SHOP}/admin/api/2023-10/products/${productId}/metafields.json`
    console.log(`Fetching metafields for product ${productId}`)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch product metafields: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    const metafields = data.metafields || []

    // Look for Edition Size metafield with various possible keys
    const editionSizeMetafield = metafields.find(
      (meta: any) =>
        meta.key.toLowerCase() === "edition_size" ||
        meta.key.toLowerCase() === "edition size" ||
        meta.key.toLowerCase() === "limited_edition_size" ||
        meta.key.toLowerCase() === "total_edition",
    )

    let editionSize = null
    if (editionSizeMetafield && editionSizeMetafield.value) {
      // Try to parse the edition size as a number
      const sizeValue = Number.parseInt(editionSizeMetafield.value, 10)
      if (!isNaN(sizeValue) && sizeValue > 0) {
        editionSize = sizeValue
      }
    }

    return {
      editionSize,
      allMetafields: metafields,
    }
  } catch (error) {
    console.error(`Error fetching metafields for product ${productId}:`, error)
    return {
      editionSize: null,
      allMetafields: [],
    }
  }
}

// Update the processLineItem function in this file as well
async function processLineItem(order: any, lineItem: any) {
  try {
    const orderId = order.id.toString()
    const lineItemId = lineItem.id.toString()
    const productId = lineItem.product_id.toString()
    // Extract vendor name from line item properties or vendor field
    const vendorName =
      lineItem.vendor ||
      (lineItem.properties && lineItem.properties.find((p: any) => p.name === "vendor")?.value) ||
      null

    console.log(`Processing line item ${lineItemId} for product ${productId}, vendor: ${vendorName || "Unknown"}`)

    // Fetch product metafields to get edition size
    const { editionSize } = await getProductMetafields(productId)
    console.log(`Edition size for product ${productId}: ${editionSize || "Not set"}`)

    // Check if this line item already exists in the database
    const { data: existingItems, error: queryError } = await supabase
      .from("order_line_items")
      .select("*")
      .eq("order_id", orderId)
      .eq("line_item_id", lineItemId)

    if (queryError) {
      console.error(`Error checking existing line item:`, queryError)
      throw queryError
    }

    if (existingItems && existingItems.length > 0) {
      console.log(`Line item ${lineItemId} already exists in database, skipping`)

      // Update vendor_name if it's available and not set previously
      if (vendorName && !existingItems[0].vendor_name) {
        const { error: updateError } = await supabase
          .from("order_line_items")
          .update({
            vendor_name: vendorName,
            updated_at: new Date().toISOString(),
          })
          .eq("line_item_id", lineItemId)
          .eq("order_id", orderId)

        if (updateError) {
          console.error(`Error updating vendor name:`, updateError)
        } else {
          console.log(`Updated vendor name to ${vendorName} for line item ${lineItemId}`)
        }
      }

      return {
        lineItemId,
        productId,
        status: "already_exists",
        message: "Line item already exists in database",
      }
    }

    // Insert the new line item
    const { error: insertError } = await supabase.from("order_line_items").insert({
      order_id: orderId,
      order_name: order.name,
      line_item_id: lineItemId,
      product_id: productId,
      variant_id: lineItem.variant_id?.toString(),
      vendor_name: vendorName, // Add vendor name to the insert
      // Don't set edition_number here, it will be assigned during resequencing
      edition_total: editionSize, // Add the edition_total from the metafield
      created_at: new Date(order.created_at).toISOString(),
      updated_at: new Date().toISOString(),
      status: "active",
    })

    if (insertError) {
      console.error(`Error inserting line item:`, insertError)
      throw insertError
    }

    console.log(`Successfully inserted line item ${lineItemId} with vendor ${vendorName || "Unknown"}`)

    // Resequence edition numbers for this product
    await resequenceEditionNumbers(productId)

    console.log(`Successfully processed line item ${lineItemId}`)

    return {
      lineItemId,
      productId,
      status: "inserted",
      message: "Line item inserted and edition numbers resequenced",
      editionSize: editionSize,
      vendorName: vendorName,
    }
  } catch (error) {
    console.error(`Error processing line item:`, error)
    throw error
  }
}

/**
 * Resequence edition numbers for a product
 */
async function resequenceEditionNumbers(productId: string) {
  try {
    console.log(`Resequencing edition numbers for product ${productId}`)

    // Get all active line items for this product, ordered by creation date
    const { data: activeItems, error } = await supabase
      .from("order_line_items")
      .select("*")
      .eq("product_id", productId)
      .eq("status", "active")
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching active items for resequencing:", error)
      throw error
    }

    if (!activeItems || activeItems.length === 0) {
      console.log("No active items found for resequencing")
      return
    }

    console.log(`Found ${activeItems.length} active items to resequence`)

    // Assign new sequential edition numbers starting from 1
    let editionCounter = 1

    for (const item of activeItems) {
      const { error: updateError } = await supabase
        .from("order_line_items")
        .update({
          edition_number: editionCounter,
          updated_at: new Date().toISOString(),
        })
        .eq("line_item_id", item.line_item_id)
        .eq("order_id", item.order_id)

      if (updateError) {
        console.error(`Error updating edition number for item ${item.line_item_id}:`, updateError)
      } else {
        console.log(`Updated item ${item.line_item_id} with new edition number ${editionCounter}`)
        editionCounter++
      }
    }

    console.log(`Resequencing complete. Assigned edition numbers 1 through ${editionCounter - 1}`)
  } catch (error) {
    console.error("Error in resequenceEditionNumbers:", error)
    throw error
  }
}
