import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    // Check for admin authentication
    // This would normally check for admin authentication, but we're skipping it for brevity

    // First, get all vendors with their PayPal emails and tax info
    const { data: vendors, error: vendorsError } = await supabaseAdmin
      .from("vendors")
      .select("vendor_name, paypal_email, tax_id, tax_country, is_company")

    if (vendorsError) {
      console.error("Error fetching vendors:", vendorsError)
      return NextResponse.json({ error: vendorsError.message }, { status: 500 })
    }

    // Create a map of vendor names to their details
    const vendorMap = new Map()
    vendors.forEach((vendor) => {
      vendorMap.set(vendor.vendor_name, {
        paypal_email: vendor.paypal_email,
        tax_id: vendor.tax_id,
        tax_country: vendor.tax_country,
        is_company: vendor.is_company,
      })
    })

    // Get the latest payout date for each vendor
    const { data: lastPayouts, error: lastPayoutsError } = await supabaseAdmin
      .from("vendor_payouts")
      .select("vendor_name, payout_date")
      .eq("status", "completed")
      .order("payout_date", { ascending: false })

    if (lastPayoutsError) {
      console.error("Error fetching last payouts:", lastPayoutsError)
      return NextResponse.json({ error: lastPayoutsError.message }, { status: 500 })
    }

    // Create a map of vendor names to their last payout date
    const lastPayoutMap = new Map()
    lastPayouts.forEach((payout) => {
      if (!lastPayoutMap.has(payout.vendor_name)) {
        lastPayoutMap.set(payout.vendor_name, payout.payout_date)
      }
    })

    // Calculate pending payouts for each vendor
    const pendingPayouts = []

    // Get all line items with vendor names
    const { data: lineItems, error: lineItemsError } = await supabaseAdmin
      .from("order_line_items")
      .select("vendor_name, product_id, price")
      .not("vendor_name", "is", null)
      .eq("status", "active")

    if (lineItemsError) {
      console.error("Error fetching line items:", lineItemsError)
      return NextResponse.json({ error: lineItemsError.message }, { status: 500 })
    }

    // Get all payout settings
    const { data: payoutSettings, error: payoutSettingsError } = await supabaseAdmin
      .from("product_vendor_payouts")
      .select("product_id, vendor_name, payout_amount, is_percentage")

    if (payoutSettingsError) {
      console.error("Error fetching payout settings:", payoutSettingsError)
      return NextResponse.json({ error: payoutSettingsError.message }, { status: 500 })
    }

    // Create a map of product_id+vendor_name to payout settings
    const payoutSettingsMap = new Map()
    payoutSettings.forEach((setting) => {
      const key = `${setting.product_id}:${setting.vendor_name}`
      payoutSettingsMap.set(key, {
        amount: setting.payout_amount,
        isPercentage: setting.is_percentage,
      })
    })

    // Group line items by vendor and calculate pending amounts
    const vendorPayouts = new Map()

    lineItems.forEach((item) => {
      if (!item.vendor_name) return

      if (!vendorPayouts.has(item.vendor_name)) {
        vendorPayouts.set(item.vendor_name, {
          amount: 0,
          productCount: 0,
        })
      }

      const vendorPayout = vendorPayouts.get(item.vendor_name)
      vendorPayout.productCount++

      // Calculate payout amount based on settings
      const key = `${item.product_id}:${item.vendor_name}`
      const payoutSetting = payoutSettingsMap.get(key)

      if (payoutSetting) {
        const price = typeof item.price === "string" ? Number.parseFloat(item.price) : item.price || 0

        if (payoutSetting.isPercentage) {
          vendorPayout.amount += (price * payoutSetting.amount) / 100
        } else {
          vendorPayout.amount += payoutSetting.amount
        }
      } else {
        // Default payout if no specific setting found (10%)
        const price = typeof item.price === "string" ? Number.parseFloat(item.price) : item.price || 0
        vendorPayout.amount += price * 0.1 // 10% default
      }
    })

    // Format the pending payouts
    for (const [vendorName, payout] of vendorPayouts.entries()) {
      if (payout.amount > 0) {
        const vendorDetails = vendorMap.get(vendorName) || {}

        pendingPayouts.push({
          vendor_name: vendorName,
          amount: Number(payout.amount.toFixed(2)),
          product_count: payout.productCount,
          paypal_email: vendorDetails.paypal_email,
          tax_id: vendorDetails.tax_id,
          tax_country: vendorDetails.tax_country,
          is_company: vendorDetails.is_company || false,
          last_payout_date: lastPayoutMap.get(vendorName) || null,
        })
      }
    }

    // Sort by amount (highest first)
    pendingPayouts.sort((a, b) => b.amount - a.amount)

    return NextResponse.json({ payouts: pendingPayouts })
  } catch (error: any) {
    console.error("Error in pending payouts API:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
