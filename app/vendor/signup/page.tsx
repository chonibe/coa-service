"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { AuthShell } from "@/components/vendor/AuthShell"

interface AuthStatusResponse {
  authenticated: boolean
  isAdmin: boolean
  vendorSession: string | null
  vendor: { id: number; vendor_name: string } | null
  user: { id: string; email: string | null } | null
  state: "admin" | "linked" | "pending" | "unlinked" | null
}

const SignupContent = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [authStatus, setAuthStatus] = useState<AuthStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [vendorName, setVendorName] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [createLoading, setCreateLoading] = useState(false)
  const [claimLoading, setClaimLoading] = useState(false)
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null)

  useEffect(() => {
    const loadStatus = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/auth/status", { cache: "no-store" })
        if (!response.ok) {
          throw new Error("Unable to determine authentication state")
        }
        const data = (await response.json()) as AuthStatusResponse
        if (!data.authenticated) {
          router.replace("/vendor/login")
          return
        }
        if (data.state === "admin") {
          router.replace("/admin/dashboard?state=admin")
          return
        }
        if (data.state === "linked") {
          router.replace("/vendor/dashboard")
          return
        }
        setAuthStatus(data)
      } catch (err) {
        console.error("Failed to load auth status:", err)
        setError(err instanceof Error ? err.message : "Unexpected error")
      } finally {
        setLoading(false)
      }
    }

    loadStatus()
  }, [router])

  const handleCreateVendor = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!vendorName.trim()) {
      setError("Please choose a vendor name.")
      return
    }

    setCreateLoading(true)
    setClaimSuccess(null)
    setError(null)
    try {
      const response = await fetch("/api/vendor/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", vendorName }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || "Unable to create vendor profile")
      }

      router.replace("/vendor/onboarding")
    } catch (err) {
      console.error("Create vendor error:", err)
      setError(err instanceof Error ? err.message : "Failed to create vendor profile")
    } finally {
      setCreateLoading(false)
    }
  }

  const handleClaimVendor = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!inviteCode.trim()) {
      setError("Invite code is required to claim an existing vendor.")
      return
    }

    setClaimLoading(true)
    setClaimSuccess(null)
    setError(null)
    try {
      const response = await fetch("/api/vendor/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim", inviteCode }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || "Unable to submit pairing request")
      }

      setClaimSuccess(
        "Pairing request submitted. An administrator will review and link your account shortly.",
      )
      setInviteCode("")
    } catch (err) {
      console.error("Claim vendor error:", err)
      setError(err instanceof Error ? err.message : "Failed to submit pairing request")
    } finally {
      setClaimLoading(false)
    }
  }

  if (loading) {
    return (
      <AuthShell
        title="Checking your account…"
        description="Preparing your vendor signup experience."
        heroTitle="Link your Google account"
        heroSubtitle="We’re confirming your access so you can manage your storefront."
      >
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthShell>
    )
  }

  if (!authStatus) {
    return null
  }

  return (
    <AuthShell
      title="Complete your vendor signup"
      description={`Signed in as ${authStatus.user?.email ?? "your Google account"}.`}
      heroTitle="Finalize your access"
      heroSubtitle="Create a new vendor workspace or connect with an existing one to unlock the dashboard."
      footer={
        <p className="text-center">
          Need help?{" "}
          <a className="font-medium text-primary" href="mailto:support@streetcollector.com">
            support@streetcollector.com
          </a>
        </p>
      }
    >
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {(claimSuccess || searchParams.get("status") === "pending" || authStatus.state === "pending") && (
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle>Request submitted</AlertTitle>
          <AlertDescription>
            {claimSuccess ||
              "Your pairing request is pending. An administrator will review and confirm access shortly."}
          </AlertDescription>
        </Alert>
      )}

      {(searchParams.get("status") === "unlinked" || authStatus.state === "unlinked") && (
        <Alert>
          <AlertTitle>No vendor profile linked yet</AlertTitle>
          <AlertDescription>
            We couldn’t match your Google email to a vendor. Create a new vendor profile below or use an invite code to
            request access to an existing vendor. If you believe this is a mistake, contact support.
          </AlertDescription>
        </Alert>
      )}

      <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900">Create a new vendor profile</h2>
          <p className="text-sm text-slate-600">
            Start fresh with a dedicated vendor workspace. You can complete your storefront details after onboarding.
          </p>
        </div>
        <form onSubmit={handleCreateVendor} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="vendor-name">Vendor name</Label>
            <Input
              id="vendor-name"
              placeholder="e.g. Sunset Studio Collective"
              value={vendorName}
              onChange={(event) => setVendorName(event.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={createLoading} className="w-full sm:w-auto">
            {createLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating…
              </>
            ) : (
              "Create vendor"
            )}
          </Button>
        </form>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900">Claim an existing vendor</h2>
          <p className="text-sm text-slate-600">
            Already on Street Collector? Enter the invite code shared by your administrator to request access.
          </p>
        </div>

        <form onSubmit={handleClaimVendor} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="invite-code">Invite code</Label>
            <Input
              id="invite-code"
              placeholder="Enter invite code"
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value)}
              required
            />
          </div>
          <Button type="submit" variant="outline" disabled={claimLoading} className="w-full sm:w-auto">
            {claimLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting…
              </>
            ) : (
              "Submit pairing request"
            )}
          </Button>
        </form>
      </section>
    </AuthShell>
  )
}

const PendingSignupFallback = () => (
  <AuthShell
    title="Preparing signup…"
    description="Loading signup options."
    heroTitle="Street Collector"
    heroSubtitle="We’re getting your workspace ready."
  >
    <div className="flex justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  </AuthShell>
)

const SignupPage = () => {
  return (
    <Suspense fallback={<PendingSignupFallback />}>
      <SignupContent />
    </Suspense>
  )
}

export default SignupPage

