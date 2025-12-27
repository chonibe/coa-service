"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, DollarSign, Users, TrendingUp, AlertTriangle } from "lucide-react"
import { formatUSD } from "@/lib/utils"
import { convertGBPToUSD } from "@/lib/utils"
import type { PendingPayout, PayoutHistory } from "../types"

interface PayoutOverviewProps {
  pendingPayouts: PendingPayout[]
  payoutHistory: PayoutHistory[]
  isLoading?: boolean
}

export function PayoutOverview({ pendingPayouts, payoutHistory, isLoading }: PayoutOverviewProps) {
  const metrics = useMemo(() => {
    const totalPending = pendingPayouts.reduce((sum, p) => sum + p.amount, 0)
    const vendorsWithIssues = pendingPayouts.filter(
      (p) => p.amount < 0 || !p.paypal_email
    ).length
    const vendorsWithNegativeBalance = pendingPayouts.filter((p) => p.amount < 0)
    const vendorsWithoutPayPal = pendingPayouts.filter((p) => !p.paypal_email)

    // Calculate this month's payouts
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthPayouts = payoutHistory.filter((p) => {
      const payoutDate = new Date(p.payout_date || p.created_at)
      return payoutDate >= thisMonthStart && p.status === "completed"
    })
    const totalThisMonth = thisMonthPayouts.reduce((sum, p) => sum + p.amount, 0)

    // Calculate average payout
    const completedPayouts = payoutHistory.filter((p) => p.status === "completed")
    const averagePayout =
      completedPayouts.length > 0
        ? completedPayouts.reduce((sum, p) => sum + p.amount, 0) /
          completedPayouts.length
        : 0

    return {
      totalPending,
      vendorsWithIssues,
      vendorsWithNegativeBalance,
      vendorsWithoutPayPal,
      totalThisMonth,
      averagePayout,
      pendingCount: pendingPayouts.length,
    }
  }, [pendingPayouts, payoutHistory])

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </CardTitle>
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-muted animate-pulse rounded mb-1" />
              <div className="h-4 w-48 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" role="region" aria-label="Payout summary metrics">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUSD(metrics.totalPending)}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.pendingCount} vendor{metrics.pendingCount !== 1 ? "s" : ""} awaiting payout
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUSD(metrics.totalThisMonth)}</div>
            <p className="text-xs text-muted-foreground">Completed payouts this month</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Payout</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUSD(metrics.averagePayout)}</div>
            <p className="text-xs text-muted-foreground">Per completed payout</p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${metrics.vendorsWithIssues > 0 ? 'border-l-red-500' : 'border-l-gray-500'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${metrics.vendorsWithIssues > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.vendorsWithIssues > 0 ? 'text-red-600' : ''}`}>
              {metrics.vendorsWithIssues}
            </div>
            <p className="text-xs text-muted-foreground">Vendors requiring attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {metrics.vendorsWithNegativeBalance.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Negative Balances Detected</AlertTitle>
          <AlertDescription>
            {metrics.vendorsWithNegativeBalance.length} vendor
            {metrics.vendorsWithNegativeBalance.length !== 1 ? "s" : ""} have negative balances
            due to refunds. They owe money that will be deducted from their next payout:{" "}
            {metrics.vendorsWithNegativeBalance
              .map((v) => `${v.vendor_name} (${formatUSD(Math.abs(convertGBPToUSD(v.amount)))})`)
              .join(", ")}
          </AlertDescription>
        </Alert>
      )}

      {metrics.vendorsWithoutPayPal.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Missing PayPal Emails</AlertTitle>
          <AlertDescription>
            {metrics.vendorsWithoutPayPal.length} vendor
            {metrics.vendorsWithoutPayPal.length !== 1 ? "s" : ""} are missing PayPal email
            addresses and cannot receive payouts:{" "}
            {metrics.vendorsWithoutPayPal.map((v) => v.vendor_name).join(", ")}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

