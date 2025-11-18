"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BarChart,
  Settings,
  Package,
  ShoppingCart,
  Award,
  Menu,
  X,
  Home,
  Store,
  Truck,
  DollarSign,
  RefreshCw,
  FileText,
  Clock,
  Upload,
  Smartphone,
  Eye,
  User,
  Users,
  Mail,
  Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import LogoutButton from "./logout-button"
import { useMobile } from "@/hooks/use-mobile"
import { BottomNav } from "./components/bottom-nav"
import { Breadcrumb } from "./components/breadcrumb"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  submenu?: NavItem[]
  expanded?: boolean
}

interface AdminShellProps {
  children: React.ReactNode
}

type AdminView = "admin" | "chooser"

type VendorRecord = {
  id: number
  vendor_name: string
  status: string | null
  onboarding_completed: boolean | null
  last_login_at: string | null
  contact_email: string | null
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const isMobile = useMobile()
  const [open, setOpen] = useState(false)
  const [currentSection, setCurrentSection] = useState("Dashboard")
  const [activeView, setActiveView] = useState<AdminView>("admin")
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
          title: "All Orders",
          href: "/admin/orders",
          icon: <ShoppingCart className="h-4 w-4" />,
        },
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
      ],
      expanded: false,
    },
    {
      title: "Payouts",
      href: "/admin/vendors/payouts",
      icon: <DollarSign className="h-5 w-5" />,
      submenu: [
        {
          title: "Payout Manager",
          href: "/admin/vendors/payouts/admin",
          icon: <DollarSign className="h-4 w-4" />,
        },
        {
          title: "Manual Payouts",
          href: "/admin/vendors/payouts/manual",
          icon: <DollarSign className="h-4 w-4" />,
        },
        {
          title: "Payout Calculator",
          href: "/admin/vendors/payouts/calculate",
          icon: <DollarSign className="h-4 w-4" />,
        },
        {
          title: "Payout Settings",
          href: "/admin/vendors/payouts",
          icon: <Settings className="h-4 w-4" />,
        },
        {
          title: "Payout History",
          href: "/admin/vendors/payouts/history",
          icon: <Clock className="h-4 w-4" />,
        },
      ],
      expanded: false,
    },
    {
      title: "Reports",
      href: "/admin/tax-reporting",
      icon: <FileText className="h-5 w-5" />,
      submenu: [
        {
          title: "Tax Reporting",
          href: "/admin/tax-reporting",
          icon: <FileText className="h-4 w-4" />,
        },
        {
          title: "Sales Reports",
          href: "/admin/reports/sales",
          icon: <BarChart className="h-4 w-4" />,
        },
      ],
      expanded: false,
    },
    {
      title: "Certificates",
      icon: <FileText className="h-4 w-4" />,
      submenu: [
        {
          title: "Management",
          href: "/admin/certificates/management",
          icon: <Settings className="h-4 w-4" />,
        },
        {
          title: "Sync",
          href: "/admin/certificates/sync",
          icon: <RefreshCw className="h-4 w-4" />,
        },
        {
          title: "Bulk Operations",
          href: "/admin/certificates/bulk",
          icon: <Upload className="h-4 w-4" />,
        },
        {
          title: "NFC Tags",
          href: "/admin/certificates/nfc",
          icon: <Smartphone className="h-4 w-4" />,
        },
        {
          title: "Preview",
          href: "/admin/certificates/preview",
          icon: <Eye className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Preview",
      icon: <Eye className="h-4 w-4" />,
      submenu: [
        {
          title: "Customer View",
          href: "/admin/preview/customer",
          icon: <User className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ])

  const [isLoadingVendors, setIsLoadingVendors] = useState(false)
  const [vendorRecords, setVendorRecords] = useState<VendorRecord[]>([])
  const [vendorSearch, setVendorSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [switcherError, setSwitcherError] = useState<string | null>(null)
  const [loadingVendorId, setLoadingVendorId] = useState<number | null>(null)
  const [vendorsLoaded, setVendorsLoaded] = useState(false)
  const [editingVendor, setEditingVendor] = useState<VendorRecord | null>(null)
  const [editedEmail, setEditedEmail] = useState("")
  const [savingEmail, setSavingEmail] = useState(false)
  const [impersonateConfirmOpen, setImpersonateConfirmOpen] = useState(false)
  const [pendingImpersonateVendor, setPendingImpersonateVendor] = useState<VendorRecord | null>(null)

  const filteredVendors = useMemo(() => {
    const bySearch = vendorRecords.filter((vendor) =>
      vendor.vendor_name.toLowerCase().includes(vendorSearch.toLowerCase()),
    )

    if (statusFilter === "all") {
      return bySearch
    }

    return bySearch.filter((vendor) => (vendor.status ?? "").toLowerCase() === statusFilter)
  }, [vendorRecords, vendorSearch, statusFilter])

  const openVendorChooser = () => {
    setActiveView("chooser")
    setOpen(false)
  }

  const toggleSubmenu = (index: number) => {
    setNavItems((prev) => prev.map((item, i) => (i === index ? { ...item, expanded: !item.expanded } : item)))
  }

  const isActive = (item: NavItem): boolean => {
    if (pathname === item.href) return true
    if (item.submenu) {
      return item.submenu.some((subItem) => pathname === subItem.href)
    }
    return false
  }

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    const currentNavItem = navItems.find(
      (item) => pathname === item.href || (item.submenu && item.submenu.some((subItem) => pathname === subItem.href)),
    )

    if (currentNavItem) {
      if (currentNavItem.submenu) {
        const currentSubItem = currentNavItem.submenu.find((subItem) => pathname === subItem.href)
        if (currentSubItem) {
          setCurrentSection(`${currentNavItem.title} / ${currentSubItem.title}`)
        } else {
          setCurrentSection(currentNavItem.title)
        }
      } else {
        setCurrentSection(currentNavItem.title)
      }
    } else {
      setCurrentSection("Dashboard")
    }
  }, [pathname, navItems])

  useEffect(() => {
    if (activeView !== "chooser" || vendorsLoaded) return

    const loadVendors = async () => {
      try {
        setIsLoadingVendors(true)
        setSwitcherError(null)
        const response = await fetch("/api/admin/vendors/list?limit=250", { cache: "no-store" })
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(payload.error || "Failed to load vendors")
        }
        const payload = await response.json()
        setVendorRecords(payload.vendors || [])
        setVendorsLoaded(true)
      } catch (error: any) {
        console.error("Failed to load vendors for explorer:", error)
        setSwitcherError(error.message || "Unable to load vendors")
      } finally {
        setIsLoadingVendors(false)
      }
    }

    void loadVendors()
  }, [activeView, vendorsLoaded])

  const handleImpersonateClick = (vendor: VendorRecord) => {
    setPendingImpersonateVendor(vendor)
    setImpersonateConfirmOpen(true)
  }

  const handleImpersonate = async () => {
    if (!pendingImpersonateVendor) return

    const vendor = pendingImpersonateVendor
    setImpersonateConfirmOpen(false)
    setLoadingVendorId(vendor.id)
    setSwitcherError(null)
    try {
      const response = await fetch("/api/auth/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId: vendor.id }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || "Unable to switch vendor")
      }

      toast({
        title: "Viewing as Vendor",
        description: `You are now viewing the vendor portal as ${vendor.vendor_name}. Use this for testing and support.`,
      })
      router.replace("/vendor/dashboard")
    } catch (error: any) {
      console.error("Failed to impersonate vendor:", error)
      setSwitcherError(error.message || "Failed to switch vendor")
    } finally {
      setLoadingVendorId(null)
      setPendingImpersonateVendor(null)
    }
  }

  const openEmailEditor = (vendor: VendorRecord) => {
    setEditingVendor(vendor)
    setEditedEmail(vendor.contact_email ?? "")
  }

  const handleSaveEmail = async () => {
    if (!editingVendor) return
    const email = editedEmail.trim()
    if (!email) {
      setSwitcherError("Email is required")
      return
    }

    try {
      setSavingEmail(true)
      const response = await fetch("/api/admin/vendors/update-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId: editingVendor.id, email }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || "Failed to update vendor email")
      }

      setVendorRecords((prev) =>
        prev.map((record) =>
          record.id === editingVendor.id ? { ...record, contact_email: email } : record,
        ),
      )

      toast({
        title: "Vendor email updated",
        description: `${editingVendor.vendor_name} now uses ${email}`,
      })
      setEditingVendor(null)
    } catch (error: any) {
      console.error("Failed to update vendor email", error)
      setSwitcherError(error.message || "Unable to update vendor email")
    } finally {
      setSavingEmail(false)
    }
  }

  const renderViewToggle = (className = "") => (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        size="sm"
        variant={activeView === "admin" ? "default" : "outline"}
        onClick={() => setActiveView("admin")}
      >
        Admin View
      </Button>
      <Button
        size="sm"
        variant={activeView === "chooser" ? "default" : "outline"}
        onClick={openVendorChooser}
        className="flex items-center gap-2"
      >
        <Users className="h-4 w-4" />
        Vendor Explorer
      </Button>
    </div>
  )

  const formatTimestamp = (value: string | null) => {
    if (!value) return "—"
    try {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    } catch {
      return value ?? "—"
    }
  }

  const vendorChooser = (
    <div className="px-4 py-6 md:px-6 md:py-8 space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Vendor Explorer</h2>
          <p className="text-sm text-muted-foreground">
            Search vendors, review their status, and jump into their dashboards instantly.
          </p>
        </div>
        <Button variant="outline" onClick={() => setActiveView("admin")}>Return to Admin</Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Search vendors..."
          value={vendorSearch}
          onChange={(event) => setVendorSearch(event.target.value)}
          className="md:w-72"
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="review">In Review</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Vendor</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Last Login</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Onboarding</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingVendors ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    Loading vendors…
                  </td>
                </tr>
              ) : switcherError ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-destructive">
                    {switcherError}
                  </td>
                </tr>
              ) : filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    No vendors match your filters.
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="border-t">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {vendor.vendor_name}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={vendor.status === "active" ? "default" : "secondary"}>
                        {vendor.status ?? "unknown"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatTimestamp(vendor.last_login_at)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {vendor.contact_email ? <a href={`mailto:${vendor.contact_email}`}>{vendor.contact_email}</a> : "—"}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEmailEditor(vendor)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit email</span>
                        </Button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {vendor.onboarding_completed ? (
                        <Badge variant="outline">Completed</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => router.push(`/admin/vendors/${vendor.id}`)}
                        >
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleImpersonateClick(vendor)}
                          disabled={loadingVendorId !== null}
                        >
                          {loadingVendorId === vendor.id ? "Switching…" : "View as Vendor"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={editingVendor !== null} onOpenChange={(open) => !open && setEditingVendor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit vendor email</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Assign the email address that will be linked to this vendor for authentication and notifications.
            </p>
            <div className="space-y-2">
              <label htmlFor="vendor-email" className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Vendor email
              </label>
              <Input
                id="vendor-email"
                value={editedEmail}
                onChange={(event) => setEditedEmail(event.target.value)}
                placeholder="vendor@example.com"
                type="email"
                required
              />
            </div>
          </div>
          <DialogFooter className="flex sm:justify-between sm:space-x-2">
            <Button variant="outline" onClick={() => setEditingVendor(null)} disabled={savingEmail}>
              Cancel
            </Button>
            <Button onClick={handleSaveEmail} disabled={savingEmail}>
              {savingEmail ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={impersonateConfirmOpen} onOpenChange={setImpersonateConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>View as Vendor</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You are about to view the vendor portal as <span className="font-medium text-foreground">{pendingImpersonateVendor?.vendor_name}</span>.
            </p>
            <div className="rounded-md bg-muted p-3 space-y-2">
              <p className="text-sm font-medium">This will:</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Switch you to the vendor's dashboard view</li>
                <li>Allow you to see exactly what the vendor sees</li>
                <li>Log all actions as admin actions for audit purposes</li>
                <li>Display a banner indicating you're in admin view mode</li>
              </ul>
            </div>
            <p className="text-xs text-muted-foreground">
              Use this feature for testing the vendor experience or providing support. For regular vendor management, use "View Details" instead.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImpersonateConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImpersonate} disabled={loadingVendorId !== null}>
              {loadingVendorId !== null ? "Switching…" : "Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

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
                <Link href="/admin" className="flex items-center gap-2 font-semibold">
                  <Award className="h-6 w-6" />
                  {isMobile ? <span className="font-medium">{currentSection}</span> : <span>Admin Dashboard</span>}
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
                      <div key={item.href ?? item.title} className="flex flex-col">
                        {item.submenu ? (
                          <>
                            <button
                              onClick={() => toggleSubmenu(index)}
                              className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium ${
                                isActive(item)
                                  ? "bg-accent text-accent-foreground"
                                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {item.icon}
                                <span>{item.title}</span>
                              </div>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`h-4 w-4 transition-transform ${item.expanded ? "rotate-180" : ""}`}
                              >
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </button>
                            {item.expanded && (
                              <div className="mt-1 pl-6 space-y-1">
                                {item.submenu.map((subItem) => (
                                  <Link
                                    key={subItem.href}
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
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
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
                        )}
                      </div>
                    ))}
                    {renderViewToggle("")}
                  </nav>
                </div>
              </ScrollArea>
              <div className="border-t p-4">
                <LogoutButton className="w-full" />
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <Award className="h-6 w-6" />
          <span className={isMobile ? "sr-only" : "inline-block"}>Admin Dashboard</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:flex gap-2">
            {renderViewToggle("hidden md:flex")}
          </div>
          <Button variant="outline" size="sm" className="md:hidden" onClick={openVendorChooser}>
            <Users className="h-4 w-4 mr-2" />
            Vendor Chooser
          </Button>
          <LogoutButton className="hidden md:flex" />
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-[250px] flex-col border-r md:flex">
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-2 p-4">
              <nav className="grid gap-2">
                {navItems.map((item, index) => (
                  <div key={item.href ?? item.title} className="flex flex-col">
                    {item.submenu ? (
                      <>
                        <button
                          onClick={() => toggleSubmenu(index)}
                          className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium ${
                            isActive(item)
                              ? "bg-accent text-accent-foreground"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {item.icon}
                            <span>{item.title}</span>
                          </div>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`h-4 w-4 transition-transform ${item.expanded ? "rotate-180" : ""}`}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                        {item.expanded && (
                          <div className="mt-1 pl-6 space-y-1">
                            {item.submenu.map((subItem) => (
                              <Link
                                key={subItem.href}
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
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
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
                    )}
                  </div>
                ))}
                {renderViewToggle("text-left")}
              </nav>
            </div>
          </ScrollArea>
        </aside>
        <main className="flex-1 pb-16 md:pb-0">
          <div className="px-4 py-2 md:px-6 md:py-4">
            {activeView === "admin" ? <Breadcrumb className="hidden md:flex" /> : null}
          </div>
          {activeView === "admin" ? children : vendorChooser}
        </main>
      </div>
      <BottomNav />
      <Toaster />
    </div>
  )
}

