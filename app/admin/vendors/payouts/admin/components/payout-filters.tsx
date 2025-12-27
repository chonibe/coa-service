"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import type { PayoutFilters } from "../hooks/use-payout-filters"

interface PayoutFiltersProps {
  filters: PayoutFilters
  onFilterChange: (key: keyof PayoutFilters, value: any) => void
  onClearFilters: () => void
  showPaymentMethod?: boolean
  showDateRange?: boolean
  showAmountRange?: boolean
  showIncludePaid?: boolean
}

export function PayoutFiltersComponent({
  filters,
  onFilterChange,
  onClearFilters,
  showPaymentMethod = false,
  showDateRange = false,
  showAmountRange = false,
  showIncludePaid = false,
}: PayoutFiltersProps) {
  const hasActiveFilters =
    filters.searchQuery ||
    filters.statusFilter !== "all" ||
    filters.paymentMethodFilter !== "all" ||
    filters.dateRange.start ||
    filters.dateRange.end ||
    filters.amountRange.min ||
    filters.amountRange.max

  return (
    <div className="flex flex-col gap-4 p-4 bg-muted/50 dark:bg-muted/30 rounded-lg border">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} aria-label="Clear all filters">
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search-filter">Search</Label>
          <Input
            id="search-filter"
            placeholder="Search vendors..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange("searchQuery", e.target.value)}
            aria-label="Search vendors"
          />
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status-filter">Status</Label>
          <Select
            value={filters.statusFilter}
            onValueChange={(value) => onFilterChange("statusFilter", value)}
          >
            <SelectTrigger id="status-filter" aria-label="Filter by status">
              <SelectValue placeholder="All statuses" />
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

        {/* Payment Method Filter */}
        {showPaymentMethod && (
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select
              value={filters.paymentMethodFilter}
              onValueChange={(value) => onFilterChange("paymentMethodFilter", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date Range */}
        {showDateRange && (
          <div className="space-y-2">
            <Label>Date Range</Label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) =>
                  onFilterChange("dateRange", { ...filters.dateRange, start: e.target.value })
                }
                className="flex-1"
              />
              <span className="text-muted-foreground text-sm">to</span>
              <Input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) =>
                  onFilterChange("dateRange", { ...filters.dateRange, end: e.target.value })
                }
                className="flex-1"
              />
            </div>
          </div>
        )}

        {/* Amount Range */}
        {showAmountRange && (
          <div className="space-y-2">
            <Label>Amount Range</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.amountRange.min}
                onChange={(e) =>
                  onFilterChange("amountRange", { ...filters.amountRange, min: e.target.value })
                }
                className="flex-1"
              />
              <span className="text-muted-foreground text-sm">to</span>
              <Input
                type="number"
                placeholder="Max"
                value={filters.amountRange.max}
                onChange={(e) =>
                  onFilterChange("amountRange", { ...filters.amountRange, max: e.target.value })
                }
                className="flex-1"
              />
            </div>
          </div>
        )}

        {/* Include Paid */}
        {showIncludePaid && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-paid"
              checked={filters.includePaid || false}
              onCheckedChange={(checked) => onFilterChange("includePaid", checked)}
              aria-label="Include paid items"
            />
            <Label htmlFor="include-paid" className="text-sm cursor-pointer">
              Include Paid Items
            </Label>
          </div>
        )}
      </div>
    </div>
  )
}

