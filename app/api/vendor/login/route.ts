import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
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

    // Set a cookie to maintain the vendor session
    const cookieStore = cookies()
    cookieStore.set("vendor_session", vendorName, {
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    })

    return NextResponse.json({ success: true, vendor: { name: vendor.vendor_name } })
  } catch (error: any) {
    console.error("Error in vendor login:", error)
    return NextResponse.json({ message: error.message || "An error occurred" }, { status: 500 })
  }
}
