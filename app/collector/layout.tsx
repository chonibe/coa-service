import type { ReactNode } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getCollectorSession } from "@/lib/collector-session"
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"
import { handleAuthError, isAuthError } from "@/lib/auth-error-handler"

export const dynamic = 'force-dynamic'

interface CollectorLayoutProps {
  children: ReactNode
}

export default async function CollectorLayout({ children }: CollectorLayoutProps) {
  try {
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
  } catch (error: any) {
    // Check if it's an auth error
    if (isAuthError(error)) {
      console.error('[collector/layout] Authentication error caught:', error)
      handleAuthError(error, { redirectTo: '/login' })
    }
    
    // Check if it's a redirect (expected behavior)
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error
    }
    
    // For any other error, log and redirect to login with error message
    console.error('[collector/layout] Unexpected error:', error)
    const errorMessage = encodeURIComponent('An error occurred. Please log in again.')
    redirect(`/login?error=${errorMessage}`)
  }
}
