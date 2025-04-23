"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HomeIcon, BoxIcon, CreditCardIcon, LogOutIcon } from "lucide-react"

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const navItems = [
    {
      name: "Dashboard",
      href: "/vendor",
      icon: HomeIcon,
    },
    {
      name: "Products",
      href: "/vendor/products",
      icon: BoxIcon,
    },
    {
      name: "Payouts",
      href: "/vendor/payouts",
      icon: CreditCardIcon,
    },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 border-r">
        <div className="flex h-16 items-center border-b px-6">
          <h2 className="text-lg font-semibold">Vendor Portal</h2>
        </div>
        <nav className="flex flex-col gap-2 p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/50 ${
                pathname === item.href ? "bg-muted" : ""
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
          <form action="/api/vendor/logout" method="POST">
            <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100">
              <LogOutIcon className="h-4 w-4" />
              Sign Out
            </button>
          </form>
        </nav>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  )
}
