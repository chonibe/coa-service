"use client"

import { useEffect } from "react"
import Link from "next/link"


import { AlertCircle, LayoutDashboard, RefreshCw } from "lucide-react"

import { Alert, AlertDescription, AlertTitle, Button } from "@/components/ui"
import { getCollectorPageContent } from "@/lib/content/site-content"

const errorContent = getCollectorPageContent('errorBoundary')
export default function CollectorError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[collector-error-boundary]", error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <Alert variant="destructive" className="text-left">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{errorContent.title}</AlertTitle>
          <AlertDescription>
            {errorContent.body}
          </AlertDescription>
        </Alert>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="default" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {errorContent.retry}
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/collector/dashboard">
              <LayoutDashboard className="h-4 w-4" />
              {errorContent.dashboard}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
