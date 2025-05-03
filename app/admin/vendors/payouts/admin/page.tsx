"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, RefreshCw, Clock, Download, Send, FileText, Calendar } from "lucide-react"
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
  const { toast } = useToast()

  // Initialize tables and fetch data
  useEffect(() => {
    const initializeAndFetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
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
  const fetchPayoutData = async () => {
    try {
      // Fetch pending payouts
      const pendingResponse = await fetch("/api/vendors/payouts/pending")
      if (!pendingResponse.ok) {
        throw new Error("Failed to fetch pending payouts")
      }
      const pendingData = await pendingResponse.json()
      setPendingPayouts(pendingData.payouts || [])

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

  // Filter pending payouts based on search query
  const filteredPendingPayouts = pendingPayouts.filter((payout) =>
    payout.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Products</TableHead>
                            <TableHead>Last Payout</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredPendingPayouts.map((payout) => (
                            <TableRow key={payout.vendor_name}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedPayouts.includes(payout.vendor_name)}
                                  onCheckedChange={() => togglePayoutSelection(payout.vendor_name)}
                                  aria-label={`Select ${payout.vendor_name}`}
                                />
                              </TableCell>
                              <TableCell className="font-medium">{payout.vendor_name}</TableCell>
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
                              <TableCell className="text-right font-medium">£{payout.amount.toFixed(2)}</TableCell>
                              <TableCell>{payout.product_count}</TableCell>
                              <TableCell>
                                {payout.last_payout_date ? (
                                  formatDate(payout.last_payout_date)
                                ) : (
                                  <span className="text-muted-foreground text-sm">Never</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => togglePayoutSelection(payout.vendor_name)}
                                >
                                  {selectedPayouts.includes(payout.vendor_name) ? "Deselect" : "Select"}
                                </Button>
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
                              <TableCell>£{payout.amount.toFixed(2)}</TableCell>
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
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => generateInvoice(payout.id)}
                                    disabled={payout.status !== "completed"}
                                    title="Generate Invoice"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="icon" title="Download Details">
                                    <Download className="h-4 w-4" />
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
