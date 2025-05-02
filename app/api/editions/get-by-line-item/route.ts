import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get("order_id")
  const lineItemId = searchParams.get("line_item_id")

  if (!orderId || !lineItemId) {
    return NextResponse.json({ success: false, message: "Order ID and Line Item ID are required" }, { status: 400 })
  }

  try {
    console.log(`Fetching edition info for order ${orderId}, line item ${lineItemId}`)

    // First, check for the exact line item
    const { data: exactMatch, error: exactError } = await supabase
      .from("order_line_items")
      .select("*")
      .eq("order_id", orderId)
      .eq("line_item_id", lineItemId)
      .limit(1)

    if (exactError) {
      console.error("Error fetching exact line item:", exactError)
      throw new Error("Failed to fetch edition information")
    }

    // If we found an exact match and it's not removed, return it
    if (exactMatch && exactMatch.length > 0 && exactMatch[0].status !== "removed") {
      console.log(`Found exact match for line item ${lineItemId} with status ${exactMatch[0].status}`)
      return NextResponse.json({
        success: true,
        editionNumber: exactMatch[0].edition_number,
        editionTotal: exactMatch[0].edition_total,
        status: exactMatch[0].status,
        updatedAt: exactMatch[0].updated_at,
        removedReason: exactMatch[0].removed_reason,
      })
    }

    // If the exact match is removed or not found, look for related line items
    console.log(`No valid exact match found, checking for related line items in order ${orderId}`)

    // Get the created_at timestamp from the exact match if available
    const createdAt = exactMatch && exactMatch.length > 0 ? exactMatch[0].created_at : null

    // Query to find related line items
    let query = supabase
      .from("order_line_items")
      .select("*")
      .eq("order_id", orderId)
      .neq("status", "removed")
      .order("line_item_id", { ascending: false }) // Higher line item IDs first

    // If we have a timestamp, use it to find items created at the same time
    if (createdAt) {
      // Parse the timestamp and create a range (within the same minute)
      const timestamp = new Date(createdAt)
      const startTime = new Date(timestamp)
      startTime.setMinutes(timestamp.getMinutes() - 1)

      const endTime = new Date(timestamp)
      endTime.setMinutes(timestamp.getMinutes() + 1)

      query = query.gte("created_at", startTime.toISOString()).lte("created_at", endTime.toISOString())
    }

    const { data: orderItems, error: orderError } = await query

    if (orderError) {
      console.error("Error fetching related line items:", orderError)
      throw new Error("Failed to fetch related line items")
    }

    if (orderItems && orderItems.length > 0) {
      console.log(`Found ${orderItems.length} related line items in order ${orderId}`)

      // Find the highest line item ID that has a valid edition number
      const validItem = orderItems.find((item) => item.edition_number && item.status !== "removed")

      if (validItem) {
        console.log(`Found related line item ${validItem.line_item_id} with edition number ${validItem.edition_number}`)
        return NextResponse.json({
          success: true,
          editionNumber: validItem.edition_number,
          editionTotal: validItem.edition_total,
          status: validItem.status,
          updatedAt: validItem.updated_at,
          removedReason: validItem.removed_reason,
          note: "Edition from related line item in same order",
        })
      }
    }

    // If the exact match is removed, return it with a note
    if (exactMatch && exactMatch.length > 0 && exactMatch[0].status === "removed") {
      console.log(`Returning removed line item ${lineItemId} with a note`)
      return NextResponse.json({
        success: true,
        editionNumber: exactMatch[0].edition_number,
        editionTotal: exactMatch[0].edition_total,
        status: "removed",
        updatedAt: exactMatch[0].updated_at,
        removedReason: exactMatch[0].removed_reason,
        note: "This item has been marked as removed. The edition number may be assigned to another line item.",
      })
    }

    // If we still haven't found anything, return not found
    console.log(`No edition information found for line item ${lineItemId}`)
    return NextResponse.json({ success: false, message: "Edition information not found" }, { status: 404 })
  } catch (error: any) {
    console.error("Error fetching edition info:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch edition information" },
      { status: 500 },
    )
  }
}
