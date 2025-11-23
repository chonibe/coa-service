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
    const body = await request.json()
    const { formData, currentStep } = body

    if (!formData || typeof currentStep !== "number") {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    const supabase = createClient()

    // Update vendor with auto-saved data
    const { error } = await supabase
      .from("vendors")
      .update({
        onboarding_data: formData,
        onboarding_step: currentStep,
        onboarding_started_at: new Date().toISOString(),
      })
      .eq("vendor_name", vendorName)

    if (error) {
      console.error("Error auto-saving onboarding data:", error)
      return NextResponse.json({ error: "Failed to save progress" }, { status: 500 })
    }

    return NextResponse.json({ success: true, saved: true })
  } catch (error) {
    console.error("Error in auto-save route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

