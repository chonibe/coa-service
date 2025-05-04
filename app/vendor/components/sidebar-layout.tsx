"use client"
import type { ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useMobile } from "@/hooks/use-mobile"
import { VendorSidebar } from "./vendor-sidebar"
import { PullToRefresh } from "@/components/pull-to-refresh"

interface SidebarLayoutProps {
  children: ReactNode
}

// Export as both named export and default export to maintain compatibility
export function SidebarLayout({ children }: SidebarLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useMobile()

  // Function to refresh content - will be passed to PullToRefresh
  const handleRefresh = async () => {
    // This will trigger a page refresh
    window.location.reload()
    return true
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* The sidebar is now completely separate from the main content */}
      <VendorSidebar />

      {/* Main content takes full width on mobile */}
      <div className="flex-1 w-full overflow-y-auto">
        <PullToRefresh onRefresh={handleRefresh}>
          <main className="p-2 md:p-6 max-w-full mx-auto pb-24 pt-16">{children}</main>
        </PullToRefresh>
      </div>
    </div>
  )
}

// Also export as default for backward compatibility
export default SidebarLayout
