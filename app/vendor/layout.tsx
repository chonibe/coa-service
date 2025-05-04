import type { ReactNode } from "react"
import { SidebarLayout } from "./components/sidebar-layout"

interface VendorLayoutProps {
  children: ReactNode
}

export default function VendorLayout({ children }: VendorLayoutProps) {
  return (
    <SidebarLayout>
      {/* Add top padding to account for fixed header and ensure content is fully visible */}
      <div className="pt-16 pb-20 min-h-screen">{children}</div>
    </SidebarLayout>
  )
}
