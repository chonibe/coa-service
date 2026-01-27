"use client"

import * as React from "react"
import { ErrorBoundary } from "react-error-boundary"

import { Alert, AlertDescription, AlertTitle, Button, Card, CardContent } from "@/components/ui"

type Props = {
  title?: string
  description?: string
  children: React.ReactNode
}

export function SectionErrorBoundary({
  title = "This section failed to load",
  description = "Try again. If the problem persists, refresh the page.",
  children,
}: Props) {
  return (
    <ErrorBoundary
      onError={(error) => {
        console.error("[collector-section-error-boundary]", { title, error })
      }}
      fallbackRender={({ resetErrorBoundary }) => (
        <Card>
          <CardContent className="py-6">
            <Alert variant="destructive">
              <AlertTitle>{title}</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>{description}</p>
                <Button type="button" variant="outline" onClick={resetErrorBoundary}>
                  Retry section
                </Button>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

