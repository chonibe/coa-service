"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  BarChart,
  Settings,
  Package,
  ShoppingCart,
  Award,
  Tag,
  Menu,
  X,
  Home,
  Store,
  Truck,
  DollarSign,
  RefreshCw,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Toaster } from "@/components/ui/toaster"
import LogoutButton from "./logout-button"
import { useMobile } from "@/hooks/use-mobile"
import { fadeIn, slideUp, slideInFromRight } from "@/lib/motion-variants"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  submenu?: NavItem[]
  expanded?: boolean
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isMobile = useMobile()
  const [open, setOpen] = useState(false)
  const [navItems, setNavItems] = useState<NavItem[]>([
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "Products",
      href: "/admin/sync-products",
      icon: <Package className="h-5 w-5" />,
      submenu: [
        {
          title: "Sync Products",
          href: "/admin/sync-products",
          icon: <Package className="h-4 w-4" />,
        },
        {
          title: "Product Editions",
          href: "/admin/product-editions",
          icon: <Award className="h-4 w-4" />,
        },
        {
          title: "Sync Vendor Names",
          href: "/admin/sync-vendor-names",
          icon: <RefreshCw className="h-4 w-4" />,
        },
      ],
      expanded: false,
    },
    {
      title: "Orders",
      href: "/admin/missing-orders",
      icon: <ShoppingCart className="h-5 w-5" />,
      submenu: [
        {
          title: "Missing Orders",
          href: "/admin/missing-orders",
          icon: <ShoppingCart className="h-4 w-4" />,
        },
        {
          title: "Shopify Sync",
          href: "/admin/shopify-sync",
          icon: <Store className="h-4 w-4" />,
        },
      ],
      expanded: false,
    },
    {
      title: "Vendors",
      href: "/admin/vendors",
      icon: <Truck className="h-5 w-5" />,
      submenu: [
        {
          title: "Vendor List",
          href: "/admin/vendors",
          icon: <Truck className="h-4 w-4" />,
        },
        {
          title: "Payouts",
          href: "/admin/vendors/payouts",
          icon: <DollarSign className="h-4 w-4" />,
        },
      ],
      expanded: false,
    },
    {
      title: "Certificates",
      href: "/admin/certificates",
      icon: <Award className="h-5 w-5" />,
      submenu: [
        {
          title: "Management",
          href: "/admin/certificates/management",
          icon: <Award className="h-4 w-4" />,
        },
        {
          title: "Bulk Operations",
          href: "/admin/certificates/bulk",
          icon: <Award className="h-4 w-4" />,
        },
        {
          title: "Access Logs",
          href: "/admin/certificates/logs",
          icon: <BarChart className="h-4 w-4" />,
        },
        {
          title: "NFC Tags",
          href: "/admin/certificates/nfc",
          icon: <Tag className="h-4 w-4" />,
        },
      ],
      expanded: false,
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ])

  // Toggle submenu expanded state
  const toggleSubmenu = (index: number) => {
    setNavItems((prev) => prev.map((item, i) => (i === index ? { ...item, expanded: !item.expanded } : item)))
  }

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
    <motion.div className="flex min-h-screen flex-col" initial="hidden" animate="visible" variants={fadeIn}>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6 backdrop-blur-md bg-background/90">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <motion.button
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-10 md:hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </motion.button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px] pr-0 rounded-r-2xl">
            <div className="flex flex-col h-full">
              <div className="flex items-center border-b h-16 px-6">
                <Link href="/admin" className="flex items-center gap-2 font-semibold">
                  <Award className="h-6 w-6" />
                  <span>Admin Dashboard</span>
                </Link>
                <motion.button
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10 ml-auto"
                  onClick={() => setOpen(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </motion.button>
              </div>
              <ScrollArea className="flex-1">
                <motion.div className="px-2 py-4" variants={staggerContainer} initial="hidden" animate="visible">
                  <nav className="flex flex-col gap-2">
                    {navItems.map((item, index) => (
                      <motion.div key={item.href} className="flex flex-col" variants={slideInFromRight}>
                        {item.submenu ? (
                          <>
                            <motion.button
                              onClick={() => toggleSubmenu(index)}
                              className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium ${
                                isActive(item)
                                  ? "bg-accent text-accent-foreground"
                                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                              }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex items-center gap-3">
                                {item.icon}
                                <span>{item.title}</span>
                              </div>
                              <motion.svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                                animate={{ rotate: item.expanded ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </motion.svg>
                            </motion.button>
                            <AnimatePresence>
                              {item.expanded && (
                                <motion.div
                                  className="mt-1 pl-6 space-y-1"
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  {item.submenu.map((subItem) => (
                                    <motion.div key={subItem.href} variants={slideUp}>
                                      <Link
                                        href={subItem.href}
                                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                                          pathname === subItem.href
                                            ? "bg-accent text-accent-foreground font-medium"
                                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                        }`}
                                      >
                                        {subItem.icon}
                                        <span>{subItem.title}</span>
                                      </Link>
                                    </motion.div>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </>
                        ) : (
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
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
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </nav>
                </motion.div>
              </ScrollArea>
              <div className="border-t p-4">
                <LogoutButton className="w-full" />
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <Award className="h-6 w-6" />
          <span className="hidden md:inline-block">Admin Dashboard</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <LogoutButton className="hidden md:flex" />
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-[250px] flex-col border-r md:flex">
          <ScrollArea className="flex-1">
            <motion.div
              className="flex flex-col gap-2 p-4"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <nav className="grid gap-2">
                {navItems.map((item, index) => (
                  <motion.div key={item.href} className="flex flex-col" variants={slideInFromRight}>
                    {item.submenu ? (
                      <>
                        <motion.button
                          onClick={() => toggleSubmenu(index)}
                          className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium ${
                            isActive(item)
                              ? "bg-accent text-accent-foreground"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center gap-3">
                            {item.icon}
                            <span>{item.title}</span>
                          </div>
                          <motion.svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                            animate={{ rotate: item.expanded ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </motion.svg>
                        </motion.button>
                        <AnimatePresence>
                          {item.expanded && (
                            <motion.div
                              className="mt-1 pl-6 space-y-1"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              {item.submenu.map((subItem) => (
                                <motion.div key={subItem.href} variants={slideUp}>
                                  <Link
                                    href={subItem.href}
                                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                                      pathname === subItem.href
                                        ? "bg-accent text-accent-foreground font-medium"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    }`}
                                  >
                                    {subItem.icon}
                                    <span>{subItem.title}</span>
                                  </Link>
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
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
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </nav>
            </motion.div>
          </ScrollArea>
        </aside>
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <Toaster />
    </motion.div>
  )
}
