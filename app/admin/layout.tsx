"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { useState } from "react"
import {
  Layers,
  Settings,
  BarChart3,
  RefreshCw,
  Clock,
  AlertTriangle,
  Zap,
  BadgeIcon as Certificate,
  Instagram,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { LogoutButton } from "./logout-button"

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { href: "/admin", label: "Edition Sync", icon: RefreshCw },
    { href: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/admin/settings", label: "Settings", icon: Settings },
    { href: "/admin/shopify-sync", label: "Shopify Sync", icon: Clock },
    { href: "/admin/missing-orders", label: "Missing Orders", icon: AlertTriangle },
    { href: "/admin/test-connections", label: "Test Connections", icon: Zap },
    { href: "/admin/certificates", label: "Certificates", icon: Certificate },
    { href: "/admin/instagram/profiles", label: "Instagram Management", icon: Instagram },
  ]

  return (
    <div className="flex min-h-screen">
      {/* Mobile Menu */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="md:hidden absolute top-2 left-2" aria-label="Open menu">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 pt-14">
          <div className="flex flex-col h-full">
            <div className="flex h-14 items-center border-b px-4">
              <Link href="/admin" className="flex items-center font-semibold">
                <Layers className="mr-2 h-5 w-5" />
                <span>Admin Dashboard</span>
              </Link>
            </div>
            <nav className="flex-1 space-y-1 p-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    pathname === item.href ? "bg-accent text-accent-foreground" : "",
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="p-2 border-t">
              <LogoutButton />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sidebar (Hidden on Mobile) */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 border-r bg-background">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/admin" className="flex items-center font-semibold">
            <Layers className="mr-2 h-5 w-5" />
            <span>Admin Dashboard</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname === item.href ? "bg-accent text-accent-foreground" : "",
              )}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-2 border-t">
          <LogoutButton />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col md:pl-64 w-full">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
