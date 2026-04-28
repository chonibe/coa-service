"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"

import { Logo } from "@/components/logo"
import { Container, SectionWrapper, Button } from "@/components/impact"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { SUPPORT_EMAIL, supportMailto } from "@/lib/constants/support"

interface AuthStatusResponse {
  authenticated: boolean
  isAdmin: boolean
  hasAdminSession?: boolean
  vendorSession: string | null
  vendor: { id: number; vendor_name: string } | null
}

type LoginType = "vendor" | "collector"

const NOT_REGISTERED_ERROR = `You're not registered yet. Write to ${SUPPORT_EMAIL} and we'll get you set up.`

/**
 * Accept a redirect value only if it is a same-origin relative URL. We allow
 * path + query + hash (needed for NFC scan round-trips like
 * `/collector/artwork/[id]?scan=pending`) but reject protocol-relative URLs
 * (`//evil.com`) and absolute URLs.
 */
function isSafeRedirect(value: string | null | undefined): value is string {
  if (!value) return false
  if (!value.startsWith("/")) return false
  if (value.startsWith("//")) return false
  if (value.startsWith("/\\")) return false
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(value)) return false
  return true
}

function resolveErrorMessage(code: string | null): string | null {
  switch (code) {
    case null:
    case "":
      return null
    case "not_registered":
      return NOT_REGISTERED_ERROR
    case "otp_expired":
      return "This sign-in link has expired. Head back and request a new one."
    case "signup_failed":
      return `We couldn't create your account. Try again in a moment or write to ${SUPPORT_EMAIL}.`
    case "no_collector_profile":
      return `Access denied. Sign up first or write to ${SUPPORT_EMAIL}.`
    case "session_missing":
      return `Your session didn't come through. Try again, and if it keeps happening, email ${SUPPORT_EMAIL}.`
    case "missing_code":
      return "Google didn't return a sign-in code. Please try again."
    default:
      return `We ran into a sign-in issue (${code}). Try again or write to ${SUPPORT_EMAIL}.`
  }
}

export default function LoginClient() {
  const searchParams = useSearchParams()
  const [formError, setFormError] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [successMessage] = useState<string | null>(null)
  const [loginType, setLoginType] = useState<LoginType>("collector")

  useEffect(() => {
    const intent = searchParams.get("intent")
    if (intent === "vendor" || intent === "collector") setLoginType(intent)
  }, [searchParams])

  useEffect(() => {
    const errorParam = searchParams.get("error")
    setFormError(resolveErrorMessage(errorParam))
  }, [searchParams])

  useEffect(() => {
    if (typeof window === "undefined") return
    const hash = window.location.hash
    if (!hash || !hash.includes("access_token")) return

    const params = new URLSearchParams(hash.replace(/^#/, ""))
    params.set("from", "hash")
    window.location.replace(`/auth/callback?${params.toString()}`)
  }, [])

  const hasCheckedSession = useRef(false)
  const hasRedirected = useRef(false)
  const isAdminLoginIntent = searchParams.get("admin") === "true"

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

        const data = (await response.json()) as AuthStatusResponse & {
          requireAccountSelection?: boolean
          hasCollectorSession?: boolean
          adminHasCollectorAccess?: boolean
          adminHasVendorAccess?: boolean
        }

        if (hasRedirected.current) {
          setCheckingSession(false)
          return
        }

        if (data.requireAccountSelection === true) {
          setCheckingSession(false)
          return
        }

        if (data.isAdmin && data.hasAdminSession) {
          const hasMultipleRoles = data.adminHasCollectorAccess || data.adminHasVendorAccess
          hasRedirected.current = true
          window.location.replace(hasMultipleRoles ? "/auth/select-role" : "/admin/dashboard")
          return
        }

        // Admin login should never be hijacked by remembered collector/vendor sessions.
        // If there is no active admin session, stay on /login?admin=true.
        if (isAdminLoginIntent) {
          setCheckingSession(false)
          return
        }

        if (data.isAdmin && !data.hasAdminSession) {
          setCheckingSession(false)
          return
        }

        const appShellEnabled = process.env.NEXT_PUBLIC_APP_SHELL_ENABLED !== "false"
        const vendorHome = appShellEnabled ? "/vendor/home" : "/vendor/dashboard"
        const collectorHome = appShellEnabled ? "/collector/home" : "/collector/dashboard"
        const redirectParam = searchParams.get("redirect")
        const intentParam = searchParams.get("intent")
        const wantsCollector =
          intentParam === "collector" || (redirectParam && /^\/shop\//.test(redirectParam))

        if (wantsCollector && data.hasCollectorSession) {
          const target = isSafeRedirect(redirectParam) ? redirectParam : collectorHome
          hasRedirected.current = true
          window.location.replace(target)
          return
        }

        if (data.vendorSession || data.vendor) {
          hasRedirected.current = true
          window.location.replace(vendorHome)
          return
        }

        if (data.hasCollectorSession) {
          const target = isSafeRedirect(redirectParam) ? redirectParam : collectorHome
          hasRedirected.current = true
          window.location.replace(target)
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
  }, [searchParams, isAdminLoginIntent])

  const handleGoogleLogin = () => {
    setFormError(null)
    setGoogleLoading(true)

    const isAdminLogin = searchParams.get("admin") === "true"
    const redirectParam = searchParams.get("redirect")
    const appShellEnabled = process.env.NEXT_PUBLIC_APP_SHELL_ENABLED !== "false"
    const vendorRedirect = appShellEnabled ? "/vendor/home" : "/vendor/dashboard"
    const defaultCollectorRedirect = "/experience"
    const collectorRedirect = isSafeRedirect(redirectParam)
      ? redirectParam
      : defaultCollectorRedirect
    let endpoint: string

    if (isAdminLogin) {
      endpoint = `/api/auth/google/start?admin=true&redirect=/admin/dashboard`
    } else if (loginType === "vendor") {
      endpoint = `/api/auth/google/start?redirect=${encodeURIComponent(vendorRedirect)}`
    } else {
      endpoint = `/api/auth/collector/google/start?redirect=${encodeURIComponent(
        collectorRedirect,
      )}`
    }

    window.location.href = endpoint
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3 text-[#1a1a1a]/70">
          <Loader2 className="h-5 w-5 animate-spin" aria-label="Checking existing session" />
          <p className="font-body text-sm">Checking your session…</p>
        </div>
      </main>
    )
  }

  const vendorCopy = loginType === "vendor"
  const headingCopy = vendorCopy ? "Sign in to your artist portal." : "Sign in to your collection."
  const subCopy = vendorCopy
    ? "Manage your editions, track sales, and request payouts."
    : "Access your art collection, saved pieces, and collector perks."

  return (
    <main className="min-h-screen bg-white">
      <SectionWrapper spacing="md" background="default">
        <Container maxWidth="narrow" paddingX="gutter">
          <div className="mx-auto max-w-md">
            <div className="flex justify-center mb-10">
              <Logo className="h-10 w-auto object-contain" alt="The Street Collector" />
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-[#1a1a1a] tracking-[-0.02em] text-center mb-3">
              {headingCopy}
            </h1>
            <p className="font-body text-[#1a1a1a]/70 text-center mb-8">{subCopy}</p>

            {/* Role selector */}
            <div
              role="tablist"
              aria-label="Choose account type"
              className="grid grid-cols-2 gap-1 p-1 mb-8 rounded-full border border-[#1a1a1a]/10 bg-[#FAFAF7]"
            >
              <button
                type="button"
                role="tab"
                aria-selected={!vendorCopy}
                onClick={() => setLoginType("collector")}
                className={`py-2.5 rounded-full text-sm font-body font-medium transition-colors ${
                  !vendorCopy
                    ? "bg-white text-[#1a1a1a] shadow-sm"
                    : "text-[#1a1a1a]/60 hover:text-[#1a1a1a]"
                }`}
              >
                Collector
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={vendorCopy}
                onClick={() => setLoginType("vendor")}
                className={`py-2.5 rounded-full text-sm font-body font-medium transition-colors ${
                  vendorCopy
                    ? "bg-white text-[#1a1a1a] shadow-sm"
                    : "text-[#1a1a1a]/60 hover:text-[#1a1a1a]"
                }`}
              >
                Artist
              </button>
            </div>

            {successMessage && (
              <div
                role="status"
                className="flex items-start gap-3 rounded-xl bg-[#00a341]/10 border border-[#00a341]/30 p-4 mb-6"
              >
                <CheckCircle2 className="h-5 w-5 text-[#00a341] shrink-0" />
                <p className="font-body text-sm text-[#00a341]">{successMessage}</p>
              </div>
            )}

            {formError && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl bg-[#f83a3a]/10 border border-[#f83a3a]/30 p-4 mb-6"
              >
                <AlertCircle className="h-5 w-5 text-[#f83a3a] shrink-0" />
                <div>
                  <p className="font-body text-sm font-medium text-[#f83a3a]">
                    Sign-in issue
                  </p>
                  <p className="font-body text-sm text-[#1a1a1a]/80 mt-0.5">{formError}</p>
                </div>
              </div>
            )}

            <Button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              variant="primary"
              size="lg"
              className="w-full"
              aria-label="Continue with Google"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  <span>Connecting to Google…</span>
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" aria-hidden="true">
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

            <p className="font-body text-xs text-[#1a1a1a]/50 text-center mt-4">
              Secure sign-in powered by Google.
            </p>

            <div className="mt-10 pt-8 border-t border-[#1a1a1a]/10 space-y-4 text-center">
              {vendorCopy ? (
                <>
                  <p className="font-body text-sm text-[#1a1a1a]/70">
                    Not an artist on our portal yet?{" "}
                    <Link href="/for-artists" className="underline underline-offset-4 text-[#1a1a1a]">
                      See how to apply
                    </Link>
                    .
                  </p>
                  <p className="font-body text-xs text-[#1a1a1a]/50">
                    Need help signing in?{" "}
                    <a
                      href={supportMailto("Artist portal sign-in help")}
                      className="underline underline-offset-4"
                    >
                      Write to {SUPPORT_EMAIL}
                    </a>
                    .
                  </p>
                </>
              ) : (
                <p className="font-body text-sm text-[#1a1a1a]/70">
                  Collectors: sign in with the same Google account you used to purchase. Trouble?{" "}
                  <a
                    href={supportMailto("Collector sign-in help")}
                    className="underline underline-offset-4"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                </p>
              )}

              {process.env.NODE_ENV === "development" && (
                <p className="font-body text-xs text-amber-700">
                  <Link
                    href={`/api/dev/mock-login?email=streets@streets.com&redirect=${encodeURIComponent(
                      searchParams.get("redirect") ?? "/shop/account",
                    )}`}
                    className="underline underline-offset-4"
                  >
                    Dev: mock login as streets@streets.com
                  </Link>
                </p>
              )}
            </div>
          </div>
        </Container>
      </SectionWrapper>
    </main>
  )
}
