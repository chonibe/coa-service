"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Toaster } from "@/components/ui/toaster"
import { useMobile } from "@/hooks/use-mobile"
import { LogOut, Menu, Home, BarChart, Settings, Award, Package, DollarSign, MessageSquare, X, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { NotificationCenter } from "@/components/vendor/notification-center"
import { Badge } from "@/components/ui/badge"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
}

export function VendorSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useMobile()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [vendorName, setVendorName] = useState<string>("Vendor")
  const [profileComplete, setProfileComplete] = useState<boolean>(true)
  const [unreadMessages, setUnreadMessages] = useState(0)

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
    {
      title: "Help",
      href: "/vendor/dashboard/help",
      icon: <HelpCircle className="h-5 w-5" />,
    },
  ]

  // Fetch vendor profile and unread counts
  useEffect(() => {
    const fetchVendorProfile = async () => {
      try {
        const response = await fetch("/api/vendor/profile")
        if (response.ok) {
          const data = await response.json()
          setVendorName(data.vendor?.vendor_name || "Vendor")

          // Check if profile is complete
          const vendor = data.vendor
          if (vendor) {
            const isComplete = !!(
              vendor.paypal_email &&
              vendor.tax_id &&
              vendor.tax_country &&
              vendor.address &&
              vendor.phone
            )
            setProfileComplete(isComplete)
          }
        }
      } catch (error) {
        console.error("Error fetching vendor profile:", error)
      }
    }

    const fetchUnreadCounts = async () => {
      try {
        const [messagesResponse, notificationsResponse] = await Promise.all([
          fetch("/api/vendor/messages").catch(() => null),
          fetch("/api/vendor/notifications?unread_only=true").catch(() => null),
        ])

        if (messagesResponse?.ok) {
          const messagesData = await messagesResponse.json()
          setUnreadMessages(messagesData.totalUnread || 0)
        }
      } catch (error) {
        console.error("Error fetching unread counts:", error)
      }
    }

    fetchVendorProfile()
    fetchUnreadCounts()
    // Poll for unread counts every 30 seconds
    const interval = setInterval(fetchUnreadCounts, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    try {
      await fetch("/api/vendor/logout", { method: "POST" })
      router.push("/login")
    } catch (err) {
      console.error("Logout error:", err)
    }
  }

  // Mobile bottom nav items (limited to 5 for space)
  const mobileNavItems = [
    navItems[0], // Dashboard
    navItems[1], // Products
    navItems[2], // Analytics
    navItems[3], // Payouts
    navItems[6], // Settings
  ]

  // Check if a path is active (exact match or starts with for section pages)
  const isActive = (href: string) => {
    if (pathname === href) return true
    if (href !== "/vendor/dashboard" && pathname.startsWith(href)) return true
    return false
  }

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // Close sidebar
  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  return (
    <>
      {/* Fixed header */}
      <header className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6" role="banner">
        <Button
          variant="outline"
          size="icon"
          className="flex transition-all hover:bg-primary/10 min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          onClick={toggleSidebar}
          aria-label="Toggle navigation menu"
          aria-expanded={sidebarOpen}
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        <Link href="/vendor/dashboard" className="flex items-center gap-2 font-semibold">
          <Award className="h-6 w-6" />
          <span className={isMobile ? "sr-only" : "inline-block"}>Vendor Portal</span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <NotificationCenter />
          <Button
            variant="outline"
            className="hidden md:flex transition-colors hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Overlay sidebar - shown when sidebarOpen is true */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-all duration-300",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={closeSidebar}
      />

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-[280px] bg-background border-r shadow-lg transition-transform duration-300 ease-in-out transform",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <Link href="/vendor/dashboard" className="flex items-center gap-2 font-semibold">
            <Award className="h-6 w-6" />
            <span className="font-medium">Vendor Portal</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeSidebar}
            className="transition-all hover:rotate-90 duration-200 min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="px-2 py-4">
            <div className="mb-4 px-4">
              <p className="text-sm font-medium">Logged in as</p>
              <h3 className="font-semibold">{vendorName}</h3>
            </div>
            <nav className="flex flex-col gap-2" aria-label="Navigation menu">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeSidebar}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                    isActive(item.href)
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  aria-label={item.title === "Messages" && unreadMessages > 0 ? `${item.title}, ${unreadMessages} unread messages` : item.title}
                >
                  {item.icon}
                  <span>{item.title}</span>
                  {item.title === "Messages" && unreadMessages > 0 && (
                    <Badge variant="destructive" className="ml-auto h-5 min-w-5 flex items-center justify-center p-0 text-xs" aria-label={`${unreadMessages} unread messages`}>
                      {unreadMessages > 99 ? "99+" : unreadMessages}
                    </Badge>
                  )}
                  {item.title === "Settings" && !profileComplete && (
                    <span className="ml-auto flex h-2 w-2 rounded-full bg-red-500" aria-label="Profile incomplete"></span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 border-t p-4">
          <Button
            variant="outline"
            className="w-full justify-start text-sm font-medium transition-colors hover:bg-destructive/10 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onClick={handleLogout}
            aria-label="Logout"
          >
            <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      {/* Mobile bottom navigation - improved with better visual indicators */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t md:hidden" role="navigation" aria-label="Mobile navigation">
        <div className="grid grid-cols-5">
          {mobileNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 relative transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                isActive(item.href) ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
              aria-current={isActive(item.href) ? "page" : undefined}
              aria-label={item.title}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full mb-1",
                  isActive(item.href) && "bg-primary/10",
                )}
              >
                {item.icon}
              </div>
              <span className="text-xs font-medium">{item.title}</span>
              {item.title === "Settings" && !profileComplete && (
                <span className="absolute top-1 right-1/4 flex h-2 w-2 rounded-full bg-red-500" aria-label="Profile incomplete"></span>
              )}
              {isActive(item.href) && (
                <span className="absolute bottom-0 left-1/2 w-1/2 h-0.5 bg-primary transform -translate-x-1/2"></span>
              )}
            </Link>
          ))}
        </div>
      </nav>

      <Toaster />
    </>
  )
}
