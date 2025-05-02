"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Menu, X, ChevronDown, ChevronRight, Sun, Moon, Laptop, LogOut } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useMobile } from "@/hooks/use-mobile"

type NavItem = {
  title: string
  href: string
  icon?: React.ReactNode
  submenu?: NavItem[]
  isTab?: boolean
}

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    Dashboard: pathname === "/vendor/dashboard",
  })
  const [vendor, setVendor] = useState<any>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const isMobile = useMobile()
  const currentTab = searchParams.get("tab")

  // Fetch vendor data
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

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false)
    }
  }, [pathname, isMobile])

  const getNavItems = (): NavItem[] => [
    {
      title: "Dashboard",
      href: "/vendor/dashboard",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      ),
      submenu: [
        {
          title: "Overview",
          href: "/vendor/dashboard",
          isTab: true,
        },
        {
          title: "Products",
          href: "/vendor/dashboard",
          isTab: true,
        },
        {
          title: "Sales",
          href: "/vendor/dashboard",
          isTab: true,
        },
        {
          title: "Payouts",
          href: "/vendor/dashboard",
          isTab: true,
        },
      ],
    },
    {
      title: "Analytics",
      href: "/vendor/dashboard/analytics",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
      ),
      submenu: [
        {
          title: "Overview",
          href: "/vendor/dashboard/analytics",
          isTab: true,
        },
        {
          title: "Sales",
          href: "/vendor/dashboard/analytics",
          isTab: true,
        },
        {
          title: "Traffic",
          href: "/vendor/dashboard/analytics",
          isTab: true,
        },
        {
          title: "Products",
          href: "/vendor/dashboard/analytics",
          isTab: true,
        },
        {
          title: "Geography",
          href: "/vendor/dashboard/analytics",
          isTab: true,
        },
      ],
    },
    {
      title: "Benefits",
      href: "/vendor/dashboard/benefits",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M12 8c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5Z" />
          <path d="m3 3 18 18" />
          <path d="M10.5 13.5 3 21" />
          <path d="m21 3-7.5 7.5" />
        </svg>
      ),
    },
    {
      title: "Messages",
      href: "/vendor/dashboard/messages",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z" />
          <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
        </svg>
      ),
    },
    {
      title: "Settings",
      href: "/vendor/dashboard/settings",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
  ]

  // Auto-open submenu for active items
  useEffect(() => {
    const navItems = getNavItems()
    const newOpenSubmenus = { ...openSubmenus }

    navItems.forEach((item) => {
      if (item.submenu) {
        // Check if this is the dashboard page
        if (pathname === "/vendor/dashboard" && item.href === "/vendor/dashboard") {
          newOpenSubmenus[item.title] = true
        } else {
          const hasActiveChild = item.submenu.some((subItem) =>
            isActive(subItem.href, subItem.isTab ? subItem.title.toLowerCase() : null),
          )
          if (hasActiveChild) {
            newOpenSubmenus[item.title] = true
          }
        }
      }
    })

    setOpenSubmenus(newOpenSubmenus)
  }, [pathname, currentTab])

  const toggleSubmenu = (title: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }))
  }

  const isActive = (itemPath: string, tabName: string | null = null) => {
    // Special case for dashboard with no tab specified
    if (pathname === "/vendor/dashboard" && itemPath === "/vendor/dashboard" && !currentTab && tabName === "overview") {
      return true
    }

    if (tabName && itemPath === pathname) {
      return currentTab === tabName || (!currentTab && tabName === "overview")
    }
    return pathname === itemPath
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/vendor/logout", { method: "POST" })
      router.push("/vendor/login")
    } catch (err) {
      console.error("Logout error:", err)
    }
  }

  const navItems = getNavItems()

  const renderNavItem = (item: NavItem) => {
    const isItemActive = item.submenu
      ? item.submenu.some((subItem) => isActive(subItem.href, subItem.isTab ? subItem.title.toLowerCase() : null))
      : isActive(item.href)

    const isSubmenuOpen = openSubmenus[item.title] || false

    if (item.submenu) {
      return (
        <div key={item.title} className="flex flex-col">
          <button
            onClick={() => toggleSubmenu(item.title)}
            className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
              isItemActive ? "bg-accent/50 text-accent-foreground" : "text-foreground"
            }`}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span>{item.title}</span>
            </div>
            {isSubmenuOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {isSubmenuOpen && (
            <div className="ml-6 mt-1 flex flex-col gap-1">
              {item.submenu.map((subItem) => {
                const href = subItem.isTab ? `${subItem.href}?tab=${subItem.title.toLowerCase()}` : subItem.href

                const isSubItemActive = isActive(subItem.href, subItem.isTab ? subItem.title.toLowerCase() : null)

                return (
                  <Link
                    key={subItem.title}
                    href={href}
                    className={`rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                      isSubItemActive ? "bg-accent text-accent-foreground" : "text-foreground"
                    }`}
                  >
                    {subItem.title}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link
        key={item.title}
        href={item.href}
        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
          isItemActive ? "bg-accent text-accent-foreground" : "text-foreground"
        }`}
      >
        {item.icon}
        <span>{item.title}</span>
      </Link>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar for desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out bg-background border-r border-border md:relative md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          <h2 className="text-xl font-bold">Vendor Portal</h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col h-[calc(100%-4rem)] overflow-hidden">
          <nav className="flex-1 overflow-y-auto p-2">
            <div className="flex flex-col gap-1">{navItems.map(renderNavItem)}</div>
          </nav>

          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium text-sm">{vendor?.vendor_name || "Vendor"}</p>
                <p className="text-xs text-muted-foreground">Vendor Account</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Log out</span>
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  {theme === "light" && <Sun className="mr-2 h-4 w-4" />}
                  {theme === "dark" && <Moon className="mr-2 h-4 w-4" />}
                  {theme === "system" && <Laptop className="mr-2 h-4 w-4" />}
                  <span className="capitalize">{theme || "system"} Theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Laptop className="mr-2 h-4 w-4" />
                  <span>System</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden bg-background">
        {/* Mobile header */}
        <header className="flex h-16 items-center border-b border-border bg-background px-4 md:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="ml-4 text-lg font-medium">Vendor Portal</h1>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-background p-4 md:p-6">{children}</main>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default SidebarLayout
