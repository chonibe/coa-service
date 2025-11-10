"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Loader2, LogIn, Store } from "lucide-react"

interface AuthStatusResponse {
  authenticated: boolean
  isAdmin: boolean
  vendorSession: string | null
  vendor: { id: number; vendor_name: string } | null
  user: { id: string; email: string | null } | null
}

function VendorLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<AuthStatusResponse | null>(null)
  const [vendors, setVendors] = useState<string[]>([])
  const [selectedVendor, setSelectedVendor] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [impersonating, setImpersonating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const oauthError = searchParams.get("error")

  useEffect(() => {
    const loadStatus = async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/auth/status", { cache: "no-store" })
        if (!response.ok) {
          throw new Error("Failed to load authentication status")
        }

        const data = (await response.json()) as AuthStatusResponse
        setStatus(data)

        if (data.vendorSession || data.vendor) {
          router.replace("/vendor/dashboard")
          return
        }

        if (data.authenticated && !data.isAdmin) {
          router.replace("/vendor/onboarding")
          return
        }

        if (data.isAdmin) {
          await fetchVendors()
        }
      } catch (err) {
        console.error("Vendor login status error:", err)
        setError(err instanceof Error ? err.message : "Unable to determine login status")
      } finally {
        setLoading(false)
      }
    }

    const fetchVendors = async () => {
      try {
        const response = await fetch("/api/vendors/names", { cache: "no-store" })
        if (!response.ok) {
          throw new Error("Failed to fetch vendor list")
        }
        const data = await response.json()
        setVendors(data.vendors || [])
      } catch (err) {
        console.error("Error fetching vendor list:", err)
        setError("Unable to load vendor directory for impersonation.")
      }
    }

    loadStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startGoogleSignIn = () => {
    const redirect = encodeURIComponent("/vendor/dashboard")
    window.location.href = `/api/auth/google/start?redirect=${redirect}`
  }

  const handleImpersonation = async () => {
    if (!selectedVendor) {
      setError("Select a vendor to impersonate.")
      return
    }

    setImpersonating(true)
    setError(null)
    try {
      const response = await fetch("/api/auth/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorName: selectedVendor }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || "Unable to impersonate vendor")
      }

      router.replace("/vendor/dashboard")
    } catch (err) {
      console.error("Impersonation failed:", err)
      setError(err instanceof Error ? err.message : "Impersonation failed")
    } finally {
      setImpersonating(false)
    }
  }

  const isAdmin = status?.isAdmin ?? false

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center">
            <Store className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Vendor Portal</CardTitle>
          <CardDescription>Sign in with Google to access your vendor dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(error || oauthError) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription>{error || `OAuth error: ${oauthError}`}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={startGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2"
            size="lg"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Continue with Google
          </Button>

          {isAdmin && (
            <div className="rounded-lg border p-4 space-y-3">
              <div>
                <Label htmlFor="impersonate-select">Admin tools</Label>
                <p className="text-sm text-muted-foreground">
                  Impersonate a vendor to review their dashboard experience.
                </p>
              </div>
              <Select value={selectedVendor} onValueChange={setSelectedVendor} disabled={impersonating || loading}>
                <SelectTrigger id="impersonate-select">
                  <SelectValue placeholder="Select a vendor to impersonate" />
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
                className="w-full"
                disabled={!selectedVendor || impersonating}
                onClick={handleImpersonation}
              >
                {impersonating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Switching...
                  </>
                ) : (
                  "View as Vendor"
                )}
              </Button>
            </div>
          )}

          <p className="text-sm text-muted-foreground text-center">
            Need help? Contact <a href="mailto:support@streetcollector.com">support@streetcollector.com</a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VendorLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader className="space-y-2 text-center">
              <CardTitle>Loading login...</CardTitle>
              <CardDescription>Please wait while we prepare the vendor portal.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </CardContent>
          </Card>
        </div>
      }
    >
      <VendorLoginContent />
    </Suspense>
  )
}
