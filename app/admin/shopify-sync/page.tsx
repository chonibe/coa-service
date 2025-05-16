"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, CheckCircle, RefreshCw, Clock } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function ShopifySyncPage() {
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<any>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [autoSync, setAutoSync] = useState(true)
  const [syncInterval, setSyncInterval] = useState("60")
  const [webhookStatus, setWebhookStatus] = useState<any>(null)
  const [isTestingWebhook, setIsTestingWebhook] = useState(false)
  const [syncHistory, setSyncHistory] = useState<any[]>([])

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch sync status on load
  useEffect(() => {
    if (mounted) {
      fetchSyncStatus()
    }
  }, [mounted])

  const fetchSyncStatus = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/shopify/sync-status")

      if (!response.ok) {
        throw new Error(`Error ${response.status}: Failed to fetch sync status`)
      }

      const data = await response.json()
      setSyncStatus(data)

      // Also fetch webhook status
      await fetchWebhookStatus()

      // Also fetch sync history
      try {
        const historyResponse = await fetch("/api/shopify/sync-history")

        if (historyResponse.ok) {
          const historyData = await historyResponse.json()
          setSyncHistory(historyData.history || [])
        }
      } catch (historyErr) {
        console.error("Error fetching sync history:", historyErr)
      }
    } catch (err: any) {
      console.error("Error fetching sync status:", err)
      setError(err.message || "Failed to fetch sync status")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchWebhookStatus = async () => {
    try {
      const response = await fetch("/api/shopify/webhook-status")

      if (!response.ok) {
        throw new Error(`Error ${response.status}: Failed to fetch webhook status`)
      }

      const data = await response.json()
      setWebhookStatus(data)
    } catch (err: any) {
      console.error("Error fetching webhook status:", err)
      // Don't set the main error state, just log it
    }
  }

  const handleManualSync = async () => {
    try {
      setIsSyncing(true)
      setError(null)

      const response = await fetch("/api/shopify/manual-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + localStorage.getItem("admin_token")
        }
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: Failed to trigger sync`)
      }

      const data = await response.json()

      // Wait a moment to allow the sync to complete
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Refresh the status
      await fetchSyncStatus()
    } catch (err: any) {
      console.error("Error triggering sync:", err)
      setError(err.message || "Failed to trigger sync")
    } finally {
      setIsSyncing(false)
    }
  }

  const handleTestWebhook = async () => {
    try {
      setIsTestingWebhook(true)
      setError(null)

      const response = await fetch("/api/shopify/test-webhook")

      if (!response.ok) {
        throw new Error(`Error ${response.status}: Failed to test webhook`)
      }

      const data = await response.json()

      // Refresh the webhook status
      await fetchWebhookStatus()
    } catch (err: any) {
      console.error("Error testing webhook:", err)
      setError(err.message || "Failed to test webhook")
    } finally {
      setIsTestingWebhook(false)
    }
  }

  const handleSaveSettings = async () => {
    // In a real implementation, this would save the settings to the database
    // For now, we'll just show a success message
    alert("Settings saved successfully")
  }

  // Don't render anything until mounted
  if (!mounted) {
    return null
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 max-w-5xl">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading Shopify sync status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <div className="flex flex-col space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shopify Synchronization</h1>
          <p className="text-muted-foreground mt-2">Manage automatic synchronization with Shopify</p>
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
            <CardTitle>Sync Status</CardTitle>
            <CardDescription>Current status of Shopify synchronization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Last Sync</p>
                <p className="font-medium">
                  {syncStatus?.lastSync ? new Date(syncStatus.lastSync).toLocaleString() : "Never"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Orders Processed</p>
                <p className="font-medium">{syncStatus?.ordersProcessed || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="flex items-center">
                  {syncStatus?.isActive ? (
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  ) : (
                    <Badge variant="outline">Inactive</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 border-t pt-6">
              <h3 className="text-sm font-medium mb-4">Last Synced Order</h3>

              {syncStatus?.lastOrder ? (
                <div className="bg-muted rounded-md p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Order</p>
                      <p className="font-medium">
                        {syncStatus.lastOrder.orderName || `#${syncStatus.lastOrder.orderId}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Updated At</p>
                      <p className="font-medium">{new Date(syncStatus.lastOrder.updatedAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Product ID</p>
                      <p className="font-medium">{syncStatus.lastOrder.productId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Edition Number</p>
                      <p className="font-medium">
                        {syncStatus.lastOrder.editionNumber !== null ? (
                          syncStatus.lastOrder.editionNumber
                        ) : (
                          <span className="text-muted-foreground italic">Not assigned</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <div className="flex items-center">
                        {syncStatus.lastOrder.status === "active" ? (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        ) : (
                          <Badge variant="destructive">Removed</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Line Item ID</p>
                      <p className="font-medium text-xs truncate">{syncStatus.lastOrder.lineItemId}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Link href={`/admin/product-editions/${syncStatus.lastOrder.productId}`}>
                      <Button variant="outline" size="sm">
                        View Product Editions
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-muted rounded-md p-4 text-center text-muted-foreground">
                  No orders have been synced yet
                </div>
              )}
            </div>

            <div className="mt-6">
              <Button onClick={handleManualSync} disabled={isSyncing} className="flex items-center gap-2 mr-2">
                {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {isSyncing ? "Syncing..." : "Sync Now"}
              </Button>
              <Link href="/admin/missing-orders">
                <Button variant="outline" className="ml-2">
                  Check for Missing Orders
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground mt-2">
                This will manually trigger a sync with Shopify to fetch the latest orders.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webhook Status</CardTitle>
            <CardDescription>Status of Shopify order webhooks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Webhook URL</p>
                <p className="font-medium text-sm truncate">
                  {webhookStatus?.url || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/shopify/orders`}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="flex items-center">
                  {webhookStatus?.isActive ? (
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  ) : (
                    <Badge variant="outline">Not Configured</Badge>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Last Received</p>
                <p className="font-medium">
                  {webhookStatus?.lastReceived ? new Date(webhookStatus.lastReceived).toLocaleString() : "Never"}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <Button
                onClick={handleTestWebhook}
                disabled={isTestingWebhook}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isTestingWebhook ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {isTestingWebhook ? "Testing..." : "Test Webhook"}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                This will send a test webhook to verify the connection is working properly.
              </p>
            </div>

            <div className="mt-6 p-4 bg-muted rounded-md">
              <h3 className="text-sm font-medium mb-2">Shopify Webhook Setup Instructions</h3>
              <ol className="text-sm space-y-2 text-muted-foreground">
                <li>1. Go to your Shopify admin panel</li>
                <li>2. Navigate to Settings &gt; Notifications &gt; Webhooks</li>
                <li>3. Click "Create webhook"</li>
                <li>4. Select "Order creation" as the event</li>
                <li>
                  5. Enter the URL:{" "}
                  <code className="bg-background px-1 py-0.5 rounded">
                    {process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/shopify/orders
                  </code>
                </li>
                <li>6. Select "JSON" as the format</li>
                <li>7. Click "Save webhook"</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sync Settings</CardTitle>
            <CardDescription>Configure automatic synchronization with Shopify</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-sync">Automatic Sync</Label>
                  <p className="text-sm text-muted-foreground">Automatically sync with Shopify on a regular schedule</p>
                </div>
                <Switch id="auto-sync" checked={autoSync} onCheckedChange={setAutoSync} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sync-interval">Sync Interval (minutes)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="sync-interval"
                    type="number"
                    value={syncInterval}
                    onChange={(e) => setSyncInterval(e.target.value)}
                    disabled={!autoSync}
                    className="w-24"
                    min="5"
                    max="1440"
                  />
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    {Number(syncInterval) < 60
                      ? `Every ${syncInterval} minutes`
                      : `Every ${Math.floor(Number(syncInterval) / 60)} hour${Math.floor(Number(syncInterval) / 60) !== 1 ? "s" : ""}`}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">How often to check for new orders (minimum 5 minutes)</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveSettings}>Save Settings</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sync History</CardTitle>
            <CardDescription>Recent synchronization activity</CardDescription>
          </CardHeader>
          <CardContent>
            {syncHistory.length > 0 ? (
              <div className="border rounded-md">
                <div className="grid grid-cols-12 gap-4 p-4 font-medium border-b">
                  <div className="col-span-3">Date</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-2">Orders</div>
                  <div className="col-span-5">Details</div>
                </div>
                <div className="divide-y">
                  {syncHistory.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 p-4">
                      <div className="col-span-3 text-sm">{new Date(item.created_at).toLocaleString()}</div>
                      <div className="col-span-2">
                        <Badge variant="outline">{item.type}</Badge>
                      </div>
                      <div className="col-span-2">{item.details?.ordersProcessed || 0}</div>
                      <div className="col-span-5 text-sm text-muted-foreground">
                        {item.details?.lastOrderName && <div>Last Order: {item.details.lastOrderName}</div>}
                        {item.details?.startDate && item.details?.endDate && (
                          <div className="text-xs">
                            Period: {new Date(item.details.startDate).toLocaleString()} to{" "}
                            {new Date(item.details.endDate).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center p-4 text-muted-foreground">No sync history available</div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Link href="/admin">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
