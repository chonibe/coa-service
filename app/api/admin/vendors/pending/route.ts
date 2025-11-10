import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { createClient as createServiceRoleClient } from "@/lib/supabase/server"
import { isAdminEmail, SIGNUP_STATUS_COMPLETED } from "@/lib/vendor-auth"

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createRouteClient(cookieStore)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const serviceClient = createServiceRoleClient()

  const { data, error } = await serviceClient
    .from("vendors")
    .select(
      "id,vendor_name,signup_status,auth_id,auth_pending_email,contact_email,invite_code,updated_at,onboarding_completed",
    )
    .neq("signup_status", SIGNUP_STATUS_COMPLETED)
    .order("updated_at", { ascending: false })

  if (error) {
    console.error("Failed to load pending vendors:", error)
    return NextResponse.json({ error: "Failed to load pending vendors" }, { status: 500 })
  }

  return NextResponse.json({ vendors: data ?? [] })
}

