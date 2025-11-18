"use client"

import Link from "next/link"
import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, LogIn, Mail, LockKeyhole, Loader2, LifeBuoy, ArrowUpRight } from "lucide-react"

interface AuthStatusResponse {
  authenticated: boolean
  isAdmin: boolean
  hasAdminSession?: boolean
  vendorSession: string | null
  vendor: { id: number; vendor_name: string } | null
}

const NOT_REGISTERED_ERROR = "You are not registered. Contact support@thestreetlamp.com."

const SUPPORT_EMAIL = "support@thestreetlamp.com"
const MAILTO_SUBJECT = encodeURIComponent("Street Collector Vendor Access Request")
const MAILTO_BODY = encodeURIComponent(
  [
    "Hi Street Collector Team,",
    "",
    "I'd like to request access to the vendor portal.",
    "",
    "Business / Vendor Name:",
    "Primary Contact Name:",
    "Preferred Contact Email:",
    "",
    "Thanks!",
  ].join("\n"),
)

export default function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam === "not_registered") {
      setFormError(NOT_REGISTERED_ERROR)
    } else if (errorParam) {
      setFormError(`Authentication error: ${errorParam}`)
    }
  }, [searchParams])

  useEffect(() => {
    if (typeof window === "undefined") return

    const hash = window.location.hash
    if (!hash || !hash.includes("access_token")) {
      return
    }

    const params = new URLSearchParams(hash.replace(/^#/, ""))
    // convert hash tokens to query string so the server callback can process them
    params.set("from", "hash")
    window.location.replace(`/auth/callback?${params.toString()}`)
  }, [])

  const hasCheckedSession = useRef(false)
  const hasRedirected = useRef(false)

  useEffect(() => {
    // Only check once, ever
    if (hasCheckedSession.current) {
      setCheckingSession(false)
      return
    }

    const abortController = new AbortController()

    const checkSession = async () => {
      hasCheckedSession.current = true

      // Only check if we're still on the login page
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        setCheckingSession(false)
        return
      }

      try {
        const response = await fetch("/api/auth/status", {
          cache: "no-store",
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error("Unable to check session")
        }

        const data = (await response.json()) as AuthStatusResponse

        // Prevent multiple redirects
        if (hasRedirected.current) {
          setCheckingSession(false)
          return
        }

        // Prioritize vendor session - if user has vendor session, go to vendor dashboard
        // Check vendor session first, regardless of admin status
        if (data.vendorSession || data.vendor) {
          console.log(`[login-client] Redirecting to vendor dashboard: vendorSession=${data.vendorSession}, vendor=${data.vendor?.vendor_name}`)
          hasRedirected.current = true
          window.location.replace("/vendor/dashboard")
          return
        }

        // Only redirect to admin if explicitly admin, has admin session cookie, and no vendor session
        // Don't redirect if admin session cookie is missing - user needs to log in first
        if (data.isAdmin && data.hasAdminSession) {
          console.log(`[login-client] Redirecting to admin dashboard: isAdmin=true, hasAdminSession=true`)
          hasRedirected.current = true
          window.location.replace("/admin/dashboard")
          return
        }
        
        // If admin but no admin session cookie, don't redirect - let them log in
        if (data.isAdmin && !data.hasAdminSession) {
          console.log(`[login-client] Admin user but no admin session cookie - staying on login page`)
          setCheckingSession(false)
          return
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Session check failed:", error)
        }
      } finally {
        setCheckingSession(false)
      }
    }

    // Only check once on mount
    void checkSession()

    return () => {
      abortController.abort()
    }
  }, [])

  const handleEmailLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setFormSubmitting(true)

    try {
      const response = await fetch("/api/auth/email-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        setFormError(payload?.message || "Unable to sign in. Please check your credentials and try again.")
        setFormSubmitting(false)
        return
      }

      router.replace(payload?.redirect || "/vendor/dashboard")
    } catch (error) {
      console.error("Email login failed:", error)
      setFormError("An unexpected error occurred. Please try again or use Google sign-in.")
      setFormSubmitting(false)
    }
  }

  const handleGoogleLogin = () => {
    setFormError(null)
    setGoogleLoading(true)
    window.location.href = "/api/auth/google/start"
  }

  const isSubmitDisabled = !email || !password || formSubmitting

  if (checkingSession) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Checking existing session" />
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4 dark:bg-background">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl tracking-tight">Sign in to Street Collector</CardTitle>
          <CardDescription>
            Use your vendor or admin credentials. We automatically route you to the correct dashboard after authentication.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {(formError || googleLoading || formSubmitting) && (
            <Alert variant={formError ? "destructive" : "default"} role="alert">
              {formError ? <AlertCircle className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
              <AlertTitle>{formError ? "Sign-in issue" : "Signing you in"}</AlertTitle>
              <AlertDescription>
                {formError ||
                  (googleLoading ? "Redirecting to Google. Please complete the sign-in flow." : "Processing your request...")}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleGoogleLogin}
              disabled={googleLoading || formSubmitting}
              className="w-full flex items-center justify-center gap-2"
              size="lg"
              aria-label="Continue with Google"
            >
              {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              Continue with Google
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Recommended for both admins and vendors using Google Workspace accounts.
            </p>
          </div>

          <div className="text-xs uppercase text-muted-foreground flex items-center gap-4">
            <Separator className="flex-1" />
            <span>Email Sign-In</span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4" aria-label="Email sign-in form">
            <div className="space-y-2">
              <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                <LockKeyhole className="h-4 w-4 text-muted-foreground" />
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitDisabled} aria-live="polite">
              {formSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              Sign in with Email
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Separator />
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <LifeBuoy className="h-4 w-4" />
              Need vendor access?
            </div>
            <p>
              If your organisation has not been onboarded yet, request access and our team will provision your vendor space.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link
                  href={`mailto:${SUPPORT_EMAIL}?subject=${MAILTO_SUBJECT}&body=${MAILTO_BODY}`}
                  aria-label="Request vendor access via email"
                >
                  Request Access
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-1" aria-label="Contact support">
                  Contact Support
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </main>
  )
}

