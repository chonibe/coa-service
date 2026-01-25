"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"





import { Loader2, AlertCircle, RefreshCw, DollarSign, Percent, Package, Search, Filter, Save, X } from "lucide-react"


import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Alert, AlertDescription, AlertTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge } from "@/components/ui"
// Define types for better type safety
interface Product {
  id: string
  title: string
  image: string | null
  price: string
  currency: string
  vendor: string
  payout_amount?: number
  is_percentage?: boolean
}

interface PayoutSetting {
  amount: number
  isPercentage: boolean
}

export default function VendorPayoutsPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [vendors, setVendors] = useState<any[]>([])
  const [payoutSettings, setPayoutSettings] = useState<Record<string, PayoutSetting>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [savedStatus, setSavedStatus] = useState<{ [key: string]: boolean }>({})
  const [filters, setFilters] = useState({
    vendor: "",
    priceMin: "",
    priceMax: "",
    payoutType: "" as "" | "fixed" | "percentage",
  })

  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [bulkEditMode, setBulkEditMode] = useState<boolean>(false)
  const [bulkEditValue, setBulkEditValue] = useState<number>(25)
  const [bulkEditType, setBulkEditType] = useState<"fixed" | "percentage">("percentage")

  // Initialize tables and fetch all data on load
  useEffect(() => {
    const initializeAndFetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch all vendors first
        const vendorsResponse = await fetch("/api/vendors/list")
        if (!vendorsResponse.ok) {
          throw new Error("Failed to fetch vendors")
        }
        const vendorsData = await vendorsResponse.json()
        setVendors(vendorsData.vendors || [])

        // Fetch all products for all vendors
        await fetchAllProducts()
      } catch (err: any) {
        console.error("Error initializing data:", err)
        setError(err.message || "Failed to initialize data")
      } finally {
        setIsLoading(false)
      }
    }

    initializeAndFetchData()
  }, [])

  // Fetch all products for all vendors
  const fetchAllProducts = async () => {
    setIsRefreshing(true)
    setError(null)

    try {
      // Fetch all products
      const productsResponse = await fetch("/api/vendors/all-products")

      if (!productsResponse.ok) {
        throw new Error("Failed to fetch products")
      }

      const productsData = await productsResponse.json()
      const products = productsData.products || []

      console.log("Fetched products:", products.length)
      setAllProducts(products)
      setFilteredProducts(products)

      // Fetch payout settings for all products
      const productIds = products.map((p: Product) => p.id)
      const vendorNames = [...new Set(products.map((p: Product) => p.vendor))]

      if (productIds.length > 0) {
        console.log("Fetching payout settings for", productIds.length, "products")
        const payoutsResponse = await fetch("/api/vendors/all-payouts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productIds, vendorNames }),
        })

        if (payoutsResponse.ok) {
          const payoutsData = await payoutsResponse.json()
          console.log("Fetched payout settings:", payoutsData.payouts?.length || 0)

          // Convert to a map for easier access
          // Default to 25% percentage if no setting exists
          const payoutsMap: Record<string, PayoutSetting> = {}
          products.forEach((product: Product) => {
            const existingPayout = payoutsData.payouts?.find((p: any) => p.product_id === product.id)
            if (existingPayout) {
              payoutsMap[product.id] = {
                amount: existingPayout.payout_amount || 25,
                isPercentage: existingPayout.is_percentage !== false, // Default to true if not specified
              }
            } else {
              // Default to 25% percentage payout
              payoutsMap[product.id] = {
                amount: 25,
                isPercentage: true,
              }
            }
          })

          setPayoutSettings(payoutsMap)
        } else {
          console.error("Failed to fetch payout settings")
          const errorData = await payoutsResponse.json()
          throw new Error(errorData.message || "Failed to fetch payout settings")
        }
      }
    } catch (err: any) {
      console.error("Error fetching products:", err)
      setError(err.message || "Failed to load products")
    } finally {
      setIsRefreshing(false)
    }
  }

  // Apply filters to products
  useEffect(() => {
    let result = [...allProducts]

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (product) =>
          product.title.toLowerCase().includes(query) ||
          product.vendor.toLowerCase().includes(query) ||
          product.id.toLowerCase().includes(query),
      )
    }

    // Apply vendor filter
    if (filters.vendor) {
      result = result.filter((product) => product.vendor === filters.vendor)
    }

    // Apply price filters
    if (filters.priceMin) {
      result = result.filter((product) => Number.parseFloat(product.price) >= Number.parseFloat(filters.priceMin))
    }

    if (filters.priceMax) {
      result = result.filter((product) => Number.parseFloat(product.price) <= Number.parseFloat(filters.priceMax))
    }

    // Apply payout type filter
    if (filters.payoutType) {
      result = result.filter((product) => {
        const payout = payoutSettings[product.id]
        if (!payout) return false
        return filters.payoutType === "percentage" ? payout.isPercentage : !payout.isPercentage
      })
    }

    setFilteredProducts(result)
  }, [searchQuery, filters, allProducts, payoutSettings])

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Handle refresh
  const handleRefresh = () => {
    fetchAllProducts()
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      vendor: "",
      priceMin: "",
      priceMax: "",
      payoutType: "",
    })
    setSearchQuery("")
  }

  // Update payout setting for a product
  const updatePayoutSetting = (productId: string, amount: number, isPercentage: boolean) => {
    setPayoutSettings((prev) => ({
      ...prev,
      [productId]: { amount, isPercentage },
    }))

    // Mark this product as unsaved
    setSavedStatus((prev) => ({
      ...prev,
      [productId]: false,
    }))
  }

  // Save payout setting for a single product
  const savePayoutSetting = async (productId: string, vendorName: string) => {
    if (!payoutSettings[productId]) return

    setSavedStatus((prev) => ({
      ...prev,
      [productId]: undefined, // Set to undefined to indicate saving in progress
    }))

    try {
      const setting = payoutSettings[productId]
      const payoutToSave = {
        product_id: productId,
        vendor_name: vendorName,
        payout_amount: setting.amount,
        is_percentage: setting.isPercentage,
      }

      console.log("Saving payout setting:", payoutToSave)

      const response = await fetch("/api/vendors/save-payouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payouts: [payoutToSave] }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Failed to save payout setting:", data)
        throw new Error(data.message || "Failed to save payout setting")
      }

      console.log("Save response:", data)

      // Mark as saved
      setSavedStatus((prev) => ({
        ...prev,
        [productId]: true,
      }))

      // Clear saved status after 3 seconds
      setTimeout(() => {
        setSavedStatus((prev) => {
          const newState = { ...prev }
          delete newState[productId]
          return newState
        })
      }, 3000)
    } catch (err: any) {
      console.error("Error saving payout setting:", err)

      // Mark as error
      setSavedStatus((prev) => ({
        ...prev,
        [productId]: false,
      }))

      // Show error in UI
      setError(err.message || "Failed to save payout setting")
    }
  }

  // Save all payout settings
  const saveAllPayoutSettings = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const payoutsToSave = Object.entries(payoutSettings)
        .filter(([productId]) => savedStatus[productId] === false) // Only save unsaved changes
        .map(([productId, setting]) => {
          const product = allProducts.find((p) => p.id === productId)
          return {
            product_id: productId,
            vendor_name: product?.vendor || "",
            payout_amount: setting.amount,
            is_percentage: setting.isPercentage,
          }
        })
        .filter((payout) => payout.vendor_name) // Ensure we have a vendor name

      if (payoutsToSave.length === 0) {
        setIsSaving(false)
        return
      }

      console.log("Saving all payout settings:", payoutsToSave)

      const response = await fetch("/api/vendors/save-payouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payouts: payoutsToSave }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to save payout settings")
      }

      // Check for partial success
      if (data.results) {
        const failures = data.results.filter((r: any) => r.status === "error")
        if (failures.length > 0) {
          setError(`${failures.length} out of ${payoutsToSave.length} payouts failed to save`)
        }
      }

      // Mark successful saves
      const newSavedStatus = { ...savedStatus }
      payoutsToSave.forEach((payout, index) => {
        const result = data.results?.[index]
        if (!result || result.status !== "error") {
          newSavedStatus[payout.product_id] = true
        }
      })
      setSavedStatus(newSavedStatus)

      // Clear saved status after 3 seconds
      setTimeout(() => {
        setSavedStatus((prev) => {
          const newState = { ...prev }
          Object.keys(newState).forEach((key) => {
            if (newState[key] === true) delete newState[key]
          })
          return newState
        })
      }, 3000)
    } catch (err: any) {
      console.error("Error saving payout settings:", err)
      setError(err.message || "Failed to save payout settings")
    } finally {
      setIsSaving(false)
    }
  }

  // Count unsaved changes
  const unsavedChangesCount = useMemo(() => {
    return Object.values(savedStatus).filter((status) => status === false).length
  }, [savedStatus])

  // Handle product selection
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    )
  }

  // Select/deselect all products
  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(filteredProducts.map((product) => product.id))
    }
  }

  // Apply bulk edit to selected products
  const applyBulkEdit = () => {
    const updatedSettings = { ...payoutSettings }

    selectedProducts.forEach((productId) => {
      updatedSettings[productId] = {
        amount: bulkEditValue,
        isPercentage: bulkEditType === "percentage",
      }

      // Mark as unsaved
      setSavedStatus((prev) => ({
        ...prev,
        [productId]: false,
      }))
    })

    setPayoutSettings(updatedSettings)
    setBulkEditMode(false)
  }

  // Cancel bulk edit
  const cancelBulkEdit = () => {
    setBulkEditMode(false)
  }

  // Get unique vendor names for filter
  const uniqueVendors = useMemo(() => {
    return [...new Set(allProducts.map((product) => product.vendor))].sort()
  }, [allProducts])

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vendor Payouts</h1>
            <p className="text-muted-foreground mt-2">Manage payout settings for all vendor products</p>
          </div>
          <div className="flex gap-2">
            {unsavedChangesCount > 0 && (
              <Button onClick={saveAllPayoutSettings} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save All Changes ({unsavedChangesCount})
                  </>
                )}
              </Button>
            )}
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={() => console.log("Current payout settings:", payoutSettings)}
              className="ml-2"
            >
              <span className="sr-only">Debug</span>
              <span className="hidden sm:inline">Debug</span>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payout Settings</CardTitle>
            <CardDescription>
              Define how much vendors get paid for each product. Default payout is 25% of revenue. 
              Only fulfilled order line items are eligible for payout.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by product name, vendor, or ID..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="pl-8"
                  />
                </div>
                <div className="flex space-x-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                        {(filters.vendor || filters.priceMin || filters.priceMax || filters.payoutType) && (
                          <Badge variant="secondary" className="ml-2">
                            Active
                          </Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <div className="p-2">
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Vendor</label>
                            <Select
                              value={filters.vendor}
                              onValueChange={(value) => setFilters({ ...filters, vendor: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="All vendors" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All vendors</SelectItem>
                                {uniqueVendors.map((vendor) => (
                                  <SelectItem key={vendor} value={vendor}>
                                    {vendor}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-sm font-medium">Price Range</label>
                            <div className="flex items-center gap-2 mt-1">
                              <Input
                                type="number"
                                placeholder="Min"
                                value={filters.priceMin}
                                onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
                                className="w-full"
                              />
                              <span>-</span>
                              <Input
                                type="number"
                                placeholder="Max"
                                value={filters.priceMax}
                                onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
                                className="w-full"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium">Payout Type</label>
                            <Select
                              value={filters.payoutType}
                              onValueChange={(value: "" | "fixed" | "percentage") =>
                                setFilters({ ...filters, payoutType: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="All types" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All types</SelectItem>
                                <SelectItem value="fixed">Fixed Amount</SelectItem>
                                <SelectItem value="percentage">Percentage</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <Button variant="outline" size="sm" className="w-full" onClick={clearFilters}>
                            <X className="h-4 w-4 mr-2" />
                            Clear Filters
                          </Button>
                        </div>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Bulk Edit Panel */}
              {selectedProducts.length > 0 && (
                <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-white/20 dark:border-slate-700/20 rounded-md p-4 mb-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-medium">Bulk Edit {selectedProducts.length} Selected Products</h3>
                      <p className="text-sm text-muted-foreground">
                        Apply the same payout settings to all selected products
                      </p>
                    </div>

                    {bulkEditMode ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <Select
                          value={bulkEditType}
                          onValueChange={(value: "fixed" | "percentage") => setBulkEditType(value)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-1" />
                                Fixed
                              </div>
                            </SelectItem>
                            <SelectItem value="percentage">
                              <div className="flex items-center">
                                <Percent className="h-4 w-4 mr-1" />
                                Percentage
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="flex items-center">
                          {bulkEditType === "percentage" ? (
                            <Percent className="h-4 w-4 mr-1 text-muted-foreground" />
                          ) : (
                            <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                          )}
                          <Input
                            type="number"
                            value={bulkEditValue}
                            onChange={(e) => setBulkEditValue(Number(e.target.value) || 0)}
                            className="w-[100px]"
                            min={0}
                            step={bulkEditType === "percentage" ? 1 : 0.01}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button onClick={applyBulkEdit}>Apply to Selected</Button>
                          <Button variant="outline" onClick={cancelBulkEdit}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button onClick={() => setBulkEditMode(true)}>Edit Selected</Button>
                        <Button variant="outline" onClick={() => setSelectedProducts([])}>
                          Clear Selection
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isLoading && !allProducts.length ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No products found</AlertTitle>
                  <AlertDescription>
                    {searchQuery || filters.vendor || filters.priceMin || filters.priceMax || filters.payoutType
                      ? "No products match your search criteria. Try different filters."
                      : "No products found in your Shopify store."}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="border rounded-md">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <div className="flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={
                                  selectedProducts.length === filteredProducts.length && filteredProducts.length > 0
                                }
                                onChange={toggleSelectAll}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                            </div>
                          </TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Payout Type</TableHead>
                          <TableHead>Payout Amount</TableHead>
                          <TableHead>Estimated Payout</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((product) => {
                          // Default to 25% if no setting exists
                          const payout = payoutSettings[product.id] || { amount: 25, isPercentage: true }
                          const productPrice = Number.parseFloat(product.price)
                          const estimatedPayout = payout.isPercentage
                            ? (productPrice * payout.amount) / 100
                            : payout.amount

                          const saveStatus = savedStatus[product.id]

                          return (
                            <TableRow key={product.id}>
                              <TableCell>
                                <div className="flex items-center justify-center">
                                  <input
                                    type="checkbox"
                                    checked={selectedProducts.includes(product.id)}
                                    onChange={() => toggleProductSelection(product.id)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                  />
                                </div>
                              </TableCell>
                              <TableCell>{product.vendor}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  {product.image ? (
                                    <img
                                      src={product.image || "/placeholder.svg"}
                                      alt={product.title}
                                      className="h-10 w-10 rounded-md object-cover"
                                    />
                                  ) : (
                                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                                      <Package className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-medium">{product.title}</div>
                                    <div className="text-xs text-muted-foreground">ID: {product.id}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>${Number.parseFloat(product.price).toFixed(2)}</TableCell>
                              <TableCell>
                                <Select
                                  value={payout.isPercentage ? "percentage" : "fixed"}
                                  onValueChange={(value) =>
                                    updatePayoutSetting(
                                      product.id,
                                      Number.parseFloat(payout.amount.toString()),
                                      value === "percentage",
                                    )
                                  }
                                >
                                  <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="fixed">
                                      <div className="flex items-center">
                                        <DollarSign className="h-4 w-4 mr-1" />
                                        Fixed
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="percentage">
                                      <div className="flex items-center">
                                        <Percent className="h-4 w-4 mr-1" />
                                        Percentage
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  {payout.isPercentage ? (
                                    <Percent className="h-4 w-4 mr-1 text-muted-foreground" />
                                  ) : (
                                    <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                                  )}
                                  <Input
                                    type="number"
                                    value={payout.amount}
                                    onChange={(e) =>
                                      updatePayoutSetting(
                                        product.id,
                                        Number.parseFloat(e.target.value) || 0,
                                        payout.isPercentage,
                                      )
                                    }
                                    className="w-[100px]"
                                    min={0}
                                    step={payout.isPercentage ? 1 : 0.01}
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  ${estimatedPayout.toFixed(2)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant={saveStatus === false ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => savePayoutSetting(product.id, product.vendor)}
                                  disabled={saveStatus === undefined}
                                  className="w-full"
                                >
                                  {saveStatus === undefined ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : saveStatus === true ? (
                                    "Saved"
                                  ) : saveStatus === false ? (
                                    "Save"
                                  ) : (
                                    "Save"
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex items-center justify-between p-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {filteredProducts.length} of {allProducts.length} products
                    </p>
                    {isRefreshing && (
                      <div className="flex items-center">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <span className="text-sm text-muted-foreground">Refreshing data...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
