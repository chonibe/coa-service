import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore } from "@/lib/vendor-session"

export async function GET() {
  const supabase = createClient()
  
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    const { data: vendor, error } = await supabase
      .from("vendors")
      .select("*")
      .eq("vendor_name", vendorName)
      .single()

    if (error || !vendor) {
      console.error("Vendor not found:", vendorName)
      return NextResponse.json({ message: "Vendor not found" }, { status: 404 })
    }

    return NextResponse.json({ vendor })
  } catch (error: any) {
    console.error("Error in vendor profile API:", error)
    return NextResponse.json({ message: error.message || "An error occurred" }, { status: 500 })
  }
}
