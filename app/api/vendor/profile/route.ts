import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getVendorOrAdminAccess } from "@/lib/vendor-session-with-admin"

export async function GET() {
  const supabase = createClient()
  
  try {
    const cookieStore = cookies()
    const access = await getVendorOrAdminAccess(cookieStore)

    if (!access.hasAccess) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    // For admin users, return a placeholder profile
    if (access.isAdmin) {
      return NextResponse.json({ 
        vendor: {
          vendor_name: "Admin User",
          status: "active",
          onboarding_completed: true,
          is_admin: true
        },
        isAdmin: true
      })
    }

    const { data: vendor, error } = await supabase
      .from("vendors")
      .select("*")
      .eq("vendor_name", access.vendorName)
      .single()

    if (error || !vendor) {
      console.error("Vendor not found:", access.vendorName)
      return NextResponse.json({ message: "Vendor not found" }, { status: 404 })
    }

    return NextResponse.json({ vendor })
  } catch (error: any) {
    console.error("Error in vendor profile API:", error)
    return NextResponse.json({ message: error.message || "An error occurred" }, { status: 500 })
  }
}
