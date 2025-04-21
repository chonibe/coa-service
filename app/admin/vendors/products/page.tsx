"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ArrowLeft, Save, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function VendorProductsPage() {
  const [vendors, setVendors] = useState<any[]>([])
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payoutType, setPayoutType] = useState<"$" | "%">("$") // "$" or "%"
  const [payoutValue, setPayoutValue] = useState<number>(0)
  // Add state variables for product price and amount sold
  const [productPrices, setProductPrices] = useState<{ [productId: string]: number }>({})
  const [productAmountsSold, setProductAmountsSold] = useState<{ [productId: string]: number }>({})

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch vendors (replace with your actual API endpoint)
      const vendorsResponse = await fetch("/api/vendors/list")
      if (!vendorsResponse.ok) {
        throw new Error("Failed to fetch vendors")
      }
      const vendorsData = await vendorsResponse.json()
      setVendors(vendorsData.vendors || [])

      // Fetch products (replace with your actual API endpoint)
      const productsResponse = await fetch("/api/get-all-products?fetchAll=true")
      if (!productsResponse.ok) {
        throw new Error("Failed to fetch products")
      }
      const productsData = await productsResponse.json()
      setProducts(productsData.products || [])

      // Initialize product prices and amounts sold
      const initialProductPrices: { [productId: string]: number } = {}
      const initialProductAmountsSold: { [productId: string]: number } = {}
      productsData.products.forEach((product: any) => {
        initialProductPrices[product.id] = product.price || 0 // Assuming product has a price property
        initialProductAmountsSold[product.id] = product.amountSold || 0 // Assuming product has an amountSold property
      })
      setProductPrices(initialProductPrices)
      setProductAmountsSold(initialProductAmountsSold)
    } catch (err: any) {
      console.error("Error fetching data:", err)
      setError(err.message || "Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Fetch vendors and products on initial load
    fetchData()
  }, [])

  const handleSavePayout = async (productId: string, payoutPrice: number) => {
    try {
      // Call the API to update the payout price
      const response = await fetch("/api/products/payout/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          payoutPrice,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}: Failed to update payout price`)
      }

      // Refresh the product list to reflect the changes
      fetchData()
    } catch (err: any) {
      console.error("Error updating payout price:", err)
      setError(err.message || "Failed to update payout price")
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 max-w-5xl">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading vendor products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <div>
        <Link href="/admin" className="flex items-center text-sm mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Vendor Products</h1>
        <p className="text-muted-foreground mt-2">Select products for each vendor and define payout prices</p>
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
          <CardTitle>Select Vendor</CardTitle>
          <CardDescription>Choose a vendor to manage their products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vendor-select">Vendor</Label>
              <Select value={selectedVendor || ""} onValueChange={setSelectedVendor}>
                <SelectTrigger id="vendor-select">
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
          </div>
        </CardContent>
      </Card>

      {selectedVendor && (
        <Card>
          <CardHeader>
            <CardTitle>Products for {selectedVendor}</CardTitle>
            <CardDescription>Define payout prices for each product</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products
                .filter((product) => product.vendor === selectedVendor)
                .map((product) => (
                  <div key={product.id} className="border rounded-md p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{product.title}</h3>
                        <p className="text-sm text-muted-foreground">Product ID: {product.id}</p>
                        {/* Display product price and amount sold */}
                        <p className="text-sm">Price: ${productPrices[product.id]}</p>
                        <p className="text-sm">Amount Sold: {productAmountsSold[product.id]}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Label htmlFor={`payout-${product.id}`}>Payout Price</Label>
                        <Select value={payoutType} onValueChange={(value) => setPayoutType(value as "$" | "%")}>
                          <SelectTrigger id={`payout-type-${product.id}`} className="w-[80px]">
                            <SelectValue placeholder="$" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="$">$</SelectItem>
                            <SelectItem value="%">%</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          id={`payout-${product.id}`}
                          placeholder="Enter payout price"
                          className="w-32"
                          value={payoutValue}
                          onChange={(e) => setPayoutValue(Number(e.target.value))}
                        />
                        <Button variant="outline" size="sm" onClick={() => handleSavePayout(product.id, payoutValue)}>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
