"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Instagram, LayoutDashboard, ShoppingBag, Tag, Settings, Users, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"

interface SidebarNavProps {
  className?: string
}

export function SidebarNav({ className }: SidebarNavProps) {
  const pathname = usePathname()

  const navItems = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      title: "Orders",
      href: "/admin/orders",
      icon: ShoppingBag,
    },
    {
      title: "Certificates",
      href: "/admin/certificates",
      icon: FileText,
    },
    {
      title: "NFC Tags",
      href: "/admin/tags",
      icon: Tag,
    },
    {
      title: "Customers",
      href: "/admin/customers",
      icon: Users,
    },
    {
      title: "Instagram URLs",
      href: "/admin/instagram-dashboard",
      icon: Instagram,
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ]

  return (
    <SidebarMenu className={cn("px-2", className)}>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
            <Link href={item.href}>
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
