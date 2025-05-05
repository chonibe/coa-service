"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Toaster } from "@/components/ui/toaster"
import { useMobile } from "@/hooks/use-mobile"
import { LogOut, Menu, Home, BarChart, Settings, Award, Package, DollarSign, MessageSquare, X } from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
}

export function VendorSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useMobile()
  const [open, setOpen] = useState(false)
  const [vendorName, setVendorName] = useState<string>("Vendor")
  const [profileComplete, setProfileComplete] = useState<boolean>(true)

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

  return (
    <>
      {/* Fixed header with hamburger menu */}
      <header className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="flex md:flex">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px] pr-0 z-50">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between border-b h-16 px-6">
                <Link href="/vendor/dashboard" className="flex items-center gap-2 font-semibold">
                  <Award className="h-6 w-6" />
                  <span className="font-medium">Vendor Portal</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="px-2 py-4">
                  <div className="mb-4 px-4">
                    <p className="text-sm font-medium">Logged in as</p>
                    <h3 className="font-semibold">{vendorName}</h3>
                  </div>
                  <nav className="flex flex-col gap-2">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                          pathname === item.href
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        {item.icon}
                        <span>{item.title}</span>
                        {item.title === "Settings" && !profileComplete && (
                          <span className="ml-auto flex h-2 w-2 rounded-full bg-red-500"></span>
                        )}
                      </Link>
                    ))}
                  </nav>
                </div>
              </ScrollArea>
              <div className="border-t p-4">
                <Button variant="outline" className="w-full justify-start text-sm font-medium" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <Link href="/vendor/dashboard" className="flex items-center gap-2 font-semibold">
          <Award className="h-6 w-6" />
          <span className={isMobile ? "sr-only" : "inline-block"}>Vendor Portal</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" className="hidden md:flex" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      {/* Mobile bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t md:hidden">
        <div className="grid grid-cols-4">
          {mobileNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-3 ${
                pathname === item.href ? "text-primary" : "text-muted-foreground"
              } relative`}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.title}</span>
              {item.title === "Settings" && !profileComplete && (
                <span className="absolute top-2 right-1/4 flex h-2 w-2 rounded-full bg-red-500"></span>
              )}
            </Link>
          ))}
        </div>
      </div>

      <Toaster />
    </>
  )
}
