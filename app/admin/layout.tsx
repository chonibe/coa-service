import type { ReactNode } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AdminShell } from "./admin-shell"
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"
import { isAdminEmail } from "@/lib/vendor-auth"
import { getUnifiedSession, isUnifiedAuthEnabled, sessionHasRole } from "@/lib/auth/unified-session"

// Create a separate layout for the login page that doesn't require auth
// The (auth) route group allows us to have a different layout if needed
// For now, we'll check in the main layout

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // ── Unified Auth Path (feature-flagged) ──
  if (isUnifiedAuthEnabled()) {
    const session = await getUnifiedSession()

    if (!session || !sessionHasRole(session, 'admin')) {
      console.log('[admin/layout] Unified auth: no admin role, redirecting')
      redirect("/login?admin=true")
    }

    return <AdminShell>{children}</AdminShell>
  }

  // ── Legacy Auth Path ──
  const cookieStore = cookies()
  const adminSessionToken = (cookieStore as any).get(ADMIN_SESSION_COOKIE_NAME)?.value
  const payload = verifyAdminSessionToken(adminSessionToken)

  // If no admin session, redirect to admin login page
  if (!payload?.email || !isAdminEmail(payload.email)) {
    redirect("/login?admin=true")
  }

  return <AdminShell>{children}</AdminShell>
}
