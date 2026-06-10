import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE_NAME } from "@/lib/admin-session"
import { isAdminEmail } from "@/lib/vendor-auth"
import { getUnifiedSession, isUnifiedAuthEnabled, sessionHasRole } from "@/lib/auth/unified-session"

async function requireAdminApi(): Promise<{ ok: true; email: string } | { ok: false; status: number }> {
  if (isUnifiedAuthEnabled()) {
    const session = await getUnifiedSession()
    if (session && sessionHasRole(session, "admin")) {
      return { ok: true, email: session.email }
    }
    return { ok: false, status: 401 }
  }

  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value
  const payload = verifyAdminSessionToken(token)
  if (payload?.email && isAdminEmail(payload.email)) {
    return { ok: true, email: payload.email }
  }
  return { ok: false, status: 401 }
}

/**
 * GET /api/admin/artist-applications
 * List public artist applications (shop + /for-artists/apply) for admin triage.
 */
export async function GET() {
  const auth = await requireAdminApi()
  if (!auth.ok) {
    return NextResponse.json({ error: "Admin authentication required" }, { status: auth.status })
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from("artist_applications")
    .select(
      "id, created_at, updated_at, email, name, instagram, portfolio_url, bio, status, notes, reviewed_at",
    )
    .order("created_at", { ascending: false })
    .limit(300)

  if (error) {
    console.error("[admin/artist-applications] list error", error)
    return NextResponse.json({ error: "Failed to load applications" }, { status: 500 })
  }

  return NextResponse.json({ applications: data ?? [] })
}
