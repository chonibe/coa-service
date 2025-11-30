"use client"
import type { ReactNode } from "react"
import { VendorSidebar } from "./vendor-sidebar"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { Breadcrumb } from "./breadcrumb"
import { ImpersonationBanner } from "./impersonation-banner"
import { PageOnboardingWizard } from "./page-onboarding-wizard"

interface SidebarLayoutProps {
  children: ReactNode
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  // Function to refresh content - will be passed to PullToRefresh
  const handleRefresh = async () => {
    // This will trigger a page refresh
    window.location.reload()
    return true
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* The sidebar is now a true overlay */}
      <VendorSidebar />

      {/* Main content takes full width */}
      <div className="w-full">
        <PullToRefresh onRefresh={handleRefresh}>
          <main id="main-content" className="p-4 md:p-8 max-w-7xl mx-auto pb-24 pt-20" role="main" aria-label="Main content">
            {/* Impersonation context for admins */}
            <ImpersonationBanner />
            {/* Add breadcrumbs */}
            <Breadcrumb />
            {children}
          </main>
        </PullToRefresh>
      </div>
      
      {/* Contextual onboarding wizard */}
      <PageOnboardingWizard />
    </div>
  )
}

// Also export as default for backward compatibility
export default SidebarLayout
