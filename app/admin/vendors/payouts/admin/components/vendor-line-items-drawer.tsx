"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Loader2, ExternalLink, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { formatUSD } from "@/lib/utils"
import { convertGBPToUSD } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import type { PendingLineItem } from "../types"

interface VendorLineItemsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendorName: string
  dateRange?: { start: string; end: string }
  includePaid?: boolean
  onItemMarkedPaid?: () => void
}

export function VendorLineItemsDrawer({
  open,
  onOpenChange,
  vendorName,
  dateRange = { start: "", end: "" },
  includePaid = false,
  onItemMarkedPaid,
}: VendorLineItemsDrawerProps) {
  const [lineItems, setLineItems] = useState<PendingLineItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open && vendorName && vendorName.trim() !== "") {
      fetchLineItems()
    } else if (!open) {
      // Clear line items when drawer closes
      setLineItems([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, vendorName, dateRange.start, dateRange.end, includePaid])

  const fetchLineItems = async () => {
    if (!vendorName || vendorName.trim() === "") {
      return
    }

    setIsLoading(true)
    
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
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `Failed to fetch line items: ${response.status}`)
      }

      const data = await response.json()
      setLineItems(data.lineItems || [])
    } catch (err: any) {
      console.error("Error fetching line items:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to fetch line items",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const calculatePayoutAmount = (item: PendingLineItem) => {
    // Use calculated_payout from API if available, otherwise calculate manually
    if (item.calculated_payout !== undefined && item.calculated_payout !== null) {
      return item.calculated_payout // Already in USD from API
    }
    const priceUSD = convertGBPToUSD(item.price)
    if (item.is_percentage) {
      return (priceUSD * item.payout_amount) / 100
    }
    return convertGBPToUSD(item.payout_amount)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy")
    } catch (e) {
      return "Invalid date"
    }
  }

  const handleMarkPaid = async (lineItemId: string) => {
    console.log("handleMarkPaid called with lineItemId:", lineItemId, "vendorName:", vendorName)
    try {
      setIsProcessing(true)
      const requestBody = {
        lineItemIds: [lineItemId],
        vendorName,
        createPayoutRecord: false,
      }
      console.log("Sending request:", requestBody)

      const response = await fetch("/api/admin/payouts/mark-paid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      console.log("Response status:", response.status)
      const responseData = await response.json()
      console.log("Response data:", responseData)

      if (!response.ok) {
        throw new Error(responseData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      toast({
        title: "Success",
        description: "Line item marked as paid",
      })

      // Refresh line items
      await fetchLineItems()

      // Notify parent to refresh data
      onItemMarkedPaid?.()
    } catch (err: any) {
      console.error("Error in handleMarkPaid:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to mark as paid",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Group by order
  const groupedByOrder = lineItems.reduce((acc, item) => {
    const orderId = item.order_id
    if (!acc[orderId]) {
      acc[orderId] = []
    }
    acc[orderId].push(item)
    return acc
  }, {} as Record<string, PendingLineItem[]>)

  const totalAmount = lineItems.reduce((sum, item) => sum + calculatePayoutAmount(item), 0)
  const paidAmount = lineItems
    .filter((item) => item.is_paid)
    .reduce((sum, item) => sum + calculatePayoutAmount(item), 0)
  const pendingAmount = totalAmount - paidAmount

  if (!vendorName || vendorName.trim() === "") {
    return null
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={true}>
      <SheetContent className="sm:max-w-4xl overflow-y-auto" aria-describedby="line-items-description">
        <SheetHeader>
          <SheetTitle>Line Items - {vendorName}</SheetTitle>
          <SheetDescription id="line-items-description">
            View and manage line items for this vendor's payout. Line items are grouped by order.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : lineItems.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-4">No line items found for this vendor.</p>
            <p className="text-sm text-muted-foreground">
              {includePaid
                ? "Try adjusting the date range or check if items have been fulfilled."
                : "Only fulfilled items are shown. Enable 'Include Paid Items' to see all items."}
            </p>
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg border" role="region" aria-label="Line items summary">
              <div>
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="text-lg font-semibold">{formatUSD(totalAmount)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Paid</div>
                <div className="text-lg font-semibold text-green-600">{formatUSD(paidAmount)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Pending</div>
                <div className="text-lg font-semibold text-amber-600">{formatUSD(pendingAmount)}</div>
              </div>
            </div>

            {/* Line Items by Order */}
            <div className="space-y-4" role="region" aria-label="Line items by order">
              {Object.entries(groupedByOrder).map(([orderId, items]) => {
                const orderTotal = items.reduce((sum, item) => sum + calculatePayoutAmount(item), 0)
                return (
                  <div key={orderId} className="border rounded-lg overflow-hidden">
                    <div className="p-3 bg-muted/50 border-b">
                      <div className="flex items-center justify-between">
                        <a
                          href={`/admin/orders/${orderId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 font-medium hover:text-primary transition-colors"
                        >
                          {items[0]?.order_name || orderId}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <div className="text-sm font-medium">{formatUSD(orderTotal)}</div>
                      </div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
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
                        {items.map((item) => (
                          <TableRow key={item.line_item_id}>
                            <TableCell>
                              <div className="text-sm font-medium">
                                {item.product_title || "Unknown Product"}
                              </div>
                              <div className="text-xs text-muted-foreground">{item.product_id}</div>
                            </TableCell>
                            <TableCell>{formatDate(item.created_at)}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  item.fulfillment_status === "fulfilled" ? "default" : "outline"
                                }
                              >
                                {item.fulfillment_status || "Unknown"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {item.is_paid ? (
                                <div className="flex items-center gap-2">
                                  <Badge variant="default" className="bg-green-600">
                                    Paid
                                  </Badge>
                                  {item.payout_reference && (
                                    <span className="text-xs text-muted-foreground">
                                      {item.payout_reference}
                                    </span>
                                  )}
                                </div>
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
                              <div className="font-medium">{formatUSD(calculatePayoutAmount(item))}</div>
                              <div className="text-xs text-muted-foreground">
                                {item.is_percentage ? `${item.payout_amount}%` : "Fixed"}
                              </div>
                            </TableCell>
                            <TableCell>
                              {!item.is_paid && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMarkPaid(item.line_item_id)}
                                  disabled={isProcessing}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Mark Paid
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

