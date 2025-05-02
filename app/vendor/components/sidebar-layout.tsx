"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Package, Home, ShoppingCart, BarChart, DollarSign, LogOut, Gift, Settings, Mail } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarLayoutProps {
  children: React.ReactNode
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [vendor, setVendor] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        const response = await fetch("/api/vendor/profile")
        if (!response.ok) {
          if (response.status === 401) {
            router.push("/vendor/login")
            return
          }
          throw new Error("Failed to fetch vendor data")
        }
        const data = await response.json()
        setVendor(data.vendor)
      } catch (err) {
        console.error("Error fetching vendor data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchVendorData()
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch("/api/vendor/logout", { method: "POST" })
      router.push("/vendor/login")
    } catch (err) {
      console.error("Logout error:", err)
    }
  }

  const navItems = [
    { name: "Dashboard", href: "/vendor/dashboard", icon: <Home className="h-5 w-5" /> },
    { name: "Products", href: "/vendor/dashboard?tab=products", icon: <Package className="h-5 w-5" /> },
    { name: "Sales", href: "/vendor/dashboard?tab=sales", icon: <ShoppingCart className="h-5 w-5" /> },
    { name: "Analytics", href: "/vendor/dashboard?tab=analytics", icon: <BarChart className="h-5 w-5" /> },
    { name: "Payouts", href: "/vendor/dashboard?tab=payouts", icon: <DollarSign className="h-5 w-5" /> },
    { name: "Benefits", href: "/vendor/dashboard/benefits", icon: <Gift className="h-5 w-5" /> },
    { name: "Messages", href: "/vendor/dashboard/messages", icon: <Mail className="h-5 w-5" /> },
    { name: "Settings", href: "/vendor/dashboard/settings", icon: <Settings className="h-5 w-5" /> },
  ]

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-10 w-64 transform bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300 ease-in-out">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/vendor/dashboard" className="flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">Vendor Portal</span>
            </Link>
          </div>

          {/* Vendor info */}
          <div className="border-b px-6 py-4">
            <p className="text-sm text-muted-foreground">Logged in as</p>
            <p className="font-medium truncate">{vendor?.vendor_name || "Vendor"}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href.includes("?tab=") && pathname + window.location.search === item.href)

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Logout button */}
          <div className="border-t p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1">{children}</main>
    </div>
  )
}

export default SidebarLayout
