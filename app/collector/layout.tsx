import type { ReactNode } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getCollectorSession } from "@/lib/collector-session"
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"
import { handleAuthError, isAuthError } from "@/lib/auth-error-handler"
import { getUnifiedSession, isUnifiedAuthEnabled, sessionHasAnyRole } from "@/lib/auth/unified-session"
import { CollectorRoleSwitcherWrapper } from "./components/role-switcher-wrapper"

export const dynamic = 'force-dynamic'

interface CollectorLayoutProps {
  children: ReactNode
}

export default async function CollectorLayout({ children }: CollectorLayoutProps) {
  try {
    // ── Unified Auth Path (feature-flagged) ──
    if (isUnifiedAuthEnabled()) {
      const session = await getUnifiedSession()

      if (!session || !sessionHasAnyRole(session, ['collector', 'admin'])) {
        console.log('[collector/layout] Unified auth: no collector/admin role, redirecting')
        const redirectTo = process.env.NEXT_PUBLIC_APP_SHELL_ENABLED !== 'false' ? '/collector/home' : '/collector/dashboard'
        redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`)
      }

      return (
        <>
          <CollectorRoleSwitcherWrapper />
          {children}
        </>
      )
    }

    // ── Legacy Auth Path ──
    const cookieStore = cookies()
    
    const collectorSession = getCollectorSession(cookieStore)
    const adminSession = verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value)
    
    // Allow access if:
    // 1. Valid collector session, OR
    // 2. Admin session (admin can always access collector view)
    if (!collectorSession?.email && !adminSession?.email) {
      const redirectTo = process.env.NEXT_PUBLIC_APP_SHELL_ENABLED !== 'false' ? '/collector/home' : '/collector/dashboard'
      redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`)
    }
    
    return (
      <>
        <CollectorRoleSwitcherWrapper />
        {children}
      </>
    )
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
