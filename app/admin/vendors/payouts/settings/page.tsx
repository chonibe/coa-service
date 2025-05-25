"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Save, RefreshCw, DollarSign, Percent } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Product {
  id: string
  title: string
  vendor_name: string
  price: number
  payout_amount?: number
  is_percentage?: boolean
}

interface PayoutSetting {
  amount: number
  isPercentage: boolean
}

export default function PayoutSettingsPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [payoutSettings, setPayoutSettings] = useState<Record<string, PayoutSetting>>({})
  const [savedStatus, setSavedStatus] = useState<{ [key: string]: boolean }>({})
  const { toast } = useToast()

  // Fetch all products and their payout settings
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
      setAllProducts(products)
      setFilteredProducts(products)

      // Fetch payout settings for all products
      const productIds = products.map((p: Product) => p.id)
      const vendorNames = [...new Set(products.map((p: Product) => p.vendor_name))]

      if (productIds.length > 0) {
        const payoutsResponse = await fetch("/api/vendors/all-payouts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productIds, vendorNames }),
        })

        if (payoutsResponse.ok) {
          const payoutsData = await payoutsResponse.json()
          const payoutsMap: Record<string, PayoutSetting> = {}
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
      console.error("Error fetching data:", err)
      setError(err.message || "Failed to fetch data")
    } finally {
      setIsRefreshing(false)
      setIsLoading(false)
    }
  }

  // Initialize data
  useEffect(() => {
    fetchAllProducts()
  }, [])

  // Update payout setting for a product
  const updatePayoutSetting = (productId: string, amount: number, isPercentage: boolean) => {
    setPayoutSettings((prev) => ({
      ...prev,
      [productId]: { amount, isPercentage },
    }))
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
      [productId]: false,
    }))

    try {
      const setting = payoutSettings[productId]
      const response = await fetch("/api/vendors/save-payouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payouts: [{
            product_id: productId,
            vendor_name: vendorName,
            payout_amount: setting.amount,
            is_percentage: setting.isPercentage,
          }],
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save payout setting")
      }

      setSavedStatus((prev) => {
        const newState = { ...prev };
        delete newState[productId];
        return newState;
      });

      toast({
        title: "Success",
        description: "Payout setting saved successfully",
      })

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
      setSavedStatus((prev) => ({
        ...prev,
        [productId]: false,
      }))
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to save payout setting",
      })
    }
  }

  // Filter products based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = allProducts.filter(
        (product) =>
          product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.vendor_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts(allProducts)
    }
  }, [searchQuery, allProducts])

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payout Settings</h1>
            <p className="text-muted-foreground mt-2">Manage payout settings for all products</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchAllProducts} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Product Payout Settings</CardTitle>
            <CardDescription>Set payout amounts for each product</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="sm:max-w-[300px]"
                />
              </div>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">{error}</div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Payout Type</TableHead>
                        <TableHead>Payout Amount</TableHead>
                        <TableHead>Estimated Payout</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => {
                        const payout = payoutSettings[product.id] || { amount: 0, isPercentage: false }
                        const productPrice = Number.parseFloat(product.price.toString())
                        const estimatedPayout = payout.isPercentage
                          ? (productPrice * payout.amount) / 100
                          : payout.amount

                        const saveStatus = savedStatus[product.id]

                        return (
                          <TableRow key={product.id}>
                            <TableCell>{product.title}</TableCell>
                            <TableCell>{product.vendor_name}</TableCell>
                            <TableCell>£{productPrice.toFixed(2)}</TableCell>
                            <TableCell>
                              <Select
                                value={payout.isPercentage ? "percentage" : "fixed"}
                                onValueChange={(value) =>
                                  updatePayoutSetting(
                                    product.id,
                                    Number.parseFloat(payout.amount.toString()),
                                    value === "percentage"
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
                                  onChange={(e) => {
                                    const value = Number.parseFloat(e.target.value);
                                    if (!isNaN(value) && value >= 0) {
                                      updatePayoutSetting(product.id, value, payout.isPercentage);
                                    }
                                  }}
                                  className="w-[100px]"
                                  min={0}
                                  step={payout.isPercentage ? 1 : 0.01}
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                £{estimatedPayout.toFixed(2)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant={saveStatus === false ? "default" : "outline"}
                                size="sm"
                                onClick={() => savePayoutSetting(product.id, product.vendor_name)}
                                disabled={saveStatus === undefined}
                                className="w-full"
                              >
                                {saveStatus === undefined ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : saveStatus === true ? (
                                  "Saved"
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
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 