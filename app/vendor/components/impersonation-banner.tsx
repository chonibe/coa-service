"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, LogOut } from "lucide-react"

interface AuthStatusResponse {
  isAdmin: boolean
  vendorSession: string | null
  vendor: { id: number; vendor_name: string; status: string | null } | null
  user: { email: string | null } | null
}

export function ImpersonationBanner() {
  const [visible, setVisible] = useState(false)
  const [vendorName, setVendorName] = useState<string | null>(null)
  const [vendorId, setVendorId] = useState<number | null>(null)
  const [adminEmail, setAdminEmail] = useState<string | null>(null)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadStatus = async () => {
      try {
        const response = await fetch("/api/auth/status", { cache: "no-store" })
        if (!response.ok) {
          throw new Error("Failed to load auth status")
        }
        const payload = (await response.json()) as AuthStatusResponse
        if (!cancelled && payload.isAdmin) {
          setVendorName(payload.vendorSession || payload.vendor?.vendor_name || "the selected vendor")
          setVendorId(payload.vendor?.id || null)
          setAdminEmail(payload.user?.email || null)
          setVisible(true)
        }
      } catch (error) {
        console.error("Failed to determine impersonation state", error)
      }
    }

    void loadStatus()

    return () => {
      cancelled = true
    }
  }, [])

  const handleExit = async () => {
    try {
      setIsExiting(true)
      const response = await fetch("/api/auth/impersonate/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        throw new Error("Unable to end impersonation")
      }

      window.location.href = "/admin/dashboard"
    } catch (error) {
      console.error("Failed to end impersonation", error)
      setIsExiting(false)
    }
  }

  if (!visible) {
    return null
  }

  return (
    <Alert variant="default" className="mb-6 border-primary/50 bg-primary/5">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="font-semibold">Admin View Mode Active</AlertTitle>
      <AlertDescription className="mt-2 flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p>
            You are viewing the vendor portal as <span className="font-medium text-foreground">{vendorName}</span>.
          </p>
          {adminEmail && (
            <p className="text-xs">
              Admin: <span className="font-medium">{adminEmail}</span>
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Any changes you make will affect this vendor's account and will be logged as admin actions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {vendorId && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/vendors/${vendorId}`}>
                Switch to Admin View
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/dashboard">Return to Admin</Link>
          </Button>
          <Button variant="destructive" size="sm" onClick={handleExit} disabled={isExiting} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            {isExiting ? "Ending…" : "Exit Impersonation"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setVisible(false)}>
            Dismiss
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
