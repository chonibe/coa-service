import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore } from "@/lib/vendor-session"

export async function POST() {
  const supabase = createClient()
  
  try {
    // Get the vendor name from the cookie
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    // Get the PayPal email from the request body
    const body = await request.json()
    const { paypalEmail } = body

    if (!paypalEmail) {
      return NextResponse.json({ message: "PayPal email is required" }, { status: 400 })
    }

    // Update the vendor's PayPal email
    const { error } = await supabase
      .from("vendors")
      .update({ paypal_email: paypalEmail })
      .eq("vendor_name", vendorName)

    if (error) {
      console.error("Error updating PayPal email:", error)
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in update PayPal API:", error)
    return NextResponse.json({ message: error.message || "An error occurred" }, { status: 500 })
  }
}
