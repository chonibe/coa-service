import type { ReactNode } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getCollectorSession } from "@/lib/collector-session"
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"

interface CollectorLayoutProps {
  children: ReactNode
}

export default async function CollectorLayout({ children }: CollectorLayoutProps) {
  const cookieStore = cookies()
  
  const collectorSession = getCollectorSession(cookieStore)
  const adminSession = verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value)
  
  // Allow access if:
  // 1. Valid collector session, OR
  // 2. Admin session (admin can always access collector view)
  if (!collectorSession?.email && !adminSession?.email) {
    redirect("/login?redirect=/collector/dashboard")
  }
  
  return <>{children}</>
}
