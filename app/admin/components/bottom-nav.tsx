"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { HomeIcon, CubeIcon, ShoppingCartIcon, AcademicCapIcon, Cog6ToothIcon, DocumentTextIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline"
import { Icon } from "@/components/icon"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    {
      title: "Home",
      href: "/admin/dashboard",
      icon: <Icon size="md"><HomeIcon className="h-5 w-5" /></Icon>,
    },
    {
      title: "Products",
      href: "/admin/sync-products",
      icon: <Icon size="md"><CubeIcon className="h-5 w-5" /></Icon>,
    },
    {
      title: "Orders",
      href: "/admin/missing-orders",
      icon: <Icon size="md"><ShoppingCartIcon className="h-5 w-5" /></Icon>,
    },
    {
      title: "Certs",
      href: "/admin/certificates",
      icon: <Icon size="md"><AcademicCapIcon className="h-5 w-5" /></Icon>,
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: <Icon size="md"><Cog6ToothIcon className="h-5 w-5" /></Icon>,
    },
    {
      title: "Tax Reporting",
      href: "/admin/tax-reporting",
      icon: <Icon size="md"><DocumentTextIcon className="h-5 w-5" /></Icon>,
    },
    {
      title: "CRM",
      href: "/admin/crm",
      icon: <Icon size="md"><ChatBubbleLeftRightIcon className="h-5 w-5" /></Icon>,
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
