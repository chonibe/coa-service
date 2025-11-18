import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = createClient()

    // Try to use the function if it exists
    try {
      const { data, error } = await supabase.rpc("get_pending_vendor_payouts")

      if (error) {
        throw error
      }

      return NextResponse.json({ payouts: data })
    } catch (funcError) {
      console.error("Error using get_pending_vendor_payouts function:", funcError)

      // Fallback to direct query if function doesn't exist
      // Updated to filter by fulfillment_status = 'fulfilled' and use default 25% payout
      const { data, error } = await supabase
        .from("order_line_items_v2")
        .select(`
          vendor_name,
          line_item_id,
          order_id,
          product_id,
          price,
          product_vendor_payouts!left(payout_amount, is_percentage),
          vendor_payout_items!left(payout_id)
        `)
        .eq("status", "active")
        .not("vendor_name", "is", null)
        .eq("fulfillment_status", "fulfilled")
        .is("vendor_payout_items.payout_id", null)

      if (error) {
        console.error("Error in fallback query:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Process the data to calculate payouts
      const vendorMap = new Map<string, any>()
      
      data?.forEach((item: any) => {
        const vendorName = item.vendor_name
        if (!vendorMap.has(vendorName)) {
          vendorMap.set(vendorName, {
            vendor_name: vendorName,
            amount: 0,
            product_count: 0,
            line_items: [],
          })
        }
        
        const vendor = vendorMap.get(vendorName)!
        const payoutSetting = item.product_vendor_payouts?.[0]
        const payoutAmount = payoutSetting?.payout_amount ?? 25
        const isPercentage = payoutSetting?.is_percentage ?? true
        
        const itemPayout = isPercentage 
          ? (item.price * payoutAmount / 100)
          : payoutAmount
        
        vendor.amount += itemPayout
        vendor.product_count += 1
        vendor.line_items.push(item.line_item_id)
      })

      // Get vendor details and last payout date
      const vendorNames = Array.from(vendorMap.keys())
      const { data: vendors } = await supabase
        .from("vendors")
        .select("vendor_name, paypal_email, tax_id, tax_country, is_company")
        .in("vendor_name", vendorNames)

      const { data: lastPayouts } = await supabase
        .from("vendor_payouts")
        .select("vendor_name, payout_date")
        .in("vendor_name", vendorNames)
        .eq("status", "completed")
        .order("payout_date", { ascending: false })

      const payouts = Array.from(vendorMap.values()).map((vendor) => {
        const vendorInfo = vendors?.find((v: any) => v.vendor_name === vendor.vendor_name)
        const lastPayout = lastPayouts?.find((p: any) => p.vendor_name === vendor.vendor_name)
        
        return {
          vendor_name: vendor.vendor_name,
          amount: vendor.amount,
          product_count: vendor.product_count,
          paypal_email: vendorInfo?.paypal_email || null,
          tax_id: vendorInfo?.tax_id || null,
          tax_country: vendorInfo?.tax_country || null,
          is_company: vendorInfo?.is_company || false,
          last_payout_date: lastPayout?.payout_date || null,
        }
      }).sort((a, b) => b.amount - a.amount)

      return NextResponse.json({ payouts })
    }
  } catch (error: any) {
    console.error("Error in pending payouts API:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
