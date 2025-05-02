"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  const [batchSize, setBatchSize] = useState(5) // Reduced default batch size
  const [error, setError] = useState<string | null>(null)
  const [timeout, setTimeout] = useState(30000) // 30 seconds timeout

  // For single order processing
  const [orderId, setOrderId] = useState("")
  const [singleOrderStats, setSingleOrderStats] = useState({
    processed: 0,
    updated: 0,
    lastId: 0,
  })
  const [singleOrderStatus, setSingleOrderStatus] = useState<"idle" | "running" | "success" | "error">("idle")
  const [singleOrderMessage, setSingleOrderMessage] = useState("")
  const [singleOrderError, setSingleOrderError] = useState<string | null>(null)

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
      // Get admin password from environment or localStorage
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || localStorage.getItem("admin_password") || ""

      if (!adminPassword) {
        throw new Error("Admin password not found. Please ensure NEXT_PUBLIC_ADMIN_PASSWORD is set.")
      }

      // Create an AbortController for timeout handling
      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), timeout)

      try {
        const response = await fetch("/api/sync-vendor-names", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminPassword}`,
          },
          body: JSON.stringify({
            batchSize,
            startAfter: stats.lastId,
            limit: batchSize,
          }),
          signal: controller.signal,
        })

        // Clear the timeout since the request completed
        window.clearTimeout(timeoutId)

        // Handle response
        if (!response.ok) {
          // Try to get error details from response
          let errorMessage
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorData.message || `Server error: ${response.status}`
          } catch (jsonError) {
            // If we can't parse JSON, use status text
            errorMessage = `Server error: ${response.status} ${response.statusText}`
          }
          throw new Error(errorMessage)
        }

        // Parse successful response
        const data = await response.json()

        // Update stats
        const newStats = {
          totalProcessed: stats.totalProcessed + (data.processed || 0),
          totalUpdated: stats.totalUpdated + (data.updated || 0),
          batchesCompleted: stats.batchesCompleted + 1,
          lastId: data.lastId || stats.lastId,
        }
        setStats(newStats)

        // Update message
        setMessage(
          `Processed ${newStats.totalProcessed} line items, updated ${newStats.totalUpdated} with vendor names`,
        )

        // Continue if there are more items to process
        if (data.hasMore) {
          // Add a small delay to prevent rate limiting
          setTimeout(() => {
            processBatch()
          }, 2000) // Increased delay to 2 seconds
        } else {
          setIsRunning(false)
          setStatus("success")
          setProgress(100)
          setMessage(
            `Sync completed. Processed ${newStats.totalProcessed} line items, updated ${newStats.totalUpdated} with vendor names.`,
          )
        }
      } catch (fetchError) {
        // Clear the timeout to prevent memory leaks
        window.clearTimeout(timeoutId)

        // Handle AbortError (timeout)
        if (fetchError.name === "AbortError") {
          throw new Error(`Request timed out after ${timeout / 1000} seconds. Try reducing the batch size.`)
        }

        throw fetchError
      }
    } catch (error) {
      console.error("Error syncing vendor names:", error)
      setIsRunning(false)
      setStatus("error")
      setError(error.message || "An unknown error occurred")
      setMessage("Sync failed. See error details.")
    }
  }

  const processSingleOrder = async () => {
    if (!orderId) {
      setSingleOrderError("Please enter an order ID")
      return
    }

    setSingleOrderStatus("running")
    setSingleOrderMessage("Processing order...")
    setSingleOrderError(null)
    setSingleOrderStats({
      processed: 0,
      updated: 0,
      lastId: 0,
    })

    try {
      // Get admin password
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || localStorage.getItem("admin_password") || ""

      if (!adminPassword) {
        throw new Error("Admin password not found. Please ensure NEXT_PUBLIC_ADMIN_PASSWORD is set.")
      }

      // Create an AbortController for timeout handling
      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), timeout)

      try {
        const response = await fetch("/api/sync-vendor-names-single", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminPassword}`,
          },
          body: JSON.stringify({
            orderId,
            startAfterId: singleOrderStats.lastId,
          }),
          signal: controller.signal,
        })

        // Clear the timeout
        window.clearTimeout(timeoutId)

        // Handle response
        if (!response.ok) {
          // Try to get error details from response
          let errorMessage
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorData.message || `Server error: ${response.status}`
          } catch (jsonError) {
            // If we can't parse JSON, use status text
            errorMessage = `Server error: ${response.status} ${response.statusText}`
          }
          throw new Error(errorMessage)
        }

        // Parse successful response
        const data = await response.json()

        // Update stats
        const newStats = {
          processed: singleOrderStats.processed + (data.processed || 0),
          updated: singleOrderStats.updated + (data.updated || 0),
          lastId: data.lastId || singleOrderStats.lastId,
        }
        setSingleOrderStats(newStats)

        // Update message
        setSingleOrderMessage(
          `Processed ${newStats.processed} line items, updated ${newStats.updated} with vendor names`,
        )

        // Continue if there are more items to process
        if (data.hasMore) {
          // Add a small delay to prevent rate limiting
          setTimeout(() => {
            processSingleOrder()
          }, 1000)
        } else {
          setSingleOrderStatus("success")
          setSingleOrderMessage(
            `Sync completed for order ${orderId}. Processed ${newStats.processed} line items, updated ${newStats.updated} with vendor names.`,
          )
        }
      } catch (fetchError) {
        // Clear the timeout
        window.clearTimeout(timeoutId)

        // Handle AbortError (timeout)
        if (fetchError.name === "AbortError") {
          throw new Error(`Request timed out after ${timeout / 1000} seconds.`)
        }

        throw fetchError
      }
    } catch (error) {
      console.error("Error syncing vendor names for single order:", error)
      setSingleOrderStatus("error")
      setSingleOrderError(error.message || "An unknown error occurred")
      setSingleOrderMessage("Sync failed. See error details.")
    }
  }

  // Update progress when stats change
  useEffect(() => {
    if (status === "running") {
      // Estimate progress (this is approximate since we don't know the total)
      const estimatedProgress = Math.min(stats.batchesCompleted * 5, 90)
      setProgress(estimatedProgress)
    }
  }, [stats, status])

  // Check for admin password on component mount
  useEffect(() => {
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || localStorage.getItem("admin_password")
    if (!adminPassword) {
      setError("Admin password not found. Please ensure NEXT_PUBLIC_ADMIN_PASSWORD is set or log in again.")
      setSingleOrderError("Admin password not found. Please ensure NEXT_PUBLIC_ADMIN_PASSWORD is set or log in again.")
    }
  }, [])

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Sync Vendor Names</h1>

      <Tabs defaultValue="batch" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="batch">Batch Sync</TabsTrigger>
          <TabsTrigger value="single">Single Order</TabsTrigger>
        </TabsList>

        <TabsContent value="batch">
          <Card>
            <CardHeader>
              <CardTitle>Batch Vendor Name Sync</CardTitle>
              <CardDescription>
                Sync vendor names for all line items in batches. Use this for bulk processing.
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

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Batch Size</label>
                  <input
                    type="number"
                    value={batchSize}
                    onChange={(e) => setBatchSize(Number.parseInt(e.target.value) || 5)}
                    className="border rounded px-3 py-2 w-full"
                    min="1"
                    max="50"
                    disabled={isRunning}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Number of line items to process in each batch. Use smaller values (5-10) if you encounter timeouts.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Timeout (seconds)</label>
                  <input
                    type="number"
                    value={timeout / 1000}
                    onChange={(e) => setTimeout((Number.parseInt(e.target.value) || 30) * 1000)}
                    className="border rounded px-3 py-2 w-full"
                    min="10"
                    max="120"
                    disabled={isRunning}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Maximum time to wait for each batch to complete. Increase if you have slow network.
                  </p>
                </div>
              </div>

              {status !== "idle" && (
                <div className="mb-4 mt-4">
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
              <Button onClick={startSync} disabled={isRunning || !!error} className="mr-2">
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
        </TabsContent>

        <TabsContent value="single">
          <Card>
            <CardHeader>
              <CardTitle>Single Order Sync</CardTitle>
              <CardDescription>
                Sync vendor names for a specific order. Use this if you're having trouble with the batch sync.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {singleOrderStatus === "error" && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{singleOrderError}</AlertDescription>
                </Alert>
              )}

              {singleOrderStatus === "success" && (
                <Alert className="mb-4 bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>{singleOrderMessage}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Order ID</label>
                  <input
                    type="text"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="border rounded px-3 py-2 w-full"
                    placeholder="Enter Shopify Order ID"
                    disabled={singleOrderStatus === "running"}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    The Shopify Order ID to process. This will update all line items in this order.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Timeout (seconds)</label>
                  <input
                    type="number"
                    value={timeout / 1000}
                    onChange={(e) => setTimeout((Number.parseInt(e.target.value) || 30) * 1000)}
                    className="border rounded px-3 py-2 w-full"
                    min="10"
                    max="120"
                    disabled={singleOrderStatus === "running"}
                  />
                  <p className="text-sm text-gray-500 mt-1">Maximum time to wait for the order to process.</p>
                </div>
              </div>

              {singleOrderStatus !== "idle" && (
                <div className="mb-4 mt-4">
                  <p className="text-sm text-gray-500 mt-1">{singleOrderMessage}</p>
                </div>
              )}

              {singleOrderStats.processed > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-500">Processed</div>
                    <div className="text-xl font-semibold">{singleOrderStats.processed}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-500">Updated</div>
                    <div className="text-xl font-semibold">{singleOrderStats.updated}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-500">Last ID</div>
                    <div className="text-xl font-semibold">{singleOrderStats.lastId}</div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={processSingleOrder}
                disabled={singleOrderStatus === "running" || !orderId || !!singleOrderError}
                className="mr-2"
              >
                {singleOrderStatus === "running" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Process Order
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

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
            <h3>Troubleshooting:</h3>
            <ul>
              <li>
                <strong>Gateway Timeout (504)</strong>: Reduce the batch size to 5 or less
              </li>
              <li>
                <strong>JSON Parsing Errors</strong>: Increase the timeout value
              </li>
              <li>
                <strong>Authentication Errors</strong>: Make sure your NEXT_PUBLIC_ADMIN_PASSWORD is set correctly
              </li>
              <li>
                <strong>Shopify API Errors</strong>: Check if your Shopify API credentials are valid
              </li>
              <li>
                <strong>If batch sync fails</strong>: Try the single order sync option for specific orders
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
