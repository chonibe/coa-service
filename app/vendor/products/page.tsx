"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"

export default function VendorProductsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    // Simulate fetching data from API
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Mock data
        setProducts([
          {
            id: 1,
            title: "Limited Edition Print",
            editionSize: 100,
            itemsSold: 75,
            itemsLeft: 25,
          },
          {
            id: 2,
            title: "Collector's Edition Book",
            editionSize: 500,
            itemsSold: 400,
            itemsLeft: 100,
          },
        ])
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
          <h1 className="text-3xl font-bold tracking-tight">Your Products</h1>
          <p className="text-muted-foreground mt-2">View your products and their inventory status</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id}>
                <CardHeader>
                  <CardTitle>{product.title}</CardTitle>
                  <CardDescription>Edition Size: {product.editionSize}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Items Sold</span>
                      <span className="font-medium">{product.itemsSold}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Items Left</span>
                      <span className="font-medium">{product.itemsLeft}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
