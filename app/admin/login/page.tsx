"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { AuthShell } from "@/components/vendor/AuthShell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, Loader2, LogIn } from "lucide-react"

interface AuthStatusResponse {
  authenticated: boolean
  isAdmin: boolean
  state: "admin" | "linked" | "pending" | "unlinked" | null
  user: { id: string; email: string | null } | null
}

export default function AdminLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const redirectTarget = useMemo(() => searchParams.get("redirect") || "/admin/dashboard", [searchParams])
  const stateParam = searchParams.get("state")

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const response = await fetch("/api/auth/status", { cache: "no-store" })
        if (!response.ok) {
          throw new Error("Unable to determine authentication status")
        }
        const data = (await response.json()) as AuthStatusResponse

        if (data.authenticated && data.isAdmin) {
          router.replace(redirectTarget)
        } else if (data.authenticated && !data.isAdmin) {
          router.replace("/vendor/login?state=forbidden")
        }
      } catch (err) {
        console.error("Admin login status error:", err)
        setError(err instanceof Error ? err.message : "Failed to load authentication status")
      }
    }

    loadStatus()
  }, [router, redirectTarget])

  const startAdminSignIn = () => {
    setLoading(true)
    const query = new URLSearchParams({ redirect: redirectTarget, mode: "admin" })
    window.location.href = `/api/auth/google/start?${query.toString()}`
  }

  const stateNotices: Record<
    string,
    { title: string; description: string; variant?: "default" | "destructive" }
  > = {
    forbidden: {
      variant: "destructive",
      title: "Access denied",
      description: "This Google email is not approved for admin access. Use a vendor login instead.",
    },
  }

  const activeNotice = stateParam ? stateNotices[stateParam] : undefined

  return (
    <AuthShell
      title="Admin sign-in"
      description="Use your Street Collector admin Google account."
      heroTitle="Administrator control"
      heroSubtitle="Secure access to vendor management, operations, and platform tools."
      footer={
        <p className="text-center">
          Switch to vendor login?{" "}
          <Link className="font-medium text-primary" href="/vendor/login">
            Continue as vendor
          </Link>
        </p>
      }
    >
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {activeNotice && (
        <Alert variant={activeNotice.variant}>
          <AlertTitle>{activeNotice.title}</AlertTitle>
          <AlertDescription>{activeNotice.description}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-6">
        <div className="space-y-1 text-left">
          <h3 className="text-lg font-semibold text-slate-900">Administrator access</h3>
          <p className="text-sm text-slate-600">
            Only approved admin Google accounts can access this area. After signing in, you’ll land on the admin
            dashboard where you can jump into vendor views as needed.
          </p>
        </div>

        <Button
          onClick={startAdminSignIn}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 py-6 text-base"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
          Continue with Google
        </Button>
      </div>
    </AuthShell>
  )
}
