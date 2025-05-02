"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { PullToRefresh } from "@/components/pull-to-refresh"
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Layers,
  BadgeIcon as Certificate,
  Settings,
} from "lucide-react"
import Link from "next/link"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"

export default function ProductEditionsPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string

  const [isLoading, setIsLoading] = useState(true)
  const [isRetrying, setIsRetrying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [productData, setProductData] = useState<any>(null)
  const [lineItems, setLineItems] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isResequencing, setIsResequencing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  // Add the following state variables after the existing state declarations
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isRemovingMultiple, setIsRemovingMultiple] = useState(false)

  const fetchProductEditions = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/editions/get-edition-number-from-db?productId=${productId}`)

      // Handle non-JSON responses
      let data
      try {
        const text = await response.text()
        data = JSON.parse(text)
      } catch (parseError) {
        throw new Error(`Failed to parse response: ${await response.text()}`)
      }

      if (!response.ok) {
        throw new Error(data?.message || `Error ${response.status}`)
      }

      if (data.success) {
        setProductData(data.productInfo || {})
        setLineItems(data.lineItems || [])
      } else {
        throw new Error(data.message || "Failed to fetch product editions")
      }

      setLastRefreshed(new Date())
    } catch (err: any) {
      console.error("Error fetching product editions:", err)
      setError(err.message || "Failed to fetch product editions")
    } finally {
      setIsLoading(false)
      setIsRetrying(false)
    }
  }, [productId])

  // Retry function
  const handleRetry = async () => {
    setIsRetrying(true)
    await fetchProductEditions()
  }

  // Add a function to manually resequence edition numbers
  const handleResequence = async () => {
    try {
      setIsResequencing(true)
      setError(null)

      const response = await fetch(`/api/editions/resequence?productId=${productId}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}`)
      }

      // Wait a moment to ensure all database operations complete
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Refresh the data
      await fetchProductEditions()
    } catch (err: any) {
      console.error("Error resequencing edition numbers:", err)
      setError(err.message || "Failed to resequence edition numbers")
    } finally {
      setIsResequencing(false)
    }
  }

  useEffect(() => {
    if (productId) {
      fetchProductEditions()
    }
  }, [productId, fetchProductEditions])

  // Filter line items based on active tab
  const filteredLineItems = () => {
    switch (activeTab) {
      case "active":
        return lineItems.filter((item) => item.status === "active")
      case "removed":
        return lineItems.filter((item) => item.status === "removed")
      default:
        return lineItems
    }
  }

  // Count active and removed items
  const activeItemsCount = lineItems.filter((item) => item.status === "active").length
  const removedItemsCount = lineItems.filter((item) => item.status === "removed").length

  // Add a function to handle status updates
  const handleStatusUpdate = async (lineItemId: string, orderId: string, newStatus: string, reason?: string) => {
    try {
      setIsUpdating(true)

      const response = await fetch("/api/update-line-item-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lineItemId,
          orderId,
          status: newStatus,
          reason: reason || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.status}`)
      }

      // Wait a moment to allow the resequencing to complete
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Refresh the data
      await fetchProductEditions()
    } catch (error: any) {
      console.error("Error updating status:", error)
      setError(error.message)
    } finally {
      setIsUpdating(false)
    }
  }

  // Add these functions after the existing functions
  // Function to toggle selection of a single item
  const toggleItemSelection = (item: any) => {
    const key = `${item.order_id}-${item.line_item_id}`
    const newSelected = new Set(selectedItems)

    if (newSelected.has(key)) {
      newSelected.delete(key)
    } else {
      newSelected.add(key)
    }

    setSelectedItems(newSelected)
  }

  // Function to toggle selection of all visible items
  const toggleSelectAll = () => {
    if (selectedItems.size > 0) {
      // If any are selected, clear selection
      setSelectedItems(new Set())
    } else {
      // Otherwise select all visible items
      const newSelected = new Set<string>()
      filteredLineItems().forEach((item) => {
        const key = `${item.order_id}-${item.line_item_id}`
        newSelected.add(key)
      })
      setSelectedItems(newSelected)
    }
  }

  // Add a new function to restore selected items
  const restoreSelectedItems = async () => {
    try {
      setIsRemovingMultiple(true) // Reuse the same loading state
      setError(null)

      // Process each selected item
      for (const key of selectedItems) {
        const [orderId, lineItemId] = key.split("-")

        await fetch("/api/update-line-item-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lineItemId,
            orderId,
            status: "active",
            reason: "",
          }),
        })
      }

      // Wait for all operations to complete
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Clear selection
      setSelectedItems(new Set())

      // Refresh the data
      await fetchProductEditions()
    } catch (err: any) {
      console.error("Error restoring selected items:", err)
      setError(err.message || "Failed to restore selected items")
    } finally {
      setIsRemovingMultiple(false)
    }
  }

  // Function to remove selected items
  const removeSelectedItems = async () => {
    try {
      setIsRemovingMultiple(true)
      setError(null)

      // Process each selected item
      for (const key of selectedItems) {
        const [orderId, lineItemId] = key.split("-")

        await fetch("/api/update-line-item-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lineItemId,
            orderId,
            status: "removed",
            reason: "Manually removed",
          }),
        })
      }

      // Wait for all operations to complete
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Clear selection
      setSelectedItems(new Set())

      // Refresh the data
      await fetchProductEditions()
    } catch (err: any) {
      console.error("Error removing selected items:", err)
      setError(err.message || "Failed to remove selected items")
    } finally {
      setIsRemovingMultiple(false)
    }
  }

  if (isLoading && !productData) {
    return (
      <div className="container mx-auto py-10 max-w-5xl">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading product editions...</p>
        </div>
      </div>
    )
  }

  if (error && !productData) {
    return (
      <div className="container mx-auto py-10 max-w-5xl">
        <Link href="/admin/sync-products" className="flex items-center text-sm mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Sync Products
        </Link>

        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="flex justify-center">
          <Button onClick={handleRetry} disabled={isRetrying}>
            {isRetrying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <PullToRefresh onRefresh={fetchProductEditions}>
      <div className="container mx-auto py-10 max-w-5xl">
        <div>
          <Link href="/admin/sync-products" className="flex items-center text-sm mb-6">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Sync Products
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{productData?.productTitle || "Product Editions"}</h1>
              <p className="text-muted-foreground mt-2">
                View all edition numbers for this product
                <span className="text-xs ml-2">Last refreshed: {lastRefreshed.toLocaleTimeString()}</span>
              </p>
            </div>
            <Button variant="outline" onClick={fetchProductEditions} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant="outline" asChild>
              <Link href="/admin">
                <Layers className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/sync-products">
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Products
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/certificates">
                <Certificate className="mr-2 h-4 w-4" />
                Certificates
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-col space-y-8 mt-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
              <CardDescription>Details about this product and its edition numbers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Product ID</p>
                  <p className="font-medium">{productData?.productId || "Unknown"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Editions</p>
                  <p className="font-medium">{activeItemsCount || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Edition Size</p>
                  <p className="font-medium">{productData?.editionTotal || "Unlimited"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Line Items</p>
                  <p className="font-medium">
                    {lineItems.length} Total
                    <span className="text-sm text-muted-foreground ml-2">
                      ({activeItemsCount} Active, {removedItemsCount} Removed)
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  onClick={handleResequence}
                  disabled={isResequencing}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {isResequencing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {isResequencing ? "Resequencing..." : "Fix Edition Numbers"}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  This will reset all edition numbers, ensuring active items have sequential numbers starting from 1 and
                  removed items have no edition number.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Edition Numbers</CardTitle>
              <CardDescription>All line items with assigned edition numbers for this product</CardDescription>
              <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="all">
                    All Items
                    <Badge variant="secondary" className="ml-2">
                      {lineItems.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="active">
                    Active
                    <Badge variant="secondary" className="ml-2">
                      {activeItemsCount}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="removed">
                    Removed
                    <Badge variant="secondary" className="ml-2">
                      {removedItemsCount}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              {lineItems.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No editions found</AlertTitle>
                  <AlertDescription>No edition numbers have been assigned to this product yet.</AlertDescription>
                </Alert>
              ) : filteredLineItems().length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No items match filter</AlertTitle>
                  <AlertDescription>No items match the current filter criteria.</AlertDescription>
                </Alert>
              ) : (
                <>
                  {selectedItems.size > 0 && (
                    <div className="flex items-center justify-between mb-4 p-2 bg-muted rounded-md">
                      <div className="text-sm">
                        <span className="font-medium">{selectedItems.size}</span> items selected
                      </div>
                      <div className="flex gap-2">
                        {filteredLineItems().some(
                          (item) =>
                            item.status === "removed" && selectedItems.has(`${item.order_id}-${item.line_item_id}`),
                        ) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={restoreSelectedItems}
                            disabled={isRemovingMultiple}
                            className="flex items-center gap-2"
                          >
                            {isRemovingMultiple ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3 w-3" />
                            )}
                            {isRemovingMultiple ? "Restoring..." : "Restore Selected"}
                          </Button>
                        )}
                        {filteredLineItems().some(
                          (item) =>
                            item.status !== "removed" && selectedItems.has(`${item.order_id}-${item.line_item_id}`),
                        ) && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={removeSelectedItems}
                            disabled={isRemovingMultiple}
                            className="flex items-center gap-2"
                          >
                            {isRemovingMultiple ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {isRemovingMultiple ? "Removing..." : "Remove Selected"}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="border rounded-md">
                    <div className="grid grid-cols-13 gap-4 p-4 font-medium border-b">
                      <div className="col-span-1">
                        <Checkbox
                          checked={
                            selectedItems.size > 0 &&
                            selectedItems.size ===
                              filteredLineItems().filter((item) => item.status !== "removed").length
                          }
                          onCheckedChange={toggleSelectAll}
                          disabled={filteredLineItems().filter((item) => item.status !== "removed").length === 0}
                        />
                      </div>
                      <div className="col-span-1">Edition</div>
                      <div className="col-span-2">Order</div>
                      <div className="col-span-2">Line Item</div>
                      <div className="col-span-2">Created At</div>
                      <div className="col-span-2">
                        Updated At <span className="text-xs text-muted-foreground">(Last status change)</span>
                      </div>
                      <div className="col-span-1">Status</div>
                      <div className="col-span-1">Reason</div>
                      <div className="col-span-1">Actions</div>
                    </div>

                    <div className="divide-y">
                      {filteredLineItems().map((item) => {
                        const itemKey = `${item.order_id}-${item.line_item_id}`
                        const isSelected = selectedItems.has(itemKey)

                        return (
                          <div
                            key={itemKey}
                            className={`grid grid-cols-13 gap-4 p-4 ${isSelected ? "bg-muted/50" : ""}`}
                          >
                            <div className="col-span-1">
                              <Checkbox checked={isSelected} onCheckedChange={() => toggleItemSelection(item)} />
                            </div>
                            <div className="col-span-1 font-medium">
                              {item.edition_number ? (
                                <>
                                  {item.edition_number}
                                  {productData?.editionTotal && (
                                    <span className="text-muted-foreground">/{productData.editionTotal}</span>
                                  )}
                                </>
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </div>
                            <div className="col-span-2">
                              <div>{item.order_name || item.order_id}</div>
                            </div>
                            <div className="col-span-2 text-muted-foreground truncate">{item.line_item_id}</div>
                            <div className="col-span-2 text-sm">{new Date(item.created_at).toLocaleString()}</div>
                            <div className="col-span-2 text-sm">
                              {item.updated_at ? (
                                <>
                                  <span className="font-medium">{new Date(item.updated_at).toLocaleString()}</span>
                                  {item.updated_at !== item.created_at && (
                                    <span className="block text-xs text-blue-500">Updated</span>
                                  )}
                                </>
                              ) : (
                                "N/A"
                              )}
                            </div>
                            <div className="col-span-1">
                              {item.status === "removed" ? (
                                <Badge variant="destructive" className="bg-red-100 text-red-800">
                                  Removed
                                </Badge>
                              ) : (
                                <Badge variant="success" className="bg-green-100 text-green-800">
                                  Active
                                </Badge>
                              )}
                            </div>
                            <div className="col-span-1 text-sm text-muted-foreground truncate">
                              {item.removed_reason || (item.status === "removed" ? "Unknown" : "")}
                            </div>
                            <div className="col-span-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" disabled={isUpdating}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {item.status === "removed" ? (
                                    <DropdownMenuItem
                                      onClick={() => handleStatusUpdate(item.line_item_id, item.order_id, "active")}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Mark as Active
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusUpdate(
                                          item.line_item_id,
                                          item.order_id,
                                          "removed",
                                          "Manually removed",
                                        )
                                      }
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Mark as Removed
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Link href={`/admin/sync-products`}>
                <Button variant="outline">Back to Products</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </PullToRefresh>
  )
}
