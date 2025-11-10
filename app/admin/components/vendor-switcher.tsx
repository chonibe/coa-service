"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Store } from "lucide-react"

interface VendorSwitcherProps {
  className?: string
}

export function VendorSwitcher({ className }: VendorSwitcherProps) {
  const router = useRouter()
  const [vendors, setVendors] = useState<string[]>([])
  const [selectedVendor, setSelectedVendor] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const response = await fetch("/api/auth/status", { cache: "no-store" })
        if (!response.ok) {
          throw new Error("Unable to confirm admin status")
        }
        const data = await response.json()
        setIsAdmin(data.isAdmin ?? false)
        return data.isAdmin
      } catch (statusError) {
        console.error("Vendor switcher status error:", statusError)
        setIsAdmin(false)
        setError("Unable to load admin status.")
        return false
      }
    }

    const loadVendors = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/vendors/names", { cache: "no-store" })
        if (!response.ok) {
          throw new Error("Unable to load vendor list")
        }
        const data = await response.json()
        setVendors(data.vendors || [])
      } catch (err) {
        console.error("Vendor switcher load error:", err)
        setError("Failed to load vendors")
      } finally {
        setLoading(false)
      }
    }

    loadStatus()
      .then((admin) => {
        if (admin) {
          return loadVendors()
        }
        return null
      })
      .catch((err) => console.error("Failed to initialise vendor switcher:", err))
  }, [])

  const handleSwitch = async () => {
    if (!selectedVendor) return
    setSwitching(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorName: selectedVendor }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || "Unable to open vendor dashboard")
      }

      router.push("/vendor/dashboard")
    } catch (err) {
      console.error("Vendor switch failed:", err)
      setError(err instanceof Error ? err.message : "Unable to open vendor dashboard")
    } finally {
      setSwitching(false)
    }
  }

  if (isAdmin === false) {
    return null
  }

  if (isAdmin === null) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Checking admin status…
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <Store className="hidden h-4 w-4 text-muted-foreground md:inline-block" />
        <div className="text-sm font-medium text-muted-foreground hidden md:block">Vendor view</div>
      </div>
      <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
        <Select
          value={selectedVendor}
          onValueChange={setSelectedVendor}
          disabled={loading || switching || vendors.length === 0}
        >
          <SelectTrigger className="w-[220px] md:w-[240px]">
            <SelectValue placeholder={loading ? "Loading vendors..." : "Select a vendor"} />
          </SelectTrigger>
          <SelectContent>
            {vendors.map((vendor) => (
              <SelectItem key={vendor} value={vendor}>
                {vendor}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={handleSwitch}
          disabled={!selectedVendor || switching}
          className="md:w-auto"
        >
          {switching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Opening…
            </>
          ) : (
            "Open vendor view"
          )}
        </Button>
      </div>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      {!loading && !vendors.length && !error && (
        <p className="mt-2 text-xs text-muted-foreground">No vendors available yet.</p>
      )}
    </div>
  )
}


