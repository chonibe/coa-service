"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function TestUrlPage() {
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [urlInfo, setUrlInfo] = useState<any>(null)
  const [isTesting, setIsTesting] = useState(false)

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Test the URL on load
  useEffect(() => {
    if (mounted) {
      testUrl()
    }
  }, [mounted])

  // Don't render anything until mounted
  if (!mounted) {
    return null
  }

  const testUrl = async () => {
    try {
      setIsTesting(true)
      setError(null)

      const response = await fetch("/api/test-url")

      if (!response.ok) {
        throw new Error(`Error ${response.status}: Failed to test URL`)
      }

      const data = await response.json()
      setUrlInfo(data)
    } catch (err: any) {
      console.error("Error testing URL:", err)
      setError(err.message || "Failed to test URL")
    } finally {
      setIsTesting(false)
      setIsLoading(false)
    }
  }

  const testCronDirectly = async () => {
    try {
      setIsTesting(true)
      setError(null)

      // Use window.location.origin to get the base URL
      const baseUrl = window.location.origin
      const cronUrl = `${baseUrl}/api/cron/sync-shopify-orders?secret=test`

      alert(`Testing direct access to: ${cronUrl}`)

      // Open in a new tab
      window.open(cronUrl, "_blank")
    } catch (err: any) {
      console.error("Error:", err)
      setError(err.message || "Failed to open URL")
    } finally {
      setIsTesting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 max-w-5xl">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Testing URL configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <div className="flex flex-col space-y-8">
        <div>
          <Link href="/admin" className="text-sm hover:underline mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">URL Configuration Test</h1>
          <p className="text-muted-foreground mt-2">Test your application's URL configuration</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>URL Information</CardTitle>
            <CardDescription>Details about your application's URL configuration</CardDescription>
          </CardHeader>
          <CardContent>
            {urlInfo && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Request URL</h3>
                  <p className="text-sm bg-muted p-2 rounded-md overflow-auto">{urlInfo.requestUrl}</p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Next.js URL</h3>
                  <p className="text-sm bg-muted p-2 rounded-md overflow-auto">{urlInfo.nextUrl}</p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Origin</h3>
                  <p className="text-sm bg-muted p-2 rounded-md overflow-auto">{urlInfo.origin}</p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">NEXT_PUBLIC_APP_URL</h3>
                  <p className="text-sm bg-muted p-2 rounded-md overflow-auto">{urlInfo.envUrl}</p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Correct Cron URL</h3>
                  <p className="text-sm bg-muted p-2 rounded-md overflow-auto">{urlInfo.correctCronUrl}</p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Headers</h3>
                  <pre className="text-xs bg-muted p-2 rounded-md overflow-auto">
                    {JSON.stringify(urlInfo.headers, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
            <Button onClick={testUrl} disabled={isTesting}>
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh URL Info
                </>
              )}
            </Button>

            <Button onClick={testCronDirectly} variant="outline">
              Test Cron URL Directly
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting Steps</CardTitle>
            <CardDescription>Common issues and how to fix them</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Authentication Redirect Issues</h3>
                <p className="text-sm text-muted-foreground">
                  If you see "/authenticate/" in your URLs, you might have authentication middleware that's redirecting
                  API requests. Check your middleware.ts file and make sure it's not affecting API routes.
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Environment Variable Issues</h3>
                <p className="text-sm text-muted-foreground">
                  Make sure your NEXT_PUBLIC_APP_URL environment variable is set correctly without any trailing slashes
                  or path segments.
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Direct URL Access</h3>
                <p className="text-sm text-muted-foreground">
                  Try accessing the cron endpoint directly in your browser to see if it works. This can help identify if
                  the issue is with the URL construction or with the endpoint itself.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
