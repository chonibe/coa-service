import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { guardAdminRequest } from "@/lib/auth-guards"

export async function GET(request: NextRequest) {
  const guardResult = guardAdminRequest(request)
  if (guardResult.kind !== "ok") {
    return guardResult.response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Connection check failed" }, { status: 500 })
    }

    const supabase = createClient()
    const { data, error } = await supabase.from("products").select("count").limit(1)

    if (error) {
      console.error("Supabase connection error:", error)
      return NextResponse.json({ error: "Connection check failed" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Supabase connection successful",
      data,
    })
  } catch (error: any) {
    console.error("Unexpected error testing Supabase:", error)
    return NextResponse.json({ error: "Connection check failed" }, { status: 500 })
  }
}
