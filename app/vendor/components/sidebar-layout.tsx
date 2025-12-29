"use client"
import type { ReactNode } from "react"
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"
import { VendorSidebar } from "./vendor-sidebar"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { Breadcrumb } from "./breadcrumb"
import { ImpersonationBanner } from "./impersonation-banner"
import { PageOnboardingWizard } from "./page-onboarding-wizard"

type RefreshHandler = () => Promise<void> | void

const RefreshContext = createContext<{
  register: (handler: RefreshHandler) => () => void
  trigger: () => Promise<void>
}>({
  register: () => () => undefined,
  trigger: async () => undefined,
})

const DirtyFormContext = createContext<{
  isDirty: boolean
  setDirty: (dirty: boolean) => void
}>({
  isDirty: false,
  setDirty: () => undefined,
})

export function useRefreshRegistry() {
  return useContext(RefreshContext)
}

export function useDirtyFormGuard() {
  return useContext(DirtyFormContext)
}

interface SidebarLayoutProps {
  children: ReactNode
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const handlersRef = useRef<RefreshHandler[]>([])
  const [isDirty, setDirty] = useState(false)

  const register = useCallback((handler: RefreshHandler) => {
    handlersRef.current.push(handler)
    return () => {
      handlersRef.current = handlersRef.current.filter((h) => h !== handler)
    }
  }, [])

  const trigger = useCallback(async () => {
    if (isDirty) {
      console.warn("[SidebarLayout] Refresh prevented because a form is dirty")
      return
    }
    if (handlersRef.current.length === 0) {
      window.location.reload()
      return
    }
    for (const handler of handlersRef.current) {
      await handler()
    }
  }, [isDirty])

  const refreshValue = useMemo(() => ({ register, trigger }), [register, trigger])
  const dirtyValue = useMemo(() => ({ isDirty, setDirty }), [isDirty])

  return (
    <RefreshContext.Provider value={refreshValue}>
      <DirtyFormContext.Provider value={dirtyValue}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-background focus:px-3 focus:py-2 focus:rounded-md">
            Skip to content
          </a>
          {/* The sidebar is now a true overlay */}
          <VendorSidebar />

          {/* Main content takes full width */}
          <div className="w-full overflow-x-hidden">
            <PullToRefresh onRefresh={async () => { await trigger(); return true }}>
              <main id="main-content" className="p-4 md:p-8 max-w-7xl mx-auto pb-28 pt-20 w-full" role="main" aria-label="Main content">
                {/* Impersonation context for admins */}
                <ImpersonationBanner />
                {/* Add breadcrumbs */}
                <Breadcrumb />
                <div className="w-full">
                  {children}
                </div>
              </main>
            </PullToRefresh>
          </div>
          
          {/* Contextual onboarding wizard */}
          <PageOnboardingWizard />
        </div>
      </DirtyFormContext.Provider>
    </RefreshContext.Provider>
  )
}

// Also export as default for backward compatibility
export default SidebarLayout
