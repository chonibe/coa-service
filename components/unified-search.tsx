"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

import { 
  Home, Package, Image, BarChart3, DollarSign, User, HelpCircle,
  ShoppingCart, Users, FileText, Settings, MessageSquare, Bell,
  Palette, Grid3x3, Search as SearchIcon, ExternalLink, Building2,
  Kanban, Inbox, List, Shield, Calendar, Tag, Warehouse, Link2,
  Calculator, TrendingUp, Award, Zap, Eye
} from "lucide-react"

interface SearchResult {
  title: string
  href: string
  group: string
  description?: string
  icon?: React.ReactNode
  keywords?: string[]
}

interface UnifiedSearchProps {
  dashboard: 'admin' | 'vendor' | 'collector'
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ADMIN_PAGES: SearchResult[] = [
  // Overview
  { title: "Dashboard", href: "/admin/dashboard", group: "Overview", icon: <Home className="h-4 w-4" />, keywords: ["home", "main"] },
  { title: "Release Notes", href: "/admin/release-notes", group: "Overview", icon: <FileText className="h-4 w-4" />, keywords: ["updates", "changelog", "versions"] },
  
  // Products
  { title: "Sync Products", href: "/admin/sync-products", group: "Products", icon: <Package className="h-4 w-4" />, keywords: ["shopify", "import"] },
  { title: "Product Submissions", href: "/admin/products/submissions", group: "Products", icon: <Package className="h-4 w-4" />, keywords: ["pending", "review"] },
  { title: "Product Editions", href: "/admin/product-editions", group: "Products", icon: <Grid3x3 className="h-4 w-4" />, keywords: ["variants", "editions"] },
  { title: "Sync Vendor Names", href: "/admin/sync-vendor-names", group: "Products", icon: <Users className="h-4 w-4" />, keywords: ["artists", "creators"] },
  
  // Orders & Operations
  { title: "All Orders", href: "/admin/orders", group: "Orders & Ops", icon: <ShoppingCart className="h-4 w-4" />, keywords: ["purchases", "sales"] },
  { title: "Missing Orders", href: "/admin/missing-orders", group: "Orders & Ops", icon: <SearchIcon className="h-4 w-4" />, keywords: ["lost", "unfound"] },
  { title: "Shopify Sync", href: "/admin/shopify-sync", group: "Orders & Ops", icon: <Zap className="h-4 w-4" />, keywords: ["integration", "import"] },
  { title: "Warehouse Orders", href: "/admin/warehouse/orders", group: "Orders & Ops", icon: <Warehouse className="h-4 w-4" />, keywords: ["fulfillment", "shipping"] },
  { title: "Inventory", href: "/admin/warehouse/inventory", group: "Orders & Ops", icon: <Package className="h-4 w-4" />, keywords: ["stock", "warehouse"] },
  { title: "Manage Links", href: "/admin/warehouse/links", group: "Orders & Ops", icon: <Link2 className="h-4 w-4" />, keywords: ["connections", "mappings"] },
  
  // Vendors & Payouts
  { title: "Vendor List", href: "/admin/vendors", group: "Vendors & Payouts", icon: <Users className="h-4 w-4" />, keywords: ["artists", "sellers"] },
  { title: "Payout Manager", href: "/admin/vendors/payouts/admin", group: "Vendors & Payouts", icon: <DollarSign className="h-4 w-4" />, keywords: ["payments", "earnings"] },
  { title: "Manual Payouts", href: "/admin/vendors/payouts/manual", group: "Vendors & Payouts", icon: <Calculator className="h-4 w-4" />, keywords: ["custom", "one-time"] },
  { title: "Payout Calculator", href: "/admin/vendors/payouts/calculate", group: "Vendors & Payouts", icon: <Calculator className="h-4 w-4" />, keywords: ["estimate", "calculate"] },
  { title: "Payout Settings", href: "/admin/vendors/payouts", group: "Vendors & Payouts", icon: <Settings className="h-4 w-4" />, keywords: ["configuration", "setup"] },
  
  // Reports
  { title: "Tax Reporting", href: "/admin/tax-reporting", group: "Reports", icon: <FileText className="h-4 w-4" />, keywords: ["1099", "taxes", "irs"] },
  { title: "Sales Reports", href: "/admin/reports/sales", group: "Reports", icon: <TrendingUp className="h-4 w-4" />, keywords: ["analytics", "revenue"] },
  
  // Certificates
  { title: "Certificate Management", href: "/admin/certificates/management", group: "Certificates", icon: <Award className="h-4 w-4" />, keywords: ["coa", "authenticity"] },
  { title: "Bulk Operations", href: "/admin/certificates/bulk", group: "Certificates", icon: <Grid3x3 className="h-4 w-4" />, keywords: ["batch", "mass"] },
  { title: "NFC Tags", href: "/admin/certificates/nfc", group: "Certificates", icon: <Tag className="h-4 w-4" />, keywords: ["chips", "tags", "nfc"] },
  { title: "Certificate Preview", href: "/admin/certificates/preview", group: "Certificates", icon: <Eye className="h-4 w-4" />, keywords: ["view", "template"] },
  
  // CRM
  { title: "Collectors", href: "/admin/collectors", group: "CRM", icon: <Users className="h-4 w-4" />, keywords: ["customers", "buyers"] },
  { title: "People", href: "/admin/crm/people", group: "CRM", icon: <User className="h-4 w-4" />, keywords: ["contacts", "individuals"] },
  { title: "Companies", href: "/admin/crm/companies", group: "CRM", icon: <Building2 className="h-4 w-4" />, keywords: ["organizations", "businesses"] },
  { title: "Kanban", href: "/admin/crm/kanban", group: "CRM", icon: <Kanban className="h-4 w-4" />, keywords: ["board", "pipeline"] },
  { title: "Inbox", href: "/admin/crm/inbox", group: "CRM", icon: <Inbox className="h-4 w-4" />, keywords: ["messages", "conversations"] },
  { title: "Lists", href: "/admin/crm/lists", group: "CRM", icon: <List className="h-4 w-4" />, keywords: ["segments", "groups"] },
  { title: "CRM Settings", href: "/admin/crm/settings", group: "CRM", icon: <Settings className="h-4 w-4" />, keywords: ["configuration", "setup"] },
  
  // Preview & Settings
  { title: "Customer View", href: "/admin/preview/customer", group: "Preview", icon: <Eye className="h-4 w-4" />, keywords: ["test", "demo"] },
  { title: "Settings", href: "/admin/settings", group: "Settings", icon: <Settings className="h-4 w-4" />, keywords: ["configuration", "preferences"] },
]

const VENDOR_PAGES: SearchResult[] = [
  { title: "Dashboard", href: "/vendor/dashboard", group: "Main", icon: <Home className="h-4 w-4" />, keywords: ["home", "overview"] },
  { title: "Artworks", href: "/vendor/dashboard/products", group: "Products", icon: <Palette className="h-4 w-4" />, keywords: ["products", "items", "art"] },
  { title: "Create Artwork", href: "/vendor/dashboard/products/create", group: "Products", icon: <Package className="h-4 w-4" />, keywords: ["new", "add"] },
  { title: "Media Library", href: "/vendor/dashboard/media-library", group: "Content", icon: <Image className="h-4 w-4" />, keywords: ["images", "photos", "gallery"] },
  { title: "Series", href: "/vendor/dashboard/series", group: "Content", icon: <Grid3x3 className="h-4 w-4" />, keywords: ["collections", "groups"] },
  { title: "Create Series", href: "/vendor/dashboard/series/create", group: "Content", icon: <Grid3x3 className="h-4 w-4" />, keywords: ["new", "collection"] },
  { title: "Analytics", href: "/vendor/dashboard/analytics", group: "Insights", icon: <BarChart3 className="h-4 w-4" />, keywords: ["stats", "metrics", "data"] },
  { title: "Payouts", href: "/vendor/dashboard/payouts", group: "Finance", icon: <DollarSign className="h-4 w-4" />, keywords: ["earnings", "payments", "money"] },
  { title: "Profile", href: "/vendor/dashboard/profile", group: "Account", icon: <User className="h-4 w-4" />, keywords: ["settings", "account", "info", "preferences", "configuration"] },
  { title: "Messages", href: "/vendor/dashboard/messages", group: "Communication", icon: <MessageSquare className="h-4 w-4" />, keywords: ["chat", "inbox"] },
  { title: "Notifications", href: "/vendor/dashboard/notifications", group: "Communication", icon: <Bell className="h-4 w-4" />, keywords: ["alerts", "updates"] },
  { title: "Help", href: "/vendor/dashboard/help", group: "Support", icon: <HelpCircle className="h-4 w-4" />, keywords: ["support", "faq", "guide"] },
  { title: "Store", href: "/vendor/dashboard/store", group: "Main", icon: <Package className="h-4 w-4" />, keywords: ["shop", "storefront"] },
]

const COLLECTOR_PAGES: SearchResult[] = [
  { title: "Dashboard", href: "/collector/dashboard", group: "Main", icon: <Home className="h-4 w-4" />, keywords: ["home", "overview", "collection"] },
  { title: "Profile", href: "/collector/profile", group: "Account", icon: <User className="h-4 w-4" />, keywords: ["settings", "account", "info"] },
  { title: "Comprehensive Profile", href: "/collector/profile/comprehensive", group: "Account", icon: <User className="h-4 w-4" />, keywords: ["detailed", "full"] },
  { title: "Discover", href: "/collector/discover", group: "Explore", icon: <SearchIcon className="h-4 w-4" />, keywords: ["browse", "find", "explore"] },
]

export function UnifiedSearch({ dashboard, open, onOpenChange }: UnifiedSearchProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`${dashboard}-recent-searches`)
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored))
      } catch (e) {
        console.error("Failed to load recent searches:", e)
      }
    }
  }, [dashboard])

  // Get pages for current dashboard
  const pages = useMemo(() => {
    switch (dashboard) {
      case 'admin':
        return ADMIN_PAGES
      case 'vendor':
        return VENDOR_PAGES
      case 'collector':
        return COLLECTOR_PAGES
      default:
        return []
    }
  }, [dashboard])

  // Filter pages based on search query
  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return pages

    const query = searchQuery.toLowerCase()
    return pages.filter(page => {
      const titleMatch = page.title.toLowerCase().includes(query)
      const groupMatch = page.group.toLowerCase().includes(query)
      const keywordMatch = page.keywords?.some(k => k.toLowerCase().includes(query))
      const descMatch = page.description?.toLowerCase().includes(query)
      
      return titleMatch || groupMatch || keywordMatch || descMatch
    })
  }, [pages, searchQuery])

  // Group filtered pages
  const groupedPages = useMemo(() => {
    return filteredPages.reduce<Record<string, SearchResult[]>>((acc, page) => {
      if (!acc[page.group]) acc[page.group] = []
      acc[page.group].push(page)
      return acc
    }, {})
  }, [filteredPages])

  const handleSelect = (href: string, title: string) => {
    // Save to recent searches
    const updated = [title, ...recentSearches.filter(s => s !== title)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem(`${dashboard}-recent-searches`, JSON.stringify(updated))

    router.push(href)
    onOpenChange(false)
    setSearchQuery("")
  }

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, onOpenChange])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search pages..." 
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>No pages found.</CommandEmpty>
        
        {!searchQuery && recentSearches.length > 0 && (
          <>
            <CommandGroup heading="Recent">
              {recentSearches.map((search) => {
                const page = pages.find(p => p.title === search)
                if (!page) return null
                
                return (
                  <CommandItem 
                    key={page.href} 
                    value={page.title}
                    onSelect={() => handleSelect(page.href, page.title)}
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-2">
                        {page.icon}
                        <span>{page.title}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {page.group}
                      </Badge>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {Object.entries(groupedPages).map(([groupName, groupPages], index) => (
          <div key={groupName}>
            <CommandGroup heading={groupName}>
              {groupPages.map((page) => (
                <CommandItem 
                  key={page.href} 
                  value={page.title}
                  onSelect={() => handleSelect(page.href, page.title)}
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2">
                      {page.icon}
                      <span>{page.title}</span>
                    </div>
                    {page.description && (
                      <span className="text-xs text-muted-foreground hidden md:inline">
                        {page.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {index < Object.keys(groupedPages).length - 1 && <CommandSeparator />}
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  )
}
