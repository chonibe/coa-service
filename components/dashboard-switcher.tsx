"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Shield, Store, Package, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

import { Button } from "@/components/ui"
interface AuthStatus {
  isAdmin?: boolean
  hasAdminSession?: boolean
  adminHasCollectorAccess?: boolean
  adminHasVendorAccess?: boolean
  hasVendorAccess?: boolean
  vendorHasCollectorAccess?: boolean
  hasCollectorSession?: boolean
}

export function DashboardSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSwitching, setIsSwitching] = useState(false)

  useEffect(() => {
    const fetchAuthStatus = async () => {
      try {
        const response = await fetch("/api/auth/status", { credentials: "include" })
        if (response.ok) {
          const data = await response.json()
          setAuthStatus(data)
        }
      } catch (error) {
        console.error("Failed to fetch auth status:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAuthStatus()
  }, [])

  const getCurrentDashboard = () => {
    if (pathname?.startsWith("/admin")) return "admin"
    if (pathname?.startsWith("/vendor")) return "vendor"
    if (pathname?.startsWith("/collector")) return "collector"
    return null
  }

  const handleSwitchToAdmin = async () => {
    if (getCurrentDashboard() === "admin") {
      router.push("/admin/dashboard")
      return
    }
    router.push("/admin/dashboard")
  }

  const handleSwitchToVendor = async () => {
    if (getCurrentDashboard() === "vendor") {
      router.push("/vendor/dashboard")
      return
    }

    setIsSwitching(true)
    try {
      const response = await fetch("/api/auth/admin/switch-to-vendor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to switch to vendor dashboard")
      }

      toast({
        title: "Switched to Vendor Dashboard",
        description: "You are now viewing the vendor dashboard.",
      })
      router.push("/vendor/dashboard")
    } catch (error: any) {
      console.error("Failed to switch to vendor:", error)
      toast({
        title: "Switch Failed",
        description: error.message || "Unable to switch to vendor dashboard",
        variant: "destructive",
      })
    } finally {
      setIsSwitching(false)
    }
  }

  const handleSwitchToCollector = async () => {
    if (getCurrentDashboard() === "collector") {
      router.push("/collector/dashboard")
      return
    }

    setIsSwitching(true)
    try {
      // Determine which endpoint to use based on current role
      const endpoint = authStatus?.hasVendorAccess && !authStatus?.isAdmin
        ? "/api/auth/vendor/switch-to-collector"
        : "/api/auth/admin/switch-to-collector"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to switch to collector dashboard")
      }

      toast({
        title: "Switched to Collector Dashboard",
        description: "You are now viewing the collector dashboard.",
      })
      router.push("/collector/dashboard")
    } catch (error: any) {
      console.error("Failed to switch to collector:", error)
      toast({
        title: "Switch Failed",
        description: error.message || "Unable to switch to collector dashboard",
        variant: "destructive",
      })
    } finally {
      setIsSwitching(false)
    }
  }

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading...
      </Button>
    )
  }

  if (!authStatus) {
    return null
  }

  const currentDashboard = getCurrentDashboard()
  const availableDashboards: Array<{
    id: string
    name: string
    icon: React.ReactNode
    handler: () => void
    available: boolean
  }> = []

  // Admin dashboard
  if (authStatus.isAdmin && authStatus.hasAdminSession) {
    availableDashboards.push({
      id: "admin",
      name: "Admin Dashboard",
      icon: <Shield className="h-4 w-4" />,
      handler: handleSwitchToAdmin,
      available: true,
    })
  }

  // Vendor dashboard
  if (authStatus.hasVendorAccess || authStatus.adminHasVendorAccess) {
    availableDashboards.push({
      id: "vendor",
      name: "Vendor Dashboard",
      icon: <Store className="h-4 w-4" />,
      handler: handleSwitchToVendor,
      available: true,
    })
  }

  // Collector dashboard
  if (
    authStatus.hasCollectorSession ||
    authStatus.adminHasCollectorAccess ||
    authStatus.vendorHasCollectorAccess
  ) {
    availableDashboards.push({
      id: "collector",
      name: "Collector Dashboard",
      icon: <Package className="h-4 w-4" />,
      handler: handleSwitchToCollector,
      available: true,
    })
  }

  // Don't show switcher if only one dashboard is available
  if (availableDashboards.length <= 1) {
    return null
  }

  const currentDashboardName = availableDashboards.find((d) => d.id === currentDashboard)?.name || "Dashboard"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isSwitching}>
          {isSwitching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Switching...
            </>
          ) : (
            <>
              {availableDashboards.find((d) => d.id === currentDashboard)?.icon || <Shield className="h-4 w-4" />}
              <span className="ml-2 hidden md:inline">{currentDashboardName}</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Switch Dashboard</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableDashboards.map((dashboard) => (
          <DropdownMenuItem
            key={dashboard.id}
            onClick={dashboard.handler}
            disabled={dashboard.id === currentDashboard || isSwitching}
            className={dashboard.id === currentDashboard ? "bg-accent" : ""}
          >
            {dashboard.icon}
            <span className="ml-2">{dashboard.name}</span>
            {dashboard.id === currentDashboard && <span className="ml-auto text-xs">Current</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
