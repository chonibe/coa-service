"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"


import { X, Home, Image as ImageIcon, Lock, BarChart3, Wallet, ShoppingBag, MessageSquare, UserCircle, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from "@/components/ui"
interface PageTip {
  title: string
  description: string
  icon: React.ReactNode
  highlight?: string
}

const PAGE_TIPS: Record<string, PageTip> = {
  "/vendor/dashboard": {
    title: "Welcome to your dashboard! 👋",
    description: "Here you'll see your sales, revenue, and recent activity at a glance. Use the sidebar to navigate to different sections.",
    icon: <Home className="h-5 w-5" />,
    highlight: "Your business overview",
  },
  "/vendor/dashboard/products": {
    title: "Manage your artworks 🎨",
    description: "View all your products, check their status, and submit new artworks for review. You can also track submissions here.",
    icon: <ImageIcon className="h-5 w-5" />,
    highlight: "Your product catalog",
  },
  "/vendor/dashboard/series": {
    title: "Create exclusive series 🔒",
    description: "Series let you group artworks together and offer them as limited collections. Perfect for special releases!",
    icon: <Lock className="h-5 w-5" />,
    highlight: "Limited collections",
  },
  "/vendor/dashboard/analytics": {
    title: "Track your performance 📊",
    description: "Dive deep into your sales data, see which products perform best, and understand your revenue trends over time.",
    icon: <BarChart3 className="h-5 w-5" />,
    highlight: "Data insights",
  },
  "/vendor/dashboard/payouts": {
    title: "Your earnings 💰",
    description: "View all your payouts, track pending payments, and see your payment history. Make sure your payment info is set up!",
    icon: <Wallet className="h-5 w-5" />,
    highlight: "Payment tracking",
  },
  "/vendor/dashboard/store": {
    title: "Your vendor store 🛍️",
    description: "Browse products available for purchase, manage your balance, and view your purchase history here.",
    icon: <ShoppingBag className="h-5 w-5" />,
    highlight: "Internal marketplace",
  },
  "/vendor/dashboard/messages": {
    title: "Stay connected 💬",
    description: "Communicate with the team, get updates on your submissions, and receive important notifications.",
    icon: <MessageSquare className="h-5 w-5" />,
    highlight: "Team communication",
  },
  "/vendor/dashboard/profile": {
    title: "Your profile ⚙️",
    description: "Update your information, manage settings, and customize your vendor profile. Keep your details up to date!",
    icon: <UserCircle className="h-5 w-5" />,
    highlight: "Account settings",
  },
  "/vendor/dashboard/help": {
    title: "Need help? 🤝",
    description: "Find answers to common questions, learn about features, and get support when you need it.",
    icon: <HelpCircle className="h-5 w-5" />,
    highlight: "Support & guides",
  },
}

export function PageOnboardingWizard() {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [vendorName, setVendorName] = useState<string>("")

  useEffect(() => {
    // Get vendor name for personalization
    const fetchVendorName = async () => {
      try {
        const response = await fetch("/api/vendor/profile", {
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          setVendorName(data.vendor?.vendor_name || "")
        }
      } catch (error) {
        console.error("Error fetching vendor name:", error)
      }
    }

    fetchVendorName()

    // Normalize pathname - remove trailing slashes and handle dynamic routes
    const normalizedPath = pathname.replace(/\/$/, "")
    
    // For dynamic routes like /vendor/dashboard/products/create, check parent route
    let pageKey = normalizedPath
    if (normalizedPath.includes("/create") || normalizedPath.includes("/edit/")) {
      // For create/edit pages, use the parent page tip
      const parentPath = normalizedPath.split("/").slice(0, -1).join("/")
      pageKey = parentPath
    }

    // Check if this page has been seen before
    const seenKey = `vendor_onboarding_seen_${normalizedPath}`
    const hasSeen = localStorage.getItem(seenKey) === "true"
    
    // Check if user has dismissed onboarding globally
    const globalDismissKey = "vendor_onboarding_global_dismiss"
    const globalDismissed = localStorage.getItem(globalDismissKey) === "true"

    // Show wizard if:
    // 1. Page has a tip defined (either exact match or parent page)
    // 2. User hasn't seen this page before
    // 3. User hasn't globally dismissed onboarding
    const hasTip = PAGE_TIPS[normalizedPath] || PAGE_TIPS[pageKey]
    if (hasTip && !hasSeen && !globalDismissed) {
      // Small delay for smooth entrance
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setIsDismissed(true)
    }
  }, [pathname])

  const handleGotIt = () => {
    // Mark this page as seen
    const normalizedPath = pathname.replace(/\/$/, "")
    const seenKey = `vendor_onboarding_seen_${normalizedPath}`
    localStorage.setItem(seenKey, "true")
    setIsVisible(false)
    setIsDismissed(true)
  }

  const handleDismiss = () => {
    // Mark this page as seen
    const normalizedPath = pathname.replace(/\/$/, "")
    const seenKey = `vendor_onboarding_seen_${normalizedPath}`
    localStorage.setItem(seenKey, "true")
    setIsVisible(false)
    setIsDismissed(true)
  }

  const handleDismissAll = () => {
    // Mark all pages as seen and set global dismiss
    Object.keys(PAGE_TIPS).forEach((path) => {
      localStorage.setItem(`vendor_onboarding_seen_${path}`, "true")
    })
    localStorage.setItem("vendor_onboarding_global_dismiss", "true")
    setIsVisible(false)
    setIsDismissed(true)
  }

  // Normalize pathname for tip lookup
  const normalizedPath = pathname.replace(/\/$/, "")
  let pageKey = normalizedPath
  if (normalizedPath.includes("/create") || normalizedPath.includes("/edit/")) {
    const parentPath = normalizedPath.split("/").slice(0, -1).join("/")
    pageKey = parentPath
  }

  const tip = PAGE_TIPS[normalizedPath] || PAGE_TIPS[pageKey]

  if (isDismissed || !isVisible || !tip) {
    return null
  }
  const greeting = vendorName ? `Hey ${vendorName.split(' ')[0]}!` : "Hey there!"

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-500",
        !isVisible && "hidden"
      )}
    >
      <Card className="shadow-2xl border-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-transparent dark:from-blue-950/20 dark:via-indigo-950/20 pointer-events-none" />
        
        {/* Gentle glow effect */}
        <div className="absolute -top-2 -right-2 w-24 h-24 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-2xl animate-pulse" />
        
        <CardHeader className="relative z-10 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="relative mt-0.5">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-lg blur-sm opacity-60" />
                <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg">
                  {tip.icon}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                  {greeting}
                </CardTitle>
                <CardDescription className="text-sm mt-1 text-slate-600 dark:text-slate-400">
                  {tip.title}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-7 w-7 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shrink-0"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 pt-0 pb-4">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {tip.description}
          </p>
          {tip.highlight && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">
              💡 {tip.highlight}
            </p>
          )}
          
          <div className="flex items-center gap-2 mt-4">
            <Button
              onClick={handleGotIt}
              size="sm"
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
            >
              Got it!
            </Button>
            <Button
              onClick={handleDismissAll}
              variant="ghost"
              size="sm"
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Don't show again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

