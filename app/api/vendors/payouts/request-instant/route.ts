import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { calculateVendorBalance } from "@/lib/vendor-balance-calculator"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const sessionVendorName = getVendorFromCookieStore(cookieStore)

  // Check if this is a vendor request
  if (!sessionVendorName) {
    // Admin request
    const auth = guardAdminRequest(request)
    if (auth.kind !== "ok") {
      return auth.response
    }
  }

  const supabase = createClient()

  try {
    const body = await request.json()
    const { vendor_name, amount, payment_method } = body

    // Use session vendor name if available, otherwise use provided vendor_name (admin)
    const vendorName = sessionVendorName || vendor_name

    if (!vendorName) {
      return NextResponse.json({ error: "Vendor name is required" }, { status: 400 })
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 })
    }

    if (!payment_method) {
      return NextResponse.json({ error: "Payment method is required" }, { status: 400 })
    }

    // Get vendor's payout schedule to check instant payout settings
    const { data: schedule, error: scheduleError } = await supabase
      .from("payout_schedules")
      .select("instant_payouts_enabled, instant_payout_fee_percent, minimum_amount")
      .eq("vendor_name", vendorName)
      .single()

    if (scheduleError && scheduleError.code !== "PGRST116") {
      // PGRST116 is "not found" which is OK
      console.error("Error fetching payout schedule:", scheduleError)
    }

    // Check if instant payouts are enabled
    if (!schedule?.instant_payouts_enabled) {
      return NextResponse.json(
        { error: "Instant payouts are not enabled for this vendor" },
        { status: 400 }
      )
    }

    // Check minimum amount threshold
    const minimumAmount = schedule?.minimum_amount || 10
    if (amount < minimumAmount) {
      return NextResponse.json(
        { error: `Minimum instant payout amount is $${minimumAmount.toFixed(2)}` },
        { status: 400 }
      )
    }

    // Calculate current balance
    const balance = await calculateVendorBalance(vendorName, supabase)

    // Check if vendor has sufficient balance
    if (balance.available_balance < amount) {
      return NextResponse.json(
        {
          error: "Insufficient balance",
          available_balance: balance.available_balance,
          requested_amount: amount,
        },
        { status: 400 }
      )
    }

    // Calculate instant payout fee
    const feePercent = schedule?.instant_payout_fee_percent || 0
    const feeAmount = (amount * feePercent) / 100
    const totalAmount = amount + feeAmount

    // Check if total amount (including fee) exceeds balance
    if (balance.available_balance < totalAmount) {
      return NextResponse.json(
        {
          error: "Insufficient balance to cover payout and fee",
          available_balance: balance.available_balance,
          requested_amount: amount,
          fee_amount: feeAmount,
          total_amount: totalAmount,
        },
        { status: 400 }
      )
    }

    // Create instant payout request
    const { data: requestData, error: requestError } = await supabase
      .from("instant_payout_requests")
      .insert({
        vendor_name: vendorName,
        amount,
        fee_amount: feeAmount,
        status: sessionVendorName ? "pending" : "approved", // Auto-approve if admin
        payment_method,
        requested_at: new Date().toISOString(),
        processed_at: sessionVendorName ? null : new Date().toISOString(),
      })
      .select()
      .single()

    if (requestError) {
      console.error("Error creating instant payout request:", requestError)
      return NextResponse.json({ error: "Failed to create instant payout request" }, { status: 500 })
    }

    // If admin and auto-approved, process immediately
    if (!sessionVendorName && requestData) {
      // Process the payout immediately
      const reference = `INSTANT-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`

      const { data: payoutData, error: payoutError } = await supabase
        .from("vendor_payouts")
        .insert({
          vendor_name: vendorName,
          amount,
          status: "processing",
          reference,
          payment_method,
          currency: "USD",
          notes: `Instant payout - Fee: $${feeAmount.toFixed(2)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (payoutError) {
        console.error("Error creating payout:", payoutError)
        // Update request status to rejected
        await supabase
          .from("instant_payout_requests")
          .update({ status: "rejected", rejection_reason: "Failed to create payout" })
          .eq("id", requestData.id)

        return NextResponse.json({ error: "Failed to process instant payout" }, { status: 500 })
      }

      // Update request with payout ID
      await supabase
        .from("instant_payout_requests")
        .update({ payout_id: payoutData.id, status: "processed" })
        .eq("id", requestData.id)

      return NextResponse.json({
        success: true,
        request_id: requestData.id,
        payout_id: payoutData.id,
        amount,
        fee_amount: feeAmount,
        total_amount: totalAmount,
        reference,
      })
    }

    return NextResponse.json({
      success: true,
      request_id: requestData.id,
      amount,
      fee_amount: feeAmount,
      total_amount: totalAmount,
      status: "pending",
      message: "Instant payout request created. Waiting for admin approval.",
    })
  } catch (error: any) {
    console.error("Error in instant payout request:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}






