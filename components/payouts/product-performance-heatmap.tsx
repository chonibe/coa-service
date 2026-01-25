"use client"

import { useState, useEffect } from "react"

import { Skeleton } from "@/components/ui"

import { AlertCircle } from "lucide-react"
import { formatUSD } from "@/lib/utils"


import { Card, CardContent, CardDescription, CardHeader, CardTitle, Alert, AlertDescription, Badge } from "@/components/ui"
interface ProductPerformance {
  productId: string
  productTitle: string
  payoutAmount: number
  revenueAmount: number
  salesCount: number
  payoutPercentage: number
}

interface ProductPerformanceHeatmapProps {
  vendorName?: string
  isAdmin?: boolean
  timeRange?: "7d" | "30d" | "90d" | "1y" | "all"
  limit?: number
}

export function ProductPerformanceHeatmap({
  vendorName,
  isAdmin = false,
  timeRange = "30d",
  limit = 20,
}: ProductPerformanceHeatmapProps) {
  const [data, setData] = useState<ProductPerformance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProductData()
  }, [timeRange, vendorName])

  const fetchProductData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const url = isAdmin
        ? `/api/payouts/analytics/products?timeRange=${timeRange}&limit=${limit}`
        : `/api/payouts/analytics/products?timeRange=${timeRange}&limit=${limit}`

      const response = await fetch(url, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch product performance data")
      }

      const result = await response.json()
      setData(result.products || [])
    } catch (err) {
      console.error("Error fetching product performance:", err)
      setError(err instanceof Error ? err.message : "Failed to load product performance")
    } finally {
      setIsLoading(false)
    }
  }

  const getMaxPayout = () => {
    if (data.length === 0) return 1
    return Math.max(...data.map((p) => p.payoutAmount))
  }

  const getIntensity = (amount: number) => {
    const max = getMaxPayout()
    const percentage = (amount / max) * 100
    if (percentage >= 80) return "bg-green-600"
    if (percentage >= 60) return "bg-green-500"
    if (percentage >= 40) return "bg-yellow-500"
    if (percentage >= 20) return "bg-orange-500"
    return "bg-red-500"
  }

  if (isLoading) {
    return (
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Product Performance</CardTitle>
          <CardDescription>Top products by payout amount</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Product Performance</CardTitle>
          <CardDescription>Top products by payout amount</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Product Performance</CardTitle>
          <CardDescription>Top products by payout amount</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No product performance data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Product Performance Heatmap</CardTitle>
        <CardDescription>Top {limit} products ranked by payout amount</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((product, index) => (
            <div
              key={product.productId}
              className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-bold text-sm">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{product.productTitle}</div>
                <div className="text-sm text-muted-foreground">
                  {product.salesCount} sales • {product.payoutPercentage.toFixed(1)}% payout rate
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Revenue</div>
                  <div className="font-medium">{formatUSD(product.revenueAmount)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Payout</div>
                  <div className="font-bold">{formatUSD(product.payoutAmount)}</div>
                </div>
                <div className={`w-24 h-8 rounded ${getIntensity(product.payoutAmount)} opacity-80`} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500 opacity-80" />
              <span>Low</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500 opacity-80" />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500 opacity-80" />
              <span>High</span>
            </div>
          </div>
          <Badge variant="outline">Top {limit} Products</Badge>
        </div>
      </CardContent>
    </Card>
  )
}

