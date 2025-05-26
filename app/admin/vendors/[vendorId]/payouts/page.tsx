"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface Product {
  id: string
  title: string
  vendor_name: string
  price: number
  payout_amount?: number
  is_percentage?: boolean
}

export default function VendorPayoutsPage() {
  const params = useParams()
  const vendorId = params.vendorId as string
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [payoutSettings, setPayoutSettings] = useState<Record<string, { amount: number; isPercentage: boolean }>>({})
  const { toast } = useToast()
  const [vendorName, setVendorName] = useState<string>("")

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get vendor details and products in one call
      const response = await fetch(`/api/vendors/${vendorId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch vendor details")
      }

      const data = await response.json()
      setVendorName(data.vendor.vendor_name)
      setProducts(data.products)

      // Create payout settings map from the products data
      const settingsMap = data.products.reduce((acc: any, product: Product) => {
        acc[product.id] = {
          amount: product.payout_amount || 20,
          isPercentage: product.is_percentage || true,
        }
        return acc
      }, {})
      setPayoutSettings(settingsMap)
    } catch (err) {
      console.error("Error fetching products:", err)
      setError(err instanceof Error ? err.message : "Failed to load products")
      toast({
        variant: "destructive",
        title: "Error loading products",
        description: err instanceof Error ? err.message : "Failed to load products",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [vendorId])

  const handlePayoutChange = (productId: string, amount: number, isPercentage: boolean) => {
    setPayoutSettings((prev) => ({
      ...prev,
      [productId]: { amount, isPercentage },
    }))
  }

  const savePayoutSettings = async () => {
    try {
      const response = await fetch("/api/vendors/payouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendorName,
          payouts: Object.entries(payoutSettings).map(([productId, setting]) => ({
            product_id: productId,
            payout_amount: setting.amount,
            is_percentage: setting.isPercentage,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save payout settings")
      }

      toast({
        title: "Success",
        description: "Payout settings saved successfully",
      })
    } catch (err) {
      console.error("Error saving payout settings:", err)
      toast({
        variant: "destructive",
        title: "Error saving settings",
        description: err instanceof Error ? err.message : "Failed to save payout settings",
      })
    }
  }

  const calculatePayout = (product: Product) => {
    const setting = payoutSettings[product.id]
    if (!setting) return 0
    return setting.isPercentage ? (product.price * setting.amount) / 100 : setting.amount
  }

  return (
    <div className="space-y-6 pb-20 px-1">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payout Settings</h1>
        <p className="text-muted-foreground">Configure payout settings for vendor products</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <div className="mt-2">
              <Button variant="outline" size="sm" onClick={fetchProducts}>
                Try Again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Product Payouts</CardTitle>
          <CardDescription>Set payout amounts for each product</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : products.length > 0 ? (
            <div className="space-y-6">
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
                    const setting = payoutSettings[product.id] || { amount: 20, isPercentage: true }
                    const estimatedPayout = calculatePayout(product)

                    return (
                      <TableRow key={product.id}>
                        <TableCell>{product.title}</TableCell>
                        <TableCell>£{product.price.toFixed(2)}</TableCell>
                        <TableCell>
                          <RadioGroup
                            value={setting.isPercentage ? "percentage" : "fixed"}
                            onValueChange={(value) =>
                              handlePayoutChange(product.id, setting.amount, value === "percentage")
                            }
                            className="flex items-center space-x-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="percentage" id={`percentage-${product.id}`} />
                              <Label htmlFor={`percentage-${product.id}`}>Percentage</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="fixed" id={`fixed-${product.id}`} />
                              <Label htmlFor={`fixed-${product.id}`}>Fixed Amount</Label>
                            </div>
                          </RadioGroup>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              value={setting.amount}
                              onChange={(e) =>
                                handlePayoutChange(
                                  product.id,
                                  Number(e.target.value),
                                  setting.isPercentage
                                )
                              }
                              className="w-24"
                            />
                            <span>{setting.isPercentage ? "%" : "£"}</span>
                          </div>
                        </TableCell>
                        <TableCell>£{estimatedPayout.toFixed(2)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              <div className="flex justify-end">
                <Button onClick={savePayoutSettings}>Save Changes</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">No products found for this vendor</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 