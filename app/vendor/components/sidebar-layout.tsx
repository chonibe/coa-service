"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useTheme } from "next-themes"
import {
  Package,
  BarChart3,
  ShoppingCart,
  DollarSign,
  Gift,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  Home,
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
  Laptop,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive: boolean
  hasSubmenu?: boolean
  isSubmenuOpen?: boolean
  onClick?: () => void
}

function NavItem({ href, icon, label, isActive, hasSubmenu, isSubmenuOpen, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground",
      )}
      onClick={onClick}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {hasSubmenu && (isSubmenuOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
    </Link>
  )
}

interface SidebarLayoutProps {
  children: React.ReactNode
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({})
  const [vendor, setVendor] = useState<any>(null)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // After mounting, we can safely show the UI that depends on the theme
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        const response = await fetch("/api/vendor/profile")
        if (response.ok) {
          const data = await response.json()
          setVendor(data.vendor)
        }
      } catch (error) {
        console.error("Error fetching vendor data:", error)
      }
    }

    fetchVendorData()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch("/api/vendor/logout", { method: "POST" })
      router.push("/vendor/login")
    } catch (err) {
      console.error("Logout error:", err)
    }
  }

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  const navItems = [
    {
      href: "/vendor/dashboard",
      icon: <Home className="h-4 w-4" />,
      label: "Dashboard",
      isActive: isActive("/vendor/dashboard"),
    },
    {
      href: "/vendor/dashboard?tab=products",
      icon: <Package className="h-4 w-4" />,
      label: "Products",
      isActive: pathname === "/vendor/dashboard" && pathname.includes("tab=products"),
    },
    {
      href: "/vendor/dashboard?tab=sales",
      icon: <ShoppingCart className="h-4 w-4" />,
      label: "Sales",
      isActive: pathname === "/vendor/dashboard" && pathname.includes("tab=sales"),
    },
    {
      href: "/vendor/dashboard/analytics",
      icon: <BarChart3 className="h-4 w-4" />,
      label: "Analytics",
      isActive: isActive("/vendor/dashboard/analytics"),
    },
    {
      href: "/vendor/dashboard?tab=payouts",
      icon: <DollarSign className="h-4 w-4" />,
      label: "Payouts",
      isActive: pathname === "/vendor/dashboard" && pathname.includes("tab=payouts"),
    },
    {
      href: "/vendor/dashboard/benefits",
      icon: <Gift className="h-4 w-4" />,
      label: "Benefits",
      isActive: isActive("/vendor/dashboard/benefits"),
    },
    {
      href: "/vendor/dashboard/messages",
      icon: <MessageSquare className="h-4 w-4" />,
      label: "Messages",
      isActive: isActive("/vendor/dashboard/messages"),
    },
    {
      href: "/vendor/dashboard/settings",
      icon: <Settings className="h-4 w-4" />,
      label: "Settings",
      isActive: isActive("/vendor/dashboard/settings"),
    },
  ]

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/vendor/dashboard" className="flex items-center gap-2 font-semibold">
          <Package className="h-5 w-5" />
          <span>Vendor Portal</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {mounted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  {theme === "light" ? (
                    <Sun className="h-4 w-4" />
                  ) : theme === "dark" ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Laptop className="h-4 w-4" />
                  )}
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          {navItems.map((item, index) => (
            <NavItem
              key={index}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={item.isActive}
              onClick={() => setIsMobileMenuOpen(false)}
            />
          ))}
        </nav>
      </div>
      <div className="mt-auto border-t p-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-medium">{vendor?.vendor_name || "Vendor"}</span>
            <span className="text-xs text-muted-foreground">Vendor Account</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Log out</span>
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden border-r bg-background md:block md:w-64">{sidebarContent}</div>

      {/* Mobile sidebar */}
      <div className="md:hidden">
        <div className="flex h-14 items-center border-b px-4">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              {sidebarContent}
            </SheetContent>
          </Sheet>
          <Link href="/vendor/dashboard" className="flex items-center gap-2 font-semibold">
            <Package className="h-5 w-5" />
            <span>Vendor Portal</span>
          </Link>
          <div className="ml-auto">
            {mounted && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    {theme === "light" ? (
                      <Sun className="h-4 w-4" />
                    ) : theme === "dark" ? (
                      <Moon className="h-4 w-4" />
                    ) : (
                      <Laptop className="h-4 w-4" />
                    )}
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  )
}

export default SidebarLayout
