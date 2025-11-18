"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DollarSign, RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"

interface Payout {
  id: string
  amount: number
  status: "pending" | "paid" | "failed"
  date: string
  products: number
  reference?: string
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalPaid, setTotalPaid] = useState(0)
  const [pendingAmount, setPendingAmount] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 2,
    }).format(amount)

  const fetchPayouts = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/vendor/payouts", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch payouts: ${response.status}`)
      }

      const data = await response.json()
      setPayouts(data.payouts || [])

      // Calculate totals
      const paid = data.payouts
        .filter((p: Payout) => p.status === "paid")
        .reduce((sum: number, p: Payout) => sum + p.amount, 0)

      const pending = data.payouts
        .filter((p: Payout) => p.status === "pending")
        .reduce((sum: number, p: Payout) => sum + p.amount, 0)

      setTotalPaid(paid)
      setPendingAmount(pending)
    } catch (err) {
      console.error("Error fetching payouts:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchPayouts()
    toast({
      title: "Payouts Refreshed",
      description: "The latest payout data has been loaded.",
    })
  }

  useEffect(() => {
    fetchPayouts()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500">Paid</Badge>
      case "pending":
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-500">
            Pending
          </Badge>
        )
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payouts</h1>
          <p className="text-muted-foreground">Track your earnings and payment history</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center gap-1">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <div className="mt-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                Try Again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(pendingAmount)}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>View your payment history and transaction details</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
          ) : payouts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell>{format(new Date(payout.date), "MMM d, yyyy")}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(payout.amount)}</TableCell>
                      <TableCell>{payout.products}</TableCell>
                      <TableCell>{payout.reference || "-"}</TableCell>
                      <TableCell>{getStatusBadge(payout.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-muted-foreground">No payout history available yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Payouts will appear here once processed.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
