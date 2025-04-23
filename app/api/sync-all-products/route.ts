import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"
import crypto from "crypto"

// Add more detailed logging throughout the file

// Mocked functions (replace with your actual implementations)
async function getProductInfo(productId: string) {
  // Replace with your actual implementation to fetch product info
  console.log(`Mocked: Fetching product info for ${productId}`)
  return {
    title: `Product ${productId}`,
    variantIds: [],
    editionTotal: 100,
  }
}

async function fetchAllOrdersWithProduct(productId: string, variantIds: string[]) {
  // Replace with your actual implementation to fetch orders
  console.log(`Mocked: Fetching orders for product ${productId} and variants ${variantIds}`)
  return []
}

function assignEditionNumbers(orders: any[], productId: string, variantIds: string[], editionTotal: number) {
  // Replace with your actual implementation to assign edition numbers
  console.log(
    `Mocked: Assigning edition numbers for product ${productId}, variants ${variantIds}, editionTotal ${editionTotal}`,
  )
  return []
}

async function fetchLineItemDetails(lineItems: any[]) {
  // Replace with your actual implementation to fetch line item details
  console.log(`Mocked: Fetching line item details for ${lineItems.length} line items`)
  const details: any = {}
  lineItems.forEach((item) => {
    details[item.line_item_id] = {
      sku: `SKU-${item.line_item_id}`,
    }
  })
  return details
}

export async function POST(request: NextRequest) {
  console.log("==== SYNC ALL PRODUCTS API CALLED ====")
  console.log("Received sync request to /api/sync-all-products")
  console.log("Request headers:", Object.fromEntries(request.headers.entries()))

  try {
    const body = await request.json()
    console.log("Request body:", JSON.stringify(body, null, 2))

    const { productIds, forceSync = false } = body

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      console.error("Invalid productIds:", productIds)
      return NextResponse.json({ success: false, message: "Product IDs array is required" }, { status: 400 })
    }

    console.log(`Processing ${productIds.length} products with forceSync=${forceSync}`)
    console.log("Product IDs to sync:", productIds)

    // Process each product
    const syncResults = []
    let totalProducts = 0
    let successfulProducts = 0

    for (const productId of productIds) {
      totalProducts++
      console.log(`Starting sync for product ${productId} (${totalProducts}/${productIds.length})`)

      try {
        // Sync edition numbers for this product
        const result = await syncProductEditionNumbers(productId, forceSync)
        console.log(`Sync completed for product ${productId}:`, JSON.stringify(result, null, 2))

        syncResults.push({
          productId,
          productTitle: result.productTitle,
          result: {
            totalEditions: result.totalEditions,
            editionTotal: result.editionTotal,
            lineItemsProcessed: result.lineItemsProcessed,
            activeItems: result.activeItems,
            removedItems: result.removedItems,
          },
        })
        successfulProducts++
      } catch (error: any) {
        console.error(`Error syncing product ${productId}:`, error)
        console.error(error.stack)
        syncResults.push({
          productId,
          productTitle: "Unknown Product", // Provide a default value
          error: error.message || "Failed to sync product",
        })
      }
    }

    // Record the sync operation in the database
    try {
      console.log("Recording sync operation in database")
      await recordSyncOperation(totalProducts, successfulProducts, syncResults)
      console.log("Sync operation recorded successfully")
    } catch (recordError) {
      console.error("Error recording sync operation:", recordError)
      // Continue even if recording fails
    }

    console.log("Sync process completed successfully")
    console.log(`Total products: ${totalProducts}, Successful: ${successfulProducts}`)

    return NextResponse.json(
      {
        success: true,
        totalProducts,
        successfulProducts,
        syncResults,
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error: any) {
    console.error("Error in sync-all-products route:", error)
    console.error(error.stack)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to sync products" },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}

// Add a new function to fetch existing edition data from Supabase
async function fetchExistingEditionData(productId: string) {
  console.log(`Fetching existing edition data from Supabase for product ${productId}`)

  try {
    const { data, error } = await supabase
      .from("order_line_items")
      .select("*")
      .eq("product_id", productId)
      .order("edition_number", { ascending: true })

    if (error) {
      console.error("Error fetching existing edition data from Supabase:", error)
      return []
    }

    console.log(`Found ${data?.length || 0} existing edition records in Supabase for product ${productId}`)
    return data || []
  } catch (error) {
    console.error("Exception fetching existing edition data from Supabase:", error)
    return []
  }
}

// Update the syncProductEditionNumbers function to include fetching from Supabase
// Modify the syncProductEditionNumbers function to include this step
async function syncProductEditionNumbers(productId: string, forceSync: boolean) {
  console.log(`==== SYNCING PRODUCT ${productId} ====`)
  console.log(`Starting syncProductEditionNumbers for product ${productId} with forceSync=${forceSync}`)
  try {
    // Step 1: Get product information
    console.log(`Step 1: Getting product information for ${productId}`)
    const productInfo = await getProductInfo(productId)
    console.log(`Product info for ${productId}:`, JSON.stringify(productInfo, null, 2))

    // NEW STEP: Fetch existing edition data from Supabase
    console.log(`Step 2: Fetching existing edition data from Supabase for product ${productId}`)
    const existingEditionData = await fetchExistingEditionData(productId)
    console.log(`Found ${existingEditionData.length} existing edition records in Supabase`)

    // If we have existing data and forceSync is false, we can use it
    if (existingEditionData.length > 0 && !forceSync) {
      console.log(`Using existing edition data from Supabase (forceSync=${forceSync})`)

      // Return the existing data summary
      return {
        productTitle: productInfo.title,
        totalEditions: existingEditionData.length,
        editionTotal: productInfo.editionTotal,
        lineItemsProcessed: existingEditionData.length,
        activeItems: existingEditionData.filter((item) => item.status !== "removed").length,
        removedItems: existingEditionData.filter((item) => item.status === "removed").length,
      }
    }

    // If forceSync is true or no existing data, continue with Shopify API
    console.log(`${forceSync ? "ForceSync is true" : "No existing data"}, fetching from Shopify API`)

    // Step 3: Fetch all orders with this product or its variants
    console.log(`Step 3: Fetching all orders with product ${productId} or its variants from Shopify API`)
    const orders = await fetchAllOrdersWithProduct(productId, productInfo.variantIds || [])
    console.log(`Found ${orders.length} orders containing product ${productId} or its variants`)

    if (orders.length === 0) {
      console.log(`No orders found for product ${productId} or its variants. Nothing to sync.`)
      return {
        productTitle: productInfo.title,
        totalEditions: 0,
        editionTotal: productInfo.editionTotal,
        lineItemsProcessed: 0,
        activeItems: 0,
        removedItems: 0,
      }
    }

    // Step 4: Sort orders by created_at date
    console.log(`Step 4: Sorting ${orders.length} orders by creation date`)
    orders.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    console.log(`First order date: ${orders[0].created_at}, Last order date: ${orders[orders.length - 1].created_at}`)

    // Step 5: Assign sequential edition numbers
    console.log(`Step 5: Assigning sequential edition numbers for product ${productId} and its variants`)
    const editionAssignments = assignEditionNumbers(
      orders,
      productId,
      productInfo.variantIds || [],
      productInfo.editionTotal,
    )
    console.log(`Created ${editionAssignments.length} edition assignments for product ${productId}`)

    // Step 6: Update database with edition numbers
    console.log(`Step 6: Updating database with ${editionAssignments.length} edition numbers for product ${productId}`)
    const result = await updateDatabaseWithEditionNumbers(editionAssignments, forceSync)
    console.log(`Database update result for ${productId}:`, JSON.stringify(result, null, 2))

    // Step 7: Clean up duplicate line items
    console.log(`Step 7: Cleaning up duplicate line items for product ${productId}`)
    const cleanupResult = await cleanupDuplicateLineItems(productId)
    console.log(`Cleanup result for ${productId}:`, JSON.stringify(cleanupResult, null, 2))

    return {
      productTitle: productInfo.title,
      totalEditions: editionAssignments.length,
      editionTotal: productInfo.editionTotal,
      lineItemsProcessed: result.lineItemsProcessed,
      activeItems: result.activeItems,
      removedItems: result.removedItems + cleanupResult.removedCount,
    }
  } catch (error: any) {
    console.error(`Error in syncProductEditionNumbers for product ${productId}:`, error)
    console.error(error.stack)
    throw error // Re-throw the error to be caught in the main function
  }
}

// Update the cleanupDuplicateLineItems function with more sophisticated duplicate detection

// Replace the existing cleanupDuplicateLineItems function with this improved version:
async function cleanupDuplicateLineItems(productId: string) {
  console.log(`Starting cleanup of duplicate line items for product ${productId}`)
  let removedCount = 0

  try {
    // Fetch all line items for this product
    const { data: lineItems, error } = await supabase
      .from("order_line_items")
      .select("*")
      .or(`product_id.eq.${productId},product_id.is.null`)
      .order("line_item_id", { ascending: true })

    if (error) {
      console.error("Error fetching line items for cleanup:", error)
      return { success: false, removedCount: 0, error: error.message }
    }

    if (!lineItems || lineItems.length === 0) {
      console.log("No line items found for cleanup")
      return { success: true, removedCount: 0 }
    }

    console.log(`Found ${lineItems.length} line items for cleanup`)

    // Fetch additional metadata for each line item from Shopify
    const lineItemDetails = await fetchLineItemDetails(lineItems)
    console.log(`Fetched additional details for ${Object.keys(lineItemDetails).length} line items`)

    // Group line items by order_id and created_at timestamp
    const orderGroups = new Map()

    lineItems.forEach((item) => {
      // Create a key based on order_id and the timestamp (truncated to minute precision for flexibility)
      const timestamp = new Date(item.created_at)
      const timeKey = `${timestamp.getFullYear()}-${timestamp.getMonth()}-${timestamp.getDate()}-${timestamp.getHours()}-${timestamp.getMinutes()}`
      const key = `${item.order_id}_${timeKey}`

      if (!orderGroups.has(key)) {
        orderGroups.set(key, [])
      }
      orderGroups.get(key).push({
        ...item,
        details: lineItemDetails[item.line_item_id] || {},
      })
    })

    console.log(`Grouped into ${orderGroups.size} order groups`)

    // Process each group to find duplicates
    for (const [key, items] of orderGroups.entries()) {
      if (items.length > 1) {
        console.log(`Found ${items.length} potential duplicates in group ${key}`)

        // First, try to identify the "real" item based on our criteria
        const validItems = items.filter((item) => {
          // Check if this item has a valid product_id matching our target
          const hasValidProductId = item.product_id === productId

          // Check if this item has a valid SKU
          const hasValidSku = item.details.sku && item.details.sku.trim() !== ""

          return hasValidProductId && hasValidSku
        })

        // If we found valid items, keep the one with the highest line_item_id
        // Otherwise, just keep the highest line_item_id item
        const itemsToKeep = validItems.length > 0 ? validItems : items

        // Sort by line_item_id in descending order (higher IDs first)
        itemsToKeep.sort((a, b) => Number(b.line_item_id) - Number(a.line_item_id))

        // Keep the first one (highest line_item_id) and mark others as removed
        const keepItem = itemsToKeep[0]
        console.log(`Keeping item with line_item_id ${keepItem.line_item_id}`)

        // Mark all other items in the group as removed
        for (const item of items) {
          if (item.line_item_id !== keepItem.line_item_id) {
            console.log(`Marking item with line_item_id ${item.line_item_id} as removed`)

            // Determine the reason for removal
            let reason = "Duplicate line item (lower ID)"
            if (item.product_id === null) {
              reason = "Duplicate with null product_id"
            } else if (!item.details.sku || item.details.sku.trim() === "") {
              reason = "Duplicate with missing SKU"
            } else if (item.product_id !== productId) {
              reason = "Duplicate with incorrect product_id"
            }

            // Update the item status to "removed" and set edition_number to null
            const { error: updateError } = await supabase
              .from("order_line_items")
              .update({
                status: "removed",
                removed_reason: reason,
                edition_number: null, // Clear the edition number
                updated_at: new Date().toISOString(),
              })
              .eq("line_item_id", item.line_item_id)
              .eq("order_id", item.order_id)

            if (updateError) {
              console.error(`Error updating duplicate line item ${item.line_item_id}:`, updateError)
            } else {
              removedCount++
              console.log(`Successfully marked line item ${item.line_item_id} as removed: ${reason}`)
            }
          }
        }
      }
    }

    // After marking items as removed, resequence the edition numbers
    if (removedCount > 0) {
      console.log(`Resequencing edition numbers after removing ${removedCount} items`)
      await resequenceEditionNumbers(productId)
    }

    console.log(`Cleanup completed. Removed ${removedCount} duplicate line items`)
    return { success: true, removedCount }
  } catch (error) {
    console.error("Error in cleanupDuplicateLineItems:", error)
    return { success: false, removedCount, error: error.message }
  }
}

// Add the resequenceEditionNumbers function to the sync-all-products route
async function resequenceEditionNumbers(productId: string) {
  try {
    console.log(`Resequencing edition numbers for product ${productId}`)

    // Get all active line items for this product, ordered by creation date
    // IMPORTANT: Only select items with status="active" to exclude removed items
    const { data: activeItems, error } = await supabase
      .from("order_line_items")
      .select("*")
      .eq("product_id", productId)
      .eq("status", "active") // Explicitly filter for active items only
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching active items for resequencing:", error)
      return
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
  }
}

// Update the updateDatabaseWithEditionNumbers function to use the resequencing approach
async function updateDatabaseWithEditionNumbers(editionAssignments, forceSync) {
  let lineItemsProcessed = 0
  let activeItems = 0
  let removedItems = 0

  console.log(`Starting database update with ${editionAssignments.length} edition assignments, forceSync=${forceSync}`)
  console.log(`Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set"}`)
  console.log(`Supabase Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Not set"}`)

  // Process each assignment to update or insert records
  for (const assignment of editionAssignments) {
    try {
      console.log(`Processing assignment for order ${assignment.order_id}, line item ${assignment.line_item_id}`)

      // Check if this line item already has an edition number
      console.log(`Checking if line item already exists in database`)
      const { data: existingItems, error: queryError } = await supabase
        .from("order_line_items")
        .select("*")
        .eq("order_id", assignment.order_id)
        .eq("line_item_id", assignment.line_item_id)

      if (queryError) {
        console.error(`Error checking existing line item in database:`, queryError)
        continue
      }

      console.log(`Database query result: ${existingItems ? existingItems.length : 0} existing items found`)

      // Generate certificate URL and token
      const baseUrl = process.env.NEXT_PUBLIC_CUSTOMER_APP_URL || process.env.NEXT_PUBLIC_APP_URL || ""
      const certificateUrl = `${baseUrl}/certificate/${assignment.line_item_id}`
      const certificateToken = crypto.randomUUID()
      const now = new Date().toISOString()

      // Extract vendor_name from assignment or existing item
      const vendorName =
        assignment.vendor_name || (existingItems && existingItems.length > 0 ? existingItems[0].vendor_name : null)

      if (existingItems && existingItems.length > 0) {
        console.log(`Line item exists in database with status ${existingItems[0].status}`)

        // Line item exists, update it if forceSync is true
        if (forceSync) {
          console.log(`ForceSync is true, updating existing line item`)

          const updateData: any = {
            updated_at: now,
          }

          // Preserve vendor_name if it exists
          if (vendorName) {
            updateData.vendor_name = vendorName
          }

          // Only set edition_number for active items
          if (existingItems[0].status !== "removed") {
            // We'll assign edition numbers during resequencing
            console.log(`Item is active, will be resequenced later`)

            // Add certificate URL if it doesn't exist
            if (!existingItems[0].certificate_url) {
              updateData.certificate_url = certificateUrl
              updateData.certificate_token = certificateToken
              updateData.certificate_generated_at = now
            }
          } else {
            // For removed items, ensure edition_number is null
            updateData.edition_number = null
            console.log(`Item is removed, setting edition_number to null`)
          }

          const { error: updateError } = await supabase
            .from("order_line_items")
            .update(updateData)
            .eq("order_id", assignment.order_id)
            .eq("line_item_id", assignment.line_item_id)

          if (updateError) {
            console.error(`Error updating line item in database:`, updateError)
            continue
          }

          console.log(`Successfully updated line item in database`)
        } else {
          console.log(`ForceSync is false, skipping update for existing line item`)
        }

        // Count active/removed items
        if (existingItems[0].status === "removed") {
          console.log(`Line item is marked as removed in database`)
          removedItems++
        } else {
          console.log(`Line item is active in database`)
          activeItems++
        }
      } else {
        // Line item doesn't exist, insert it
        console.log(`Line item doesn't exist in database, inserting new record`)

        const { error: insertError } = await supabase.from("order_line_items").insert({
          order_id: assignment.order_id,
          order_name: assignment.order_name,
          line_item_id: assignment.line_item_id,
          product_id: assignment.product_id,
          variant_id: assignment.variant_id,
          vendor_name: vendorName, // Include vendor_name in insert
          // Don't set edition_number here, we'll do it during resequencing
          edition_number: null,
          created_at: assignment.created_at,
          updated_at: now,
          status: "active", // New items are active by default
          certificate_url: certificateUrl,
          certificate_token: certificateToken,
          certificate_generated_at: now,
        })

        if (insertError) {
          console.error(`Error inserting line item into database:`, insertError)
          continue
        }

        console.log(`Successfully inserted new line item into database with vendor ${vendorName || "Unknown"}`)
        activeItems++
      }

      lineItemsProcessed++
      console.log(`Processed ${lineItemsProcessed}/${editionAssignments.length} assignments`)
    } catch (error: any) {
      console.error(`Error processing assignment:`, error)
      console.error(error.stack)
      continue
    }
  }

  // After processing all assignments, resequence the edition numbers
  if (editionAssignments.length > 0) {
    const productId = editionAssignments[0].product_id
    console.log(`Resequencing edition numbers for product ${productId}`)
    await resequenceEditionNumbers(productId)
  }

  console.log(
    `Database update complete. Processed ${lineItemsProcessed} line items (${activeItems} active, ${removedItems} removed)`,
  )
  return {
    lineItemsProcessed,
    activeItems,
    removedItems,
  }
}

// Function to record sync operation in the database
async function recordSyncOperation(totalProducts, successfulProducts, syncResults) {
  try {
    const { error } = await supabase.from("sync_results").insert({
      total_products: totalProducts,
      successful_products: successfulProducts,
      sync_results: syncResults,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error recording sync operation:", error)
    }
  } catch (error: any) {
    console.error("Error recording sync operation:", error)
  }
}
