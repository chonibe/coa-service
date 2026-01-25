"use client"

import { useState, useEffect } from "react"








import { Loader2, CheckCircle, AlertCircle, RefreshCw, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import Image from "next/image"
import Link from "next/link"
import { PlatformUpdates } from "./components/platform-updates"

import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Checkbox, Tabs, TabsList, TabsTrigger, TabsContent, Alert, AlertDescription, AlertTitle, Badge, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui"
export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingProducts, setIsFetchingProducts] = useState(false)
  const [isSelectingAll, setIsSelectingAll] = useState(false)
  const [syncResults, setSyncResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [forceSync, setForceSync] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [progress, setProgress] = useState(0)
  const [currentProduct, setCurrentProduct] = useState<string | null>(null)
  // Add a state for sync progress messages
  const [progressMessages, setProgressMessages] = useState<string[]>([])
  // Warehouse alerts state
  const [warehouseLoading, setWarehouseLoading] = useState(false)
  const [warehouseError, setWarehouseError] = useState<string | null>(null)
  const [warehouseCounts, setWarehouseCounts] = useState<{
    pendingApproval: number
    awaitingFulfillment: number
    shippedOrDelivered: number
    total: number
  }>({ pendingApproval: 0, awaitingFulfillment: 0, shippedOrDelivered: 0, total: 0 })

  // Product selection state
  const [products, setProducts] = useState<any[]>([])
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchField, setSearchField] = useState("title")
  const [pagination, setPagination] = useState({
    nextCursor: null,
    prevCursor: null,
    hasNext: false,
    hasPrev: false,
  })
  const [totalProductCount, setTotalProductCount] = useState(0)

  // Add state for Supabase connection test
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionTestResult, setConnectionTestResult] = useState<any>(null)

  // Fetch products for selection
  const fetchProducts = async (cursor = "", query = "", field = searchField) => {
    setIsFetchingProducts(true)
    setError(null)

    try {
      const url = `/api/get-all-products?limit=10&query=${encodeURIComponent(query)}&field=${field}${cursor ? `&cursor=${cursor}` : ""}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: Failed to fetch products`)
      }

      const data = await response.json()
      setProducts(data.products || [])
      setPagination(data.pagination || { nextCursor: null, prevCursor: null, hasNext: false, hasPrev: false })
    } catch (err: any) {
      console.error("Error fetching products:", err)
      setError(err.message || "Failed to fetch products")
    } finally {
      setIsFetchingProducts(false)
    }
  }

  // Fetch all products for "Select All" functionality
  const fetchAllProducts = async () => {
    setIsSelectingAll(true)
    setError(null)

    try {
      const url = `/api/get-all-products?fetchAll=true&query=${encodeURIComponent(searchQuery)}&field=${searchField}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: Failed to fetch all products`)
      }

      const data = await response.json()
      setTotalProductCount(data.totalCount || 0)

      // Select all product IDs
      if (data.products && data.products.length > 0) {
        setSelectedProductIds(data.products.map((product: any) => product.id))
      }
    } catch (err: any) {
      console.error("Error fetching all products:", err)
      setError(err.message || "Failed to fetch all products")
    } finally {
      setIsSelectingAll(false)
    }
  }

  // Add function to test Supabase connection
  const testSupabaseConnection = async () => {
    setIsTestingConnection(true)
    setConnectionTestResult(null)

    try {
      const response = await fetch("/api/test-supabase-connection")
      const data = await response.json()

      console.log("Supabase connection test result:", data)
      setConnectionTestResult(data)
    } catch (error) {
      console.error("Error testing Supabase connection:", error)
      setConnectionTestResult({
        success: false,
        message: "Error testing connection",
        error: error.message,
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchProducts()
  }, [])

  // Handle search
  const handleSearch = () => {
    fetchProducts("", searchQuery, searchField)
  }

  // Handle product selection
  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    )
  }

  // Select/deselect all products
  const toggleSelectAll = () => {
    if (selectedProductIds.length === products.length) {
      setSelectedProductIds([])
    } else {
      // If we're just selecting the current page
      setSelectedProductIds(products.map((product) => product.id))
    }
  }

  // Select all products across all pages
  const handleSelectAllPages = async () => {
    // If we already have all products selected, deselect them
    if (totalProductCount > 0 && selectedProductIds.length === totalProductCount) {
      setSelectedProductIds([])
      return
    }

    // Otherwise, fetch and select all products
    await fetchAllProducts()
  }

  // Update the handleSync function to include progress messages
  const handleSync = async () => {
    if (selectedProductIds.length === 0) {
      setError("Please select at least one product to sync")
      return
    }

    setIsLoading(true)
    setError(null)
    setSyncResults(null)
    setProgress(0)
    setCurrentProduct(null)
    setProgressMessages(["Starting sync process..."])

    console.log(`Starting sync for ${selectedProductIds.length} products with forceSync=${forceSync}`)
    console.log("Selected product IDs:", selectedProductIds)

    try {
      addProgressMessage("Sending sync request to API...")
      const response = await fetch("/api/sync-all-products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          forceSync,
          productIds: selectedProductIds,
        }),
      })

      console.log(`API response status: ${response.status}`)
      addProgressMessage(`Received response from API (status: ${response.status})`)

      const responseText = await response.text()
      console.log(`API response text:`, responseText)

      let data

      try {
        // Try to parse the response as JSON
        data = JSON.parse(responseText)
        console.log("Parsed response data:", data)
        addProgressMessage("Successfully parsed response data")
      } catch (parseError) {
        // If parsing fails, use the raw text as the error message
        console.error("Failed to parse response as JSON:", parseError)
        addProgressMessage("Error: Failed to parse API response as JSON")
        throw new Error(`Failed to parse response: ${responseText}`)
      }

      if (!response.ok) {
        console.error("API returned error status:", response.status, data)
        addProgressMessage(`Error: API returned status ${response.status}`)
        throw new Error(data.message || `Error ${response.status}: ${responseText}`)
      }

      console.log("Sync completed successfully:", data)
      addProgressMessage(`Sync completed successfully for ${data.successfulProducts} of ${data.totalProducts} products`)
      setSyncResults(data)

      // Set progress to 100% when done
      setProgress(100)
    } catch (err: any) {
      console.error("Sync error:", err)
      addProgressMessage(`Error: ${err.message}`)
      setError(err.message || "An error occurred while syncing products")
    } finally {
      setIsLoading(false)
      addProgressMessage("Sync process finished")
    }
  }

  // Helper function to add progress messages
  const addProgressMessage = (message: string) => {
    setProgressMessages((prev) => [...prev, message])
  }

  // Load warehouse summary (last 30 days)
  useEffect(() => {
    const loadWarehouse = async () => {
      try {
        setWarehouseLoading(true)
        setWarehouseError(null)
        const end = new Date()
        const start = new Date()
        start.setDate(end.getDate() - 30)
        const fmt = (d: Date) => d.toISOString().split("T")[0]
        const url = `/api/warehouse/orders?start=${fmt(start)}&end=${fmt(end)}&pageSize=200`
        const response = await fetch(url, { cache: "no-store" })
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(payload.message || "Failed to load warehouse orders")
        }
        const payload = await response.json()
        const orders = Array.isArray(payload.orders) ? payload.orders : []
        const pendingApproval = orders.filter((o: any) => o.status === 0 || o.order_detail_status === "0").length
        const shippedOrDelivered = orders.filter(
          (o: any) => o.status === 3 || o.track_status === 121 || o.track_status_name === "Delivered",
        ).length
        const awaitingFulfillment = orders.filter(
          (o: any) => !(o.status === 3 || o.track_status === 121 || o.track_status_name === "Delivered"),
        ).length
        setWarehouseCounts({
          pendingApproval,
          awaitingFulfillment,
          shippedOrDelivered,
          total: orders.length,
        })
      } catch (error: any) {
        setWarehouseError(error.message || "Unable to load warehouse alerts")
      } finally {
        setWarehouseLoading(false)
      }
    }

    void loadWarehouse()
  }, [])

  // Filter results based on active tab
  const getFilteredResults = () => {
    if (!syncResults?.syncResults) return []

    switch (activeTab) {
      case "success":
        return syncResults.syncResults.filter((item: any) => !item.error)
      case "error":
        return syncResults.syncResults.filter((item: any) => item.error)
      default:
        return syncResults.syncResults
    }
  }

  return (
    <div className="container mx-auto max-w-6xl py-10">
      <div className="space-y-10">
        <div className="space-y-3">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-blue-600">Admin overview</p>
            <h1 className="text-3xl font-bold tracking-tight">Operations & sync health</h1>
            <p className="text-muted-foreground">
              Check system health, quick tasks, and manage product sync without losing context.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">System health</CardTitle>
                <CardDescription>Supabase + Shopify connectivity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
                  <span className="text-sm text-muted-foreground">Supabase</span>
                  <Badge variant={connectionTestResult?.success ? "default" : "secondary"}>
                    {connectionTestResult?.success ? "Healthy" : "Check"}
                  </Badge>
                </div>
                <Button variant="outline" size="sm" onClick={testSupabaseConnection} disabled={isTestingConnection}>
                  {isTestingConnection ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing...
                    </>
                  ) : (
                    "Run connection test"
                  )}
                </Button>
                {connectionTestResult ? (
                  <Alert className={`text-sm ${connectionTestResult.success ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-amber-50 dark:bg-amber-950/30"}`}>
                    {connectionTestResult.success ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <AlertTitle>{connectionTestResult.success ? "Connection healthy" : "Connection issue"}</AlertTitle>
                    <AlertDescription className="space-y-1">
                      <p>{connectionTestResult.message}</p>
                      {connectionTestResult.error && (
                        <p className="text-xs text-muted-foreground">Details: {connectionTestResult.error}</p>
                      )}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Last checked: not yet tested in this session. Run the connection test to verify health.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Today’s actions</CardTitle>
                <CardDescription>Quick links to common admin tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-col gap-2">
                  <Button variant="ghost" className="justify-between" asChild>
                    <Link href="/admin/missing-orders">
                      Reconcile missing orders <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" className="justify-between" asChild>
                    <Link href="/admin/vendors">
                      Review vendor statuses <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" className="justify-between" asChild>
                    <Link href="/admin/vendors/payouts">
                      Check payouts queue <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" className="justify-between" asChild>
                    <Link href="/admin/reports/sales">
                      View sales reports <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" className="justify-between" asChild>
                    <Link href="/admin/collector-profile">
                      Your collector profile <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Warehouse alerts</CardTitle>
                <CardDescription>ChinaDivision approvals & fulfillment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {warehouseLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading warehouse status…
                  </div>
                ) : warehouseError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Warehouse status unavailable</AlertTitle>
                    <AlertDescription className="space-y-1">
                      <p>{warehouseError}</p>
                      <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                        Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-md border bg-muted/50 p-3">
                        <p className="text-muted-foreground">Pending approval</p>
                        <p className="text-lg font-semibold text-amber-600">{warehouseCounts.pendingApproval}</p>
                      </div>
                      <div className="rounded-md border bg-muted/50 p-3">
                        <p className="text-muted-foreground">Awaiting fulfillment</p>
                        <p className="text-lg font-semibold">{warehouseCounts.awaitingFulfillment}</p>
                      </div>
                      <div className="rounded-md border bg-muted/50 p-3">
                        <p className="text-muted-foreground">Shipped/Delivered</p>
                        <p className="text-lg font-semibold text-emerald-600">{warehouseCounts.shippedOrDelivered}</p>
                      </div>
                      <div className="rounded-md border bg-muted/50 p-3">
                        <p className="text-muted-foreground">Total (30d)</p>
                        <p className="text-lg font-semibold">{warehouseCounts.total}</p>
                      </div>
                    </div>
                    {warehouseCounts.pendingApproval > 0 && (
                      <Alert className="border-amber-200 bg-amber-50 text-amber-900">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Orders need approval</AlertTitle>
                        <AlertDescription>
                          {warehouseCounts.pendingApproval} orders are waiting for approval in ChinaDivision.
                        </AlertDescription>
                      </Alert>
                    )}
                    <Button asChild variant="outline" size="sm">
                      <Link href="/admin/warehouse/orders">Open warehouse orders</Link>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <PlatformUpdates />
          </div>
        </div>

        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Job activity</CardTitle>
                <CardDescription>Track long-running sync jobs</CardDescription>
              </div>
              <Badge variant={isLoading ? "default" : "secondary"}>{isLoading ? "Running" : "Idle"}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Sync progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              {currentProduct ? (
                <p className="text-sm text-muted-foreground">
                  Syncing <span className="font-medium text-foreground">{currentProduct}</span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No active product sync.</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Activity log</span>
                <Button size="sm" variant="ghost" onClick={() => setProgressMessages([])}>
                  Clear
                </Button>
              </div>
              <div className="rounded-md border bg-muted/40 max-h-48 overflow-auto" aria-live="polite">
                <div className="space-y-2 p-3 text-sm" role="status">
                  {progressMessages.length > 0 ? (
                    progressMessages.map((message, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                        <span className="text-muted-foreground">{message}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">Progress messages will appear here during syncs.</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold">Product sync</h2>
            <p className="text-muted-foreground">Search, select, and sync products from Shopify.</p>
          </div>

          {/* Product selection */}
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Select Products</CardTitle>
            <CardDescription>Choose which products should be assigned sequential edition numbers.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <div className="flex-1">
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <div className="flex space-x-2">
                  <Select value={searchField} onValueChange={setSearchField}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Search by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="sku">SKU</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                      <SelectItem value="tag">Tag</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleSearch} 
                    disabled={isFetchingProducts}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-lg">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isFetchingProducts ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : products.length === 0 ? (
                    <Alert className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-lg">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No products found</AlertTitle>
                      <AlertDescription>
                        No products match your search criteria. Try a different search term.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="border rounded-md">
                      <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="select-page"
                              checked={selectedProductIds.length >= products.length && products.length > 0}
                              onCheckedChange={toggleSelectAll}
                            />
                            <label htmlFor="select-page" className="text-sm font-medium">
                              Select Page
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleSelectAllPages}
                              disabled={isSelectingAll}
                              className="h-8"
                            >
                              {isSelectingAll ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
                              {totalProductCount > 0 && selectedProductIds.length === totalProductCount
                                ? "Deselect All"
                                : "Select All Products"}
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Selected: {selectedProductIds.length}
                          {totalProductCount > 0 ? ` / ${totalProductCount}` : ""}
                        </div>
                      </div>

                      <div className="divide-y">
                        {products.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center p-4 hover:bg-white/50 dark:hover:bg-slate-900/50 backdrop-blur-sm transition-colors"
                        >
                            <div className="flex items-center flex-1">
                              <Checkbox
                                id={`product-${product.id}`}
                                checked={selectedProductIds.includes(product.id)}
                                onCheckedChange={() => toggleProductSelection(product.id)}
                                className="mr-4"
                              />

                              <div className="flex items-center space-x-4">
                                {product.image ? (
                                  <Image
                                    src={product.image.src || "/placeholder.svg"}
                                    alt={product.title}
                                    width={40}
                                    height={40}
                                    className="rounded-md object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                                    <span className="text-xs text-muted-foreground">No img</span>
                                  </div>
                                )}

                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{product.title}</div>
                                  <div className="text-sm text-muted-foreground flex items-center space-x-2">
                                    <span>{product.vendor}</span>
                                    {product.variants && product.variants[0] && (
                                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                        SKU: {product.variants[0].sku || "N/A"}
                                      </span>
                                    )}
                                  </div>
                                  {product.tags && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {product.tags
                                        .split(",")
                                        .slice(0, 3)
                                        .map((tag: string, i: number) => (
                                          <span key={i} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                            {tag.trim()}
                                          </span>
                                        ))}
                                      {product.tags.split(",").length > 3 && (
                                        <span className="text-xs text-muted-foreground">
                                          +{product.tags.split(",").length - 3} more
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between p-4 border-t">
                        <div className="text-sm text-muted-foreground">Showing {products.length} products</div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchProducts(pagination.prevCursor, searchQuery)}
                            disabled={!pagination.hasPrev || isFetchingProducts}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchProducts(pagination.nextCursor, searchQuery)}
                            disabled={!pagination.hasNext || isFetchingProducts}
                          >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sync controls */}
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Sync Selected Products</CardTitle>
            <CardDescription>This will assign sequential edition numbers based on order creation time.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-6">
              <Checkbox
                id="force-sync"
                checked={forceSync}
                onCheckedChange={(checked) => setForceSync(checked as boolean)}
              />
              <label
                htmlFor="force-sync"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Force sync (re-assign all edition numbers even if already synced)
              </label>
            </div>

            {isLoading && (
              <div className="mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                {currentProduct && (
                  <div className="text-sm text-muted-foreground">
                    Syncing: <span className="font-medium text-foreground">{currentProduct}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center space-x-2">
            <Button
              onClick={handleSync}
              disabled={isLoading || selectedProductIds.length === 0}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
            >
              {isLoading ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Syncing...
                </>
              ) : (
                <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Start Sync
                </>
              )}
            </Button>
              <Button variant="outline" onClick={testSupabaseConnection} disabled={isTestingConnection}>
                {isTestingConnection ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Testing...
                  </>
                ) : (
                  "Test Supabase Connection"
                )}
              </Button>
              {warehouseCounts.pendingApproval > 0 && (
                <Badge variant="destructive" className="gap-1">
                  {warehouseCounts.pendingApproval} warehouse approvals pending
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

          {/* Sync results */}
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
            <CardHeader>
              <CardTitle>Sync Results</CardTitle>
              <CardDescription>Review which products synced successfully and which failed.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                  <TabsTrigger value="all">
                    All Results
                    {syncResults?.syncResults && (
                    <Badge variant="secondary" className="ml-2">
                      {syncResults.syncResults.length}
                    </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="success">
                    Success
                    {syncResults?.syncResults && (
                    <Badge variant="secondary" className="ml-2">
                      {syncResults.syncResults.filter((item: any) => !item.error).length}
                    </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="error">
                    Errors
                    {syncResults?.syncResults && (
                      <Badge variant="destructive" className="ml-2">
                      {syncResults.syncResults.filter((item: any) => item.error).length}
                    </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                {syncResults ? (
              <div className="space-y-4">
                    <div className="grid gap-4">
                {getFilteredResults().map((result: any, index: number) => (
                        <Card key={`${result.productId}-${index}`} className="border border-slate-200/80 dark:border-slate-800/80">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <CardTitle className="text-lg">{result.title}</CardTitle>
                                <CardDescription>Product ID: {result.productId}</CardDescription>
                              </div>
                              <Badge variant={result.error ? "destructive" : "default"}>
                                {result.error ? "Failed" : "Synced"}
                        </Badge>
                    </div>
                          </CardHeader>
                          <CardContent className="space-y-2">
                    {result.error ? (
                              <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Sync failed</AlertTitle>
                                <AlertDescription>{result.error}</AlertDescription>
                      </Alert>
                    ) : (
                              <div className="space-y-1 text-sm">
                                <p className="text-muted-foreground">Edition number assigned: {result.editionNumber ?? "n/a"}</p>
                                {result.note && <p className="text-muted-foreground">Note: {result.note}</p>}
                          </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                        </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Run a sync to see results.</div>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
