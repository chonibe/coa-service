import type { ReactNode } from "react"
import { SidebarLayout } from "./components/sidebar-layout"

interface VendorLayoutProps {
  children: ReactNode
}

export default function VendorLayout({ children }: VendorLayoutProps) {
  return (
    <SidebarLayout>
      {/* Add top padding to account for fixed header */}
      <div className="pt-16">{children}</div>
    </SidebarLayout>
  )
}
