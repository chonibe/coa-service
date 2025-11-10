"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const oauthError = searchParams.get("error")
  const paramRedirect = searchParams.get("redirect")
  const initialMode = searchParams.get("mode")
  const stateParam = searchParams.get("state")

  const mode: "admin" | "vendor" = initialMode === "admin" ? "admin" : "vendor"

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

  const modeDescriptor =
    mode === "admin"
      ? {
          title: "Administrator access",
          icon: <ShieldCheck className="h-4 w-4" />,
          body: "Use your approved admin Google account to open the Street Collector admin dashboard. From there you can switch into any vendor view using the vendor selector.",
        }
      : {
          title: "Vendor dashboard",
          icon: <Store className="h-4 w-4" />,
          body: "Sign in with the Google email paired to your vendor profile to view sales analytics, payouts, and onboarding tasks.",
        }

  const stateNotices: Record<
    string,
    { variant?: "default" | "destructive"; title: string; description: string }
  > = {
    admin: {
      title: "Signed in as administrator",
      description:
        "You now have access to the admin dashboard. Use the vendor switcher in the header to open a vendor experience.",
    },
    pending: {
      title: "Approval pending",
      description:
        "We found your vendor request. An administrator must complete the review. You can create a new vendor profile or wait for approval.",
    },
    unlinked: {
      title: "No vendor profile linked",
      description:
        "We couldn’t match your Google email to a vendor. Continue to signup to create a new profile or request access with an invite code.",
    },
    forbidden: {
      variant: "destructive",
      title: "Access denied",
      description: "This Google email is not authorized for the requested area. Contact support for assistance.",
    },
  }

  const activeNotice = stateParam ? stateNotices[stateParam] : undefined

  return (
    <AuthShell
      title="Sign in to Street Collector"
      description={mode === "admin" ? "Administrator sign-in" : "Vendor sign-in"}
      heroTitle={mode === "admin" ? "Command the platform" : "Grow your storefront"}
      heroSubtitle={
        mode === "admin"
          ? "Secure Google SSO for trusted administrators across vendor operations."
          : "Access real-time sales, payouts, and onboarding with secure Google SSO."
      }
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

      {activeNotice && (
        <Alert variant={activeNotice.variant}>
          <AlertTitle>{activeNotice.title}</AlertTitle>
          <AlertDescription>{activeNotice.description}</AlertDescription>
        </Alert>
      )}

      <div className="mt-6 space-y-6">
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-5 text-left">
          <div className="flex items-center gap-3 text-slate-900">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              {modeDescriptor.icon}
            </span>
            <h3 className="text-lg font-semibold">{modeDescriptor.title}</h3>
          </div>
          <p className="text-sm text-slate-600">{modeDescriptor.body}</p>
          {mode === "admin" ? (
            <p className="text-xs text-slate-500">
              Need vendor tools instead?{" "}
              <Link href="/vendor/login" className="font-medium text-primary">
                Continue as vendor
              </Link>
              .
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Are you an administrator?{" "}
              <Link href="/vendor/login?mode=admin" className="font-medium text-primary">
                Switch to admin sign-in
              </Link>
              .
            </p>
          )}
        </div>

        <Button
          onClick={startGoogleSignIn}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 py-6 text-base"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
          Continue with Google
        </Button>

        {mode !== "admin" && (
          <p className="text-xs text-center text-slate-500">
            New vendor?{" "}
            <Link href="/vendor/signup" className="font-medium text-primary">
              Create or claim your vendor profile
            </Link>
            .
          </p>
        )}
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

