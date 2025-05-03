"use client"

import type React from "react"
import type { ReactNode } from "react"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useMobile } from "@/hooks/use-mobile"
import { Home, BarChart, Settings, Award, Package, DollarSign, MessageSquare } from "lucide-react"
import { VendorSidebar } from "./vendor-sidebar"

interface NavItem {
  title: string
  href: string
  icon?: React.ReactNode
  submenu?: NavItem[]
  isTab?: boolean
}

interface SidebarLayoutProps {
  children: ReactNode
}

// Export as both named export and default export to maintain compatibility
export function SidebarLayout({ children }: SidebarLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useMobile()
  const [open, setOpen] = useState(false)
  const [vendorName, setVendorName] = useState<string>("Vendor")

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/vendor/dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "Products",
      href: "/vendor/dashboard/products",
      icon: <Package className="h-5 w-5" />,
    },
    {
      title: "Analytics",
      href: "/vendor/dashboard/analytics",
      icon: <BarChart className="h-5 w-5" />,
    },
    {
      title: "Payouts",
      href: "/vendor/dashboard/payouts",
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      title: "Benefits",
      href: "/vendor/dashboard/benefits",
      icon: <Award className="h-5 w-5" />,
    },
    {
      title: "Messages",
      href: "/vendor/dashboard/messages",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/vendor/dashboard/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  // Fetch vendor profile
  useEffect(() => {
    const fetchVendorProfile = async () => {
      try {
        const response = await fetch("/api/vendor/profile")
        if (response.ok) {
          const data = await response.json()
          setVendorName(data.vendor?.vendor_name || "Vendor")
        }
      } catch (error) {
        console.error("Error fetching vendor profile:", error)
      }
    }

    fetchVendorProfile()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch("/api/vendor/logout", { method: "POST" })
      router.push("/vendor/login")
    } catch (err) {
      console.error("Logout error:", err)
    }
  }

  // Mobile bottom nav items (limited to 4 for space)
  const mobileNavItems = [
    navItems[0], // Dashboard
    navItems[1], // Products
    navItems[2], // Analytics
    navItems[6], // Settings
  ]

  // Update the return statement to ensure the sidebar properly overlays content on mobile
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <VendorSidebar />
      <div className="flex-1 w-full">
        <main className="p-4 md:p-6 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  )
}

// Also export as default for backward compatibility
export default SidebarLayout
