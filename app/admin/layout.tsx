import type { ReactNode } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AdminShell } from "./admin-shell"
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"
import { isAdminEmail } from "@/lib/vendor-auth"

export default function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = cookies()
  const adminSessionToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value
  const payload = verifyAdminSessionToken(adminSessionToken)

  if (!payload?.email || !isAdminEmail(payload.email)) {
    redirect("/login")
  }

  return <AdminShell>{children}</AdminShell>
}
