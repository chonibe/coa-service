"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AuthShell } from "@/components/vendor/AuthShell"
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const oauthError = searchParams.get("error")
  const paramRedirect = searchParams.get("redirect")
  const initialMode = searchParams.get("mode")

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

        if (data.authenticated && data.isAdmin) {
          router.replace("/admin/dashboard")
          return
        }

        if (data.authenticated) {
          router.replace("/vendor/onboarding")
          return
        }
      } catch (err) {
        console.error("Vendor login status error:", err)
        setError(err instanceof Error ? err.message : "Unable to determine login status")
      } finally {
        setLoading(false)
      }
    }

    void loadStatus()
  }, [router])

  const vendorRedirectTarget = useMemo(() => {
    if (paramRedirect) return paramRedirect
    return "/vendor/dashboard"
  }, [paramRedirect])

  const startGoogleSignIn = () => {
    const query = new URLSearchParams({ redirect: vendorRedirectTarget })
    if (initialMode === "admin") {
      query.set("mode", "admin")
    }
    window.location.href = `/api/auth/google/start?${query.toString()}`
  }

  return (
    <AuthShell
      title="Sign in to Street Collector"
      description="Access the vendor dashboard using your Google account."
      heroTitle="Modern tools for every partner"
      heroSubtitle="Secure Google SSO for vendors and administrators."
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

      <div className="mt-6 space-y-6">
        <div className="space-y-2 text-center">
          <h3 className="text-lg font-semibold text-slate-900">Vendor &amp; Admin access</h3>
          <p className="text-sm text-slate-600">
            Sign in with Google using the email assigned to your vendor or administrator account. Admins will land on
            the admin dashboard with the option to view vendor dashboards.
          </p>
        </div>

        <Button onClick={startGoogleSignIn} disabled={loading} className="flex w-full items-center justify-center gap-2 py-6 text-base">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
          Continue with Google
        </Button>
      </div>
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

