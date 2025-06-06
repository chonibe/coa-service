"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, FileText } from "lucide-react"
import Link from "next/link"
import { Layers, Settings, Clock } from "lucide-react"

export default function AssignUrlsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [progress, setProgress] = useState<{
    processed: number;
    total: number;
    success: number;
    failed: number;
    hasMore: boolean;
  } | null>(null)

  const handleAssignUrls = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setResult(null)
      setProgress(null)

      const response = await fetch("/api/certificate/assign-urls", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to assign URLs")
      }

      setResult(data)
      setProgress({
        processed: data.results.length,
        total: data.results.length,
        success: data.results.filter((r: any) => r.success).length,
        failed: data.results.filter((r: any) => !r.success).length,
        hasMore: data.hasMore
      })
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleContinueProcessing = async () => {
    if (!progress?.hasMore) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/certificate/assign-urls", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to assign URLs")
      }

      setResult(data)
      setProgress(prev => prev ? {
        processed: prev.processed + data.results.length,
        total: prev.total + data.results.length,
        success: prev.success + data.results.filter((r: any) => r.success).length,
        failed: prev.failed + data.results.filter((r: any) => !r.success).length,
        hasMore: data.hasMore
      } : null)
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-3xl">
      <div className="flex flex-col space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assign Certificate URLs</h1>
          <p className="text-muted-foreground mt-2">Assign certificate URLs to all active line items</p>

          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant="outline" asChild>
              <Link href="/admin">
                <Layers className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/certificates">
                <FileText className="mr-2 h-4 w-4" />
                Certificates
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/certificates/management">
                <Settings className="mr-2 h-4 w-4" />
                Certificate Management
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/certificates/logs">
                <Clock className="mr-2 h-4 w-4" />
                Access Logs
              </Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assign Certificate URLs</CardTitle>
            <CardDescription>
              This will assign certificate URLs to all active line items that don't have one yet.
              Items will be processed in batches to prevent timeouts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {progress && (
              <div className="space-y-4 mb-4">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Processed: {progress.processed} items</span>
                  <span>Success: {progress.success}</span>
                  <span>Failed: {progress.failed}</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${(progress.processed / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {result && (
              <Alert className="mb-4">
                <AlertTitle>Operation Complete</AlertTitle>
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button onClick={handleAssignUrls} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning URLs...
                </>
              ) : (
                "Assign Certificate URLs"
              )}
            </Button>
            {progress?.hasMore && (
              <Button onClick={handleContinueProcessing} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing More...
                  </>
                ) : (
                  "Continue Processing"
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 