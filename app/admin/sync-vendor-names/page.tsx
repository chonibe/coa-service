"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"

export default function SyncVendorNamesPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [stats, setStats] = useState({
    totalProcessed: 0,
    totalUpdated: 0,
    batchesCompleted: 0,
    lastId: 0,
  })
  const [batchSize, setBatchSize] = useState(50)
  const [error, setError] = useState<string | null>(null)

  const startSync = async () => {
    setIsRunning(true)
    setStatus("running")
    setMessage("Starting vendor name sync...")
    setStats({
      totalProcessed: 0,
      totalUpdated: 0,
      batchesCompleted: 0,
      lastId: 0,
    })
    setError(null)

    await processBatch()
  }

  const processBatch = async () => {
    try {
      const response = await fetch("/api/sync-vendor-names", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_PASSWORD || localStorage.getItem("admin_password") || ""}`,
        },
        body: JSON.stringify({
          batchSize,
          startAfter: stats.lastId,
          limit: batchSize,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to sync vendor names")
      }

      const data = await response.json()

      // Update stats
      const newStats = {
        totalProcessed: stats.totalProcessed + data.processed,
        totalUpdated: stats.totalUpdated + data.updated,
        batchesCompleted: stats.batchesCompleted + 1,
        lastId: data.lastId,
      }
      setStats(newStats)

      // Update message
      setMessage(`Processed ${newStats.totalProcessed} line items, updated ${newStats.totalUpdated} with vendor names`)

      // Continue if there are more items to process
      if (data.hasMore) {
        // Add a small delay to prevent rate limiting
        setTimeout(() => {
          processBatch()
        }, 1000)
      } else {
        setIsRunning(false)
        setStatus("success")
        setProgress(100)
        setMessage(
          `Sync completed. Processed ${newStats.totalProcessed} line items, updated ${newStats.totalUpdated} with vendor names.`,
        )
      }
    } catch (error) {
      console.error("Error syncing vendor names:", error)
      setIsRunning(false)
      setStatus("error")
      setError(error.message || "An unknown error occurred")
      setMessage("Sync failed. See error details.")
    }
  }

  // Update progress when stats change
  useEffect(() => {
    if (status === "running") {
      // Estimate progress (this is approximate since we don't know the total)
      const estimatedProgress = Math.min(stats.batchesCompleted * 10, 90)
      setProgress(estimatedProgress)
    }
  }, [stats, status])

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Sync Vendor Names</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Vendor Name Sync</CardTitle>
          <CardDescription>
            This tool will fetch vendor names from Shopify for all line items in the database that don't have a vendor
            name set.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "error" && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {status === "success" && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Batch Size</label>
            <input
              type="number"
              value={batchSize}
              onChange={(e) => setBatchSize(Number.parseInt(e.target.value) || 50)}
              className="border rounded px-3 py-2 w-full max-w-xs"
              min="10"
              max="200"
              disabled={isRunning}
            />
            <p className="text-sm text-gray-500 mt-1">
              Number of line items to process in each batch. Smaller batches are slower but more reliable.
            </p>
          </div>

          {status !== "idle" && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Progress</label>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-gray-500 mt-1">{message}</p>
            </div>
          )}

          {stats.totalProcessed > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-500">Processed</div>
                <div className="text-xl font-semibold">{stats.totalProcessed}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-500">Updated</div>
                <div className="text-xl font-semibold">{stats.totalUpdated}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-500">Batches</div>
                <div className="text-xl font-semibold">{stats.batchesCompleted}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-500">Last ID</div>
                <div className="text-xl font-semibold">{stats.lastId}</div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={startSync} disabled={isRunning} className="mr-2">
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Start Sync
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About This Tool</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose">
            <p>
              This tool syncs vendor names from Shopify to your database for all line items that don't already have a
              vendor name set.
            </p>
            <h3>How it works:</h3>
            <ol>
              <li>Fetches line items from the database that don't have a vendor_name</li>
              <li>Groups them by order_id to minimize API calls to Shopify</li>
              <li>Fetches each order from Shopify</li>
              <li>Extracts vendor information from the line items</li>
              <li>Updates the database with the vendor names</li>
            </ol>
            <p>
              The sync processes items in batches to avoid timeouts and rate limits. You can adjust the batch size as
              needed.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
