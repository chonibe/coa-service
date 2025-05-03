import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import SidebarLayout from "./components/sidebar-layout"

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SidebarLayout>{children}</SidebarLayout>
    </ThemeProvider>
  )
}
