"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, Home, RefreshCw } from "lucide-react"

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[error-boundary]", error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <Alert variant="destructive" className="text-left">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            A component error occurred. You can try again or go back home.
          </AlertDescription>
        </Alert>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="default" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Go home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
