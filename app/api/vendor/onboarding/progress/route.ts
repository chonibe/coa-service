import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore } from "@/lib/vendor-session"

export async function GET() {
  const cookieStore = cookies()
  const vendorName = getVendorFromCookieStore(cookieStore)

  if (!vendorName) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const supabase = createClient()

    const { data: vendor, error } = await supabase
      .from("vendors")
      .select("onboarding_step, onboarding_data, onboarding_started_at")
      .eq("vendor_name", vendorName)
      .single()

    if (error) {
      console.error("Error fetching onboarding progress:", error)
      return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 })
    }

    return NextResponse.json({
      step: vendor?.onboarding_step || 0,
      formData: vendor?.onboarding_data || null,
      startedAt: vendor?.onboarding_started_at || null,
    })
  } catch (error) {
    console.error("Error in progress route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

