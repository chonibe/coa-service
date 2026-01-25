"use client"

import { AlertCircle, RefreshCw } from "lucide-react"



import { Button, Alert, AlertDescription, AlertTitle } from "@/components/ui"
interface ErrorFallbackProps {
  error: string
  resetErrorBoundary: () => void
  isRetrying?: boolean
}

export function ErrorFallback({ error, resetErrorBoundary, isRetrying = false }: ErrorFallbackProps) {
  return (
    <div className="p-4 rounded-lg border bg-background">
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>

      <div className="flex justify-center">
        <Button onClick={resetErrorBoundary} disabled={isRetrying}>
          {isRetrying ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
