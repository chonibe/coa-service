import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()
    const vendorName = 'Carsten Gueth'
    
    // 1. Check vendor info
    const { data: vendor } = await supabase
      .from("vendors")
      .select("id, auth_id, vendor_name")
      .eq("vendor_name", vendorName)
      .single()

    // 2. Check line items
    const { data: lineItems } = await supabase
      .from("order_line_items_v2")
      .select("id, line_item_id, order_id, order_name, price, fulfillment_status, created_at, metadata")
      .eq("vendor_name", vendorName)
      .order("created_at", { ascending: false })

    return NextResponse.json({
      vendor,
      lineItemsCount: lineItems?.length || 0,
      orderNames: Array.from(new Set(lineItems?.map(i => i.order_name))),
      sampleLineItems: lineItems?.slice(0, 31)
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
