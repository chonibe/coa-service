"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertCircle, DollarSign, Users, TrendingUp, AlertTriangle, Info, ArrowRight } from "lucide-react"
import { formatUSD } from "@/lib/utils"
import { cn } from "@/lib/utils"
import type { PendingPayout, PayoutHistory } from "../types"

interface PayoutOverviewProps {
  pendingPayouts: PendingPayout[]
  payoutHistory: PayoutHistory[]
  isLoading?: boolean
  onFilterToIssues?: (type: "negative" | "noEmail") => void
  onViewPending?: () => void
}

export function PayoutOverview({
  pendingPayouts,
  payoutHistory,
  isLoading,
  onFilterToIssues,
  onViewPending,
}: PayoutOverviewProps) {
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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card
                className={cn(
                  "border-l-4 border-l-blue-500 cursor-pointer transition-all hover:shadow-md",
                  onViewPending && "hover:border-l-blue-600"
                )}
                onClick={onViewPending}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-blue-500" />
                    {onViewPending && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatUSD(metrics.totalPending)}</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics.pendingCount} vendor{metrics.pendingCount !== 1 ? "s" : ""} awaiting payout
                  </p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">
                Total amount pending payout across all vendors. This includes all fulfilled orders that haven't been paid yet.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
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
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">
                Total amount paid out this calendar month. Only includes payouts with "completed" status.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
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
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">
                Average payout amount per completed transaction. Calculated from all historical completed payouts.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card
                className={cn(
                  `border-l-4 ${metrics.vendorsWithIssues > 0 ? "border-l-red-500" : "border-l-gray-500"} transition-all`,
                  metrics.vendorsWithIssues > 0 && onFilterToIssues && "cursor-pointer hover:shadow-md hover:border-l-red-600"
                )}
                onClick={() => metrics.vendorsWithIssues > 0 && onFilterToIssues && onFilterToIssues("negative")}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Issues</CardTitle>
                  <div className="flex items-center gap-1">
                    <AlertTriangle
                      className={`h-4 w-4 ${metrics.vendorsWithIssues > 0 ? "text-red-500" : "text-muted-foreground"}`}
                    />
                    {metrics.vendorsWithIssues > 0 && onFilterToIssues && (
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${metrics.vendorsWithIssues > 0 ? "text-red-600" : ""}`}>
                    {metrics.vendorsWithIssues}
                  </div>
                  <p className="text-xs text-muted-foreground">Vendors requiring attention</p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">
                {metrics.vendorsWithIssues > 0
                  ? "Vendors with issues (negative balances or missing PayPal emails). Click to view details."
                  : "No vendors currently have issues requiring attention."}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Critical Alerts */}
      {metrics.vendorsWithNegativeBalance.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <div className="flex-1">
            <AlertTitle>Negative Balances Detected</AlertTitle>
            <AlertDescription className="mt-2">
              {metrics.vendorsWithNegativeBalance.length} vendor
              {metrics.vendorsWithNegativeBalance.length !== 1 ? "s" : ""} have negative balances
              due to refunds. They owe money that will be deducted from their next payout:{" "}
              {metrics.vendorsWithNegativeBalance
                .map((v) => `${v.vendor_name} (${formatUSD(Math.abs(v.amount))})`)
                .join(", ")}
            </AlertDescription>
            {onFilterToIssues && (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onFilterToIssues("negative")}
                  className="bg-background"
                >
                  View Vendors with Negative Balances
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </Alert>
      )}

      {metrics.vendorsWithoutPayPal.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <div className="flex-1">
            <AlertTitle>Missing PayPal Emails</AlertTitle>
            <AlertDescription className="mt-2">
              {metrics.vendorsWithoutPayPal.length} vendor
              {metrics.vendorsWithoutPayPal.length !== 1 ? "s" : ""} are missing PayPal email
              addresses and cannot receive payouts:{" "}
              {metrics.vendorsWithoutPayPal.map((v) => v.vendor_name).join(", ")}
            </AlertDescription>
            {onFilterToIssues && (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onFilterToIssues("noEmail")}
                  className="bg-background"
                >
                  View Vendors Missing Emails
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </Alert>
      )}
    </div>
  )
}

