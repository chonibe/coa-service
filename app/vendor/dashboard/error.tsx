"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, LayoutDashboard, RefreshCw } from "lucide-react"

export default function VendorDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[vendor-dashboard-error-boundary]", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <Alert variant="destructive" className="text-left">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            This page hit an error. Try again or return to the dashboard.
          </AlertDescription>
        </Alert>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="default" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/vendor/dashboard">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
