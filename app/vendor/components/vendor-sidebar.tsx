"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Toaster } from "@/components/ui"
import { useMobile } from "@/hooks/use-mobile"
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  HomeIcon,
  ChartBarIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  QuestionMarkCircleIcon,
  UserCircleIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline"
import { Sparkles, Eye, Loader2, Lock, Image as ImageIcon, FileText, Folder, Package, Search, Film } from "lucide-react"
import { CreateMenu } from "./create-menu"
import { Icon } from "@/components/icon"
import { cn } from "@/lib/utils"
import { NotificationCenter } from "@/components/vendor/notification-center"

import { useSwipeGesture } from "@/components/vendor/mobile-gestures"
import { Logo } from "@/components/logo"
import { SmartBackButton } from "@/components/smart-back-button"
import { UnifiedSearch } from "@/components/unified-search"

import { Button, Badge } from "@/components/ui"
interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
}

const SIDEBAR_COLLAPSE_KEY = "vendor_sidebar_collapsed"

export function VendorSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useMobile()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [vendorName, setVendorName] = useState<string>("Vendor")
  const [profileComplete, setProfileComplete] = useState<boolean>(true)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [hasCollectorAccess, setHasCollectorAccess] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
  const sidebarRef = useRef<HTMLElement>(null)
  useEffect(() => {
    // Restore collapsed state on desktop
    const stored = typeof window !== "undefined" ? localStorage.getItem(SIDEBAR_COLLAPSE_KEY) : null
    if (stored === "true") {
      setIsCollapsed(true)
    }
  }, [])

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev
      if (typeof window !== "undefined") {
        localStorage.setItem(SIDEBAR_COLLAPSE_KEY, next ? "true" : "false")
      }
      return next
    })
  }, [])

  
  // Enable swipe right to open sidebar on mobile
  useSwipeGesture(sidebarRef, {
    onSwipeRight: () => {
      if (isMobile && !sidebarOpen) {
        setSidebarOpen(true)
      }
    },
    threshold: 100,
  })

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/vendor/dashboard",
      icon: <Icon size="md"><HomeIcon className="h-5 w-5" /></Icon>,
    },
    {
      title: "Artworks",
      href: "/vendor/dashboard/products",
      icon: <Icon size="md"><ImageIcon className="h-5 w-5" /></Icon>,
    },
    {
      title: "Artwork Pages",
      href: "/vendor/dashboard/artwork-pages",
      icon: <Icon size="md"><FileText className="h-5 w-5" /></Icon>,
    },
    // Slides page hidden per user request
    // {
    //   title: "Slides",
    //   href: "/vendor/dashboard/artwork-pages",
    //   icon: <Icon size="md"><Film className="h-5 w-5" /></Icon>,
    // },
    {
      title: "Media Library",
      href: "/vendor/dashboard/media-library",
      icon: <Icon size="md"><Folder className="h-5 w-5" /></Icon>,
    },
    // Series now combined with Artworks page
    // {
    //   title: "Series",
    //   href: "/vendor/dashboard/series",
    //   icon: <Icon size="md"><Lock className="h-5 w-5" /></Icon>,
    // },
    {
      title: "Analytics",
      href: "/vendor/dashboard/analytics",
      icon: <Icon size="md"><ChartBarIcon className="h-5 w-5" /></Icon>,
    },
    {
      title: "Payouts",
      href: "/vendor/dashboard/payouts",
      icon: <Icon size="md"><CurrencyDollarIcon className="h-5 w-5" /></Icon>,
    },
    // Store temporarily hidden
    // {
    //   title: "Store",
    //   href: "/vendor/dashboard/store",
    //   icon: <Icon size="md"><ShoppingBagIcon className="h-5 w-5" /></Icon>,
    // },
    // Messages moved to header icon
    {
      title: "Profile",
      href: "/vendor/dashboard/profile",
      icon: <Icon size="md"><UserCircleIcon className="h-5 w-5" /></Icon>,
    },
    {
      title: "Help",
      href: "/vendor/dashboard/help",
      icon: <Icon size="md"><QuestionMarkCircleIcon className="h-5 w-5" /></Icon>,
    },
  ]

  // Fetch vendor profile and unread counts
  useEffect(() => {
    const fetchVendorProfile = async () => {
      try {
        const response = await fetch("/api/vendor/profile", {
          credentials: "include",
        })
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
          fetch("/api/vendor/messages", { credentials: "include" }).catch(() => null),
          fetch("/api/vendor/notifications?unread_only=true", { credentials: "include" }).catch(() => null),
        ])

        if (messagesResponse?.ok) {
          const messagesData = await messagesResponse.json()
          setUnreadMessages(messagesData.totalUnread || 0)
        }
        if (notificationsResponse?.ok) {
          const notificationsData = await notificationsResponse.json()
          setUnreadNotifications(notificationsData.totalUnread || 0)
        }
      } catch (error) {
        console.error("Error fetching unread counts:", error)
      }
    }

    const fetchAuthStatus = async () => {
      try {
        const response = await fetch("/api/auth/status", { credentials: "include" })
        if (response.ok) {
          const data = await response.json()
          setHasCollectorAccess(data.vendorHasCollectorAccess || false)
        }
      } catch (error) {
        console.error("Error fetching auth status:", error)
      }
    }

    fetchVendorProfile()
    fetchUnreadCounts()
    fetchAuthStatus()
    // Poll for unread counts every 30 seconds
    const interval = setInterval(fetchUnreadCounts, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    try {
      await fetch("/api/vendor/logout", { method: "POST", credentials: "include" })
      router.push("/login")
    } catch (err) {
      console.error("Logout error:", err)
    }
  }

  // Mobile bottom nav items (limited to 5 for space)
  // Filter out undefined items (commented out items) and take first 5
  const mobileNavItems = navItems.filter(item => item && item.href).slice(0, 5)

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

  const handleSwitchToCollector = async () => {
    try {
      setIsSwitching(true)
      const res = await fetch("/api/auth/collector/switch", { method: "POST", credentials: "include" })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || "Unable to switch to collector view")
      }
      // Redirect to collector dashboard
      window.location.href = "/collector/dashboard"
    } catch (err: any) {
      console.error("Error switching to collector:", err)
      alert(err.message || "Could not switch to collector view")
    } finally {
      setIsSwitching(false)
    }
  }

  return (
    <>
      {/* Fixed header */}
      <header className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6" role="banner">
        {/* Left: Back Button, Menu Button */}
        <div className="flex items-center gap-2">
          <SmartBackButton dashboardBase="/vendor/dashboard" />
          <Button
            variant="outline"
            size="icon"
            className="flex items-center justify-center transition-all hover:bg-primary/10 min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onClick={toggleSidebar}
            aria-label="Toggle navigation menu"
            aria-expanded={sidebarOpen}
          >
            <Icon size="lg">
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </Icon>
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>

        {/* Center: Logo */}
        <div className="flex-1 flex justify-center">
          <Link href="/vendor/dashboard" className="flex items-center gap-2 font-semibold">
            <Logo 
              className="h-8 w-auto object-contain"
              alt="Street Lamp Logo"
            />
          </Link>
        </div>

        {/* Right: Search, Notifications, Messages and Create Menu */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex items-center gap-2 hover:bg-primary/10"
            onClick={handleSwitchToCollector}
            disabled={isSwitching}
            aria-label="Switch to collector view"
          >
            {isSwitching ? (
              <Icon size="sm">
                <Loader2 className="h-4 w-4 animate-spin" />
              </Icon>
            ) : (
              <Icon size="sm">
                <Eye className="h-4 w-4" />
              </Icon>
            )}
            <span className="text-sm">View as Collector</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="flex items-center justify-center transition-all hover:bg-primary/10 min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onClick={() => setSearchOpen(true)}
            aria-label="Search pages"
          >
            <Icon size="lg">
              <Search className="h-5 w-5" aria-hidden="true" />
            </Icon>
            <span className="sr-only">Search</span>
          </Button>
          <NotificationCenter />
          <Button
            variant="outline"
            size="icon"
            className="relative flex items-center justify-center transition-all hover:bg-primary/10 min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onClick={() => router.push("/vendor/dashboard/messages")}
            aria-label={unreadMessages > 0 ? `Messages, ${unreadMessages} unread` : "Messages"}
          >
            <Icon size="lg">
              <ChatBubbleLeftRightIcon className="h-6 w-6" aria-hidden="true" />
            </Icon>
            {unreadMessages > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs" 
                aria-label={`${unreadMessages} unread messages`}
              >
                {unreadMessages > 99 ? "99+" : unreadMessages}
              </Badge>
            )}
            <span className="sr-only">Messages</span>
          </Button>
          <CreateMenu />
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
            ref={sidebarRef}
            className={cn(
              "fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out",
              "w-[280px] md:w-[260px]",
              sidebarOpen ? "translate-x-0" : "-translate-x-full",
              "md:translate-x-0",
              isCollapsed && "md:w-[72px]"
            )}
          >
        {/* Collapse/Expand Toggle - Desktop only, positioned on the right edge */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          className="hidden md:flex absolute -right-3 top-4 z-50 h-6 w-6 rounded-full border bg-background shadow-sm hover:bg-accent transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Icon size="sm">
            {isCollapsed ? (
              <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
            )}
          </Icon>
        </Button>

        <ScrollArea className="h-full">
          <div className="px-2 py-4">
            {!isCollapsed && (
              <div className="mb-4 px-4">
                <h3 className="font-semibold">
                  Hey {vendorName.split(' ')[0] || vendorName}
                </h3>
              </div>
            )}
            <nav className="flex flex-col gap-2" aria-label="Navigation menu">
              {navItems.filter(item => item && item.href).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeSidebar}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    isActive(item.href)
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    isCollapsed && "md:justify-center"
                  )}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  aria-label={item.title}
                >
                  {item.icon}
                  {!isCollapsed && (
                    <>
                      <span className="transition-opacity">{item.title}</span>
                      {item.title === "Profile" && !profileComplete && (
                        <span className="ml-auto flex h-2 w-2 rounded-full bg-red-500" aria-label="Profile incomplete"></span>
                      )}
                      {item.title === "Help" && unreadNotifications > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="ml-auto h-5 min-w-5 flex items-center justify-center p-0 text-[10px]"
                          aria-label={`${unreadNotifications} unread notifications`}
                        >
                          {unreadNotifications > 99 ? "99+" : unreadNotifications}
                        </Badge>
                      )}
                    </>
                  )}
                </Link>
              ))}
              {hasCollectorAccess && (
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    isCollapsed ? "md:justify-center" : "justify-start"
                  )}
                  onClick={async () => {
                    closeSidebar()
                    try {
                      const response = await fetch("/api/auth/vendor/switch-to-collector", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                      })
                      if (response.ok) {
                        router.push("/collector/dashboard")
                      } else {
                        const errorData = await response.json().catch(() => ({}))
                        console.error("Failed to switch to collector:", errorData)
                      }
                    } catch (error) {
                      console.error("Error switching to collector:", error)
                    }
                  }}
                >
                  <Icon size="md"><Package className="h-5 w-5" /></Icon>
                  {!isCollapsed && <span className="transition-opacity">Collector Dashboard</span>}
                </Button>
              )}
            </nav>
          </div>
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 border-t p-4">
          <Button
            variant="outline"
            className={cn(
              "w-full text-sm font-medium transition-colors hover:bg-destructive/10 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              isCollapsed ? "md:justify-center md:px-2" : "justify-start"
            )}
            onClick={handleLogout}
            aria-label="Logout"
          >
            <Icon size="sm" className={cn(isCollapsed ? "" : "mr-2")}>
              <ArrowRightOnRectangleIcon className="h-4 w-4" aria-hidden="true" />
            </Icon>
            {!isCollapsed && <span>Logout</span>}
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
              {item.title === "Profile" && !profileComplete && (
                <span className="absolute top-1 right-1/4 flex h-2 w-2 rounded-full bg-red-500" aria-label="Profile incomplete"></span>
              )}
              {item.title === "Dashboard" && unreadNotifications > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute top-1 right-1/2 translate-x-1/2 h-4 min-w-4 flex items-center justify-center p-0 text-[9px]"
                  aria-label={`${unreadNotifications} unread notifications`}
                >
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </Badge>
              )}
              {item.title === "Profile" && unreadMessages > 0 && (
                <Badge 
                  variant="secondary" 
                  className="absolute top-1 right-1/2 translate-x-1/2 h-4 min-w-4 flex items-center justify-center p-0 text-[9px]"
                  aria-label={`${unreadMessages} unread messages`}
                >
                  {unreadMessages > 99 ? "99+" : unreadMessages}
                </Badge>
              )}
              {isActive(item.href) && (
                <span className="absolute bottom-0 left-1/2 w-1/2 h-0.5 bg-primary transform -translate-x-1/2"></span>
              )}
            </Link>
          ))}
        </div>
      </nav>

      {/* Unified Search */}
      <UnifiedSearch 
        dashboard="vendor" 
        open={searchOpen} 
        onOpenChange={setSearchOpen} 
      />

      <Toaster />
    </>
  )
}
