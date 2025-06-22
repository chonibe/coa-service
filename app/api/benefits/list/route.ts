import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient, safeSupabaseCall } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const productId = searchParams.get("product_id")
  const vendorName = searchParams.get("vendor_name")

  if (!productId && !vendorName) {
    return NextResponse.json({ error: "Either product_id or vendor_name is required" }, { status: 400 })
  }

  const { data, error } = await safeSupabaseCall(async (supabase) => {
    let query = supabase.from("product_benefits").select(`
      *,
      benefit_types (name, icon)
    `)

    if (productId) {
      query = query.eq("product_id", productId)
    }

    if (vendorName) {
      query = query.eq("vendor_name", vendorName)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) throw error

    return data
  })

  if (error) {
    console.error("Error fetching benefits:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }

  return NextResponse.json({ benefits: data || [] })
}
