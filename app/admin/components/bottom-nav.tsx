"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Package, ShoppingCart, Award, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    {
      title: "Home",
      href: "/admin/dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "Products",
      href: "/admin/sync-products",
      icon: <Package className="h-5 w-5" />,
    },
    {
      title: "Orders",
      href: "/admin/missing-orders",
      icon: <ShoppingCart className="h-5 w-5" />,
    },
    {
      title: "Certs",
      href: "/admin/certificates",
      icon: <Award className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  // Check if a path is active (exact match or starts with for section pages)
  const isActive = (href: string) => {
    if (pathname === href) return true
    if (href !== "/admin/dashboard" && pathname.startsWith(href)) return true
    return false
  }

  return (
    <div className="fixed bottom-0 left-0 z-40 w-full border-t bg-background md:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full",
              isActive(item.href) ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.title}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
