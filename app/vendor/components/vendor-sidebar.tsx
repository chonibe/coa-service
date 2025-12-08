"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Toaster } from "@/components/ui/toaster"
import { useMobile } from "@/hooks/use-mobile"
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  HomeIcon,
  ChartBarIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  QuestionMarkCircleIcon,
  UserCircleIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline"
import { Lock, Image } from "lucide-react"
import { CreateMenu } from "./create-menu"
import { Icon } from "@/components/icon"
import { cn } from "@/lib/utils"
import { NotificationCenter } from "@/components/vendor/notification-center"
import { Badge } from "@/components/ui/badge"
import { useSwipeGesture } from "@/components/vendor/mobile-gestures"
import { useRef } from "react"
import { Logo } from "@/components/logo"

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
  const sidebarRef = useRef<HTMLElement>(null)
  
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
      icon: <Icon size="md"><Image className="h-5 w-5" /></Icon>,
    },
    {
      title: "Series",
      href: "/vendor/dashboard/series",
      icon: <Icon size="md"><Lock className="h-5 w-5" /></Icon>,
    },
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
    {
      title: "Messages",
      href: "/vendor/dashboard/messages",
      icon: <Icon size="md"><ChatBubbleLeftRightIcon className="h-5 w-5" /></Icon>,
    },
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
      await fetch("/api/vendor/logout", { method: "POST", credentials: "include" })
      router.push("/login")
    } catch (err) {
      console.error("Logout error:", err)
    }
  }

  // Mobile bottom nav items (limited to 5 for space)
  const mobileNavItems = [
    navItems[0], // Dashboard
    navItems[1], // Artworks
    navItems[2], // Analytics
    navItems[6], // Profile
    navItems[7], // Help
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
        {/* Left: Menu Button, Notifications */}
        <div className="flex items-center gap-2">
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
          <NotificationCenter />
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

        {/* Right: Create Menu */}
        <CreateMenu />
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
              "fixed top-0 left-0 z-50 h-full w-[280px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50 shadow-2xl transition-transform duration-300 ease-in-out transform",
              sidebarOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200/50 dark:border-slate-800/50">
          <Link href="/vendor/dashboard" className="flex items-center gap-2 font-semibold">
            <Logo 
              className="h-8 w-auto object-contain"
              alt="Street Lamp Logo"
            />
            <div className="relative hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg blur-md opacity-50 animate-pulse" />
              <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5 rounded-lg">
                <Icon size="md"><AcademicCapIcon className="h-5 w-5 text-white" /></Icon>
              </div>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeSidebar}
            className="transition-all hover:rotate-90 duration-200 min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Close sidebar"
          >
            <Icon size="md">
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </Icon>
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="px-2 py-4">
            <div className="mb-4 px-4">
              <h3 className="font-semibold">
                Hey {vendorName.split(' ')[0] || vendorName}
              </h3>
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
                  {item.title === "Profile" && !profileComplete && (
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
            <Icon size="sm" className="mr-2">
              <ArrowRightOnRectangleIcon className="h-4 w-4" aria-hidden="true" />
            </Icon>
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
              {item.title === "Profile" && !profileComplete && (
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
