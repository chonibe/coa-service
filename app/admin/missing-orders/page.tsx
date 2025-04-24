"use client"

import { useState, useEffect } from "react"
import { Button } from "@chakra-ui/react"
import { Card, CardBody, CardHeader, CardTitle } from "@chakra-ui/react"
import { Alert, AlertIcon, AlertTitle, AlertDescription } from "@chakra-ui/react"
import { Badge } from "@chakra-ui/react"
import { Loader2, CheckCircle, RefreshCw, ArrowLeft } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@chakra-ui/react"
import { FormControl, FormLabel } from "@chakra-ui/react"

import Link from "next/link"

export default function MissingOrdersPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isChecking, setIsChecking] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState("7")
  const [checkResults, setCheckResults] = useState<any>(null)
  const [syncResults, setSyncResults] = useState<Record<string, any>>({})

  // Check for missing orders on load
  useEffect(() => {
    checkMissingOrders()
  }, [])

  const checkMissingOrders = async () => {
    try {
      setIsChecking(true)
      setError(null)

      const response = await fetch(`/api/shopify/check-missing-orders?days=${days}`)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: Failed to check for missing orders`)
      }

      const data = await response.json()
      setCheckResults(data)
    } catch (err: any) {
      console.error("Error checking for missing orders:", err)
      setError(err.message || "Failed to check for missing orders")
    } finally {
      setIsChecking(false)
      setIsLoading(false)
    }
  }

  const handleSyncOrder = async (orderId: string) => {
    try {
      setIsSyncing(true)
      setSyncingOrderId(orderId)
      setError(null)

      const response = await fetch("/api/shopify/sync-missing-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: Failed to sync order`)
      }

      const data = await response.json()

      // Store the sync result for this order
      setSyncResults((prev) => ({
        ...prev,
        [orderId]: data,
      }))

      // Wait a moment to allow the sync to complete
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Refresh the list of missing orders
      await checkMissingOrders()
    } catch (err: any) {
      console.error("Error syncing order:", err)
      setError(err.message || "Failed to sync order")
    } finally {
      setIsSyncing(false)
      setSyncingOrderId(null)
    }
  }

  const handleSyncAll = async () => {
    try {
      setIsSyncing(true)
      setError(null)

      // Process each missing order sequentially
      for (const order of checkResults.missing_orders) {
        setSyncingOrderId(order.id)

        const response = await fetch("/api/shopify/sync-missing-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderId: order.id }),
        })

        if (!response.ok) {
          throw new Error(`Error ${response.status}: Failed to sync order ${order.name}`)
        }

        const data = await response.json()

        // Store the sync result for this order
        setSyncResults((prev) => ({
          ...prev,
          [order.id]: data,
        }))

        // Wait a moment between orders
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      // Refresh the list of missing orders
      await checkMissingOrders()
    } catch (err: any) {
      console.error("Error syncing all orders:", err)
      setError(err.message || "Failed to sync all orders")
    } finally {
      setIsSyncing(false)
      setSyncingOrderId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 max-w-5xl">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Checking for missing orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <div className="flex flex-col space-y-8">
        <div>
          <Link href="/admin/shopify-sync" className="flex items-center text-sm mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Shopify Sync
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Missing Orders</h1>
          <p className="text-muted-foreground mt-2">Check for orders that may have been missed by the webhook</p>
        </div>

        {error && (
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Check for Missing Orders</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="flex items-end gap-4 mb-6">
              <div className="space-y-2">
                <FormControl>
                  <FormLabel htmlFor="days">Time Period</FormLabel>
                  <Select value={days} onValueChange={setDays}>
                    <SelectTrigger id="days" className="w-[180px]">
                      <SelectValue placeholder="Select days" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Last 24 hours</SelectItem>
                      <SelectItem value="3">Last 3 days</SelectItem>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="14">Last 14 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
              </div>

              <Button onClick={checkMissingOrders} isLoading={isChecking} className="flex items-center gap-2">
                {isChecking ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Check Now
                  </>
                )}
              </Button>
            </div>

            {checkResults && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted rounded-md p-4">
                    <p className="text-sm text-muted-foreground">Shopify Orders</p>
                    <p className="text-2xl font-bold">{checkResults.total_shopify_orders}</p>
                  </div>
                  <div className="bg-muted rounded-md p-4">
                    <p className="text-sm text-muted-foreground">Database Orders</p>
                    <p className="text-2xl font-bold">{checkResults.total_supabase_orders}</p>
                  </div>
                  <div className="bg-muted rounded-md p-4">
                    <p className="text-sm text-muted-foreground">Missing Orders</p>
                    <p className="text-2xl font-bold">{checkResults.relevant_missing_orders_count}</p>
                  </div>
                </div>

                {checkResults.missing_orders.length > 0 ? (
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Missing Orders with Limited Editions</h3>
                      <Button
                        onClick={handleSyncAll}
                        isLoading={isSyncing}
                        isDisabled={checkResults.missing_orders.length === 0}
                        size="sm"
                      >
                        {isSyncing ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Syncing All...
                          </>
                        ) : (
                          "Sync All Orders"
                        )}
                      </Button>
                    </div>

                    <div className="border rounded-md">
                      <div className="grid grid-cols-12 gap-4 p-4 font-medium border-b">
                        <div className="col-span-3">Order</div>
                        <div className="col-span-3">Date</div>
                        <div className="col-span-3">Limited Editions</div>
                        <div className="col-span-3">Actions</div>
                      </div>

                      <div className="divide-y">
                        {checkResults.missing_orders.map((order: any) => (
                          <div key={order.id} className="grid grid-cols-12 gap-4 p-4">
                            <div className="col-span-3">
                              <div className="font-medium">{order.name}</div>
                              <div className="text-xs text-muted-foreground">ID: {order.id}</div>
                            </div>
                            <div className="col-span-3">
                              <div>{new Date(order.processed_at || order.created_at).toLocaleDateString()}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(order.processed_at || order.created_at).toLocaleTimeString()}
                              </div>
                            </div>
                            <div className="col-span-3">
                              <Badge>{order.limited_edition_count}</Badge>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {order.limited_edition_items.map((item: any) => (
                                  <div key={item.id} className="truncate">
                                    {item.title} (x{item.quantity})
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="col-span-3">
                              {syncResults[order.id] ? (
                                <div className="flex items-center">
                                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                  <span className="text-sm">Synced</span>
                                </div>
                              ) : (
                                <Button
                                  onClick={() => handleSyncOrder(order.id)}
                                  isLoading={isSyncing && syncingOrderId === order.id}
                                  size="sm"
                                  variant="outline"
                                >
                                  {isSyncing && syncingOrderId === order.id ? (
                                    <>
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      Syncing...
                                    </>
                                  ) : (
                                    "Sync Order"
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Alert status="success" className="mt-6">
                    <AlertIcon />
                    <AlertTitle>All Orders Synced</AlertTitle>
                    <AlertDescription>
                      No missing orders with limited editions were found. Your database is up to date!
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
