"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

interface AuthStatusResponse {
  authenticated: boolean
  isAdmin: boolean
  vendorSession: string | null
  vendor: { id: number; vendor_name: string } | null
  user: { id: string; email: string | null } | null
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
        if (data.vendorSession || data.vendor) {
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
      <div className="min-h-screen flex items-center justify-center bg-muted/20 p-6">
        <Card className="max-w-sm w-full">
          <CardHeader className="text-center space-y-2">
            <CardTitle>Checking your account…</CardTitle>
            <CardDescription>Preparing your vendor signup experience.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!authStatus) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <Card>
          <CardHeader className="space-y-3 text-center">
            <CardTitle className="text-3xl">Complete Your Vendor Signup</CardTitle>
            <CardDescription>
              Sign in detected for <strong>{authStatus.user?.email}</strong>. Choose one of the options below
              to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Something went wrong</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {(claimSuccess || searchParams.get("status") === "pending") && (
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle>Request submitted</AlertTitle>
                <AlertDescription>
                  {claimSuccess ||
                    "Your pairing request is pending. An administrator will review and confirm access shortly."}
                </AlertDescription>
              </Alert>
            )}

            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Create a new vendor profile</h2>
                <p className="text-sm text-muted-foreground">
                  Start fresh with a new vendor workspace. You can update all details after onboarding.
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

            <div className="border-t pt-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Claim an existing vendor</h2>
                <p className="text-sm text-muted-foreground">
                  Already have a vendor profile? Enter the invite code shared by your administrator to request
                  access.
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const PendingSignupFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-muted/20 p-6">
    <Card className="max-w-sm w-full">
      <CardHeader className="text-center space-y-2">
        <CardTitle>Preparing signup…</CardTitle>
        <CardDescription>Loading signup options.</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </CardContent>
    </Card>
  </div>
)

const SignupPage = () => {
  return (
    <Suspense fallback={<PendingSignupFallback />}>
      <SignupContent />
    </Suspense>
  )
}

export default SignupPage

