"use client"

import { useState, useEffect, useMemo } from "react"

import { Skeleton } from "@/components/ui"


import { DollarSign, RefreshCw, AlertCircle, Download, Wallet, ExternalLink, Search, Filter, Calendar, TrendingUp, TrendingDown, Grid3x3, List, FileText, FileSpreadsheet, BarChart3, LayoutGrid, Clock, ChevronDown, ChevronUp } from "lucide-react"





import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { PayoutMetricsCards } from "@/components/payouts/payout-metrics-cards"
import { ContextualOnboarding } from "../../components/contextual-onboarding"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Button, Alert, AlertDescription, AlertTitle, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsContent, TabsList, TabsTrigger, AnnouncementBar } from "@/components/ui"
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

interface VendorBalance {
  vendor_name: string
  available_balance: number
  pending_balance: number
  held_balance: number
  total_balance: number
  last_updated: string
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
  const [isPayPalEmailMissing, setIsPayPalEmailMissing] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [sortOption, setSortOption] = useState<SortOption>("date-desc")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [dateFilter, setDateFilter] = useState<DateFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [pendingLineItems, setPendingLineItems] = useState<any[]>([])
  const [pendingGroupedByMonth, setPendingGroupedByMonth] = useState<any[]>([])
  const [unfulfilledLineItems, setUnfulfilledLineItems] = useState<any[]>([])
  const [unfulfilledGroupedByMonth, setUnfulfilledGroupedByMonth] = useState<any[]>([])
  const [isLoadingPending, setIsLoadingPending] = useState(false)
  const [pendingError, setPendingError] = useState<string | null>(null)
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set())
  const [expandedUnfulfilledMonths, setExpandedUnfulfilledMonths] = useState<Set<string>>(new Set())
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isPageVisible, setIsPageVisible] = useState(true)
  const [balance, setBalance] = useState<VendorBalance | null>(null)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [showSuccessBanner, setShowSuccessBanner] = useState(false)
  const [lastRequestedPayout, setLastRequestedPayout] = useState<Payout | null>(null)
  const [payoutReadiness, setPayoutReadiness] = useState<any>(null)
  const [isLoadingReadiness, setIsLoadingReadiness] = useState(false)
  const { toast } = useToast()

  // Fetch balance data
  const fetchBalance = async () => {
    if (!vendorName) return

    try {
      setIsLoadingBalance(true)
      const response = await fetch(`/api/vendors/balance?vendorName=${encodeURIComponent(vendorName)}`)
      if (!response.ok) throw new Error("Failed to fetch balance")
      const data = await response.json()
      setBalance(data.balance)
    } catch (error: any) {
      console.error("Error fetching balance:", error)
      // Don't show error toast for balance fetch, just log it
    } finally {
      setIsLoadingBalance(false)
    }
  }

  // Fetch payout readiness
  const fetchPayoutReadiness = async () => {
    if (!vendorName) return

    try {
      setIsLoadingReadiness(true)
      const response = await fetch("/api/vendor/payout-readiness", {
        credentials: "include",
      })
      if (!response.ok) throw new Error("Failed to fetch readiness")
      const data = await response.json()
      setPayoutReadiness(data.readiness)
    } catch (error: any) {
      console.error("Error fetching payout readiness:", error)
    } finally {
      setIsLoadingReadiness(false)
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)

  useEffect(() => {
    const initialLoad = async () => {
      await Promise.all([fetchVendorName(), fetchPayouts(), fetchPendingItems(), fetchBalance(), fetchPayoutReadiness()])
      setLastUpdated(new Date())
    }
    void initialLoad()
  }, [])

  useEffect(() => {
    const handleVisibility = () => setIsPageVisible(document.visibilityState === "visible")
    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const hasPending = payouts.some(
        (p) => p.status === "pending" || p.status === "processing" || p.status === "requested"
      )
      if (isPageVisible && hasPending) {
        fetchPayouts()
        fetchPendingItems()
        setLastUpdated(new Date())
      }
    }, 30000) // Refresh every 30 seconds if there are pending requests
    return () => clearInterval(interval)
  }, [isPageVisible, payouts])

  // Auto-refresh when on pending requests tab
  useEffect(() => {
    if (activeTab === "pending-requests" && isPageVisible) {
      const hasRequested = payouts.some(p => p.status === "requested")
      if (hasRequested) {
        const refreshInterval = setInterval(() => {
          fetchPayouts()
          setLastUpdated(new Date())
        }, 30000) // Refresh every 30 seconds when viewing pending requests
        return () => clearInterval(refreshInterval)
      }
    }
  }, [activeTab, isPageVisible, payouts])

  const fetchVendorName = async () => {
    try {
      const response = await fetch("/api/vendor/profile", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setVendorName(data.vendor?.vendor_name || null)
        
        // Check if PayPal email is missing
        if (!data.vendor?.paypal_email) {
          setIsPayPalEmailMissing(true)
          setError("PayPal email not configured. Please go to Settings to set your PayPal email to request payouts.")
        } else {
          setIsPayPalEmailMissing(false)
        }
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

      // Calculate totals (amounts are already in USD from vendor_payouts table)
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
      setPendingError(null)
      const response = await fetch("/api/vendor/payouts/pending-items", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch pending items")
      }

      const data = await response.json()
      setPendingLineItems(data.lineItems || [])
      setPendingGroupedByMonth(data.groupedByMonth || [])
      setUnfulfilledLineItems(data.unfulfilledItems || [])
      setUnfulfilledGroupedByMonth(data.unfulfilledGroupedByMonth || [])
    } catch (err) {
      console.error("Error fetching pending items:", err)
      setPendingError(err instanceof Error ? err.message : "Failed to load pending items")
    } finally {
      setIsLoadingPending(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([fetchPayouts(), fetchPendingItems()])
    setLastUpdated(new Date())
      toast({
        title: "Updated!",
        description: "Your latest earnings information has been refreshed.",
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

  const toggleUnfulfilledMonthExpansion = (monthKey: string) => {
    setExpandedUnfulfilledMonths((prev) => {
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
      console.log("[handleRedeem] Starting payout request...")
      
      const response = await fetch("/api/vendor/payouts/redeem", {
        method: "POST",
        credentials: "include",
      })

      console.log("[handleRedeem] Response status:", response.status)
      
      let data
      try {
        data = await response.json()
        console.log("[handleRedeem] Response data:", data)
      } catch (parseError) {
        console.error("[handleRedeem] Failed to parse response:", parseError)
        throw new Error("Invalid response from server. Please try again.")
      }

      if (!response.ok) {
        throw new Error(data?.error || `Request failed with status ${response.status}`)
      }

      toast({
        title: "Payment Request Sent!",
        description: data.note || "We've received your payment request and will process it soon. You'll be notified once it's approved.",
      })

      // Show success banner and switch to pending requests tab
      setShowSuccessBanner(true)
      
      // Refresh payouts and pending items
      await Promise.all([fetchPayouts(), fetchPendingItems()])
      
      // Find the newly created payout request
      const updatedPayoutsResponse = await fetch("/api/vendor/payouts", { credentials: "include" })
      if (updatedPayoutsResponse.ok) {
        const updatedPayouts = await updatedPayoutsResponse.json()
        const requestedPayout = updatedPayouts.payouts?.find((p: Payout) => p.status === "requested" && p.reference === data.reference)
        if (requestedPayout) {
          setLastRequestedPayout(requestedPayout)
        }
      }
      
      // Switch to pending requests tab to show the new request
      setActiveTab("pending-requests")
      
      // Auto-hide banner after 15 seconds
      setTimeout(() => setShowSuccessBanner(false), 15000)
    } catch (err) {
      console.error("Error redeeming payout:", err)
      const errorMessage = err instanceof Error ? err.message : "We couldn't process your request. Please try again."
      
      // Check if it's a PayPal email error and provide a helpful message with link
      if (errorMessage.includes("PayPal email") || errorMessage.includes("paypal")) {
        toast({
          variant: "destructive",
          title: "PayPal Email Required",
          description: `${errorMessage} Click here to go to Settings and configure your PayPal email.`,
        })
        // Also show a persistent alert at the top of the page
        setError(`PayPal email not configured. Please update your settings to request payouts.`)
      } else {
        toast({
          variant: "destructive",
          title: "Request Failed",
          description: errorMessage,
        })
        setError(errorMessage)
      }
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
            Reviewing Your Request
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
    <>
      {/* Dynamic announcement bar using reusable component */}
      {pendingAmount > 0 && pendingLineItems.length > 0 && (() => {
        const isReady = payoutReadiness?.isReady || false;
        const hasSufficientBalance = pendingAmount >= 25;
        
        // Priority: Missing prerequisites > Below minimum > Ready to request
        if (!isReady) {
          // State 1: Missing prerequisites
          return (
            <AnnouncementBar
              id="payouts-prerequisites"
              variant="warning"
              message={`Complete your payout details to request payments • Missing: ${payoutReadiness?.missingItems.join(", ") || "profile information"}`}
              action={{
                label: "Go to Settings",
                onClick: () => window.location.href = "/vendor/dashboard/settings"
              }}
              dismissible
              markerLabel="Setup Required"
              markerPosition="top"
            />
          );
        } else if (!hasSufficientBalance) {
          // State 2: Below minimum threshold
          return (
            <AnnouncementBar
              id="payouts-minimum"
              variant="pending"
              message={`You have ${formatCurrency(pendingAmount)} pending • Minimum payout is $25 • You need ${formatCurrency(25 - pendingAmount)} more`}
              dismissible
              markerLabel="Pending Balance"
              markerPosition="top"
            />
          );
        } else {
          // State 3: Ready to request payment
          return (
            <AnnouncementBar
              id="payouts-ready"
              variant="success"
              icon={<Wallet className="h-5 w-5" />}
              message={`You have ${formatCurrency(pendingAmount)} ready to withdraw from ${pendingLineItems.length} order${pendingLineItems.length !== 1 ? 's' : ''}`}
              action={{
                label: isRedeeming ? "Processing..." : "Request Payment",
                onClick: handleRedeem,
                disabled: isRedeeming || isLoading,
                loading: isRedeeming
              }}
              dismissible
              markerLabel="Payment Ready"
              markerPosition="top"
            />
          );
        }
      })()}

      <div className="w-full space-y-4">

        {/* Contextual Onboarding for Payouts - floating */}
        <ContextualOnboarding context="payouts" onComplete={() => {
          fetchPayouts()
          fetchPendingItems()
        }} />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full">
          <div>
            <p className="text-muted-foreground text-lg">Your earnings and payment history</p>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground">Last updated {format(lastUpdated, "HH:mm")}</p>
            )}
          </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={isRefreshing} 
            className="flex items-center gap-1 border shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {statusFilter !== "all" && <Badge variant="outline">Status: {statusFilter}</Badge>}
        {dateFilter !== "all" && <Badge variant="outline">Date: {dateFilter}</Badge>}
        {searchQuery && <Badge variant="outline">Search: “{searchQuery}”</Badge>}
      </div>

      {/* Success Banner */}
      {showSuccessBanner && (
        <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-800 dark:text-green-200">Payment Request Submitted Successfully!</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            Your payout request has been submitted and is awaiting admin approval. 
            {lastRequestedPayout && (
              <span className="block mt-1">
                Amount: {formatCurrency(lastRequestedPayout.amount)} • Reference: {lastRequestedPayout.reference}
              </span>
            )}
            You can track its progress in the "Pending Requests" section below. You'll be notified once it's processed.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 border shadow-sm">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pending-requests">
            Pending Requests
            {payouts.filter(p => p.status === "requested").length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                {payouts.filter(p => p.status === "requested").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="pending-requests" className="space-y-4">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Pending Payment Requests
              </CardTitle>
              <CardDescription>
                Track the status of your payment requests. These are awaiting admin approval and processing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array(2).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : payouts.filter(p => p.status === "requested").length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Pending Requests</AlertTitle>
                  <AlertDescription>
                    You don't have any pending payment requests. Click "Request Payment" above to submit a new payout request.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {payouts
                    .filter(p => p.status === "requested")
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((payout) => (
                      <Card key={payout.id} className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            {/* Header */}
                            <div className="flex items-start justify-between flex-wrap gap-4">
                              <div>
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-2xl font-bold">{formatCurrency(payout.amount)}</span>
                                  <Badge variant="outline" className="text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700">
                                    Under Review
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground space-y-1">
                                  <div>Requested: {format(new Date(payout.date), "MMM d, yyyy 'at' h:mm a")}</div>
                                  {payout.reference && <div>Reference: {payout.reference}</div>}
                                  {payout.invoice_number && <div>Invoice: {payout.invoice_number}</div>}
                                  {payout.products > 0 && <div>{payout.products} item{payout.products !== 1 ? "s" : ""} included</div>}
                                </div>
                              </div>
                            </div>

                            {/* Progress Timeline */}
                            <div className="border-t pt-4">
                              <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                                      1
                                    </div>
                                    <div className="w-0.5 h-8 bg-blue-300 dark:bg-blue-700 mt-1" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">Request Submitted</div>
                                    <div className="text-xs text-muted-foreground">
                                      Your payment request has been received
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                    Completed
                                  </Badge>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                                      2
                                    </div>
                                    <div className="w-0.5 h-8 bg-blue-300 dark:bg-blue-700 mt-1" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">Admin Review</div>
                                    <div className="text-xs text-muted-foreground">
                                      Your request is being reviewed by our team
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 animate-pulse">
                                    In Progress
                                  </Badge>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 text-xs font-semibold">
                                      3
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-sm text-muted-foreground">Payment Processing</div>
                                    <div className="text-xs text-muted-foreground">
                                      Once approved, your payment will be processed
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-300">
                                    Pending
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            {/* Info Message */}
                            <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              <AlertDescription className="text-blue-800 dark:text-blue-300 text-sm">
                                You'll receive a notification once your payment request has been approved and processed. 
                                Typically, this takes 1-3 business days.
                              </AlertDescription>
                            </Alert>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          {/* Enhanced Metrics Cards */}
          {vendorName && <PayoutMetricsCards vendorName={vendorName} isAdmin={false} />}

          {/* Orders in Process (Awaiting Platform Fulfillment) */}
          {unfulfilledGroupedByMonth.length > 0 && (
            <Card className="border shadow-sm border-blue-200 dark:border-blue-900/30 opacity-75">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <Clock className="h-5 w-5" />
                  Orders in Process
                </CardTitle>
                <CardDescription>
                  These orders have been placed and are being fulfilled by our team. Once fulfillment is complete, they'll appear in "Ready to Request Payment" and you can request your payout via PayPal.
                  <div className="mt-2 text-xs">
                    <a href="/vendor/dashboard/settings" className="text-blue-600 hover:underline">
                      How is my payout calculated?
                    </a>
                    {" • You earn 25% commission on each sale"}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {unfulfilledGroupedByMonth.map((monthData) => (
                    <div key={monthData.monthKey} className="border rounded-lg p-4 space-y-3 border-blue-200 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-950/10">
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleUnfulfilledMonthExpansion(monthData.monthKey)}
                      >
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">{monthData.month}</h3>
                          <Badge variant="outline" className="border-blue-300 text-blue-700">{monthData.itemCount} items</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">
                            Total Value: <span className="font-medium text-foreground">{formatCurrency(monthData.totalAmount)}</span>
                          </span>
                          {expandedUnfulfilledMonths.has(monthData.monthKey) ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      {expandedUnfulfilledMonths.has(monthData.monthKey) && (
                        <div className="space-y-2 pt-2 border-t border-blue-200 dark:border-blue-900/30">
                          {monthData.items.map((item: any) => (
                            <div key={item.line_item_id} className="flex items-center justify-between p-2 rounded bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-blue-200/50 dark:border-blue-900/20">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{item.product_title}</div>
                                <div className="text-sm text-muted-foreground">
                                  {format(new Date(item.created_at), "MMM d, yyyy")}
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <div className="font-bold text-lg text-blue-600 dark:text-blue-400">{formatCurrency(item.payout_amount)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30">
                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-blue-800 dark:text-blue-300">
                      <strong>Awaiting platform fulfillment.</strong> Our team is currently preparing these orders. Once shipped, they'll move to "Ready to Request Payment" and you can request your payout.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Orders Breakdown */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Ready to Request Payment
              </CardTitle>
              <CardDescription>
                Great news! These orders have been fulfilled by our team and are ready for payment. Click "Request Payment" above to get paid to your PayPal account.
                <div className="mt-2 text-xs">
                  <a href="/vendor/dashboard/settings" className="text-blue-600 hover:underline">
                    How is my payout calculated?
                  </a>
                  {" • You earn 25% commission on each sale"}
                </div>
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
              ) : pendingError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Couldn’t load pending items</AlertTitle>
                  <AlertDescription className="mt-1">
                    {pendingError}
                    <div className="mt-2">
                      <Button size="sm" variant="outline" onClick={fetchPendingItems}>
                        Retry
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
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
                            <div key={item.line_item_id} className="flex items-center justify-between p-3 rounded bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-white/20 dark:border-slate-700/20">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{item.product_title}</div>
                                <div className="text-sm text-muted-foreground">
                                  {format(new Date(item.created_at), "MMM d, yyyy")}
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <div className="font-bold text-lg text-green-600">{formatCurrency(item.payout_amount)}</div>
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
                      <strong>Ready for payment!</strong> These are orders that have been successfully fulfilled and are waiting for you to request payment. 
                      Simply click "Request Payment" above to get paid for all of these items at once.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-muted-foreground">All caught up!</p>
                  <p className="text-sm text-muted-foreground mt-1">All your fulfilled orders have been paid out. Great work!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Payouts Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Your latest payment activity</CardDescription>
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
                <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
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
                </div>
              ) : (
                <div className="py-6 text-center text-muted-foreground">
                  No payments yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
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
                    <SelectItem value="requested">Reviewing Your Request</SelectItem>
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
          <div className="flex items-center justify-between flex-wrap gap-3">
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
              className="border shadow-sm"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Payout History */}
          <Card className="overflow-hidden border shadow-sm">
            <CardHeader>
              <CardTitle>Your Payment History</CardTitle>
              <CardDescription>
                {filteredAndSortedPayouts.length === 0 
                  ? "Your payment history will appear here"
                  : `You have ${filteredAndSortedPayouts.length} payment${filteredAndSortedPayouts.length !== 1 ? "s" : ""} in your history`}
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
                <div className="space-y-4">
                  {sortedMonths.map((monthKey) => {
                    const monthData = groupedPayouts[monthKey]
                    return (
                      <div key={monthKey} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between border-b pb-2 flex-wrap gap-2">
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
                                      We're Reviewing Your Request
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
                                      className="flex items-center gap-1 h-7 border shadow-sm"
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
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <span className="text-muted-foreground truncate">{item.item_name}</span>
                                        {item.is_paid && (
                                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs shrink-0">
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
                                            className="h-5 px-1 text-xs shrink-0"
                                          >
                                            <ExternalLink className="h-3 w-3" />
                                          </Button>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-3 ml-4 shrink-0">
                                        <span className="text-muted-foreground text-xs">
                                          {format(new Date(item.date), "MMM d")}
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
                  <p className="text-muted-foreground">Your payment history will appear here</p>
                  <p className="text-sm text-muted-foreground mt-1">Once your first payment is processed, you'll see it here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </>
  )
}
