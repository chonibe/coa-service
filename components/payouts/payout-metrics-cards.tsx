"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, TrendingUp, TrendingDown, Clock, DollarSign, Users, Zap, AlertTriangle } from "lucide-react"
import { formatUSD } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface AdminMetrics {
  totalPending: number
  averageProcessingTime: number
  successRate: number
  topVendors: Array<{ vendorName: string; amount: number }>
  payoutVelocity: { daily: number; weekly: number; monthly: number }
  refundImpact: number
}

interface VendorMetrics {
  expectedNextPayout: number
  payoutFrequency: number
  averagePayoutSize: number
  growthTrend: number
  nextPayoutDate?: string
  totalEarned: number
}

interface PayoutMetricsCardsProps {
  vendorName?: string
  isAdmin?: boolean
}

export function PayoutMetricsCards({ vendorName, isAdmin = false }: PayoutMetricsCardsProps) {
  const [adminMetrics, setAdminMetrics] = useState<AdminMetrics | null>(null)
  const [vendorMetrics, setVendorMetrics] = useState<VendorMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resolvedVendorName, setResolvedVendorName] = useState<string | null>(vendorName || null)

  useEffect(() => {
    if (!isAdmin && !vendorName) {
      // Fetch vendor name if not provided
      fetch("/api/vendor/profile", { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          if (data.vendor?.vendor_name) {
            setResolvedVendorName(data.vendor.vendor_name)
          }
        })
        .catch(console.error)
    } else {
      setResolvedVendorName(vendorName || null)
    }
  }, [vendorName, isAdmin])

  useEffect(() => {
    if (isAdmin || resolvedVendorName) {
      fetchMetrics()
    }
  }, [resolvedVendorName, isAdmin])

  const fetchMetrics = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const url = isAdmin
        ? "/api/payouts/analytics/metrics"
        : "/api/payouts/analytics/metrics"

      const response = await fetch(url, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch metrics")
      }

      const result = await response.json()
      if (isAdmin) {
        setAdminMetrics(result.metrics)
      } else {
        setVendorMetrics(result.metrics)
      }
    } catch (err) {
      console.error("Error fetching metrics:", err)
      setError(err instanceof Error ? err.message : "Failed to load metrics")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (isAdmin && adminMetrics) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pending Payouts</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatUSD(adminMetrics.totalPending)}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all vendors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminMetrics.averageProcessingTime.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground mt-1">Time to complete payout</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminMetrics.successRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">Successful payouts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Velocity</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminMetrics.payoutVelocity.daily.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground mt-1">Payouts per day</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Velocity</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminMetrics.payoutVelocity.weekly.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground mt-1">Payouts per week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Refund Impact</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatUSD(adminMetrics.refundImpact)}</div>
              <p className="text-xs text-muted-foreground mt-1">Total refund deductions</p>
            </CardContent>
          </Card>
        </div>

        {adminMetrics.topVendors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Vendors by Payout Amount
              </CardTitle>
              <CardDescription>Vendors with highest payout amounts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Total Payout</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminMetrics.topVendors.map((vendor, index) => (
                    <TableRow key={vendor.vendorName}>
                      <TableCell>
                        <Badge variant={index < 3 ? "default" : "outline"}>{index + 1}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{vendor.vendorName}</TableCell>
                      <TableCell className="text-right font-bold">{formatUSD(vendor.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  if (!isAdmin && vendorMetrics) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expected Next Payout</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatUSD(vendorMetrics.expectedNextPayout)}</div>
            {vendorMetrics.nextPayoutDate && (
              <p className="text-xs text-muted-foreground mt-1">
                Estimated: {new Date(vendorMetrics.nextPayoutDate).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payout Frequency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendorMetrics.payoutFrequency.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">Payouts per month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Payout Size</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUSD(vendorMetrics.averagePayoutSize)}</div>
            <p className="text-xs text-muted-foreground mt-1">Per payout</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Trend</CardTitle>
            {vendorMetrics.growthTrend >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${vendorMetrics.growthTrend >= 0 ? "text-green-500" : "text-red-500"}`}
            >
              {vendorMetrics.growthTrend >= 0 ? "+" : ""}
              {vendorMetrics.growthTrend.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">vs last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUSD(vendorMetrics.totalEarned)}</div>
            <p className="text-xs text-muted-foreground mt-1">All-time total</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}

