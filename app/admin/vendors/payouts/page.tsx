"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, RefreshCw, DollarSign, Percent, Package } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export default function VendorPayoutsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null)
  const [vendors, setVendors] = useState<any[]>([])
  const [payoutSettings, setPayoutSettings] = useState<Record<string, { amount: number; isPercentage: boolean }>>({})
  const [isSaving, setIsSaving] = useState(false)

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

  // Fetch products for selected vendor
  useEffect(() => {
    if (selectedVendor) {
      fetchProducts()
    } else {
      setProducts([])
      setPayoutSettings({}) // Clear payout settings when vendor is unselected
    }
  }, [selectedVendor])

  // Fetch products
  const fetchProducts = async (refresh = false) => {
    if (!selectedVendor) return

    if (refresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    setError(null)

    try {
      // Fetch products for the selected vendor
      const response = await fetch(`/api/vendors/products?vendor=${encodeURIComponent(selectedVendor)}`)

      if (!response.ok) {
        throw new Error("Failed to fetch products")
      }

      const data = await response.json()
      setProducts(data.products || [])

      // Fetch payout settings for these products
      const productIds = data.products.map((p: any) => p.id)
      if (productIds.length > 0) {
        const payoutsResponse = await fetch("/api/vendors/payouts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productIds, vendorName: selectedVendor }),
        })

        if (payoutsResponse.ok) {
          const payoutsData = await payoutsResponse.json()

          // Convert to a map for easier access
          const payoutsMap: Record<string, { amount: number; isPercentage: boolean }> = {}
          payoutsData.payouts.forEach((payout: any) => {
            payoutsMap[payout.product_id] = {
              amount: payout.payout_amount || 0,
              isPercentage: payout.is_percentage || false,
            }
          })

          setPayoutSettings(payoutsMap)
        }
      }
    } catch (err: any) {
      console.error("Error fetching products:", err)
      setError(err.message || "Failed to load products")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Handle search
  const handleSearch = () => {
    fetchProducts(true)
  }

  // Handle refresh
  const handleRefresh = () => {
    fetchProducts(true)
  }

  // Update payout setting for a product
  const updatePayoutSetting = (productId: string, amount: number, isPercentage: boolean) => {
    setPayoutSettings((prev) => ({
      ...prev,
      [productId]: { amount, isPercentage },
    }))
  }

  // Save payout settings
  const savePayoutSettings = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const payoutsToSave = Object.entries(payoutSettings).map(([productId, setting]) => ({
        product_id: productId,
        vendor_name: selectedVendor,
        payout_amount: setting.amount,
        is_percentage: setting.isPercentage,
      }))

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
      fetchProducts(true)
    } catch (err: any) {
      console.error("Error saving payout settings:", err)
      setError(err.message || "Failed to save payout settings")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-6xl">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vendor Payouts</h1>
            <p className="text-muted-foreground mt-2">Manage payout settings for vendor products</p>
          </div>
          <div>
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing || !selectedVendor}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
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
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <div className="flex-1">
                  <Select value={selectedVendor || ""} onValueChange={setSelectedVendor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.name}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={savePayoutSettings} disabled={isSaving || !selectedVendor || products.length === 0}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Settings"
                    )}
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

              {!selectedVendor ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Select a Vendor</AlertTitle>
                  <AlertDescription>Please select a vendor to view and manage their payout settings.</AlertDescription>
                </Alert>
              ) : isLoading && !products.length ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : products.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No products found</AlertTitle>
                  <AlertDescription>
                    No products found for this vendor. Try selecting a different vendor.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Payout Type</TableHead>
                        <TableHead>Payout Amount</TableHead>
                        <TableHead>Estimated Payout</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => {
                        const payout = payoutSettings[product.id] || { amount: 0, isPercentage: false }
                        const productPrice = Number.parseFloat(product.price)
                        const estimatedPayout = payout.isPercentage
                          ? (productPrice * payout.amount) / 100
                          : payout.amount

                        return (
                          <TableRow key={product.id}>
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
