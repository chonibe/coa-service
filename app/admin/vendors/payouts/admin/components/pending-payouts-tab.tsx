"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, Send, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { PendingPayout, PayoutPagination } from "../types"
import { VendorPayoutRow } from "./vendor-payout-row"
import { PayoutFiltersComponent } from "./payout-filters"
import type { PayoutFilters } from "../hooks/use-payout-filters"
import { usePayoutSelection } from "../hooks/use-payout-selection"

interface PendingPayoutsTabProps {
  pendingPayouts: PendingPayout[]
  isLoading: boolean
  pagination: PayoutPagination
  onPageChange: (page: number) => void
  filters: PayoutFilters
  onFilterChange: (key: keyof PayoutFilters, value: any) => void
  onClearFilters: () => void
  onProcessPayouts: (selectedPayouts: PendingPayout[]) => void
  onViewDetails: (vendorName: string) => void
  selectedPayouts?: string[]
  onSelectionChange?: (selected: string[]) => void
}

export function PendingPayoutsTab({
  pendingPayouts,
  isLoading,
  pagination,
  onPageChange,
  filters,
  onFilterChange,
  onClearFilters,
  onProcessPayouts,
  onViewDetails,
  selectedPayouts: externalSelectedPayouts,
  onSelectionChange,
}: PendingPayoutsTabProps) {
  const { toast } = useToast()

  const filteredPayouts = pendingPayouts.filter((payout) => {
    const matchesSearch = payout.vendor_name
      .toLowerCase()
      .includes(filters.searchQuery.toLowerCase())
    return matchesSearch
  })

  const internalSelection = usePayoutSelection(filteredPayouts)
  const selectedPayouts = externalSelectedPayouts || internalSelection.selectedPayouts
  const togglePayoutSelection = onSelectionChange
    ? (vendorName: string) => {
        const newSelection = selectedPayouts.includes(vendorName)
          ? selectedPayouts.filter((name) => name !== vendorName)
          : [...selectedPayouts, vendorName]
        onSelectionChange(newSelection)
      }
    : internalSelection.togglePayoutSelection
  const toggleSelectAll = onSelectionChange
    ? () => {
        if (selectedPayouts.length === filteredPayouts.length) {
          onSelectionChange([])
        } else {
          onSelectionChange(filteredPayouts.map((p) => p.vendor_name))
        }
      }
    : internalSelection.toggleSelectAll
  const getSelectedPayoutData = () => {
    return filteredPayouts.filter((payout) => selectedPayouts.includes(payout.vendor_name))
  }

  const handleProcessSelected = () => {
    const selected = getSelectedPayoutData()
    if (selected.length === 0) {
      toast({
        variant: "destructive",
        title: "No selection",
        description: "Please select at least one vendor to process.",
      })
      return
    }
    onProcessPayouts(selected)
  }

  const allSelected = selectedPayouts.length === filteredPayouts.length && filteredPayouts.length > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Pending Payouts</CardTitle>
            <CardDescription>Process payments to vendors for their products</CardDescription>
          </div>
          {selectedPayouts.length > 0 && (
            <Button onClick={handleProcessSelected}>
              <Send className="h-4 w-4 mr-2" />
              Process Selected ({selectedPayouts.length})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <PayoutFiltersComponent
            filters={filters}
            onFilterChange={onFilterChange}
            onClearFilters={onClearFilters}
            showDateRange={true}
            showIncludePaid={true}
          />

          {isLoading ? (
            <div className="space-y-4">
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                      </TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>PayPal Email</TableHead>
                      <TableHead>Tax Info</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Last Payout</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-40 bg-muted animate-pulse rounded" />
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="h-4 w-20 bg-muted animate-pulse rounded ml-auto" />
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-12 bg-muted animate-pulse rounded" />
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        </TableCell>
                        <TableCell>
                          <div className="h-8 w-20 bg-muted animate-pulse rounded" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : filteredPayouts.length === 0 ? (
            <div className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <Alert>
                <AlertTitle>No pending payouts</AlertTitle>
                <AlertDescription>
                  {filters.searchQuery
                    ? "No vendors match your search criteria. Try adjusting your filters."
                    : "There are no pending payouts to process at this time."}
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all vendors"
                        />
                      </TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>PayPal Email</TableHead>
                      <TableHead>Tax Info</TableHead>
                      <TableHead className="text-right">Amount (USD)</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Last Payout</TableHead>
                      <TableHead className="w-[180px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayouts.map((payout) => (
                      <VendorPayoutRow
                        key={payout.vendor_name}
                        payout={payout}
                        isSelected={selectedPayouts.includes(payout.vendor_name)}
                        onSelect={togglePayoutSelection}
                        onViewDetails={onViewDetails}
                        canSelect={payout.amount >= 0 && !!payout.paypal_email}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.total > 0 && (
                <div className="flex items-center justify-between px-4 py-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
                    {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{" "}
                    {pagination.total} vendors
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(pagination.page - 1)}
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
                      onClick={() => onPageChange(pagination.page + 1)}
                      disabled={!pagination.hasNext || isLoading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

