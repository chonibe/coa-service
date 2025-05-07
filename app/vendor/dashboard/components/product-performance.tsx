"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils"

interface ProductPerformanceProps {
  period: string
}

interface ProductData {
  productId: string
  title: string
  salesCount: number
  revenue: number
}

export function ProductPerformance({ period }: ProductPerformanceProps) {
  const [products, setProducts] = useState<ProductData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/vendor/stats?period=${period}`)

        if (!response.ok) {
          throw new Error("Failed to fetch product performance data")
        }

        const data = await response.json()

        if (data.productPerformance) {
          setProducts(data.productPerformance)
        } else {
          setProducts([])
        }
      } catch (error) {
        console.error("Error fetching product performance:", error)
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [period])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product Performance</CardTitle>
          <CardDescription>Sales by product for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product Performance</CardTitle>
          <CardDescription>Sales by product for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-6 text-muted-foreground">No product sales data available for this period</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Performance</CardTitle>
        <CardDescription>Sales by product for the selected period</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Sales</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.slice(0, 5).map((product) => (
              <TableRow key={product.productId}>
                <TableCell className="font-medium">{product.title}</TableCell>
                <TableCell className="text-right">{product.salesCount}</TableCell>
                <TableCell className="text-right">{formatCurrency(product.revenue)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {products.length > 5 && (
          <div className="text-center mt-4 text-sm text-muted-foreground">
            Showing top 5 of {products.length} products
          </div>
        )}
      </CardContent>
    </Card>
  )
}
