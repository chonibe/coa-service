"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { SidebarLayout } from "./components/sidebar-layout"

const AUTH_ROUTES = ["/vendor/login", "/vendor/signup", "/vendor/onboarding"]

const shouldBypassSidebar = (pathname: string) => {
  return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

export default function VendorLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  if (shouldBypassSidebar(pathname)) {
    return <>{children}</>
  }

  return <SidebarLayout>{children}</SidebarLayout>
}
