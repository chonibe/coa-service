"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Settings, Package, ShoppingCart, Award, Menu, X, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Toaster } from "@/components/ui/toaster"
import LogoutButton from "./logout-button"
import { useMobile } from "@/hooks/use-mobile"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  submenu?: NavItem[]
  expanded?: boolean
}

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isMobile = useMobile()
  const [open, setOpen] = useState(false)
  const [navItems, setNavItems] = useState<NavItem[]>([
    {
      title: "Dashboard",
      href: "/vendor",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "Products",
      href: "/vendor/products",
      icon: <Package className="h-5 w-5" />,
    },
    {
      title: "Sales",
      href: "/vendor/sales",
      icon: <ShoppingCart className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/vendor/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ])

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
                <Link href="/vendor" className="flex items-center gap-2 font-semibold">
                  <Award className="h-6 w-6" />
                  <span>Vendor Dashboard</span>
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
        <Link href="/vendor" className="flex items-center gap-2 font-semibold">
          <Award className="h-6 w-6" />
          <span className="hidden md:inline-block">Vendor Dashboard</span>
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
                  </div>
                ))}
              </nav>
            </div>
          </ScrollArea>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
      <Toaster />
    </div>
  )
}
