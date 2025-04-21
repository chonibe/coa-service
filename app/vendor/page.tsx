"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"

export default function VendorDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [salesData, setSalesData] = useState<any>(null)
  const [inventoryData, setInventoryData] = useState<any>(null)

  useEffect(() => {
    // Simulate fetching data from API
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Mock data
        setSalesData({
          totalSales: 12345,
          itemsSold: 500,
          averageOrderValue: 50,
        })

        setInventoryData({
          totalProducts: 10,
          itemsInStock: 200,
          itemsOutOfStock: 50,
        })
      } catch (err: any) {
        console.error("Error fetching data:", err)
        setError(err.message || "Failed to fetch data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <div className="flex flex-col space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendor Dashboard</h1>
          <p className="text-muted-foreground mt-2">View your sales and inventory data</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Data</CardTitle>
                  <CardDescription>Overview of your sales performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Sales</span>
                      <span className="font-medium">${salesData.totalSales}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Items Sold</span>
                      <span className="font-medium">{salesData.itemsSold}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Average Order Value</span>
                      <span className="font-medium">${salesData.averageOrderValue}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Inventory Data</CardTitle>
                  <CardDescription>Overview of your product inventory</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Products</span>
                      <span className="font-medium">{inventoryData.totalProducts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Items In Stock</span>
                      <span className="font-medium">{inventoryData.itemsInStock}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Items Out of Stock</span>
                      <span className="font-medium">{inventoryData.itemsOutOfStock}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
