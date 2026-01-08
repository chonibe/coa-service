"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, RefreshCw, FileText } from "lucide-react"
import { format } from "date-fns"
import { formatUSD } from "@/lib/utils"
import type { PayoutHistory } from "../types"
import { PayoutFiltersComponent } from "./payout-filters"
import type { PayoutFilters } from "../hooks/use-payout-filters"

interface PayoutHistoryTabProps {
  history: PayoutHistory[]
  isLoading: boolean
  filters: PayoutFilters
  onFilterChange: (key: keyof PayoutFilters, value: any) => void
  onClearFilters: () => void
  onCheckPayPalStatus: (batchId: string, payoutId: number) => Promise<void>
}

export function PayoutHistoryTab({
  history,
  isLoading,
  filters,
  onFilterChange,
  onClearFilters,
  onCheckPayPalStatus,
}: PayoutHistoryTabProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy")
    } catch (e) {
      return "Invalid date"
    }
  }

  const convertPayoutAmount = (amount: number): number => {
    // Database amounts are already in USD
    return amount
  }

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

  const getPaymentMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      paypal: "bg-blue-500",
      stripe: "bg-purple-500",
      bank_transfer: "bg-gray-500",
      manual: "bg-orange-500",
    }
    return (
      <Badge className={colors[method] || "bg-gray-500"} variant="default">
        {method.replace("_", " ").toUpperCase()}
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payout History</CardTitle>
        <CardDescription>View all processed payouts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <PayoutFiltersComponent
            filters={filters}
            onFilterChange={onFilterChange}
            onClearFilters={onClearFilters}
            showPaymentMethod={true}
            showDateRange={true}
            showAmountRange={true}
          />

          {isLoading ? (
            <div className="space-y-4">
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
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                        </TableCell>
                        <TableCell>
                          <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        </TableCell>
                        <TableCell>
                          <div className="h-6 w-20 bg-muted animate-pulse rounded" />
                        </TableCell>
                        <TableCell>
                          <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                        </TableCell>
                        <TableCell>
                          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <Alert>
                <AlertTitle>No payout history</AlertTitle>
                <AlertDescription>
                  {filters.searchQuery || filters.statusFilter !== "all" || filters.paymentMethodFilter !== "all"
                    ? "No payout records match your search criteria. Try adjusting your filters."
                    : "No payout history available yet."}
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell>{formatDate(payout.payout_date || payout.created_at)}</TableCell>
                      <TableCell className="font-medium">{payout.vendor_name}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatUSD(convertPayoutAmount(payout.amount))}
                      </TableCell>
                      <TableCell>{getPaymentMethodBadge(payout.payment_method)}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {payout.reference || "-"}
                        </code>
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
                          {payout.payment_method === "paypal" &&
                            payout.payout_batch_id &&
                            (payout.status === "processing" || payout.status === "pending") && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => onCheckPayPalStatus(payout.payout_batch_id!, payout.id)}
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
  )
}

