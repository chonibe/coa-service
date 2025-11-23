import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore } from "@/lib/vendor-session"

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const vendorName = getVendorFromCookieStore(cookieStore)

  if (!vendorName) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const supabase = createClient()

    // Mark onboarding as complete and clear saved data
    const { error } = await supabase
      .from("vendors")
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        onboarding_data: null,
        onboarding_step: null,
      })
      .eq("vendor_name", vendorName)

    if (error) {
      console.error("Error completing onboarding:", error)
      return NextResponse.json({ error: "Failed to complete onboarding" }, { status: 500 })
    }

    return NextResponse.json({ success: true, completed: true })
  } catch (error) {
    console.error("Error in complete route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

