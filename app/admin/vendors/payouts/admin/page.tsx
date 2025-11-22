"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Clock,
  Download,
  Send,
  FileText,
  Calendar,
  ChevronDown,
  ChevronUp,
  Eye,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { convertGBPToUSD, formatUSD } from "@/lib/utils"

interface Vendor {
  id: string
  name: string
  paypal_email: string | null
  tax_id: string | null
  tax_country: string | null
  is_company: boolean
}

interface PendingPayout {
  vendor_name: string
  amount: number
  product_count: number
  paypal_email: string | null
  tax_id: string | null
  tax_country: string | null
  is_company: boolean
  last_payout_date: string | null
}

interface PendingLineItem {
  line_item_id: string
  order_id: string
  order_name: string
  product_id: string
  product_title: string
  price: number
  created_at: string
  payout_amount: number
  is_percentage: boolean
  fulfillment_status?: string | null
  is_paid?: boolean
}

interface PayoutHistory {
  id: number
  vendor_name: string
  amount: number
  status: string
  payout_date: string
  created_at: string
  reference: string
  product_count: number
  payment_method: string
  invoice_number: string | null
  tax_amount: number
  processed_by: string | null
  payout_batch_id?: string | null
}

export default function AdminPayoutsPage() {
  const [pendingPayouts, setPendingPayouts] = useState<PendingPayout[]>([])
  const [payoutHistory, setPayoutHistory] = useState<PayoutHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedPayouts, setSelectedPayouts] = useState<string[]>([])
  const [isPayoutDialogOpen, setIsPayoutDialogOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string>("paypal")
  const [generateInvoices, setGenerateInvoices] = useState(true)
  const [payoutNotes, setPayoutNotes] = useState("")
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null)
  const [vendorLineItems, setVendorLineItems] = useState<Record<string, PendingLineItem[]>>({})
  const [loadingLineItems, setLoadingLineItems] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  })
  const [includePaid, setIncludePaid] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const { toast } = useToast()

  // Initialize tables and fetch data
  useEffect(() => {
    const initializeAndFetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Initialize payout functions
        await fetch("/api/vendors/init-payout-functions", {
          method: "POST",
        })

        // Initialize payout tables
        await fetch("/api/vendors/init-payout-tables", {
          method: "POST",
        })

        // Fetch pending payouts and history
        await fetchPayoutData()
      } catch (err: any) {
        console.error("Error initializing data:", err)
        setError(err.message || "Failed to initialize data")
      } finally {
        setIsLoading(false)
      }
    }

    initializeAndFetchData()
  }, [])

  // Fetch payout data
  const fetchPayoutData = async (page: number = pagination.page) => {
    try {
      // Fetch pending payouts with pagination
      const pendingResponse = await fetch(`/api/vendors/payouts/pending?page=${page}&pageSize=${pagination.pageSize}`)
      if (!pendingResponse.ok) {
        throw new Error("Failed to fetch pending payouts")
      }
      const pendingData = await pendingResponse.json()
      setPendingPayouts(pendingData.payouts || [])
      if (pendingData.pagination) {
        setPagination(pendingData.pagination)
      }

      // Fetch payout history
      const historyResponse = await fetch("/api/vendors/payouts/history")
      if (!historyResponse.ok) {
        throw new Error("Failed to fetch payout history")
      }
      const historyData = await historyResponse.json()
      setPayoutHistory(historyData.payouts || [])
    } catch (err: any) {
      console.error("Error fetching payout data:", err)
      setError(err.message || "Failed to fetch payout data")
    }
  }

  // Handle refresh
  const handleRefresh = async () => {
    setIsLoading(true)
    setError(null)
    await fetchPayoutData()
    setIsLoading(false)
    toast({
      title: "Data refreshed",
      description: "Payout data has been updated.",
    })
  }

  // Toggle payout selection
  const togglePayoutSelection = (vendorName: string) => {
    setSelectedPayouts((prev) =>
      prev.includes(vendorName) ? prev.filter((name) => name !== vendorName) : [...prev, vendorName],
    )
  }

  // Select/deselect all payouts
  const toggleSelectAll = () => {
    if (selectedPayouts.length === filteredPendingPayouts.length) {
      setSelectedPayouts([])
    } else {
      setSelectedPayouts(filteredPendingPayouts.map((payout) => payout.vendor_name))
    }
  }

  // Process selected payouts
  const processSelectedPayouts = async () => {
    if (selectedPayouts.length === 0) return

    setIsProcessing(true)
    try {
      const selectedPayoutData = pendingPayouts.filter((payout) => selectedPayouts.includes(payout.vendor_name))

      const response = await fetch("/api/vendors/payouts/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payouts: selectedPayoutData,
          payment_method: paymentMethod,
          generate_invoices: generateInvoices,
          notes: payoutNotes,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to process payouts")
      }

      const result = await response.json()

      toast({
        title: "Payouts processed",
        description: `Successfully processed ${result.processed} payouts.`,
      })

      // Refresh data
      await fetchPayoutData()

      // Close dialog and reset selection
      setIsPayoutDialogOpen(false)
      setSelectedPayouts([])
      setPayoutNotes("")
    } catch (err: any) {
      console.error("Error processing payouts:", err)
      setError(err.message || "Failed to process payouts")
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to process payouts",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Generate invoice for a single payout
  const generateInvoice = async (payoutId: number) => {
    try {
      const response = await fetch(`/api/vendors/payouts/invoice/${payoutId}`, {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to generate invoice")
      }

      const result = await response.json()

      // Open invoice in new tab
      if (result.invoiceUrl) {
        window.open(result.invoiceUrl, "_blank")
      }

      toast({
        title: "Invoice generated",
        description: "The invoice has been generated successfully.",
      })
    } catch (err: any) {
      console.error("Error generating invoice:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to generate invoice",
      })
    }
  }

  // Fetch line items for a vendor
  const fetchVendorLineItems = async (vendorName: string, forceRefresh = false) => {
    if (!forceRefresh && vendorLineItems[vendorName]) {
      // Already loaded
      return
    }

    setLoadingLineItems(vendorName)
    try {
      const response = await fetch("/api/vendors/payouts/pending-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendorName,
          startDate: dateRange.start || undefined,
          endDate: dateRange.end || undefined,
          includePaid,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch line items")
      }

      const data = await response.json()
      setVendorLineItems((prev) => ({
        ...prev,
        [vendorName]: data.lineItems || [],
      }))
    } catch (err: any) {
      console.error("Error fetching line items:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to fetch line items",
      })
    } finally {
      setLoadingLineItems(null)
    }
  }

  // Refresh line items when date range or includePaid changes
  useEffect(() => {
    if (expandedVendor) {
      fetchVendorLineItems(expandedVendor, true)
    }
  }, [dateRange, includePaid])

  // Toggle vendor expansion
  const toggleVendorExpansion = (vendorName: string) => {
    if (expandedVendor === vendorName) {
      setExpandedVendor(null)
    } else {
      setExpandedVendor(vendorName)
      fetchVendorLineItems(vendorName)
    }
  }

  // Check PayPal batch status
  const checkPayPalStatus = async (payoutBatchId: string, payoutId: number) => {
    try {
      const response = await fetch(`/api/vendors/payouts/check-status?batchId=${payoutBatchId}&payoutId=${payoutId}`, {
        method: "GET",
      })

      if (!response.ok) {
        throw new Error("Failed to check PayPal status")
      }

      const result = await response.json()
      
      toast({
        title: "Status Updated",
        description: `Payout status: ${result.status}`,
      })

      // Refresh data
      await fetchPayoutData()
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to check PayPal status",
      })
    }
  }

  // Filter pending payouts based on search query
  const filteredPendingPayouts = pendingPayouts.filter((payout) =>
    payout.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Separate vendors with negative balances and missing PayPal emails
  const vendorsWithIssues = filteredPendingPayouts.filter(
    (payout) => payout.amount < 0 || !payout.paypal_email
  )
  const vendorsWithNegativeBalance = filteredPendingPayouts.filter((payout) => payout.amount < 0)
  const vendorsWithoutPayPal = filteredPendingPayouts.filter((payout) => !payout.paypal_email)

  // Filter payout history based on search query and status
  const filteredPayoutHistory = payoutHistory.filter((payout) => {
    const matchesSearch = payout.vendor_name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || payout.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>
      case "pending":
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-500">
            Pending
          </Badge>
        )
      case "processing":
        return (
          <Badge variant="outline" className="text-blue-500 border-blue-500">
            Processing
          </Badge>
        )
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy")
    } catch (e) {
      return "Invalid date"
    }
  }

  // Calculate payout amount for a line item (converting GBP to USD)
  const calculatePayoutAmount = (item: PendingLineItem) => {
    // Convert price from GBP to USD first
    const priceUSD = convertGBPToUSD(item.price)
    
    if (item.is_percentage) {
      // Calculate payout in USD
      return (priceUSD * item.payout_amount) / 100
    }
    // If fixed amount, assume it's in GBP and convert to USD
    return convertGBPToUSD(item.payout_amount)
  }

  // Convert vendor payout amount from GBP to USD
  const convertPayoutAmount = (gbpAmount: number): number => {
    return convertGBPToUSD(gbpAmount)
  }

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vendor Payouts</h1>
            <p className="text-muted-foreground mt-2">Manage and process payments to vendors</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Warnings for vendors with issues */}
        {vendorsWithNegativeBalance.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Negative Balances Detected</AlertTitle>
            <AlertDescription>
              {vendorsWithNegativeBalance.length} vendor(s) have negative balances due to refunds. 
              They owe money that will be deducted from their next payout:{" "}
              {vendorsWithNegativeBalance.map((v) => `${v.vendor_name} (${formatUSD(Math.abs(v.amount))})`).join(", ")}
            </AlertDescription>
          </Alert>
        )}

        {vendorsWithoutPayPal.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Missing PayPal Emails</AlertTitle>
            <AlertDescription>
              {vendorsWithoutPayPal.length} vendor(s) are missing PayPal email addresses and cannot receive payouts:{" "}
              {vendorsWithoutPayPal.map((v) => v.vendor_name).join(", ")}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending" className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Pending Payouts
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Payout History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Payouts</CardTitle>
                <CardDescription>Process payments to vendors for their products</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 sm:justify-between">
                    <div className="flex-1">
                      <Input
                        placeholder="Search vendors..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="date"
                          placeholder="Start Date"
                          value={dateRange.start}
                          onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                          className="w-[150px]"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          type="date"
                          placeholder="End Date"
                          value={dateRange.end}
                          onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                          className="w-[150px]"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDateRange({ start: "", end: "" })}
                        >
                          Clear
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="include-paid"
                          checked={includePaid}
                          onCheckedChange={(checked) => setIncludePaid(checked === true)}
                        />
                        <label htmlFor="include-paid" className="text-sm cursor-pointer">
                          Include Paid
                        </label>
                      </div>
                    </div>
                    <div>
                      {selectedPayouts.length > 0 && (
                        <Button onClick={() => setIsPayoutDialogOpen(true)}>
                          <Send className="h-4 w-4 mr-2" />
                          Process Selected ({selectedPayouts.length})
                        </Button>
                      )}
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredPendingPayouts.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No pending payouts</AlertTitle>
                      <AlertDescription>There are no pending payouts to process at this time.</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">
                              <Checkbox
                                checked={
                                  selectedPayouts.length === filteredPendingPayouts.length &&
                                  filteredPendingPayouts.length > 0
                                }
                                onCheckedChange={toggleSelectAll}
                                aria-label="Select all"
                              />
                            </TableHead>
                            <TableHead>Vendor</TableHead>
                            <TableHead>PayPal Email</TableHead>
                            <TableHead>Tax Info</TableHead>
                            <TableHead className="text-right">Amount (USD)</TableHead>
                            <TableHead>Products</TableHead>
                            <TableHead>Last Payout</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredPendingPayouts.map((payout) => (
                            <React.Fragment key={payout.vendor_name}>
                              <TableRow className={payout.amount < 0 ? "bg-red-50 dark:bg-red-950/20" : ""}>
                                <TableCell>
                                  <Checkbox
                                    checked={selectedPayouts.includes(payout.vendor_name)}
                                    onCheckedChange={() => togglePayoutSelection(payout.vendor_name)}
                                    aria-label={`Select ${payout.vendor_name}`}
                                    disabled={payout.amount < 0 || !payout.paypal_email}
                                  />
                                </TableCell>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="p-0 hover:bg-transparent"
                                      onClick={() => toggleVendorExpansion(payout.vendor_name)}
                                    >
                                      {expandedVendor === payout.vendor_name ? (
                                        <ChevronUp className="h-4 w-4 mr-2" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4 mr-2" />
                                      )}
                                    </Button>
                                    {payout.vendor_name}
                                    {payout.amount < 0 && (
                                      <Badge variant="destructive" className="text-xs">
                                        Owing {formatUSD(Math.abs(payout.amount))}
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {payout.paypal_email ? (
                                    <span className="text-sm">{payout.paypal_email}</span>
                                  ) : (
                                    <Badge variant="outline" className="text-red-500 border-red-200">
                                      Not set
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {payout.tax_id ? (
                                    <div className="text-xs">
                                      <div>{payout.tax_id}</div>
                                      <div className="text-muted-foreground">{payout.tax_country || "Unknown"}</div>
                                    </div>
                                  ) : (
                                    <Badge variant="outline" className="text-amber-500 border-amber-200">
                                      No tax info
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-medium">{formatUSD(convertPayoutAmount(payout.amount))}</TableCell>
                                <TableCell>{payout.product_count}</TableCell>
                                <TableCell>
                                  {payout.last_payout_date ? (
                                    formatDate(payout.last_payout_date)
                                  ) : (
                                    <span className="text-muted-foreground text-sm">Never</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => togglePayoutSelection(payout.vendor_name)}
                                    >
                                      {selectedPayouts.includes(payout.vendor_name) ? "Deselect" : "Select"}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => toggleVendorExpansion(payout.vendor_name)}
                                      title="View Details"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                              {expandedVendor === payout.vendor_name && (
                                <TableRow>
                                  <TableCell colSpan={8} className="p-0">
                                    <div className="bg-muted/50 p-4">
                                      <h4 className="font-medium mb-2">Line Items for {payout.vendor_name}</h4>
                                      {loadingLineItems === payout.vendor_name ? (
                                        <div className="flex justify-center py-4">
                                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        </div>
                                      ) : vendorLineItems[payout.vendor_name]?.length > 0 ? (
                                        <div className="space-y-6">
                                          <div className="text-sm text-muted-foreground mb-4">
                                            Showing {vendorLineItems[payout.vendor_name]?.length || 0} total line items
                                          </div>
                                          {Object.entries(
                                            // Group by month first
                                            vendorLineItems[payout.vendor_name].reduce(
                                              (acc, item) => {
                                                const date = new Date(item.created_at)
                                                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
                                                if (!acc[monthKey]) {
                                                  acc[monthKey] = []
                                                }
                                                acc[monthKey].push(item)
                                                return acc
                                              },
                                              {} as Record<string, typeof vendorLineItems[payout.vendor_name]>
                                            )
                                          )
                                            .sort(([a], [b]) => b.localeCompare(a)) // Sort months descending
                                            .map(([monthKey, monthItems]) => {
                                              const [year, month] = monthKey.split('-')
                                              const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
                                              const monthTotal = monthItems.reduce((sum, item) => sum + calculatePayoutAmount(item), 0)
                                              const monthPaidTotal = monthItems
                                                .filter(item => item.is_paid)
                                                .reduce((sum, item) => sum + calculatePayoutAmount(item), 0)
                                              const monthPendingTotal = monthTotal - monthPaidTotal

                                              // Group by order within month
                                              const ordersByMonth = monthItems.reduce(
                                                (acc, item) => {
                                                  const orderId = item.order_id
                                                  if (!acc[orderId]) {
                                                    acc[orderId] = []
                                                  }
                                                  acc[orderId].push(item)
                                                  return acc
                                                },
                                                {} as Record<string, typeof monthItems>
                                              )

                                              const hasUnpaidItems = monthItems.some(item => !item.is_paid)
                                              
                                              return (
                                                <div key={monthKey} className="border rounded-md bg-background">
                                                  <div className="p-4 border-b bg-muted/30">
                                                    <div className="flex justify-between items-center">
                                                      <h5 className="font-semibold">{monthName}</h5>
                                                      <div className="flex items-center gap-4">
                                                        <div className="text-sm space-x-4">
                                                          <span className="text-muted-foreground">
                                                            Total: <span className="font-medium text-foreground">{formatUSD(monthTotal)}</span>
                                                          </span>
                                                          <span className="text-green-600">
                                                            Paid: <span className="font-medium">{formatUSD(monthPaidTotal)}</span>
                                                          </span>
                                                          <span className="text-amber-600">
                                                            Pending: <span className="font-medium">{formatUSD(monthPendingTotal)}</span>
                                                          </span>
                                                        </div>
                                                        {hasUnpaidItems && (
                                                          <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={async () => {
                                                              if (!confirm(`Mark all unpaid items for ${monthName} as paid? This will mark ${monthItems.filter(item => !item.is_paid).length} items.`)) {
                                                                return
                                                              }
                                                              
                                                              try {
                                                                setIsProcessing(true)
                                                                const response = await fetch("/api/admin/payouts/mark-month-paid", {
                                                                  method: "POST",
                                                                  headers: {
                                                                    "Content-Type": "application/json",
                                                                  },
                                                                  body: JSON.stringify({
                                                                    vendorName: payout.vendor_name,
                                                                    year: parseInt(year),
                                                                    month: parseInt(month),
                                                                    createPayoutRecord: true,
                                                                  }),
                                                                })

                                                                if (!response.ok) {
                                                                  const error = await response.json()
                                                                  throw new Error(error.error || "Failed to mark month as paid")
                                                                }

                                                                toast({
                                                                  title: "Success",
                                                                  description: `Successfully marked all items for ${monthName} as paid`,
                                                                })

                                                                // Refresh data
                                                                fetchPendingPayouts()
                                                              } catch (error: any) {
                                                                toast({
                                                                  title: "Error",
                                                                  description: error.message || "Failed to mark month as paid",
                                                                  variant: "destructive",
                                                                })
                                                              } finally {
                                                                setIsProcessing(false)
                                                              }
                                                            }}
                                                            disabled={isProcessing}
                                                          >
                                                            {isProcessing ? (
                                                              <>
                                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                Processing...
                                                              </>
                                                            ) : (
                                                              <>
                                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                                Mark Month as Paid
                                                              </>
                                                            )}
                                                          </Button>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </div>
                                                  <Table>
                                                    <TableHeader>
                                                      <TableRow>
                                                        <TableHead>Order</TableHead>
                                                        <TableHead>Product</TableHead>
                                                        <TableHead>Date</TableHead>
                                                        <TableHead>Fulfillment</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead className="text-right">Price</TableHead>
                                                        <TableHead className="text-right">Payout</TableHead>
                                                        <TableHead className="w-[100px]">Actions</TableHead>
                                                      </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                      {Object.entries(ordersByMonth).map(([orderId, items]) => (
                                                        <React.Fragment key={orderId}>
                                                          {items.map((item, idx) => (
                                                            <TableRow key={item.line_item_id}>
                                                              {idx === 0 && (
                                                                <TableCell
                                                                  rowSpan={items.length}
                                                                  className="text-xs font-medium border-r"
                                                                >
                                                                  <a
                                                                    href={`/admin/orders/${orderId}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-1 hover:text-primary transition-colors"
                                                                  >
                                                                    {item.order_name || orderId}
                                                                    <ExternalLink className="h-3 w-3" />
                                                                  </a>
                                                                </TableCell>
                                                              )}
                                                      <TableCell>
                                                        <div className="text-sm font-medium">
                                                          {item.product_title || "Unknown Product"}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                          {item.product_id}
                                                        </div>
                                                      </TableCell>
                                                              <TableCell>{formatDate(item.created_at)}</TableCell>
                                                              <TableCell>
                                                                <Badge
                                                                  variant={
                                                                    item.fulfillment_status === "fulfilled"
                                                                      ? "default"
                                                                      : "outline"
                                                                  }
                                                                >
                                                                  {item.fulfillment_status || "Unknown"}
                                                                </Badge>
                                                              </TableCell>
                                                              <TableCell>
                                                                {item.is_paid ? (
                                                                  <Badge variant="default" className="bg-green-600">
                                                                    Paid
                                                                  </Badge>
                                                                ) : (
                                                                  <Badge variant="outline" className="text-amber-600">
                                                                    Pending
                                                                  </Badge>
                                                                )}
                                                              </TableCell>
                                                              <TableCell className="text-right">
                                                                {formatUSD(convertGBPToUSD(item.price))}
                                                              </TableCell>
                                                              <TableCell className="text-right">
                                                                <div className="font-medium">
                                                                  {formatUSD(calculatePayoutAmount(item))}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                  {item.is_percentage ? `${item.payout_amount}%` : "Fixed"}
                                                                </div>
                                                              </TableCell>
                                                              <TableCell>
                                                                {!item.is_paid && (
                                                                  <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={async () => {
                                                                      try {
                                                                        const response = await fetch("/api/admin/payouts/mark-paid", {
                                                                          method: "POST",
                                                                          headers: {
                                                                            "Content-Type": "application/json",
                                                                          },
                                                                          body: JSON.stringify({
                                                                            lineItemIds: [item.line_item_id],
                                                                            vendorName: payout.vendor_name,
                                                                            createPayoutRecord: false,
                                                                          }),
                                                                        })

                                                                        if (!response.ok) {
                                                                          throw new Error("Failed to mark as paid")
                                                                        }

                                                                        toast({
                                                                          title: "Success",
                                                                          description: "Line item marked as paid",
                                                                        })

                                                                        // Refresh data
                                                                        await fetchPayoutData()
                                                                        await fetchVendorLineItems(payout.vendor_name, true)
                                                                      } catch (err: any) {
                                                                        toast({
                                                                          variant: "destructive",
                                                                          title: "Error",
                                                                          description: err.message || "Failed to mark as paid",
                                                                        })
                                                                      }
                                                                    }}
                                                                  >
                                                                    Mark Paid
                                                                  </Button>
                                                                )}
                                                              </TableCell>
                                                            </TableRow>
                                                          ))}
                                                        </React.Fragment>
                                                      ))}
                                                    </TableBody>
                                                  </Table>
                                                </div>
                                              )
                                            })}
                                        </div>
                                      ) : (
                                        <Alert>
                                          <AlertCircle className="h-4 w-4" />
                                          <AlertTitle>No line items</AlertTitle>
                                          <AlertDescription>
                                            No pending line items found for this vendor.
                                          </AlertDescription>
                                        </Alert>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          ))}
                        </TableBody>
                      </Table>
                      
                      {/* Pagination Controls */}
                      {pagination.total > 0 && (
                        <div className="flex items-center justify-between px-4 py-4 border-t">
                          <div className="text-sm text-muted-foreground">
                            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} vendors
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchPayoutData(pagination.page - 1)}
                              disabled={!pagination.hasPrev || isLoading}
                            >
                              <ChevronLeft className="h-4 w-4 mr-1" />
                              Previous
                            </Button>
                            <div className="text-sm">
                              Page {pagination.page} of {pagination.totalPages}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchPayoutData(pagination.page + 1)}
                              disabled={!pagination.hasNext || isLoading}
                            >
                              Next
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Payout History</CardTitle>
                  <CardDescription>View all processed payouts</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex">
                    <Input
                      placeholder="Search vendors..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>

                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredPayoutHistory.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No payout history</AlertTitle>
                      <AlertDescription>No payout records match your search criteria.</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Reference</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Invoice</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredPayoutHistory.map((payout) => (
                            <TableRow key={payout.id}>
                              <TableCell>{formatDate(payout.payout_date || payout.created_at)}</TableCell>
                              <TableCell className="font-medium">{payout.vendor_name}</TableCell>
                              <TableCell>{formatUSD(convertPayoutAmount(payout.amount))}</TableCell>
                              <TableCell className="capitalize">{payout.payment_method}</TableCell>
                              <TableCell>
                                <span className="text-xs text-muted-foreground">{payout.reference || "-"}</span>
                              </TableCell>
                              <TableCell>{getStatusBadge(payout.status)}</TableCell>
                              <TableCell>
                                {payout.invoice_number ? (
                                  <Badge variant="outline" className="text-green-500 border-green-200">
                                    {payout.invoice_number}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-muted-foreground">
                                    None
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {payout.payment_method === "paypal" && payout.payout_batch_id && (payout.status === "processing" || payout.status === "pending") && (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => checkPayPalStatus(payout.payout_batch_id!, payout.id)}
                                      title="Check PayPal Status"
                                    >
                                      <RefreshCw className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                      const link = document.createElement("a")
                                      link.href = `/api/vendors/payouts/${payout.id}/invoice`
                                      link.download = `invoice-${payout.invoice_number || payout.id}.pdf`
                                      link.click()
                                    }}
                                    disabled={payout.status !== "completed"}
                                    title="Download Invoice"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Process Payouts Dialog */}
      <Dialog open={isPayoutDialogOpen} onOpenChange={setIsPayoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Process Vendor Payouts</DialogTitle>
            <DialogDescription>
              You are about to process payouts for {selectedPayouts.length} vendors.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Payment Method</h4>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="manual">Manual (Other)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="generate-invoices"
                checked={generateInvoices}
                onCheckedChange={(checked) => setGenerateInvoices(checked as boolean)}
              />
              <label
                htmlFor="generate-invoices"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Generate self-billed invoices
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Input
                placeholder="Add notes about this payout batch"
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                This will process payments for all selected vendors. Make sure all vendor payment details are correct
                before proceeding.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPayoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={processSelectedPayouts} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Process Payouts
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
