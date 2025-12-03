"use client"

import { ReactNode, useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Users, 
  Building2, 
  Inbox, 
  Search, 
  Settings,
  Mail,
  Instagram,
  Facebook,
  MessageCircle,
  ShoppingBag
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GlobalSearch } from "@/components/crm/global-search"
import { Toaster } from "@/components/ui/toaster"

interface CRMLayoutProps {
  children: ReactNode
}

export default function CRMLayout({ children }: CRMLayoutProps) {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Keyboard shortcut for search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const navItems = [
    { href: "/admin/crm/people", label: "People", icon: Users },
    { href: "/admin/crm/companies", label: "Companies", icon: Building2 },
    { href: "/admin/crm/inbox", label: "Inbox", icon: Inbox },
    { href: "/admin/crm/settings", label: "Settings", icon: Settings },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/admin/crm/search?q=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar */}
      <aside className="w-64 border-r bg-muted/40 flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            CRM
          </h2>
        </div>
        
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname?.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Platform Status */}
        <div className="p-4 border-t space-y-2">
          <p className="text-xs font-medium text-muted-foreground mb-2">Connected Platforms</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span>Email</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Instagram className="h-3 w-3" />
              <span>Instagram</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Facebook className="h-3 w-3" />
              <span>Facebook</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MessageCircle className="h-3 w-3" />
              <span>WhatsApp</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShoppingBag className="h-3 w-3" />
              <span>Shopify</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar with Search */}
        <header className="h-16 border-b flex items-center gap-4 px-6">
          <div className="flex-1 max-w-2xl">
            <Button
              variant="outline"
              className="w-full justify-start text-muted-foreground"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="mr-2 h-4 w-4" />
              Search people, companies, conversations...
              <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </div>
        </header>

        {/* Global Search Dialog */}
        <GlobalSearch open={isSearchOpen} onOpenChange={setIsSearchOpen} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  )
}

