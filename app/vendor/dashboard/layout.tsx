import type { ReactNode } from "react"
import { SidebarLayout } from "../components/sidebar-layout"

// Legacy sidebar chrome, scoped to `/vendor/dashboard/*` only.
// New app-shell routes under `/vendor/(app)/*` (home, studio, insights, inbox,
// profile, welcome) use the unified AppShell and must not be wrapped here.

export default function VendorDashboardLayout({ children }: { children: ReactNode }) {
  return <SidebarLayout>{children}</SidebarLayout>
}
