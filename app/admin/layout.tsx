import type { ReactNode } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AdminShell } from "./admin-shell"
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"
import { isAdminEmail } from "@/lib/vendor-auth"

// Create a separate layout for the login page that doesn't require auth
// The (auth) route group allows us to have a different layout if needed
// For now, we'll check in the main layout

export default function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = cookies()
  const adminSessionToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value
  const payload = verifyAdminSessionToken(adminSessionToken)

  // Check if this is the login page by checking if children is the login component
  // Since we can't easily get pathname in layout, we'll allow unauthenticated access
  // and let the login page handle its own redirect logic
  // The login page is a client component that checks auth status itself
  
  // If no admin session, redirect to admin login page
  if (!payload?.email || !isAdminEmail(payload.email)) {
    redirect("/login?admin=true")
  }

  return <AdminShell>{children}</AdminShell>
}
