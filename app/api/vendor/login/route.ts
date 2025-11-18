import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { buildVendorSessionCookie } from "@/lib/vendor-session"

export async function POST(request: NextRequest) {
  const supabase = createClient()
  
  try {
    const body = await request.json()
    const { vendorName } = body

    if (!vendorName) {
      return NextResponse.json({ message: "Vendor name is required" }, { status: 400 })
    }

    // Check if the vendor exists
    const { data: vendor, error } = await supabase
      .from("vendors")
      .select("*")
      .eq("vendor_name", vendorName)
      .single()

    if (error || !vendor) {
      console.error("Vendor not found:", vendorName)
      return NextResponse.json({ message: "Vendor not found" }, { status: 401 })
    }

    // Update last login timestamp
    await supabase.from("vendors").update({ last_login: new Date().toISOString() }).eq("vendor_name", vendorName)

    // Set a signed cookie to maintain the vendor session
    const cookieStore = cookies()
    const sessionCookie = buildVendorSessionCookie(vendor.vendor_name)
    cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.options)

    return NextResponse.json({ success: true, vendor: { name: vendor.vendor_name } })
  } catch (error: any) {
    console.error("Error in vendor login:", error)
    return NextResponse.json({ message: error.message || "An error occurred" }, { status: 500 })
  }
}
