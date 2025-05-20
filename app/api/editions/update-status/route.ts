import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { updateLineItemStatus } from "@/lib/update-line-item-status"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lineItemId, orderId, status } = body

    if (!lineItemId || !orderId || !status) {
      return NextResponse.json(
        { success: false, message: "Line item ID, order ID, and status are required" },
        { status: 400 },
      )
    }

    // Validate status
    if (status !== "active" && status !== "inactive") {
      return NextResponse.json(
        { success: false, message: "Status must be either 'active' or 'inactive'" },
        { status: 400 },
      )
    }

    // Update the line item status
    const result = await updateLineItemStatus(lineItemId, orderId, status)

    return NextResponse.json({
      success: true,
      message: `Line item status updated to ${status}`,
      updatedAt: result.updatedAt,
    })
  } catch (error: any) {
    console.error("Error updating line item status:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update line item status" },
      { status: 500 },
    )
  }
} 