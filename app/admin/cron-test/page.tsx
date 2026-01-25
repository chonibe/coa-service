"use client"

import { useState } from "react"



import { Loader2, AlertCircle, Terminal } from "lucide-react"
import Link from "next/link"

import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Alert, AlertDescription, AlertTitle } from "@/components/ui"
export default function CronTestPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  const runCron = async (endpoint: string) => {
    try {
      setIsLoading(true)
      setError(null)
      setResult(null)

      let url: string

      // Determine which endpoint to use
      switch (endpoint) {
        case "direct":
          url = `/api/cron/sync-shopify-orders?secret=${process.env.CRON_SECRET || "test"}`
          break
        case "admin":
          url = `/api/admin/run-cron?secret=${process.env.CRON_SECRET || "test"}`
          break
        case "test-url":
          url = "/api/test-url"
          break
        default:
          url = `/api/admin/run-cron?secret=${process.env.CRON_SECRET || "test"}`
      }

      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}`)
      }

      setResult(data)
    } catch (err: any) {
      console.error("Error running cron job:", err)
      setError(err.message || "Failed to run cron job")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <div className="flex flex-col space-y-8">
        <div>
          <Link href="/admin" className="text-sm hover:underline mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Cron Job Tester</h1>
          <p className="text-muted-foreground mt-2">Test and debug cron job execution</p>
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
            <CardTitle>Cron Job Test Options</CardTitle>
            <CardDescription>Choose a method to test the cron job</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Direct API Call</CardTitle>
                  <CardDescription>Call the cron endpoint directly</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground pt-0">
                  This makes a direct call to the cron API endpoint, which may be affected by middleware.
                </CardContent>
                <CardFooter>
                  <Button onClick={() => runCron("direct")} disabled={isLoading} variant="outline" className="w-full">
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Terminal className="h-4 w-4 mr-2" />
                    )}
                    Run Direct
                  </Button>
                </CardFooter>
              </Card>

              <Card className="border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Admin Runner</CardTitle>
                  <CardDescription>Use the admin cron runner</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground pt-0">
                  This uses a dedicated admin endpoint that bypasses middleware to run the cron job.
                </CardContent>
                <CardFooter>
                  <Button onClick={() => runCron("admin")} disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Terminal className="h-4 w-4 mr-2" />
                    )}
                    Run via Admin
                  </Button>
                </CardFooter>
              </Card>

              <Card className="border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Test URL Config</CardTitle>
                  <CardDescription>Check URL configuration</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground pt-0">
                  This tests your URL configuration to diagnose potential issues.
                </CardContent>
                <CardFooter>
                  <Button onClick={() => runCron("test-url")} disabled={isLoading} variant="outline" className="w-full">
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Terminal className="h-4 w-4 mr-2" />
                    )}
                    Test URL Config
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Result</CardTitle>
              <CardDescription>Response from the cron job endpoint</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md bg-muted p-4">
                <pre className="text-xs overflow-auto whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting Guide</CardTitle>
            <CardDescription>Common issues and solutions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">404 Error with /authenticate/ in URL</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  This occurs when middleware is intercepting API routes and trying to redirect them through an
                  authentication path.
                </p>
                <div className="mt-2">
                  <p className="text-sm font-medium">Solutions:</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                    <li>Make sure middleware.ts correctly excludes API routes in the matcher configuration</li>
                    <li>Use the Admin Runner which bypasses middleware interference</li>
                    <li>Add headers to your requests that middleware can check to bypass authentication</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium">Secret Key Issues</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Cron jobs may fail if the CRON_SECRET environment variable is not correctly set or provided.
                </p>
                <div className="mt-2">
                  <p className="text-sm font-medium">Solutions:</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                    <li>Verify the CRON_SECRET environment variable is set in your Vercel project</li>
                    <li>Ensure the secret is correctly included in the URL when calling the endpoint</li>
                    <li>Check for any typos or encoding issues in the secret value</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium">URL Construction Issues</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  The NEXT_PUBLIC_APP_URL environment variable may be incorrectly set or used.
                </p>
                <div className="mt-2">
                  <p className="text-sm font-medium">Solutions:</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                    <li>Use the request origin directly instead of relying on environment variables</li>
                    <li>Make sure there are no trailing slashes or unexpected segments in your URLs</li>
                    <li>Use the Test URL Config option to diagnose URL construction issues</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
