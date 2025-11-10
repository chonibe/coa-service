"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthShell } from "@/components/vendor/AuthShell"
import { AlertCircle, Loader2, LogIn, ShieldCheck, Store } from "lucide-react"

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
  const [activeTab, setActiveTab] = useState<"vendor" | "admin">("vendor")

  const oauthError = searchParams.get("error")
  const paramRedirect = searchParams.get("redirect")
  const tabParam = searchParams.get("tab")
  const adminParam = searchParams.get("admin")

  const fetchVendors = useCallback(async () => {
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
  }, [])

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

    void loadStatus()
  }, [fetchVendors, router])

  useEffect(() => {
    if (tabParam === "admin" || adminParam === "1") {
      setActiveTab("admin")
    } else {
      setActiveTab("vendor")
    }
  }, [tabParam, adminParam])

  const vendorRedirectTarget = useMemo(() => {
    if (paramRedirect) return paramRedirect
    return "/vendor/dashboard"
  }, [paramRedirect])

  const adminRedirectTarget = "/vendor/login?tab=admin"

  const updateQueryParams = (nextTab: "vendor" | "admin") => {
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    if (nextTab === "admin") {
      params.set("tab", "admin")
    } else {
      params.delete("tab")
      params.delete("admin")
    }
    if (paramRedirect) {
      params.set("redirect", paramRedirect)
    } else {
      params.delete("redirect")
    }

    const queryString = params.toString()
    router.replace(`/vendor/login${queryString ? `?${queryString}` : ""}`)
  }

  const handleTabChange = (value: string) => {
    const next = value === "admin" ? "admin" : "vendor"
    setActiveTab(next)
    updateQueryParams(next)
  }

  const startGoogleSignIn = (mode: "vendor" | "admin" = "vendor") => {
    const redirectTarget = mode === "admin" ? adminRedirectTarget : vendorRedirectTarget
    const query = new URLSearchParams({ redirect: redirectTarget, mode })
    window.location.href = `/api/auth/google/start?${query.toString()}`
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
    <AuthShell
      title="Sign in to Street Collector"
      description="Choose how you want to access the vendor workspace."
      heroTitle="Modern tools for every partner"
      heroSubtitle="Secure Google SSO for vendors and advanced controls for administrators."
      footer={
        <p className="text-center">
          Need assistance?{" "}
          <a className="font-medium text-primary" href="mailto:support@streetcollector.com">
            support@streetcollector.com
          </a>
        </p>
      }
    >
      {(error || oauthError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication error</AlertTitle>
          <AlertDescription>{error || `OAuth error: ${oauthError}`}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vendor" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Vendors
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Admins
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vendor" className="mt-6 space-y-6">
          <div className="space-y-2 text-center">
            <h3 className="text-lg font-semibold text-slate-900">Vendor dashboard</h3>
            <p className="text-sm text-slate-600">
              Sign in with Google using the email linked to your vendor account.
            </p>
          </div>

          <Button
            onClick={() => startGoogleSignIn("vendor")}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 py-6 text-base"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
            Continue with Google
          </Button>
        </TabsContent>

        <TabsContent value="admin" className="mt-6 space-y-6">
          <div className="space-y-2 text-center">
            <h3 className="text-lg font-semibold text-slate-900">Administrator access</h3>
            <p className="text-sm text-slate-600">
              Log in to review vendor accounts, approve pairings, and impersonate dashboards.
            </p>
          </div>

          {isAdmin ? (
            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="space-y-2 text-left">
                <Label htmlFor="impersonate-select" className="text-slate-700">
                  Impersonate a vendor
                </Label>
                <p className="text-xs text-slate-500">
                  Choose a vendor to open the dashboard in their context. Your admin session remains active.
                </p>
              </div>
              <Select value={selectedVendor} onValueChange={setSelectedVendor} disabled={impersonating || loading}>
                <SelectTrigger id="impersonate-select">
                  <SelectValue placeholder="Select a vendor" />
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Switching…
                  </>
                ) : (
                  "View selected vendor"
                )}
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-left">
              <p className="text-sm text-slate-600">
                Use an approved admin Google account to unlock advanced tooling. Once authenticated you’ll see vendor
                impersonation controls here.
              </p>
              <Button
                onClick={() => startGoogleSignIn("admin")}
                disabled={loading}
                className="mt-4 flex w-full items-center justify-center gap-2 py-6 text-base"
                variant="secondary"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
                Continue as admin
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AuthShell>
  )
}

function LoginFallback() {
  return (
    <AuthShell
      title="Loading login"
      description="Please wait while we prepare the vendor portal."
      heroTitle="Street Collector"
      heroSubtitle="Connecting vendors and admins securely."
    >
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </AuthShell>
  )
}

export default function VendorLoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <VendorLoginContent />
    </Suspense>
  )
}

