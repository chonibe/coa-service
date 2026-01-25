"use client"

import Link from "next/link"
import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Logo } from "@/components/logo"
import {
  AlertCircle,
  Loader2,
  LifeBuoy,
  ArrowUpRight,
  Sparkles,
  Shield,
  Zap,
  CheckCircle2,
} from "lucide-react"

interface AuthStatusResponse {
  authenticated: boolean
  isAdmin: boolean
  hasAdminSession?: boolean
  vendorSession: string | null
  vendor: { id: number; vendor_name: string } | null
}

const NOT_REGISTERED_ERROR = "You are not registered. Contact support@thestreetcollector.com."

const SUPPORT_EMAIL = "support@thestreetcollector.com"
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
  const [formError, setFormError] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loginType, setLoginType] = useState<"vendor" | "collector">("collector")

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
    params.set("from", "hash")
    window.location.replace(`/auth/callback?${params.toString()}`)
  }, [])

  const hasCheckedSession = useRef(false)
  const hasRedirected = useRef(false)

  useEffect(() => {
    if (hasCheckedSession.current) {
      setCheckingSession(false)
      return
    }

    const abortController = new AbortController()

    const checkSession = async () => {
      hasCheckedSession.current = true

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

        if (hasRedirected.current) {
          setCheckingSession(false)
          return
        }

        // Check for collector session first
        if ((data as any).hasCollectorSession) {
          console.log(`[login-client] Redirecting to collector dashboard: hasCollectorSession=true`)
          hasRedirected.current = true
          window.location.replace("/collector/dashboard")
          return
        }

        if (data.vendorSession || data.vendor) {
          console.log(`[login-client] Redirecting to vendor dashboard: vendorSession=${data.vendorSession}, vendor=${data.vendor?.vendor_name}`)
          hasRedirected.current = true
          window.location.replace("/vendor/dashboard")
          return
        }

        if (data.isAdmin && data.hasAdminSession) {
          console.log(`[login-client] Redirecting to admin dashboard: isAdmin=true, hasAdminSession=true`)
          hasRedirected.current = true
          window.location.replace("/admin/dashboard")
          return
        }

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

    void checkSession()

    return () => {
      abortController.abort()
    }
  }, [])

  const handleGoogleLogin = () => {
    setFormError(null)
    setSuccessMessage(null)
    setGoogleLoading(true)

    // Check if this is an admin login attempt
    const isAdminLogin = searchParams.get("admin") === "true"
    
    let endpoint = `/api/auth/google/start`
    
    if (loginType === "collector") {
      endpoint = `/api/auth/collector/google/start`
    } else if (isAdminLogin) {
      endpoint = `/api/auth/google/start?redirect=/admin/dashboard`
    }

    window.location.href = endpoint
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Checking existing session" />
            <Sparkles className="h-4 w-4 absolute -top-1 -right-1 text-primary animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Checking session...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/20 dark:bg-blue-900/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-200/20 dark:bg-indigo-900/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl relative z-10">
        <CardHeader className="space-y-4 text-center pb-6">
          <div className="flex justify-center">
            <Logo 
              className="h-16 w-auto object-contain"
              alt="Street Lamp Logo"
            />
            <div className="relative hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur-lg opacity-50 animate-pulse" />
              <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-base">
              {loginType === "collector" 
                ? "Sign in to access your art collection and exclusive content"
                : "Sign in with your Google account to access your Street Collector dashboard"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {successMessage && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 dark:text-green-200">Success!</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">{successMessage}</AlertDescription>
            </Alert>
          )}

          {formError && (
            <Alert variant="destructive" className="animate-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Sign-in issue</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {googleLoading && !formError && !successMessage && (
            <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <AlertTitle className="text-blue-800 dark:text-blue-200">Redirecting to Google</AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                Please complete the sign-in flow in the new window.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {/* Login Type Selector */}
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              <button
                type="button"
                onClick={() => setLoginType("collector")}
                className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                  loginType === "collector"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Collector
              </button>
              <button
                type="button"
                onClick={() => setLoginType("vendor")}
                className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                  loginType === "vendor"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Vendor
              </button>
            </div>

            <Button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full h-14 text-base font-medium bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border-2 border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              size="lg"
              aria-label="Continue with Google"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg className="h-6 w-6 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </Button>

            <Button
              asChild
              disabled={googleLoading}
              className="hidden w-full h-14 text-base font-medium bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white border-2 border-slate-900 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              size="lg"
              aria-label="Continue with Google via Shopify"
            >
              <Link href="/api/auth/shopify/google/start">
                <Shield className="h-5 w-5 mr-3" />
                <span>Continue with Google (Shopify)</span>
              </Link>
            </Button>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Secure authentication powered by Google and Shopify
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 pt-6">
          <Separator />
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <LifeBuoy className="h-4 w-4 text-blue-600" />
              Need vendor access?
            </div>
            <p className="text-muted-foreground">
              If your organisation has not been onboarded yet, request access and our team will provision your vendor space.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm" className="flex-1 min-w-[140px]">
                <Link
                  href={`mailto:${SUPPORT_EMAIL}?subject=${MAILTO_SUBJECT}&body=${MAILTO_BODY}`}
                  aria-label="Request vendor access via email"
                >
                  <Zap className="h-3 w-3 mr-2" />
                  Request Access
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="flex-1 min-w-[140px]">
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
