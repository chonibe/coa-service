"use client"
import type { ReactNode } from "react"
import { VendorSidebar } from "./vendor-sidebar"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { Breadcrumb } from "./breadcrumb"

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* The sidebar is now a true overlay */}
      <VendorSidebar />

      {/* Main content takes full width */}
      <div className="w-full">
        <PullToRefresh onRefresh={handleRefresh}>
          <main className="p-4 md:p-8 max-w-7xl mx-auto pb-24 pt-20">
            {/* Add breadcrumbs */}
            <Breadcrumb />
            {children}
          </main>
        </PullToRefresh>
      </div>
    </div>
  )
}

// Also export as default for backward compatibility
export default SidebarLayout
