"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"

interface AuthStatusResponse {
  state: "admin" | "linked" | "pending" | "unlinked" | null
  vendorSession: string | null
  vendor: { id: number; vendor_name: string } | null
}

export function ImpersonationBanner() {
  const router = useRouter()
  const [isImpersonating, setIsImpersonating] = useState(false)
  const [vendorName, setVendorName] = useState<string | null>(null)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch("/api/auth/status", { cache: "no-store" })
        if (!response.ok) return
        const data = (await response.json()) as AuthStatusResponse

        if (data.state === "admin" && data.vendorSession) {
          setIsImpersonating(true)
          setVendorName(data.vendor?.vendor_name ?? data.vendorSession)
        }
      } catch (err) {
        console.error("Failed to determine impersonation status:", err)
      }
    }

    checkStatus()
  }, [])

  const exitImpersonation = async () => {
    setExiting(true)
    try {
      await fetch("/api/auth/impersonate/exit", { method: "POST" })
    } catch (err) {
      console.error("Failed to exit impersonation:", err)
    } finally {
      router.push("/admin/dashboard")
    }
  }

  if (!isImpersonating) {
    return null
  }

  return (
    <Alert className="mb-4 border-primary/40 bg-primary/5 text-primary-foreground">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="rounded-full bg-primary/20 p-2 text-primary">
            <ShieldAlert className="h-4 w-4" />
          </span>
          <div>
            <AlertTitle>Viewing as {vendorName ?? "vendor"}</AlertTitle>
            <AlertDescription className="text-primary/80">
              You are impersonating this vendor. Any actions you take are applied to their account.
            </AlertDescription>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={exitImpersonation} disabled={exiting}>
          {exiting ? "Returning…" : "Return to admin"}
        </Button>
      </div>
    </Alert>
  )
}


