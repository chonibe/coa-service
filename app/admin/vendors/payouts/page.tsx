"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, RefreshCw, DollarSign, Percent, Package, Search, Filter, Save } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function VendorPayoutsPage() {
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [vendors, setVendors] = useState<any[]>([])
  const [payoutSettings, setPayoutSettings] = useState<
    Record<string, { amount: number; isPercentage: boolean; vendorName: string }>
  >({})
  const [isSaving, setIsSaving] = useState(false)
  const [filters, setFilters] = useState({
    vendors: [] as string[],
    priceRange: { min: "", max: "" },
    payoutType: [] as string[],
  })
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  // Fetch vendors
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await fetch("/api/vendors/list")

        if (!response.ok) {
          throw new Error("Failed to fetch vendors")
        }

        const data = await response.json()
        setVendors(data.vendors || [])
      } catch (err: any) {
        console.error("Error fetching vendors:", err)
        setError(err.message || "Failed to load vendors")
      }
    }

    fetchVendors()
  }, [])

  // Fetch all products and payouts
  useEffect(() => {
    fetchAllProducts()
  }, [])

  // Fetch all products for all vendors
  const fetchAllProducts = async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    setError(null)

    try {
      // Fetch all vendors first if not already loaded
      if (vendors.length === 0) {
        const vendorsResponse = await fetch("/api/vendors/list")
        if (!vendorsResponse.ok) {
          throw new Error("Failed to fetch vendors")
        }
        const vendorsData = await vendorsResponse.json()
        setVendors(vendorsData.vendors || [])
      }

      // Fetch products for all vendors
      const allProductsData: any[] = []
      const allPayoutSettings: Record<string, { amount: number; isPercentage: boolean; vendorName: string }> = {}

      // Process each vendor
      for (const vendor of vendors) {
        // Fetch products for this vendor
        const response = await fetch(`/api/vendors/products?vendor=${encodeURIComponent(vendor.name)}`)
        if (!response.ok) {
          console.warn(`Failed to fetch products for vendor ${vendor.name}`)
          continue
        }

        const data = await response.json()
        const vendorProducts = data.products || []

        // Add vendor name to each product
        vendorProducts.forEach((product: any) => {
          product.vendorName = vendor.name
          allProductsData.push(product)

          // Store payout settings
          const productKey = `${product.id}-${vendor.name}`
          allPayoutSettings[productKey] = {
            amount: product.payout_amount || 0,
            isPercentage: product.is_percentage || false,
            vendorName: vendor.name,
          }
        })
      }

      setAllProducts(allProductsData)
      setPayoutSettings(allPayoutSettings)
    } catch (err: any) {
      console.error("Error fetching products:", err)
      setError(err.message || "Failed to load products")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Update payout setting for a product
  const updatePayoutSetting = (productId: string, vendorName: string, amount: number, isPercentage: boolean) => {
    const productKey = `${productId}-${vendorName}`
    setPayoutSettings((prev) => ({
      ...prev,
      [productKey]: { amount, isPercentage, vendorName },
    }))
  }

  // Save payout settings
  const savePayoutSettings = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const payoutsToSave = Object.entries(payoutSettings).map(([productKey, setting]) => {
        const [productId, _] = productKey.split("-")
        return {
          product_id: productId,
          vendor_name: setting.vendorName,
          payout_amount: setting.amount,
          is_percentage: setting.isPercentage,
        }
      })

      const response = await fetch("/api/vendors/save-payouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payouts: payoutsToSave }),
      })

      if (!response.ok) {
        throw new Error("Failed to save payout settings")
      }

      // Refresh data
      fetchAllProducts(true)
    } catch (err: any) {
      console.error("Error saving payout settings:", err)
      setError(err.message || "Failed to save payout settings")
    } finally {
      setIsSaving(false)
    }
  }

  // Toggle vendor filter
  const toggleVendorFilter = (vendorName: string) => {
    setFilters((prev) => {
      const newVendors = prev.vendors.includes(vendorName)
        ? prev.vendors.filter((v) => v !== vendorName)
        : [...prev.vendors, vendorName]

      // Update active filters
      updateActiveFilters({ ...prev, vendors: newVendors })

      return { ...prev, vendors: newVendors }
    })
  }

  // Toggle payout type filter
  const togglePayoutTypeFilter = (type: string) => {
    setFilters((prev) => {
      const newTypes = prev.payoutType.includes(type)
        ? prev.payoutType.filter((t) => t !== type)
        : [...prev.payoutType, type]

      // Update active filters
      updateActiveFilters({ ...prev, payoutType: newTypes })

      return { ...prev, payoutType: newTypes }
    })
  }

  // Update price range filter
  const updatePriceRange = (min: string, max: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, priceRange: { min, max } }
      updateActiveFilters(newFilters)
      return newFilters
    })
  }

  // Update active filters list
  const updateActiveFilters = (currentFilters: any) => {
    const active: string[] = []

    if (currentFilters.vendors.length > 0) {
      active.push(`Vendors (${currentFilters.vendors.length})`)
    }

    if (currentFilters.payoutType.length > 0) {
      active.push(`Payout Type (${currentFilters.payoutType.length})`)
    }

    if (currentFilters.priceRange.min || currentFilters.priceRange.max) {
      active.push("Price Range")
    }

    if (searchQuery) {
      active.push("Search")
    }

    setActiveFilters(active)
  }

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      vendors: [],
      priceRange: { min: "", max: "" },
      payoutType: [],
    })
    setSearchQuery("")
    setActiveFilters([])
  }

  // Filter products based on current filters and search
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      // Filter by vendor
      if (filters.vendors.length > 0 && !filters.vendors.includes(product.vendorName)) {
        return false
      }

      // Filter by price range
      const price = Number.parseFloat(product.price)
      if (filters.priceRange.min && price < Number.parseFloat(filters.priceRange.min)) {
        return false
      }
      if (filters.priceRange.max && price > Number.parseFloat(filters.priceRange.max)) {
        return false
      }

      // Filter by payout type
      const productKey = `${product.id}-${product.vendorName}`
      const payout = payoutSettings[productKey]
      if (filters.payoutType.length > 0) {
        const type = payout?.isPercentage ? "percentage" : "fixed"
        if (!filters.payoutType.includes(type)) {
          return false
        }
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          product.title.toLowerCase().includes(query) ||
          product.vendorName.toLowerCase().includes(query) ||
          product.id.toLowerCase().includes(query)
        )
      }

      return true
    })
  }, [allProducts, filters, searchQuery, payoutSettings])

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vendor Payouts</h1>
            <p className="text-muted-foreground mt-2">Manage payout settings for all vendor products</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fetchAllProducts(true)} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={savePayoutSettings} disabled={isSaving || allProducts.length === 0}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save All
                </>
              )}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payout Settings</CardTitle>
            <CardDescription>Define how much vendors get paid for each product</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search products or vendors..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      if (e.target.value) {
                        if (!activeFilters.includes("Search")) {
                          setActiveFilters([...activeFilters, "Search"])
                        }
                      } else {
                        setActiveFilters(activeFilters.filter((f) => f !== "Search"))
                      }
                    }}
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Filter className="h-4 w-4" />
                      Filters
                      {activeFilters.length > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {activeFilters.length}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80" align="end">
                    <DropdownMenuLabel>Filter Products</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="text-xs font-medium">Vendors</DropdownMenuLabel>
                      <div className="max-h-40 overflow-y-auto p-2">
                        {vendors.map((vendor) => (
                          <div key={vendor.id} className="flex items-center space-x-2 mb-2">
                            <Checkbox
                              id={`vendor-${vendor.id}`}
                              checked={filters.vendors.includes(vendor.name)}
                              onCheckedChange={() => toggleVendorFilter(vendor.name)}
                            />
                            <Label htmlFor={`vendor-${vendor.id}`} className="text-sm">
                              {vendor.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="text-xs font-medium">Price Range</DropdownMenuLabel>
                      <div className="p-2 flex gap-2 items-center">
                        <Input
                          type="number"
                          placeholder="Min"
                          className="w-24"
                          value={filters.priceRange.min}
                          onChange={(e) => updatePriceRange(e.target.value, filters.priceRange.max)}
                        />
                        <span>to</span>
                        <Input
                          type="number"
                          placeholder="Max"
                          className="w-24"
                          value={filters.priceRange.max}
                          onChange={(e) => updatePriceRange(filters.priceRange.min, e.target.value)}
                        />
                      </div>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="text-xs font-medium">Payout Type</DropdownMenuLabel>
                      <div className="p-2">
                        <div className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            id="payout-fixed"
                            checked={filters.payoutType.includes("fixed")}
                            onCheckedChange={() => togglePayoutTypeFilter("fixed")}
                          />
                          <Label htmlFor="payout-fixed" className="text-sm flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            Fixed Amount
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="payout-percentage"
                            checked={filters.payoutType.includes("percentage")}
                            onCheckedChange={() => togglePayoutTypeFilter("percentage")}
                          />
                          <Label htmlFor="payout-percentage" className="text-sm flex items-center">
                            <Percent className="h-4 w-4 mr-1" />
                            Percentage
                          </Label>
                        </div>
                      </div>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <div className="p-2">
                      <Button variant="outline" size="sm" className="w-full" onClick={clearAllFilters}>
                        Clear All Filters
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {activeFilters.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {activeFilters.map((filter) => (
                    <Badge key={filter} variant="secondary">
                      {filter}
                    </Badge>
                  ))}
                  <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-7 px-2 text-xs">
                    Clear all
                  </Button>
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
              ) : allProducts.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No products found</AlertTitle>
                  <AlertDescription>No products found. Try refreshing the data.</AlertDescription>
                </Alert>
              ) : filteredProducts.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No matching products</AlertTitle>
                  <AlertDescription>
                    No products match your current filters. Try adjusting your search or filters.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="border rounded-md overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Payout Type</TableHead>
                        <TableHead>Payout Amount</TableHead>
                        <TableHead>Estimated Payout</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => {
                        const productKey = `${product.id}-${product.vendorName}`
                        const payout = payoutSettings[productKey] || {
                          amount: 0,
                          isPercentage: false,
                          vendorName: product.vendorName,
                        }
                        const productPrice = Number.parseFloat(product.price)
                        const estimatedPayout = payout.isPercentage
                          ? (productPrice * payout.amount) / 100
                          : payout.amount

                        return (
                          <TableRow key={productKey}>
                            <TableCell>
                              <Badge variant="outline" className="font-normal">
                                {product.vendorName}
                              </Badge>
                            </TableCell>
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
                                  <div className="text-sm text-muted-foreground">ID: {product.id}</div>
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
                                    product.vendorName,
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
                                      product.vendorName,
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
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
