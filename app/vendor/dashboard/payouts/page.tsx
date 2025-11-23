"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DollarSign, RefreshCw, AlertCircle, Download, Wallet, ExternalLink, Search, Filter, Calendar, TrendingUp, TrendingDown, Grid3x3, List, FileText, FileSpreadsheet, BarChart3, LayoutGrid, Clock, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { PayoutTrendsChart } from "@/components/payouts/payout-trends-chart"
import { PayoutMetricsCards } from "@/components/payouts/payout-metrics-cards"
import { ProductPerformanceHeatmap } from "@/components/payouts/product-performance-heatmap"
import { ContextualOnboarding } from "../../components/contextual-onboarding"

interface PayoutItem {
  item_name: string
  date: string
  amount: number
  payout_reference?: string
  marked_at?: string
  marked_by?: string
  is_paid?: boolean
}

interface Payout {
  id: string
  amount: number
  status: "pending" | "paid" | "failed" | "completed" | "processing" | "requested" | "rejected"
  date: string
  products: number
  reference?: string
  invoice_number?: string
  payout_batch_id?: string
  items?: PayoutItem[]
}

type ViewMode = "list" | "card"
type SortOption = "date-desc" | "date-asc" | "amount-desc" | "amount-asc" | "status"
type StatusFilter = "all" | "requested" | "processing" | "completed" | "rejected" | "failed"
type DateFilter = "7d" | "30d" | "90d" | "1y" | "all" | "this-month" | "last-month" | "this-year"

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalPaid, setTotalPaid] = useState(0)
  const [pendingAmount, setPendingAmount] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [vendorName, setVendorName] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [sortOption, setSortOption] = useState<SortOption>("date-desc")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [dateFilter, setDateFilter] = useState<DateFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [pendingLineItems, setPendingLineItems] = useState<any[]>([])
  const [pendingGroupedByMonth, setPendingGroupedByMonth] = useState<any[]>([])
  const [isLoadingPending, setIsLoadingPending] = useState(false)
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)

  useEffect(() => {
    fetchVendorName()
    fetchPayouts()
    fetchPendingItems()
    
    // Auto-refresh for pending/requested payouts every 30 seconds
    const interval = setInterval(() => {
      const hasPending = payouts.some(
        (p) => p.status === "pending" || p.status === "processing" || p.status === "requested"
      )
      if (hasPending) {
        fetchPayouts()
        fetchPendingItems()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const fetchVendorName = async () => {
    try {
      const response = await fetch("/api/vendor/profile", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setVendorName(data.vendor?.vendor_name || null)
      }
    } catch (err) {
      console.error("Error fetching vendor name:", err)
    }
  }

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
        .filter((p: Payout) => p.status === "paid" || p.status === "completed")
        .reduce((sum: number, p: Payout) => sum + p.amount, 0)

      const pending = data.payouts
        .filter(
          (p: Payout) =>
            p.status === "pending" || p.status === "processing" || p.status === "requested"
        )
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

  const fetchPendingItems = async () => {
    try {
      setIsLoadingPending(true)
      const response = await fetch("/api/vendor/payouts/pending-items", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch pending items")
      }

      const data = await response.json()
      setPendingLineItems(data.lineItems || [])
      setPendingGroupedByMonth(data.groupedByMonth || [])
    } catch (err) {
      console.error("Error fetching pending items:", err)
    } finally {
      setIsLoadingPending(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([fetchPayouts(), fetchPendingItems()])
    toast({
      title: "Payouts Refreshed",
      description: "The latest payout data has been loaded.",
    })
  }

  const toggleMonthExpansion = (monthKey: string) => {
    setExpandedMonths((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(monthKey)) {
        newSet.delete(monthKey)
      } else {
        newSet.add(monthKey)
      }
      return newSet
    })
  }

  const handleRedeem = async () => {
    try {
      setIsRedeeming(true)
      const response = await fetch("/api/vendor/payouts/redeem", {
        method: "POST",
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to redeem payout")
      }

      toast({
        title: "Payout Request Submitted!",
        description: data.note || "Your payout request has been submitted and is awaiting admin approval.",
      })

      // Refresh payouts
      await fetchPayouts()
    } catch (err) {
      console.error("Error redeeming payout:", err)
      toast({
        variant: "destructive",
        title: "Redeem Failed",
        description: err instanceof Error ? err.message : "An unexpected error occurred",
      })
    } finally {
      setIsRedeeming(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
      case "completed":
        return <Badge className="bg-green-500">Paid</Badge>
      case "requested":
        return (
          <Badge variant="outline" className="text-blue-500 border-blue-500">
            Awaiting Approval
          </Badge>
        )
      case "pending":
      case "processing":
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-500">
            {status === "processing" ? "Processing" : "Pending"}
          </Badge>
        )
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Filter and sort payouts
  const filteredAndSortedPayouts = useMemo(() => {
    let filtered = [...payouts]

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter)
    }

    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date()
      let startDate = new Date()
      
      switch (dateFilter) {
        case "7d":
          startDate.setDate(now.getDate() - 7)
          break
        case "30d":
          startDate.setDate(now.getDate() - 30)
          break
        case "90d":
          startDate.setDate(now.getDate() - 90)
          break
        case "1y":
          startDate.setFullYear(now.getFullYear() - 1)
          break
        case "this-month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case "last-month":
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          const endDate = new Date(now.getFullYear(), now.getMonth(), 0)
          filtered = filtered.filter(
            (p) => new Date(p.date) >= startDate && new Date(p.date) <= endDate
          )
          break
        case "this-year":
          startDate = new Date(now.getFullYear(), 0, 1)
          break
      }
      
      if (dateFilter !== "last-month") {
        filtered = filtered.filter((p) => new Date(p.date) >= startDate)
      }
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.reference?.toLowerCase().includes(query) ||
          p.invoice_number?.toLowerCase().includes(query) ||
          p.payout_batch_id?.toLowerCase().includes(query) ||
          formatCurrency(p.amount).toLowerCase().includes(query)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortOption) {
        case "date-desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case "amount-desc":
          return b.amount - a.amount
        case "amount-asc":
          return a.amount - b.amount
        case "status":
          return a.status.localeCompare(b.status)
        default:
          return 0
      }
    })

    return filtered
  }, [payouts, statusFilter, dateFilter, searchQuery, sortOption])

  // Group payouts by month for display
  const groupedPayouts = useMemo(() => {
    return filteredAndSortedPayouts.reduce((acc, payout) => {
      const date = new Date(payout.date)
      const monthKey = format(date, "yyyy-MM")
      const monthName = format(date, "MMMM yyyy")

      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthName,
          monthKey,
          payouts: [],
          total: 0,
        }
      }

      acc[monthKey].payouts.push(payout)
      acc[monthKey].total += payout.amount

      return acc
    }, {} as Record<string, { month: string; monthKey: string; payouts: Payout[]; total: number }>)
  }, [filteredAndSortedPayouts])

  const sortedMonths = Object.keys(groupedPayouts).sort().reverse()

  const handleExportCSV = () => {
    const headers = ["Date", "Amount", "Status", "Reference", "Products", "Invoice Number"]
    const rows = filteredAndSortedPayouts.map((p) => [
      format(new Date(p.date), "yyyy-MM-dd"),
      p.amount.toFixed(2),
      p.status,
      p.reference || "",
      p.products.toString(),
      p.invoice_number || "",
    ])

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `payouts-${format(new Date(), "yyyy-MM-dd")}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
        {/* Contextual Onboarding for Payouts - floating */}
        <ContextualOnboarding context="payouts" onComplete={() => {
          fetchPayouts()
          fetchPendingItems()
        }} />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Payouts</h1>
            <p className="text-muted-foreground">Track your earnings and payment history</p>
          </div>
        <div className="flex gap-2 flex-wrap">
          {pendingAmount > 0 && (
            <Button 
              onClick={handleRedeem} 
              disabled={isRedeeming || isLoading} 
              className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
            >
              <Wallet className={`h-4 w-4 ${isRedeeming ? "animate-pulse" : ""}`} />
              {isRedeeming ? "Processing..." : "Redeem Payout"}
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={isRefreshing} 
            className="flex items-center gap-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
          >
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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
              >
                Try Again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-lg">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Enhanced Metrics Cards */}
          {vendorName && <PayoutMetricsCards vendorName={vendorName} isAdmin={false} />}

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
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
                <p className="text-xs text-muted-foreground mt-1">Lifetime earnings</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
                <Clock className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-7 w-20" />
                ) : (
                  <div className="text-2xl font-bold text-amber-600">{formatCurrency(pendingAmount)}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {pendingLineItems.length > 0 
                    ? `${pendingLineItems.length} fulfilled orders awaiting payout`
                    : "Awaiting payout"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-7 w-20" />
                ) : (
                  <div className="text-2xl font-bold">
                    {payouts.filter((p) => p.status === "completed" || p.status === "paid").length}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Completed payouts</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-7 w-20" />
                ) : (
                  <div className="text-2xl font-bold">
                    {formatCurrency(
                      payouts
                        .filter((p) => {
                          const payoutDate = new Date(p.date)
                          const now = new Date()
                          return (
                            payoutDate.getMonth() === now.getMonth() &&
                            payoutDate.getFullYear() === now.getFullYear() &&
                            (p.status === "completed" || p.status === "paid")
                          )
                        })
                        .reduce((sum, p) => sum + p.amount, 0)
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Current month earnings</p>
              </CardContent>
            </Card>
          </div>

          {/* Pending Orders Breakdown */}
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Orders Breakdown
              </CardTitle>
              <CardDescription>
                These are fulfilled orders that haven't been paid out yet. Click "Redeem Payout" to request payment for all pending items.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPending ? (
                <div className="space-y-2">
                  {Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
              ) : pendingGroupedByMonth.length > 0 ? (
                <div className="space-y-4">
                  {pendingGroupedByMonth.map((monthData) => (
                    <div key={monthData.monthKey} className="border rounded-lg p-4 space-y-3">
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleMonthExpansion(monthData.monthKey)}
                      >
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">{monthData.month}</h3>
                          <Badge variant="outline">{monthData.itemCount} items</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">
                            Total: <span className="font-medium text-foreground">{formatCurrency(monthData.totalAmount)}</span>
                          </span>
                          {expandedMonths.has(monthData.monthKey) ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      {expandedMonths.has(monthData.monthKey) && (
                        <div className="space-y-2 pt-2 border-t">
                          {monthData.items.map((item: any) => (
                            <div key={item.line_item_id} className="flex items-center justify-between p-2 rounded bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-white/20 dark:border-slate-700/20">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{item.product_title}</div>
                                <div className="text-sm text-muted-foreground">
                                  {format(new Date(item.created_at), "MMM d, yyyy")}
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <div className="text-sm text-muted-foreground">Order Value</div>
                                <div className="font-medium">{formatCurrency(item.price)}</div>
                                <div className="text-sm text-muted-foreground mt-1">Payout</div>
                                <div className="font-bold text-green-600">{formatCurrency(item.payout_amount)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>What does "Pending" mean?</strong> These are orders that have been fulfilled and are ready for payout. 
                      They haven't been included in a payout request yet. Click "Redeem Payout" above to request payment for all pending items.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-muted-foreground">No pending orders</p>
                  <p className="text-sm text-muted-foreground mt-1">All fulfilled orders have been paid out.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Payouts Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Payouts</CardTitle>
              <CardDescription>Your most recent payout activity</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
              ) : filteredAndSortedPayouts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedPayouts.slice(0, 5).map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell>{format(new Date(payout.date), "MMM d, yyyy")}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(payout.amount)}</TableCell>
                        <TableCell>{getStatusBadge(payout.status)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {payout.reference || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-6 text-center text-muted-foreground">
                  No payouts found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Payout Trends Chart */}
          {vendorName && <PayoutTrendsChart vendorName={vendorName} isAdmin={false} timeRange="30d" />}

          {/* Product Performance */}
          {vendorName && (
            <ProductPerformanceHeatmap vendorName={vendorName} isAdmin={false} timeRange="30d" limit={10} />
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by reference..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="requested">Awaiting Approval</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="90d">Last 90 Days</SelectItem>
                    <SelectItem value="1y">Last Year</SelectItem>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="this-year">This Year</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Date (Newest)</SelectItem>
                    <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                    <SelectItem value="amount-desc">Amount (High to Low)</SelectItem>
                    <SelectItem value="amount-asc">Amount (Low to High)</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* View Options */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4 mr-2" />
                List
              </Button>
              <Button
                variant={viewMode === "card" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("card")}
              >
                <Grid3x3 className="h-4 w-4 mr-2" />
                Cards
              </Button>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportCSV}
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Payout History */}
          <Card className="overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
              <CardDescription>
                {filteredAndSortedPayouts.length} payout{filteredAndSortedPayouts.length !== 1 ? "s" : ""} found
              </CardDescription>
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
              ) : sortedMonths.length > 0 ? (
                <div className="space-y-6">
                  {sortedMonths.map((monthKey) => {
                    const monthData = groupedPayouts[monthKey]
                    return (
                      <div key={monthKey} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                          <h3 className="text-lg font-semibold">{monthData.month}</h3>
                          <div className="text-sm text-muted-foreground">
                            Total: <span className="font-medium text-foreground">{formatCurrency(monthData.total)}</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {monthData.payouts.map((payout) => (
                            <div key={payout.id} className="border rounded-md p-4 space-y-2">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className="font-medium">{formatCurrency(payout.amount)}</span>
                                  {getStatusBadge(payout.status)}
                                  {payout.reference && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        toast({
                                          title: "Payment Reference",
                                          description: `Reference: ${payout.reference}${payout.payout_batch_id ? `\nBatch ID: ${payout.payout_batch_id}` : ""}`,
                                        })
                                      }}
                                      className="flex items-center gap-1 h-7 text-xs"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      {payout.reference}
                                    </Button>
                                  )}
                                  {payout.status === "requested" && (
                                    <Badge variant="outline" className="text-blue-500 border-blue-500 text-xs">
                                      Awaiting Admin Approval
                                    </Badge>
                                  )}
                                  {(payout.status === "paid" || payout.status === "completed") && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const link = document.createElement("a")
                                        link.href = `/api/vendors/payouts/${payout.id}/invoice`
                                        link.download = `invoice-${payout.invoice_number || payout.id}.pdf`
                                        link.click()
                                      }}
                                      className="flex items-center gap-1 h-7 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
                                    >
                                      <Download className="h-3 w-3" />
                                      Invoice
                                    </Button>
                                  )}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {format(new Date(payout.date), "MMM d, yyyy")}
                                </span>
                              </div>
                              {payout.items && payout.items.length > 0 && (
                                <div className="mt-3 space-y-1 pl-4 border-l-2">
                                  {payout.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm">
                                      <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">{item.item_name}</span>
                                        {item.is_paid && (
                                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                                            Paid
                                          </Badge>
                                        )}
                                        {item.payout_reference && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              toast({
                                                title: "Payment Details",
                                                description: `Reference: ${item.payout_reference}${item.marked_at ? `\nPaid: ${format(new Date(item.marked_at), "MMM d, yyyy")}` : ""}`,
                                              })
                                            }}
                                            className="h-5 px-1 text-xs"
                                          >
                                            <ExternalLink className="h-3 w-3" />
                                          </Button>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className="text-muted-foreground">
                                          {format(new Date(item.date), "MMM d, yyyy")}
                                        </span>
                                        <span className="font-medium">{formatCurrency(item.amount)}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-muted-foreground">No payout history available yet.</p>
                  <p className="text-sm text-muted-foreground mt-1">Payouts will appear here once processed.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
