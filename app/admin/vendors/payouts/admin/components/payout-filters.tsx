"use client"

import { useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
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
    filters.amountRange.max ||
    filters.includePaid

  // Get filter chips for active filters
  const filterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; value: string; onRemove: () => void }> = []

    if (filters.searchQuery) {
      chips.push({
        key: "search",
        label: "Search",
        value: filters.searchQuery,
        onRemove: () => onFilterChange("searchQuery", ""),
      })
    }

    if (filters.statusFilter !== "all") {
      chips.push({
        key: "status",
        label: "Status",
        value: filters.statusFilter,
        onRemove: () => onFilterChange("statusFilter", "all"),
      })
    }

    if (filters.paymentMethodFilter !== "all") {
      chips.push({
        key: "paymentMethod",
        label: "Payment Method",
        value: filters.paymentMethodFilter,
        onRemove: () => onFilterChange("paymentMethodFilter", "all"),
      })
    }

    if (filters.dateRange.start || filters.dateRange.end) {
      chips.push({
        key: "dateRange",
        label: "Date Range",
        value: `${filters.dateRange.start || "..."} to ${filters.dateRange.end || "..."}`,
        onRemove: () => onFilterChange("dateRange", { start: "", end: "" }),
      })
    }

    if (filters.amountRange.min || filters.amountRange.max) {
      chips.push({
        key: "amountRange",
        label: "Amount Range",
        value: `${filters.amountRange.min || "..."} to ${filters.amountRange.max || "..."}`,
        onRemove: () => onFilterChange("amountRange", { min: "", max: "" }),
      })
    }

    if (filters.includePaid) {
      chips.push({
        key: "includePaid",
        label: "Include Paid",
        value: "Yes",
        onRemove: () => onFilterChange("includePaid", false),
      })
    }

    return chips
  }, [filters, onFilterChange])

  // Date preset handlers
  const applyDatePreset = (preset: "thisMonth" | "last30Days" | "last90Days") => {
    const today = new Date()
    const start = new Date()
    const end = new Date()

    switch (preset) {
      case "thisMonth":
        start.setDate(1)
        end.setDate(new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate())
        break
      case "last30Days":
        start.setDate(today.getDate() - 30)
        break
      case "last90Days":
        start.setDate(today.getDate() - 90)
        break
    }

    onFilterChange("dateRange", {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    })
  }

  return (
    <div className="flex flex-col gap-4 p-4 bg-muted/50 dark:bg-muted/30 rounded-lg border">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} aria-label="Clear all filters">
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Filter Chips */}
      {filterChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filterChips.map((chip) => (
            <Badge key={chip.key} variant="secondary" className="flex items-center gap-1 pr-1">
              <span className="text-xs">
                <span className="font-medium">{chip.label}:</span> {chip.value}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={chip.onRemove}
                aria-label={`Remove ${chip.label} filter`}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

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
            className={cn(filters.searchQuery && "border-primary bg-primary/5")}
          />
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status-filter">Status</Label>
          <Select
            value={filters.statusFilter}
            onValueChange={(value) => onFilterChange("statusFilter", value)}
          >
            <SelectTrigger
              id="status-filter"
              aria-label="Filter by status"
              className={cn(filters.statusFilter !== "all" && "border-primary bg-primary/5")}
            >
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
              <SelectTrigger
                className={cn(filters.paymentMethodFilter !== "all" && "border-primary bg-primary/5")}
              >
                <SelectValue placeholder="All methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="manual">Manual (Other)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date Range */}
        {showDateRange && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Date Range</Label>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => applyDatePreset("thisMonth")}
                >
                  This Month
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => applyDatePreset("last30Days")}
                >
                  30d
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => applyDatePreset("last90Days")}
                >
                  90d
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-1">
                <Label htmlFor="date-start" className="text-xs text-muted-foreground">
                  From
                </Label>
                <Input
                  id="date-start"
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) =>
                    onFilterChange("dateRange", { ...filters.dateRange, start: e.target.value })
                  }
                  className={cn(filters.dateRange.start && "border-primary bg-primary/5")}
                />
              </div>
              <span className="text-muted-foreground text-sm pt-5">to</span>
              <div className="flex-1 space-y-1">
                <Label htmlFor="date-end" className="text-xs text-muted-foreground">
                  To
                </Label>
                <Input
                  id="date-end"
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) =>
                    onFilterChange("dateRange", { ...filters.dateRange, end: e.target.value })
                  }
                  className={cn(filters.dateRange.end && "border-primary bg-primary/5")}
                />
              </div>
            </div>
          </div>
        )}

        {/* Amount Range */}
        {showAmountRange && (
          <div className="space-y-2">
            <Label>Amount Range</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-1">
                <Label htmlFor="amount-min" className="text-xs text-muted-foreground">
                  Min
                </Label>
                <Input
                  id="amount-min"
                  type="number"
                  placeholder="Min"
                  value={filters.amountRange.min}
                  onChange={(e) =>
                    onFilterChange("amountRange", { ...filters.amountRange, min: e.target.value })
                  }
                  className={cn(filters.amountRange.min && "border-primary bg-primary/5")}
                />
              </div>
              <span className="text-muted-foreground text-sm pt-5">to</span>
              <div className="flex-1 space-y-1">
                <Label htmlFor="amount-max" className="text-xs text-muted-foreground">
                  Max
                </Label>
                <Input
                  id="amount-max"
                  type="number"
                  placeholder="Max"
                  value={filters.amountRange.max}
                  onChange={(e) =>
                    onFilterChange("amountRange", { ...filters.amountRange, max: e.target.value })
                  }
                  className={cn(filters.amountRange.max && "border-primary bg-primary/5")}
                />
              </div>
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

