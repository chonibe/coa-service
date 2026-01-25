"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Package, Loader2, AlertCircle, Store } from "lucide-react"
import { Logo } from "@/components/logo"

export default function SelectRolePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(true)
  const [hasVendorAccess, setHasVendorAccess] = useState(false)
  const [hasCollectorAccess, setHasCollectorAccess] = useState(false)

  useEffect(() => {
    // Verify admin session exists and check access levels
    const verifySession = async () => {
      try {
        const response = await fetch("/api/auth/status", {
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error("Unable to verify session")
        }

        const data = await response.json()

        // If not admin, redirect to login
        if (!data.isAdmin || !data.hasAdminSession) {
          router.push("/login")
          return
        }

        // Set access flags
        setHasVendorAccess(data.adminHasVendorAccess || false)
        setHasCollectorAccess(data.adminHasCollectorAccess || false)

        setIsVerifying(false)
      } catch (err: any) {
        console.error("Session verification failed:", err)
        setError("Failed to verify session")
        setIsVerifying(false)
      }
    }

    verifySession()
  }, [router])

  const handleSelectRole = async (role: "admin" | "vendor" | "collector") => {
    setIsLoading(true)
    setError(null)

    try {
      if (role === "admin") {
        // Already have admin session, just redirect
        window.location.href = "/admin/dashboard"
      } else if (role === "vendor") {
        // Switch to vendor role
        const response = await fetch("/api/auth/admin/switch-to-vendor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to switch to vendor role")
        }

        window.location.href = "/vendor/dashboard"
      } else {
        // Switch to collector role
        const response = await fetch("/api/auth/admin/switch-to-collector", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to switch to collector role")
        }

        window.location.href = "/collector/dashboard"
      }
    } catch (err: any) {
      console.error("Role selection failed:", err)
      setError(err.message || "Failed to select role")
      setIsLoading(false)
    }
  }

  if (isVerifying) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Verifying session...</p>
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

      <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl relative z-10">
        <CardHeader className="space-y-4 text-center pb-6">
          <div className="flex justify-center">
            <Logo className="h-16 w-auto object-contain" alt="Street Lamp Logo" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Welcome Back!
            </CardTitle>
            <CardDescription className="text-base">
              You have access to multiple areas. Please select which dashboard you'd like to access.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" className="animate-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className={`grid grid-cols-1 ${hasVendorAccess || hasCollectorAccess ? 'md:grid-cols-2' : ''} ${hasVendorAccess && hasCollectorAccess ? 'md:grid-cols-3' : ''} gap-4`}>
            {/* Admin Role Card */}
            <button
              onClick={() => handleSelectRole("admin")}
              disabled={isLoading}
              className="group relative overflow-hidden rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 p-6 text-left transition-all hover:border-blue-500 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative space-y-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                    Admin Dashboard
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Manage vendors, collectors, products, and system settings.
                  </p>
                </div>
                <div className="pt-2">
                  <span className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                    Access Admin →
                  </span>
                </div>
              </div>
            </button>

            {/* Vendor Role Card */}
            {hasVendorAccess && (
              <button
                onClick={() => handleSelectRole("vendor")}
                disabled={isLoading}
                className="group relative overflow-hidden rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 p-6 text-left transition-all hover:border-green-500 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative space-y-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                    <Store className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                      Vendor Dashboard
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Manage your products, series, artwork pages, and sales.
                    </p>
                  </div>
                  <div className="pt-2">
                    <span className="inline-flex items-center text-sm font-medium text-green-600 dark:text-green-400 group-hover:translate-x-1 transition-transform">
                      Access Vendor →
                    </span>
                  </div>
                </div>
              </button>
            )}

            {/* Collector Role Card */}
            {hasCollectorAccess && (
              <button
                onClick={() => handleSelectRole("collector")}
                disabled={isLoading}
                className="group relative overflow-hidden rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 p-6 text-left transition-all hover:border-indigo-500 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative space-y-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                      Collector Dashboard
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      View your art collection, authenticate pieces, and explore exclusive content.
                    </p>
                  </div>
                  <div className="pt-2">
                    <span className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                      Access Collection →
                    </span>
                  </div>
                </div>
              </button>
            )}
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Loading dashboard...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
