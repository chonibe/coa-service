"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus, Award, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { EmptyState } from "./empty-state"
import { Package } from "lucide-react"

interface ProductPerformance {
  productId: string
  title: string
  sales: number
  revenue: number
  trend?: number // Percentage change
}

interface ProductPerformanceProps {
  products: ProductPerformance[]
  isLoading?: boolean
  className?: string
}

/**
 * Product performance insights component
 * Shows best/worst performing products with trends
 */
export function ProductPerformance({ products, isLoading, className }: ProductPerformanceProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Product Performance</CardTitle>
          <CardDescription>Top and bottom performing products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!products || products.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Product Performance</CardTitle>
          <CardDescription>Top and bottom performing products</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Package}
            title="No product data"
            description="Product performance data will appear here once you have sales."
          />
        </CardContent>
      </Card>
    )
  }

  // Sort by revenue to get best and worst
  const sortedProducts = [...products].sort((a, b) => b.revenue - a.revenue)
  const bestProducts = sortedProducts.slice(0, 3)
  const worstProducts = sortedProducts.slice(-3).reverse()

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 2,
    }).format(amount)

  const getTrendIcon = (trend?: number) => {
    if (!trend) return <Minus className="h-4 w-4 text-muted-foreground" />
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const getTrendColor = (trend?: number) => {
    if (!trend) return "text-muted-foreground"
    if (trend > 0) return "text-green-600 dark:text-green-400"
    if (trend < 0) return "text-red-600 dark:text-red-400"
    return "text-muted-foreground"
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Best Performing Products */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <CardTitle>Top Performing Products</CardTitle>
          </div>
          <CardDescription>Your best-selling products by revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bestProducts.map((product, index) => (
              <div
                key={product.productId}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{product.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.sales} {product.sales === 1 ? "sale" : "sales"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {product.trend !== undefined && (
                    <div className={cn("flex items-center gap-1 text-sm", getTrendColor(product.trend))}>
                      {getTrendIcon(product.trend)}
                      <span>
                        {product.trend > 0 ? "+" : ""}
                        {product.trend.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Worst Performing Products */}
      {worstProducts.length > 0 && worstProducts.some((p) => p.revenue < bestProducts[bestProducts.length - 1]?.revenue) && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <CardTitle>Needs Attention</CardTitle>
            </div>
            <CardDescription>Products with lower performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {worstProducts.map((product) => (
                <div
                  key={product.productId}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{product.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.sales} {product.sales === 1 ? "sale" : "sales"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {product.trend !== undefined && (
                      <div className={cn("flex items-center gap-1 text-sm", getTrendColor(product.trend))}>
                        {getTrendIcon(product.trend)}
                        <span>
                          {product.trend > 0 ? "+" : ""}
                          {product.trend.toFixed(1)}%
                        </span>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                      <p className="text-xs text-muted-foreground">Revenue</p>
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

