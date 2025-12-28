"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Loader2, ExternalLink, CheckCircle, Search, Download, Info } from "lucide-react"
import { format } from "date-fns"
import { formatUSD } from "@/lib/utils"
import { convertGBPToUSD } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
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
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
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

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), "dd MMM yyyy")
    } catch (e) {
      return "Invalid date"
    }
  }

  const formatDateForExport = (dateString: string): string => {
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

  // Filter line items by search query
  const filteredLineItems = useMemo(() => {
    if (!searchQuery.trim()) return lineItems
    const query = searchQuery.toLowerCase()
    return lineItems.filter(
      (item) =>
        item.product_title?.toLowerCase().includes(query) ||
        item.product_id.toLowerCase().includes(query) ||
        item.order_id.toLowerCase().includes(query) ||
        item.order_name?.toLowerCase().includes(query)
    )
  }, [lineItems, searchQuery])

  // Group by order
  const groupedByOrder = useMemo(() => {
    return filteredLineItems.reduce((acc, item) => {
      const orderId = item.order_id
      if (!acc[orderId]) {
        acc[orderId] = []
      }
      acc[orderId].push(item)
      return acc
    }, {} as Record<string, PendingLineItem[]>)
  }, [filteredLineItems])

  const totalAmount = filteredLineItems.reduce((sum, item) => sum + calculatePayoutAmount(item), 0)
  const paidAmount = filteredLineItems
    .filter((item) => item.is_paid)
    .reduce((sum, item) => sum + calculatePayoutAmount(item), 0)
  const pendingAmount = totalAmount - paidAmount

  // Get selectable items (fulfilled and not paid)
  const selectableItems = filteredLineItems.filter(
    (item) => !item.is_paid && item.fulfillment_status === "fulfilled"
  )

  const handleToggleSelect = (itemId: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedItems.size === selectableItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(selectableItems.map((item) => item.line_item_id)))
    }
  }

  const handleBulkMarkPaid = async () => {
    if (selectedItems.size === 0) return

    try {
      setIsProcessing(true)
      const response = await fetch("/api/admin/payouts/mark-paid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lineItemIds: Array.from(selectedItems),
          vendorName,
          createPayoutRecord: false,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to mark items as paid")
      }

      toast({
        title: "Success",
        description: `${selectedItems.size} item${selectedItems.size !== 1 ? "s" : ""} marked as paid`,
      })

      setSelectedItems(new Set())
      await fetchLineItems()
      onItemMarkedPaid?.()
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to mark items as paid",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExport = () => {
    const csv = [
      ["Order ID", "Order Name", "Product ID", "Product Title", "Date", "Price", "Payout Amount", "Status", "Fulfillment Status"].join(","),
      ...filteredLineItems.map((item) =>
        [
          item.order_id,
          item.order_name || "",
          item.product_id,
          item.product_title || "",
          formatDateForExport(item.created_at),
          convertGBPToUSD(item.price),
          calculatePayoutAmount(item),
          item.is_paid ? "Paid" : "Pending",
          item.fulfillment_status || "Unfulfilled",
        ].join(",")
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${vendorName}-line-items-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Export Complete",
      description: "Line items exported to CSV",
    })
  }

  if (!vendorName || vendorName.trim() === "") {
    return null
  }

  let content: React.ReactNode = null

  if (isLoading) {
    content = (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  } else if (lineItems.length === 0) {
    content = (
      <div className="py-12 text-center">
        <p className="text-muted-foreground mb-2 font-medium">No line items found for this vendor.</p>
        <p className="text-sm text-muted-foreground mb-4">
          {includePaid
            ? "Try adjusting the date range or check if items have been fulfilled."
            : "Only fulfilled items are shown. Enable 'Include Paid Items' to see all items."}
        </p>
        <p className="text-xs text-muted-foreground">
          Make sure the vendor has fulfilled orders within the selected date range.
        </p>
      </div>
    )
  } else {
    content = (
      <>
          <div className="space-y-4 mt-6">
            {/* Sticky Summary */}
            <div className="sticky top-0 z-10 bg-background pb-2 border-b">
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

              {/* Search and Actions */}
              <div className="flex items-center gap-2 mt-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products, orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                {selectedItems.size > 0 && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleBulkMarkPaid}
                    disabled={isProcessing}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Mark {selectedItems.size} Paid
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </div>

              {/* Selection Controls */}
              {selectableItems.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <Checkbox
                    checked={selectedItems.size === selectableItems.length && selectableItems.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">
                    {selectedItems.size > 0
                      ? `${selectedItems.size} of ${selectableItems.length} selected`
                      : `Select all ${selectableItems.length} payable items`}
                  </span>
                </div>
              )}
            </div>

            {/* Line Items by Order */}
            {filteredLineItems.length === 0 && searchQuery ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No items match your search query.</p>
                <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")} className="mt-2">
                  Clear Search
                </Button>
              </div>
            ) : (
              <div className="space-y-6" role="region" aria-label="Line items by order">
                {Object.entries(groupedByOrder).map(([orderId, items]) => {
                  const orderTotal = items.reduce((sum, item) => sum + calculatePayoutAmount(item), 0)
                  return (
                    <div key={orderId} className="border rounded-lg overflow-hidden shadow-sm">
                      <div className="p-4 bg-gradient-to-r from-muted/50 to-muted/30 border-b">
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
                          <div className="text-sm font-semibold">{formatUSD(orderTotal)}</div>
                        </div>
                      </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]"></TableHead>
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
                        {items.map((item) => {
                          const isSelectable = !item.is_paid && item.fulfillment_status === "fulfilled"
                          const isSelected = selectedItems.has(item.line_item_id)
                          return (
                            <TableRow
                              key={item.line_item_id}
                              className={cn(isSelected && "bg-blue-50 dark:bg-blue-950/20")}
                            >
                              <TableCell className="w-[50px]">
                                {isSelectable && (
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => handleToggleSelect(item.line_item_id)}
                                  />
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm font-medium">
                                  {item.product_title || "Unknown Product"}
                                </div>
                                <div className="text-xs text-muted-foreground">{item.product_id}</div>
                              </TableCell>
                              <TableCell>{formatDate(item.created_at)}</TableCell>
                              <TableCell>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge
                                        variant={
                                          item.fulfillment_status === "fulfilled" ? "default" : "outline"
                                        }
                                        className={cn(
                                          item.fulfillment_status !== "fulfilled" &&
                                            "text-amber-600 border-amber-200 bg-amber-50 cursor-help"
                                        )}
                                      >
                                        {item.fulfillment_status || "Unfulfilled"}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-sm">
                                        {item.fulfillment_status === "fulfilled"
                                          ? "Order has been fulfilled and is ready for payout"
                                          : "Order must be fulfilled before payout can be processed"}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell>
                                {item.is_paid ? (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex items-center gap-2 cursor-help">
                                          <Badge variant="default" className="bg-green-600">
                                            Paid
                                          </Badge>
                                          {item.payout_reference && (
                                            <span className="text-xs text-muted-foreground">
                                              {item.payout_reference}
                                            </span>
                                          )}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-sm">
                                          This item has been marked as paid
                                          {item.payout_reference && ` (Reference: ${item.payout_reference})`}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ) : item.fulfillment_status === "fulfilled" ? (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge variant="outline" className="text-amber-600 cursor-help">
                                          Pending Payout
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-sm">Ready to be marked as paid</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ) : (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge
                                          variant="outline"
                                          className="text-muted-foreground bg-muted cursor-help"
                                        >
                                          Not Ready
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-sm">
                                          Item must be fulfilled before it can be marked as paid
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
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
                                    onClick={() => {
                                      handleMarkPaid(item.line_item_id)
                                    }}
                                    disabled={isProcessing || item.fulfillment_status !== "fulfilled"}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Mark Paid
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )
              })}
            </div>
          </div>
      </>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={true}>
      <SheetContent className="sm:max-w-4xl overflow-y-auto z-[100]" aria-describedby="line-items-description">
        <SheetHeader>
          <SheetTitle>Line Items - {vendorName}</SheetTitle>
          <SheetDescription id="line-items-description">
            View and manage line items for this vendor's payout. Line items are grouped by order.
          </SheetDescription>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  )
}

