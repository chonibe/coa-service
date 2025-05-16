"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, RefreshCw, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function TestConnectionsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<any>(null)
  const [isTesting, setIsTesting] = useState(false)

  // Run tests on load
  useEffect(() => {
    runTests()
  }, [])

  const runTests = async () => {
    try {
      setIsTesting(true)
      setError(null)

      const response = await fetch("/api/test-connections")

      if (!response.ok) {
        throw new Error(`Error ${response.status}: Failed to run connection tests`)
      }

      const data = await response.json()
      setTestResults(data)
    } catch (err: any) {
      console.error("Error running tests:", err)
      setError(err.message || "Failed to run connection tests")
    } finally {
      setIsTesting(false)
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 max-w-5xl">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Testing connections...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <div className="flex flex-col space-y-8">
        <div>
          <Link href="/admin" className="flex items-center text-sm mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Connection Tests</h1>
          <p className="text-muted-foreground mt-2">Test connections to Shopify API, Supabase, and cron endpoints</p>
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
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription>Check if required environment variables are set</CardDescription>
          </CardHeader>
          <CardContent>
            {testResults?.environment && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(testResults.environment).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="font-medium">{key}</div>
                    <Badge variant={value === "Set" ? "default" : "destructive"}>{value}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shopify API Connection</CardTitle>
            <CardDescription>Test connection to Shopify API</CardDescription>
          </CardHeader>
          <CardContent>
            {testResults?.shopify_api && (
              <div className="space-y-4">
                <div className="flex items-center">
                  <Badge
                    variant={testResults.shopify_api.status === "Success" ? "default" : "destructive"}
                    className="mr-2"
                  >
                    {testResults.shopify_api.status}
                  </Badge>
                  <span>{testResults.shopify_api.message}</span>
                </div>

                {testResults.shopify_api.details && (
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-xs overflow-auto whitespace-pre-wrap">
                      {JSON.stringify(testResults.shopify_api.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supabase Connection</CardTitle>
            <CardDescription>Test connection to Supabase database</CardDescription>
          </CardHeader>
          <CardContent>
            {testResults?.supabase && (
              <div className="space-y-4">
                <div className="flex items-center">
                  <Badge
                    variant={testResults.supabase.status === "Success" ? "default" : "destructive"}
                    className="mr-2"
                  >
                    {testResults.supabase.status}
                  </Badge>
                  <span>{testResults.supabase.message}</span>
                </div>

                {testResults.supabase.details && (
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-xs overflow-auto whitespace-pre-wrap">
                      {JSON.stringify(testResults.supabase.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cron Endpoint</CardTitle>
            <CardDescription>Test connection to cron job endpoint</CardDescription>
          </CardHeader>
          <CardContent>
            {testResults?.cron_endpoint && (
              <div className="space-y-4">
                <div className="flex items-center">
                  <Badge
                    variant={testResults.cron_endpoint.status === "Success" ? "default" : "destructive"}
                    className="mr-2"
                  >
                    {testResults.cron_endpoint.status}
                  </Badge>
                  <span>{testResults.cron_endpoint.message}</span>
                </div>

                {testResults.cron_endpoint.details && (
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-xs overflow-auto whitespace-pre-wrap">
                      {JSON.stringify(testResults.cron_endpoint.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={runTests} disabled={isTesting}>
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Run Tests Again
                </>
              )}
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
                <h3 className="font-medium mb-2">Missing Environment Variables</h3>
                <p className="text-sm text-muted-foreground">
                  Make sure all required environment variables are set in your Vercel project settings:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li>SHOPIFY_SHOP - Your Shopify store domain (e.g., your-store.myshopify.com)</li>
                  <li>SHOPIFY_ACCESS_TOKEN - Your Shopify Admin API access token</li>
                  <li>CRON_SECRET - A secret key to secure your cron job endpoints</li>
                  <li>NEXT_PUBLIC_SUPABASE_URL - Your Supabase project URL</li>
                  <li>SUPABASE_SERVICE_ROLE_KEY - Your Supabase service role key</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-2">Shopify API Connection Issues</h3>
                <p className="text-sm text-muted-foreground">If you're having trouble connecting to the Shopify API:</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li>Verify your SHOPIFY_SHOP domain is correct</li>
                  <li>Check that your SHOPIFY_ACCESS_TOKEN is valid and has the necessary permissions</li>
                  <li>Ensure your Shopify app has the required scopes (read_orders, write_orders)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-2">Supabase Connection Issues</h3>
                <p className="text-sm text-muted-foreground">If you're having trouble connecting to Supabase:</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li>Verify your NEXT_PUBLIC_SUPABASE_URL is correct</li>
                  <li>Check that your SUPABASE_SERVICE_ROLE_KEY is valid</li>
                  <li>Ensure your Supabase project is active and not in maintenance mode</li>
                  <li>Check that the required tables exist in your database</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-2">Cron Endpoint Issues</h3>
                <p className="text-sm text-muted-foreground">If your cron endpoint is not working:</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li>Make sure the CRON_SECRET environment variable is set</li>
                  <li>Verify that the cron endpoint URL is correct</li>
                  <li>Check that your vercel.json file has the correct cron job configuration</li>
                  <li>Ensure your Vercel project has the Cron feature enabled (Pro plan required)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
