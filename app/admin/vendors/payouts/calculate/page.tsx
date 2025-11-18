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
  Calculator,
  Download,
  ChevronDown,
  ChevronUp,
  DollarSign,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import type { VendorPayoutSummary, OrderPayout } from "@/lib/payout-calculator"

export default function CalculatePayoutPage() {
  const [vendors, setVendors] = useState<Array<{ vendor_name: string; amount: number }>>([])
  const [selectedVendor, setSelectedVendor] = useState<string>("")
  const [payoutData, setPayoutData] = useState<VendorPayoutSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [includePaid, setIncludePaid] = useState(false)

  // Fetch vendors
  useEffect(() => {
    fetchVendors()
  }, [])

  // Calculate payout when vendor changes
  useEffect(() => {
    if (selectedVendor) {
      calculatePayout()
    } else {
      setPayoutData(null)
    }
  }, [selectedVendor, includePaid])

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
    }
  }

  const calculatePayout = async () => {
    if (!selectedVendor) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/admin/payouts/calculate?vendorName=${encodeURIComponent(selectedVendor)}&includePaid=${includePaid}&fulfillmentStatus=fulfilled`
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to calculate payout")
      }

      const data = await response.json()
      if (data.type === "vendor" && data.payout) {
        setPayoutData(data.payout)
      }
    } catch (err: any) {
      console.error("Error calculating payout:", err)
      setError(err.message || "Failed to calculate payout")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders)
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId)
    } else {
      newExpanded.add(orderId)
    }
    setExpandedOrders(newExpanded)
  }

  const exportReport = () => {
    if (!payoutData) return

    const report = {
      vendor: payoutData.vendor_name,
      calculatedAt: new Date().toISOString(),
      summary: {
        totalOrders: payoutData.total_orders,
        totalLineItems: payoutData.total_line_items,
        fulfilledLineItems: payoutData.fulfilled_line_items,
        paidLineItems: payoutData.paid_line_items,
        pendingLineItems: payoutData.pending_line_items,
        totalRevenue: payoutData.total_revenue,
        totalPayoutAmount: payoutData.total_payout_amount,
      },
      orders: payoutData.orders.map((order) => ({
        orderId: order.order_id,
        orderName: order.order_name,
        orderDate: order.order_date,
        orderTotal: order.order_total,
        payoutAmount: order.payout_amount,
        lineItems: order.line_items,
      })),
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `payout-report-${payoutData.vendor_name}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payout Calculator</h1>
            <p className="text-muted-foreground mt-2">
              Calculate detailed payout breakdown by order and line item for vendors
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchVendors}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {payoutData && (
              <Button variant="outline" onClick={exportReport}>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            )}
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
            <CardDescription>Choose a vendor to calculate their payout breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                <SelectTrigger className="w-full sm:w-[400px]">
                  <SelectValue placeholder="Select a vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.vendor_name} value={vendor.vendor_name}>
                      {vendor.vendor_name} - £{vendor.amount.toFixed(2)} pending
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="include-paid"
                  checked={includePaid}
                  onChange={(e) => setIncludePaid(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="include-paid" className="text-sm font-medium">
                  Include paid items
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {payoutData && !isLoading && (
          <>
            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>Payout Summary</CardTitle>
                <CardDescription>Overview of payout calculation for {payoutData.vendor_name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Total Orders</div>
                    <div className="text-2xl font-bold">{payoutData.total_orders}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Fulfilled Items</div>
                    <div className="text-2xl font-bold">{payoutData.fulfilled_line_items}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Pending Items</div>
                    <div className="text-2xl font-bold">{payoutData.pending_line_items}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Payout</div>
                    <div className="text-2xl font-bold text-green-600">
                      £{payoutData.total_payout_amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Orders Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Orders Breakdown</CardTitle>
                <CardDescription>
                  Detailed breakdown by order. Click to expand and view line items.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payoutData.orders.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No orders found</AlertTitle>
                      <AlertDescription>
                        No eligible orders found for this vendor with the current filters.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    payoutData.orders.map((order) => (
                      <div key={order.order_id} className="border rounded-lg">
                        <div
                          className="p-4 cursor-pointer hover:bg-muted/50 flex items-center justify-between"
                          onClick={() => toggleOrderExpansion(order.order_id)}
                        >
                          <div className="flex-1">
                            <div className="font-medium">
                              {order.order_name || order.order_id}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(order.order_date), "MMM dd, yyyy")} • {order.pending_line_items}{" "}
                              pending items • {order.paid_line_items} paid items
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">Order Total</div>
                              <div className="font-medium">£{order.order_total.toFixed(2)}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">Payout</div>
                              <div className="font-bold text-green-600">£{order.payout_amount.toFixed(2)}</div>
                            </div>
                            {expandedOrders.has(order.order_id) ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>

                        {expandedOrders.has(order.order_id) && (
                          <div className="border-t p-4">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Product</TableHead>
                                  <TableHead>Price</TableHead>
                                  <TableHead>Payout %</TableHead>
                                  <TableHead className="text-right">Payout Amount</TableHead>
                                  <TableHead>Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {order.line_items.map((item) => (
                                  <TableRow key={item.line_item_id}>
                                    <TableCell>
                                      <div className="font-medium">{item.product_title || "Unknown Product"}</div>
                                      <div className="text-xs text-muted-foreground">{item.product_id}</div>
                                    </TableCell>
                                    <TableCell>£{item.price.toFixed(2)}</TableCell>
                                    <TableCell>
                                      {item.is_percentage
                                        ? `${item.payout_percentage}%`
                                        : "Fixed Amount"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="font-medium">£{item.payout_amount.toFixed(2)}</div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={item.is_paid ? "default" : "outline"}>
                                        {item.is_paid ? "Paid" : "Pending"}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

