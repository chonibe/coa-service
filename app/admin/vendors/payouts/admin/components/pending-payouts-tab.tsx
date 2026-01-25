"use client"

import { useState } from "react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui"

import { Loader2, AlertCircle, Send, ChevronLeft, ChevronRight, ChevronDown, Filter, X, Keyboard } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { formatUSD } from "@/lib/utils"
import type { PendingPayout, PayoutPagination } from "../types"
import { VendorPayoutRow } from "./vendor-payout-row"
import { PayoutFiltersComponent } from "./payout-filters"
import type { PayoutFilters } from "../hooks/use-payout-filters"
import { usePayoutSelection } from "../hooks/use-payout-selection"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Checkbox, Alert, AlertDescription, AlertTitle, Badge } from "@/components/ui"
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
  const [isFiltersOpen, setIsFiltersOpen] = useState(true)

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

  // Calculate active filter count
  const activeFilterCount = [
    filters.searchQuery,
    filters.statusFilter !== "all",
    filters.paymentMethodFilter !== "all",
    filters.dateRange.start,
    filters.dateRange.end,
    filters.amountRange.min,
    filters.amountRange.max,
    filters.includePaid,
  ].filter(Boolean).length

  // Calculate selected payout total
  const selectedPayoutTotal = getSelectedPayoutData().reduce((sum, p) => sum + p.amount, 0)

  // Check if filters are active
  const hasActiveFilters = activeFilterCount > 0
  const isFiltered = filteredPayouts.length !== pendingPayouts.length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Pending Payouts</CardTitle>
            <CardDescription>
              Process payments to vendors for their products
              {isFiltered && (
                <span className="ml-2 text-xs">
                  ({filteredPayouts.length} of {pendingPayouts.length} vendors)
                </span>
              )}
            </CardDescription>
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
          {/* Selection Summary Banner */}
          {selectedPayouts.length > 0 && (
            <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                  <div>
                    <AlertTitle className="text-blue-900 dark:text-blue-100">
                      {selectedPayouts.length} vendor{selectedPayouts.length !== 1 ? "s" : ""} selected
                    </AlertTitle>
                    <AlertDescription className="text-blue-700 dark:text-blue-300">
                      Total payout amount: <span className="font-semibold">{formatUSD(selectedPayoutTotal)}</span>
                    </AlertDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (onSelectionChange) {
                      onSelectionChange([])
                    } else {
                      internalSelection.clearSelection()
                    }
                  }}
                  className="border-blue-300 dark:border-blue-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Selection
                </Button>
              </div>
            </Alert>
          )}

          {/* Collapsible Filters */}
          <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <div className="flex items-center justify-between p-2 border rounded-lg bg-muted/30">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1">
                      {activeFilterCount}
                    </Badge>
                  )}
                  <ChevronDown className={`h-4 w-4 transition-transform ${isFiltersOpen ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={onClearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
            <CollapsibleContent>
              <div className="pt-2">
                <PayoutFiltersComponent
                  filters={filters}
                  onFilterChange={onFilterChange}
                  onClearFilters={onClearFilters}
                  showDateRange={true}
                  showIncludePaid={true}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

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
                  {hasActiveFilters ? (
                    <div className="space-y-2">
                      <p>No vendors match your current filter criteria.</p>
                      <div className="flex items-center justify-center gap-2 mt-3">
                        <Button variant="outline" size="sm" onClick={onClearFilters}>
                          <X className="h-4 w-4 mr-1" />
                          Clear Filters
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setIsFiltersOpen(true)}>
                          <Filter className="h-4 w-4 mr-1" />
                          Adjust Filters
                        </Button>
                      </div>
                    </div>
                  ) : (
                    "There are no pending payouts to process at this time."
                  )}
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
                    {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{" "}
                    {pagination.total} vendor{pagination.total !== 1 ? "s" : ""}
                    {isFiltered && (
                      <span className="ml-1">
                        (filtered from {pendingPayouts.length} total)
                      </span>
                    )}
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

              {/* Keyboard Shortcuts Hint */}
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                <Keyboard className="h-3 w-3" />
                <span>Keyboard shortcuts: Space to select, Enter to view details</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

