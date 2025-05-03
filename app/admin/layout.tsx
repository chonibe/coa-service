"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart,
  Settings,
  Package,
  ShoppingCart,
  Award,
  Tag,
  Menu,
  X,
  Home,
  Store,
  Truck,
  DollarSign,
  RefreshCw,
  FileText,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Toaster } from "@/components/ui/toaster"
import LogoutButton from "./logout-button"
import { useMobile } from "@/hooks/use-mobile"
import { BottomNav } from "./components/bottom-nav"
import { Breadcrumb } from "./components/breadcrumb"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  submenu?: NavItem[]
  expanded?: boolean
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isMobile = useMobile()
  const [open, setOpen] = useState(false)
  const [currentSection, setCurrentSection] = useState("Dashboard")
  const [navItems, setNavItems] = useState<NavItem[]>([
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "Products",
      href: "/admin/sync-products",
      icon: <Package className="h-5 w-5" />,
      submenu: [
        {
          title: "Sync Products",
          href: "/admin/sync-products",
          icon: <Package className="h-4 w-4" />,
        },
        {
          title: "Product Editions",
          href: "/admin/product-editions",
          icon: <Award className="h-4 w-4" />,
        },
        {
          title: "Sync Vendor Names",
          href: "/admin/sync-vendor-names",
          icon: <RefreshCw className="h-4 w-4" />,
        },
      ],
      expanded: false,
    },
    {
      title: "Orders",
      href: "/admin/missing-orders",
      icon: <ShoppingCart className="h-5 w-5" />,
      submenu: [
        {
          title: "Missing Orders",
          href: "/admin/missing-orders",
          icon: <ShoppingCart className="h-4 w-4" />,
        },
        {
          title: "Shopify Sync",
          href: "/admin/shopify-sync",
          icon: <Store className="h-4 w-4" />,
        },
      ],
      expanded: false,
    },
    {
      title: "Vendors",
      href: "/admin/vendors",
      icon: <Truck className="h-5 w-5" />,
      submenu: [
        {
          title: "Vendor List",
          href: "/admin/vendors",
          icon: <Truck className="h-4 w-4" />,
        },
      ],
      expanded: false,
    },
    {
      title: "Payouts",
      href: "/admin/vendors/payouts/admin",
      icon: <DollarSign className="h-5 w-5" />,
      submenu: [
        {
          title: "Payout Manager",
          href: "/admin/vendors/payouts/admin",
          icon: <DollarSign className="h-4 w-4" />,
        },
        {
          title: "Payout History",
          href: "/admin/vendors/payouts/admin",
          icon: <Clock className="h-4 w-4" />,
        },
        {
          title: "Payout Settings",
          href: "/admin/vendors/payouts",
          icon: <Settings className="h-4 w-4" />,
        },
      ],
      expanded: false,
    },
    {
      title: "Reports",
      href: "/admin/tax-reporting",
      icon: <FileText className="h-5 w-5" />,
      submenu: [
        {
          title: "Tax Reporting",
          href: "/admin/tax-reporting",
          icon: <FileText className="h-4 w-4" />,
        },
        {
          title: "Sales Reports",
          href: "/admin/reports/sales",
          icon: <BarChart className="h-4 w-4" />,
        },
      ],
      expanded: false,
    },
    {
      title: "Certificates",
      href: "/admin/certificates",
      icon: <Award className="h-5 w-5" />,
      submenu: [
        {
          title: "Management",
          href: "/admin/certificates/management",
          icon: <Award className="h-4 w-4" />,
        },
        {
          title: "Bulk Operations",
          href: "/admin/certificates/bulk",
          icon: <Award className="h-4 w-4" />,
        },
        {
          title: "Access Logs",
          href: "/admin/certificates/logs",
          icon: <BarChart className="h-4 w-4" />,
        },
        {
          title: "NFC Tags",
          href: "/admin/certificates/nfc",
          icon: <Tag className="h-4 w-4" />,
        },
      ],
      expanded: false,
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ])

  // Toggle submenu expanded state
  const toggleSubmenu = (index: number) => {
    setNavItems((prev) => prev.map((item, i) => (i === index ? { ...item, expanded: !item.expanded } : item)))
  }

  // Check if a nav item or its children are active
  const isActive = (item: NavItem): boolean => {
    if (pathname === item.href) return true
    if (item.submenu) {
      return item.submenu.some((subItem) => pathname === subItem.href)
    }
    return false
  }

  // Close the mobile menu when route changes
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Update current section title based on pathname
  useEffect(() => {
    const currentNavItem = navItems.find(
      (item) => pathname === item.href || (item.submenu && item.submenu.some((subItem) => pathname === subItem.href)),
    )

    if (currentNavItem) {
      // If we're on a submenu page, find which one
      if (currentNavItem.submenu) {
        const currentSubItem = currentNavItem.submenu.find((subItem) => pathname === subItem.href)
        if (currentSubItem) {
          setCurrentSection(`${currentNavItem.title} / ${currentSubItem.title}`)
        } else {
          setCurrentSection(currentNavItem.title)
        }
      } else {
        setCurrentSection(currentNavItem.title)
      }
    } else {
      setCurrentSection("Dashboard")
    }
  }, [pathname, navItems])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px] pr-0">
            <div className="flex flex-col h-full">
              <div className="flex items-center border-b h-16 px-6">
                <Link href="/admin" className="flex items-center gap-2 font-semibold">
                  <Award className="h-6 w-6" />
                  {isMobile ? <span className="font-medium">{currentSection}</span> : <span>Admin Dashboard</span>}
                </Link>
                <Button variant="ghost" size="icon" className="ml-auto" onClick={() => setOpen(false)}>
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="px-2 py-4">
                  <nav className="flex flex-col gap-2">
                    {navItems.map((item, index) => (
                      <div key={item.href} className="flex flex-col">
                        {item.submenu ? (
                          <>
                            <button
                              onClick={() => toggleSubmenu(index)}
                              className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium ${
                                isActive(item)
                                  ? "bg-accent text-accent-foreground"
                                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {item.icon}
                                <span>{item.title}</span>
                              </div>
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
                                className={`h-4 w-4 transition-transform ${item.expanded ? "rotate-180" : ""}`}
                              >
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                            </button>
                            {item.expanded && (
                              <div className="mt-1 pl-6 space-y-1">
                                {item.submenu.map((subItem) => (
                                  <Link
                                    key={subItem.href}
                                    href={subItem.href}
                                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                                      pathname === subItem.href
                                        ? "bg-accent text-accent-foreground font-medium"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    }`}
                                  >
                                    {subItem.icon}
                                    <span>{subItem.title}</span>
                                  </Link>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <Link
                            href={item.href}
                            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                              pathname === item.href
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            }`}
                          >
                            {item.icon}
                            <span>{item.title}</span>
                          </Link>
                        )}
                      </div>
                    ))}
                  </nav>
                </div>
              </ScrollArea>
              <div className="border-t p-4">
                <LogoutButton className="w-full" />
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <Award className="h-6 w-6" />
          <span className={isMobile ? "sr-only" : "inline-block"}>Admin Dashboard</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <LogoutButton className="hidden md:flex" />
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-[250px] flex-col border-r md:flex">
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-2 p-4">
              <nav className="grid gap-2">
                {navItems.map((item, index) => (
                  <div key={item.href} className="flex flex-col">
                    {item.submenu ? (
                      <>
                        <button
                          onClick={() => toggleSubmenu(index)}
                          className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium ${
                            isActive(item)
                              ? "bg-accent text-accent-foreground"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {item.icon}
                            <span>{item.title}</span>
                          </div>
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
                            className={`h-4 w-4 transition-transform ${item.expanded ? "rotate-180" : ""}`}
                          >
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </button>
                        {item.expanded && (
                          <div className="mt-1 pl-6 space-y-1">
                            {item.submenu.map((subItem) => (
                              <Link
                                key={subItem.href}
                                href={subItem.href}
                                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                                  pathname === subItem.href
                                    ? "bg-accent text-accent-foreground font-medium"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                }`}
                              >
                                {subItem.icon}
                                <span>{subItem.title}</span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                          pathname === item.href
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        {item.icon}
                        <span>{item.title}</span>
                      </Link>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </ScrollArea>
        </aside>
        <main className="flex-1 pb-16 md:pb-0">
          <div className="px-4 py-2 md:px-6 md:py-4">
            <Breadcrumb className="hidden md:flex" />
          </div>
          {children}
        </main>
      </div>
      <BottomNav />
      <Toaster />
    </div>
  )
}
