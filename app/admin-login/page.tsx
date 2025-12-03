"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AdminLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Handle OAuth callback with tokens in hash fragment (from Supabase redirect)
    const hash = window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get("access_token")
      const refreshToken = params.get("refresh_token")
      const expiresAt = params.get("expires_at")
      const providerToken = params.get("provider_token")
      const code = params.get("code") // Supabase might pass code in hash
      
      // If we have a code, redirect to admin callback
      if (code) {
        const callbackUrl = new URL("/auth/admin/callback", window.location.origin)
        callbackUrl.searchParams.set("code", code)
        
        // Clear hash and redirect to admin callback
        window.history.replaceState(null, "", window.location.pathname)
        window.location.href = callbackUrl.toString()
        return
      }
      
      // If we have tokens but no code, redirect to admin callback with tokens
      if (accessToken && refreshToken) {
        const callbackUrl = new URL("/auth/admin/callback", window.location.origin)
        callbackUrl.searchParams.set("access_token", accessToken)
        callbackUrl.searchParams.set("refresh_token", refreshToken)
        if (expiresAt) callbackUrl.searchParams.set("expires_at", expiresAt)
        if (providerToken) callbackUrl.searchParams.set("provider_token", providerToken)
        
        // Clear hash and redirect to admin callback
        window.history.replaceState(null, "", window.location.pathname)
        window.location.href = callbackUrl.toString()
        return
      }
    }

    // Check for error message from OAuth redirect
    const urlParams = new URLSearchParams(window.location.search)
    const error = urlParams.get("error")
    const errorMessage = urlParams.get("message")
    const hint = urlParams.get("hint")
    
    if (error === "use_admin_login") {
      setError("Admin users must use the admin login page. Please sign in using the button below.")
      urlParams.delete("error")
      window.history.replaceState({}, "", window.location.pathname)
    } else if (error === "missing_code") {
      if (hint === "supabase_redirect_config") {
        setError("OAuth configuration error: The admin callback URL is not configured in Supabase. Please add 'https://dashboard.thestreetlamp.com/auth/admin/callback' to Supabase's allowed redirect URLs in Authentication → URL Configuration.")
      } else if (hint === "formatting_issue") {
        const expected = urlParams.get("expected") || "https://dashboard.thestreetlamp.com/auth/admin/callback"
        setError(`OAuth configuration error: The admin callback URL in Supabase may have a formatting issue. Please verify it matches EXACTLY (no trailing slash, no extra spaces): ${expected}`)
      } else {
        setError("Missing OAuth code. Please try logging in again.")
      }
      urlParams.delete("error")
      urlParams.delete("hint")
      urlParams.delete("expected")
      window.history.replaceState({}, "", window.location.pathname)
    } else if (error === "supabase_error" && errorMessage) {
      setError(`Supabase OAuth error: ${errorMessage}. Please check Supabase Dashboard → Authentication → URL Configuration.`)
      urlParams.delete("error")
      urlParams.delete("message")
      window.history.replaceState({}, "", window.location.pathname)
    } else if (error === "oauth_error" && errorMessage) {
      setError(`OAuth error: ${errorMessage}`)
      urlParams.delete("error")
      urlParams.delete("message")
      window.history.replaceState({}, "", window.location.pathname)
    }

    // Check if already logged in
    async function checkSession() {
      try {
        const response = await fetch("/api/auth/status", {
          cache: "no-store",
        })

        if (response.ok) {
          const data = await response.json()
          if (data.isAdmin && data.hasAdminSession) {
            router.replace("/admin/dashboard")
            return
          }
        }
      } catch (error) {
        console.error("Session check failed:", error)
      } finally {
        setCheckingSession(false)
      }
    }

    checkSession()
  }, [router])

  const handleGoogleLogin = () => {
    setIsLoading(true)
    // Use dedicated admin OAuth route - ALWAYS requests Gmail scopes
    window.location.href = "/api/auth/admin/google/start?redirect=/admin/dashboard"
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking session...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Admin Login</CardTitle>
          <CardDescription className="text-center">
            Sign in with Google to access the admin dashboard
            <br />
            <span className="text-xs text-muted-foreground mt-2 block">
              Gmail access will be requested for CRM email sync
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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
                Continue with Google
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Admin access only. Gmail permissions required for CRM features.
          </p>
          {error && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

