"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, Building2 } from "lucide-react"
import { Logo } from "@/components/logo"

interface VendorAccount {
  id: number
  vendor_name: string
  status: string | null
}

export default function SelectAccountPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [vendor, setVendor] = useState<VendorAccount | null>(null)

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const response = await fetch("/api/vendor/available-accounts", {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch vendor accounts")
        }

        const data = await response.json()
        if (data.vendor) {
          setVendor(data.vendor)
        } else {
          setError("No vendor account found. Please contact support.")
        }
      } catch (err: any) {
        console.error("Error fetching vendor:", err)
        setError(err.message || "Failed to load vendor account")
      } finally {
        setLoading(false)
      }
    }

    void fetchVendor()
  }, [])

  const handleSelectAccount = async () => {
    if (!vendor) return

    setSelecting(true)
    setError(null)

    try {
      const response = await fetch("/api/vendor/select-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ vendorName: vendor.vendor_name }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to select account")
      }

      // Redirect to vendor dashboard
      router.push("/vendor/dashboard")
    } catch (err: any) {
      console.error("Error selecting account:", err)
      setError(err.message || "Failed to select account")
      setSelecting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading account information...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <CardHeader className="space-y-4 text-center pb-6">
          <div className="flex justify-center">
            <Logo className="h-16 w-auto object-contain" alt="Street Lamp Logo" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Select Account
            </CardTitle>
            <CardDescription className="text-base">
              Please select the vendor account you want to access
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

          {vendor && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{vendor.vendor_name}</h3>
                    {vendor.status && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Status: <span className="capitalize">{vendor.status}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSelectAccount}
                disabled={selecting}
                className="w-full"
                size="lg"
              >
                {selecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Selecting Account...
                  </>
                ) : (
                  "Continue with this Account"
                )}
              </Button>
            </div>
          )}

          {!vendor && !error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No vendor accounts found. Please contact support if you believe this is an error.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

