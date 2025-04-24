"use client"

import { TabsTrigger } from "@/components/ui/tabs"

import { TabsList } from "@/components/ui/tabs"

import { CardContent } from "@/components/ui/card"

import { CardDescription } from "@/components/ui/card"

import { CardTitle } from "@/components/ui/card"

import { useState, useEffect } from "react"
import {
  Button,
  Card,
  CardHeader,
  CardFooter,
  Checkbox,
  Tabs,
  Alert,
  AlertTitle,
  AlertDescription,
  Badge,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Progress,
  Image,
  Link,
} from "@chakra-ui/react"
import { Loader2, CheckCircle, AlertCircle, RefreshCw, Search, ChevronLeft, ChevronRight } from "lucide-react"

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
  const [progressMessages, setProgressMessages] = useState<string[]>([])

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

  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionTestResult, setConnectionTestResult] = useState<any>(null)

  const fetchProducts = async (cursor = "", query = "", field = searchField) => {
    setIsFetchingProducts(true)
    setError(null)

    try {
      const url = `/api/get-all-products?limit=10&query=${encodeURIComponent(
        query,
      )}&field=${field}${cursor ? `&cursor=${cursor}` : ""}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: Failed to fetch products`)
      }

      const data = await response.json()
      setProducts(data.products || [])
      setPagination(
        data.pagination || {
          nextCursor: null,
          prevCursor: null,
          hasNext: false,
          hasPrev: false,
        },
      )
    } catch (err: any) {
      console.error("Error fetching products:", err)
      setError(err.message || "Failed to fetch products")
    } finally {
      setIsFetchingProducts(false)
    }
  }

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

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleSearch = () => {
    fetchProducts("", searchQuery, searchField)
  }

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    )
  }

  const toggleSelectAll = () => {
    if (selectedProductIds.length === products.length) {
      setSelectedProductIds([])
    } else {
      setSelectedProductIds(products.map((product) => product.id))
    }
  }

  const handleSelectAllPages = async () => {
    if (totalProductCount > 0 && selectedProductIds.length === totalProductCount) {
      setSelectedProductIds([])
      return
    }

    await fetchAllProducts()
  }

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
    <div className="container mx-auto py-10 max-w-5xl">
      <div className="flex flex-col space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edition Number Sync</h1>
          <p className="text-muted-foreground mt-2">Synchronize edition numbers for products</p>
        </div>

        <Card>
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
                  <Button onClick={handleSearch} disabled={isFetchingProducts}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isFetchingProducts ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {products.length === 0 ? (
                    <Alert>
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
                          <div key={product.id} className="flex items-center p-4 hover:bg-muted/50">
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
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
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
                  <span>Syncing products...</span>
                  {currentProduct && <span>Processing: {currentProduct}</span>}
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {isLoading && (
              <div className="mb-6 max-h-40 overflow-y-auto border rounded-md p-2 bg-muted/50 text-xs">
                {progressMessages.map((message, index) => (
                  <div key={index} className="py-1 border-b border-border/20 last:border-0">
                    <span className="text-muted-foreground">{new Date().toLocaleTimeString()}: </span>
                    {message}
                  </div>
                ))}
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {syncResults && (
              <Alert className="mb-6">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Sync Complete</AlertTitle>
                <AlertDescription>Successfully processed {syncResults.totalProducts} products.</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleSync}
              disabled={isLoading || selectedProductIds.length === 0}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing Products...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync {selectedProductIds.length} Selected Products
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {syncResults && syncResults.syncResults && syncResults.syncResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Sync Results</CardTitle>
              <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="all">
                    All Products
                    <Badge variant="secondary" className="ml-2">
                      {syncResults.syncResults.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="success">
                    Success
                    <Badge variant="secondary" className="ml-2">
                      {syncResults.syncResults.filter((item: any) => !item.error).length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="error">
                    Errors
                    <Badge variant="secondary" className="ml-2">
                      {syncResults.syncResults.filter((item: any) => item.error).length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getFilteredResults().map((result: any, index: number) => (
                  <div key={result.productId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{result.productTitle || `Product ${result.productId}`}</div>
                      {result.error ? (
                        <Badge variant="destructive">Failed</Badge>
                      ) : (
                        <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-200">
                          Success
                        </Badge>
                      )}
                    </div>

                    <div className="text-sm text-muted-foreground mb-2">Product ID: {result.productId}</div>

                    {result.error ? (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">{result.error}</AlertDescription>
                      </Alert>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                          <div className="flex flex-col">
                            <span className="text-muted-foreground">Total Editions</span>
                            <span>{result.result?.totalEditions || 0}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-muted-foreground">Edition Size</span>
                            <span>{result.result?.editionTotal || "Unlimited"}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-muted-foreground">Line Items</span>
                            <span>{result.result?.lineItemsProcessed || 0}</span>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Link href={`/admin/product-editions/${result.productId}`}>
                            <Button variant="outline" size="sm">
                              View Edition Numbers
                            </Button>
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
