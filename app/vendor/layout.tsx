import type { ReactNode } from "react"
import { SidebarLayout } from "./components/sidebar-layout"

interface VendorLayoutProps {
  children: ReactNode
}

export default function VendorLayout({ children }: VendorLayoutProps) {
  return <SidebarLayout>{children}</SidebarLayout>
}
