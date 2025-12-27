"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  CheckSquare,
  Square,
  DollarSign,
  Calendar,
  Package,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { convertGBPToUSD, formatUSD } from "@/lib/utils"

interface LineItem {
  line_item_id: string
  order_id: string
  order_name: string | null
  product_id: string
  product_title: string | null
  price: number
  created_at: string
  payout_amount: number
  is_percentage: boolean
  calculated_payout?: number
  fulfillment_status: string | null
  is_paid: boolean
}

interface Vendor {
  vendor_name: string
  amount: number
  product_count: number
}

export default function ManualPayoutPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [selectedVendor, setSelectedVendor] = useState<string>("")
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [filteredLineItems, setFilteredLineItems] = useState<LineItem[]>([])
  const [selectedLineItems, setSelectedLineItems] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState({ start: "", end: "" })
  const [orderFilter, setOrderFilter] = useState("all")
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false)
  const [isMarkingPaid, setIsMarkingPaid] = useState(false)
  const [payoutReference, setPayoutReference] = useState("")
  const [createPayoutRecord, setCreatePayoutRecord] = useState(true)
  const { toast } = useToast()

  // Fetch vendors with pending payouts
  useEffect(() => {
    fetchVendors()
  }, [])

  // Fetch line items when vendor is selected
  useEffect(() => {
    if (selectedVendor) {
      fetchLineItems(selectedVendor)
    } else {
      setLineItems([])
      setFilteredLineItems([])
    }
  }, [selectedVendor])

  // Apply filters
  useEffect(() => {
    let filtered = [...lineItems]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.order_name?.toLowerCase().includes(query) ||
          item.product_title?.toLowerCase().includes(query) ||
          item.order_id.toLowerCase().includes(query) ||
          item.line_item_id.toLowerCase().includes(query)
      )
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter((item) => item.created_at >= dateRange.start)
    }
    if (dateRange.end) {
      filtered = filtered.filter((item) => item.created_at <= dateRange.end + "T23:59:59")
    }

    // Order filter
    if (orderFilter && orderFilter !== "all") {
      filtered = filtered.filter((item) => item.order_id === orderFilter || item.order_name === orderFilter)
    }

    setFilteredLineItems(filtered)
  }, [lineItems, searchQuery, dateRange, orderFilter])

  const fetchVendors = async () => {
    try {
      const response = await fetch("/api/vendors/payouts/pending")
      if (!response.ok) {
        throw new Error("Failed to fetch vendors")
      }
      const data = await response.json()
      setVendors(data.payouts || [])
    } catch (err: any) {
      console.error("Error fetching vendors:", err)
      setError(err.message || "Failed to load vendors")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchLineItems = async (vendorName: string) => {
    setIsRefreshing(true)
    setError(null)
    try {
      const response = await fetch("/api/vendors/payouts/pending-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ vendorName }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch line items")
      }

      const data = await response.json()
      setLineItems(data.lineItems || [])
    } catch (err: any) {
      console.error("Error fetching line items:", err)
      setError(err.message || "Failed to load line items")
    } finally {
      setIsRefreshing(false)
    }
  }

  const toggleLineItemSelection = (lineItemId: string) => {
    const newSelection = new Set(selectedLineItems)
    if (newSelection.has(lineItemId)) {
      newSelection.delete(lineItemId)
    } else {
      newSelection.add(lineItemId)
    }
    setSelectedLineItems(newSelection)
  }

  const toggleSelectAll = () => {
    if (selectedLineItems.size === filteredLineItems.length) {
      setSelectedLineItems(new Set())
    } else {
      setSelectedLineItems(new Set(filteredLineItems.map((item) => item.line_item_id)))
    }
  }

  const calculateSelectedTotal = () => {
    return Array.from(selectedLineItems).reduce((total, lineItemId) => {
      const item = lineItems.find((li) => li.line_item_id === lineItemId)
      // Use calculated_payout if available (which contains the actual payout amount), otherwise fallback to calculation
      const payoutAmount = item?.calculated_payout ?? (item?.is_percentage
        ? (convertGBPToUSD(item.price) * item.payout_amount) / 100
        : convertGBPToUSD(item.payout_amount))
      return total + payoutAmount
    }, 0)
  }

  const handleMarkPaid = async () => {
    if (selectedLineItems.size === 0) {
      toast({
        variant: "destructive",
        title: "No items selected",
        description: "Please select at least one line item to mark as paid",
      })
      return
    }

    setIsMarkingPaid(true)
    try {
      const response = await fetch("/api/admin/payouts/mark-paid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lineItemIds: Array.from(selectedLineItems),
          vendorName: selectedVendor,
          payoutReference: payoutReference || undefined,
          createPayoutRecord,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to mark items as paid")
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: data.message || `Successfully marked ${selectedLineItems.size} item(s) as paid`,
      })

      // Refresh data
      setSelectedLineItems(new Set())
      setShowMarkPaidDialog(false)
      setPayoutReference("")
      await fetchLineItems(selectedVendor)
      await fetchVendors()
    } catch (err: any) {
      console.error("Error marking items as paid:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to mark items as paid",
      })
    } finally {
      setIsMarkingPaid(false)
    }
  }

  const getUniqueOrders = () => {
    const orders = new Set<string>()
    lineItems.forEach((item) => {
      if (item.order_id) orders.add(item.order_id)
      if (item.order_name) orders.add(item.order_name)
    })
    return Array.from(orders)
  }

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manual Payout Management</h1>
            <p className="text-muted-foreground mt-2">
              Manually mark fulfilled line items as paid. Only fulfilled items are shown.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchVendors} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
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

        <Card>
          <CardHeader>
            <CardTitle>Select Vendor</CardTitle>
            <CardDescription>Choose a vendor to view their pending payouts</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedVendor} onValueChange={setSelectedVendor}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Select a vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.vendor_name} value={vendor.vendor_name}>
                    {vendor.vendor_name} - {formatUSD(convertGBPToUSD(vendor.amount))} ({vendor.product_count} items)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedVendor && (
          <Card>
            <CardHeader>
              <CardTitle>Fulfilled Line Items</CardTitle>
              <CardDescription>
                Select line items to mark as paid. Only fulfilled items are eligible for payout.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by order, product, or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Select value={orderFilter} onValueChange={setOrderFilter}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Filter by order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Orders</SelectItem>
                      {getUniqueOrders().map((order) => (
                        <SelectItem key={order} value={order}>
                          {order}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    placeholder="Start date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-full sm:w-[150px]"
                  />
                  <Input
                    type="date"
                    placeholder="End date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-full sm:w-[150px]"
                  />
                </div>

                {/* Selection Summary */}
                {selectedLineItems.size > 0 && (
                  <Alert>
                    <Package className="h-4 w-4" />
                    <AlertTitle>Selection Summary</AlertTitle>
                    <AlertDescription>
                      {selectedLineItems.size} item(s) selected - Total payout: {formatUSD(convertGBPToUSD(calculateSelectedTotal()))}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowMarkPaidDialog(true)}
                    disabled={selectedLineItems.size === 0}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark Selected as Paid ({selectedLineItems.size})
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedLineItems(new Set())}>
                    Clear Selection
                  </Button>
                </div>

                {/* Table */}
                {isRefreshing ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredLineItems.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No line items found</AlertTitle>
                    <AlertDescription>
                      {selectedVendor
                        ? "No fulfilled line items found for this vendor"
                        : "Please select a vendor to view line items"}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <Checkbox
                              checked={
                                selectedLineItems.size === filteredLineItems.length &&
                                filteredLineItems.length > 0
                              }
                              onCheckedChange={toggleSelectAll}
                            />
                          </TableHead>
                          <TableHead>Order</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Payout</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLineItems.map((item) => (
                          <TableRow key={item.line_item_id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedLineItems.has(item.line_item_id)}
                                onCheckedChange={() => toggleLineItemSelection(item.line_item_id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{item.order_name || item.order_id}</div>
                              <div className="text-xs text-muted-foreground">{item.order_id}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{item.product_title || "Unknown Product"}</div>
                              <div className="text-xs text-muted-foreground">{item.product_id}</div>
                            </TableCell>
                            <TableCell>
                              {format(new Date(item.created_at), "MMM dd, yyyy")}
                            </TableCell>
                            <TableCell className="text-right">{formatUSD(convertGBPToUSD(item.price))}</TableCell>
                            <TableCell className="text-right">
                              <div className="font-medium">
                                {formatUSD(item.calculated_payout ?? (item.is_percentage
                                  ? (convertGBPToUSD(item.price) * item.payout_amount) / 100
                                  : convertGBPToUSD(item.payout_amount)))}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                25% of item price
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={item.fulfillment_status === "fulfilled" ? "default" : "outline"}
                              >
                                {item.fulfillment_status || "Unknown"}
                              </Badge>
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
        )}

        {/* Mark Paid Dialog */}
        <Dialog open={showMarkPaidDialog} onOpenChange={setShowMarkPaidDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark Items as Paid</DialogTitle>
              <DialogDescription>
                You are about to mark {selectedLineItems.size} line item(s) as paid. This action will create an
                audit trail.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Payout Reference (Optional)</label>
                <Input
                  placeholder="e.g., PAY-2024-001"
                  value={payoutReference}
                  onChange={(e) => setPayoutReference(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="create-record"
                  checked={createPayoutRecord}
                  onCheckedChange={(checked) => setCreatePayoutRecord(checked as boolean)}
                />
                <label htmlFor="create-record" className="text-sm font-medium">
                  Create payout record
                </label>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Total Amount</AlertTitle>
                <AlertDescription>{formatUSD(convertGBPToUSD(calculateSelectedTotal()))}</AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMarkPaidDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleMarkPaid} disabled={isMarkingPaid}>
                {isMarkingPaid ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark as Paid
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

