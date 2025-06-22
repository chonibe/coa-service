import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, params } = body

    // Get the admin Supabase client
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client not available" }, { status: 500 })
    }

    // Handle different actions
    switch (action) {
      case "getEditionInfo":
        return await getEditionInfo(supabaseAdmin, params)
      case "updateLineItemStatus":
        return await updateLineItemStatus(supabaseAdmin, params)
      case "resequenceEditionNumbers":
        return await resequenceEditionNumbers(supabaseAdmin, params)
      case "fetchOrderLineItems":
        return await fetchOrderLineItems(supabaseAdmin, params)
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error: any) {
    console.error("Error in Supabase proxy:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Get edition info for a line item
async function getEditionInfo(supabaseAdmin: any, params: any) {
  const { orderId, lineItemId } = params

  if (!orderId || !lineItemId) {
    return NextResponse.json({ error: "Order ID and Line Item ID are required" }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from("order_line_items")
    .select("*")
    .eq("order_id", orderId)
    .eq("line_item_id", lineItemId)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}

// Update line item status
async function updateLineItemStatus(supabaseAdmin: any, params: any) {
  const { lineItemId, orderId, status, reason } = params

  if (!lineItemId || !orderId || !status) {
    return NextResponse.json({ error: "Line item ID, order ID, and status are required" }, { status: 400 })
  }

  // Validate status
  if (status !== "active" && status !== "inactive") {
    return NextResponse.json({ error: "Status must be either 'active' or 'inactive'" }, { status: 400 })
  }

  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  }

  // Add reason if provided
  if (reason) {
    updateData.removed_reason = reason
  }

  // If marking as inactive, set edition_number to null
  if (status === "inactive") {
    updateData.edition_number = null
  }

  // Update the line item
  const { error, data } = await supabaseAdmin
    .from("order_line_items")
    .update(updateData)
    .eq("line_item_id", lineItemId)
    .eq("order_id", orderId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If we're marking an item as inactive, resequence the edition numbers
  if (status === "inactive") {
    // Get the product ID for this line item
    const { data: lineItemData, error: lineItemError } = await supabaseAdmin
      .from("order_line_items")
      .select("product_id")
      .eq("line_item_id", lineItemId)
      .eq("order_id", orderId)
      .single()

    if (!lineItemError && lineItemData && lineItemData.product_id) {
      // Resequence edition numbers for this product
      await resequenceEditionNumbers(supabaseAdmin, { productId: lineItemData.product_id })
    }
  }

  return NextResponse.json({ success: true, updatedAt: new Date().toISOString() })
}

// Resequence edition numbers for a product
async function resequenceEditionNumbers(supabaseAdmin: any, params: any) {
  const { productId } = params

  if (!productId) {
    return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
  }

  // Get all active line items for this product, ordered by creation date
  const { data: activeItems, error } = await supabaseAdmin
    .from("order_line_items")
    .select("*")
    .eq("product_id", productId)
    .eq("status", "active")
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!activeItems || activeItems.length === 0) {
    return NextResponse.json({
      success: true,
      message: "No active items found for resequencing",
      activeItems: 0,
      removedItems: 0,
    })
  }

  // Assign new sequential edition numbers starting from 1
  let editionCounter = 1
  let updatedCount = 0

  for (const item of activeItems) {
    const { error: updateError } = await supabaseAdmin
      .from("order_line_items")
      .update({
        edition_number: editionCounter,
        updated_at: new Date().toISOString(),
      })
      .eq("line_item_id", item.line_item_id)
      .eq("order_id", item.order_id)

    if (!updateError) {
      updatedCount++
      editionCounter++
    }
  }

  // Get count of removed items
  const { count: removedCount } = await supabaseAdmin
    .from("order_line_items")
    .select("*", { count: "exact" })
    .eq("product_id", productId)
    .eq("status", "removed")

  return NextResponse.json({
    success: true,
    message: `Resequencing complete. Assigned edition numbers 1 through ${editionCounter - 1}`,
    activeItems: activeItems.length,
    updatedCount,
    removedItems: removedCount || 0,
  })
}

// Fetch order line items
async function fetchOrderLineItems(supabaseAdmin: any, params: any) {
  const { limit = 20 } = params

  const { data, error, count } = await supabaseAdmin
    .from("order_line_items")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    data,
    pagination: {
      total: count || 0,
      limit,
    },
  })
}
