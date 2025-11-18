import { NextRequest, NextResponse } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"
import { calculateVendorPayout, calculateOrderPayout } from "@/lib/payout-calculator"
import type { PayoutCalculationOptions } from "@/lib/payout-calculator"

export async function GET(request: NextRequest) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  try {
    const { searchParams } = request.nextUrl
    const vendorName = searchParams.get("vendorName")
    const orderId = searchParams.get("orderId")
    const includePaid = searchParams.get("includePaid") === "true"
    const fulfillmentStatus = searchParams.get("fulfillmentStatus") as "fulfilled" | "all" | null

    if (!vendorName && !orderId) {
      return NextResponse.json(
        { error: "Either vendorName or orderId must be provided" },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // If orderId provided, calculate for that specific order
    if (orderId && vendorName) {
      const orderPayout = await calculateOrderPayout(orderId, vendorName, supabase)

      if (!orderPayout) {
        return NextResponse.json(
          { error: "Order not found or has no eligible line items" },
          { status: 404 }
        )
      }

      return NextResponse.json({
        type: "order",
        orderId,
        vendorName,
        payout: orderPayout,
      })
    }

    // Otherwise calculate for vendor
    if (!vendorName) {
      return NextResponse.json(
        { error: "vendorName is required for vendor-level calculations" },
        { status: 400 }
      )
    }

    const options: PayoutCalculationOptions = {
      vendorName,
      includePaid,
      fulfillmentStatus: fulfillmentStatus || "fulfilled",
    }

    const vendorPayout = await calculateVendorPayout(vendorName, options, supabase)

    if (!vendorPayout) {
      return NextResponse.json(
        { error: "Failed to calculate vendor payout" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      type: "vendor",
      vendorName,
      payout: vendorPayout,
    })
  } catch (error: any) {
    console.error("Error in calculate payout API:", error)
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

