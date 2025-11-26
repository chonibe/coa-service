"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Filter, X, Save, CalendarIcon, Search } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export interface FilterCriteria {
  vendors?: string[]
  status?: string[]
  paymentMethods?: string[]
  dateRange?: { start: Date | null; end: Date | null }
  amountRange?: { min: number | null; max: number | null }
  products?: string[]
  searchQuery?: string
}

interface SavedFilter {
  id: string
  name: string
  criteria: FilterCriteria
}

interface AdvancedFiltersProps {
  onFilterChange: (criteria: FilterCriteria) => void
  vendors?: string[]
  isAdmin?: boolean
  savedFilters?: SavedFilter[]
  onSaveFilter?: (name: string, criteria: FilterCriteria) => void
  onDeleteFilter?: (id: string) => void
}

export function AdvancedFilters({
  onFilterChange,
  vendors = [],
  isAdmin = false,
  savedFilters = [],
  onSaveFilter,
  onDeleteFilter,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [criteria, setCriteria] = useState<FilterCriteria>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [vendorSearch, setVendorSearch] = useState("")
  const [productSearch, setProductSearch] = useState("")
  const [saveFilterName, setSaveFilterName] = useState("")
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  const activeFilterCount = Object.values(criteria).filter((v) => {
    if (Array.isArray(v)) return v.length > 0
    if (typeof v === "object" && v !== null) {
      return Object.values(v).some((val) => val !== null && val !== "")
    }
    return v !== undefined && v !== ""
  }).length

  const quickFilters = [
    { label: "Today", getCriteria: () => getTodayCriteria() },
    { label: "This Week", getCriteria: () => getThisWeekCriteria() },
    { label: "This Month", getCriteria: () => getThisMonthCriteria() },
    { label: "Last 30 Days", getCriteria: () => getLast30DaysCriteria() },
    { label: "Pending Only", getCriteria: () => ({ status: ["pending", "processing"] }) },
    { label: "Completed Only", getCriteria: () => ({ status: ["completed", "paid"] }) },
  ]

  const getTodayCriteria = (): FilterCriteria => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return { dateRange: { start: today, end: tomorrow } }
  }

  const getThisWeekCriteria = (): FilterCriteria => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    return { dateRange: { start: startOfWeek, end: today } }
  }

  const getThisMonthCriteria = (): FilterCriteria => {
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    return { dateRange: { start: startOfMonth, end: today } }
  }

  const getLast30DaysCriteria = (): FilterCriteria => {
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)
    return { dateRange: { start: thirtyDaysAgo, end: today } }
  }

  const handleQuickFilter = (getCriteria: () => FilterCriteria) => {
    const newCriteria = getCriteria()
    setCriteria((prev) => ({ ...prev, ...newCriteria }))
    onFilterChange({ ...criteria, ...newCriteria })
  }

  const handleCriteriaChange = (updates: Partial<FilterCriteria>) => {
    const newCriteria = { ...criteria, ...updates }
    setCriteria(newCriteria)
    onFilterChange(newCriteria)
  }

  const clearFilters = () => {
    const cleared: FilterCriteria = {}
    setCriteria(cleared)
    setSearchQuery("")
    setVendorSearch("")
    setProductSearch("")
    onFilterChange(cleared)
  }

  const applySavedFilter = (savedFilter: SavedFilter) => {
    setCriteria(savedFilter.criteria)
    onFilterChange(savedFilter.criteria)
    setIsOpen(false)
  }

  const handleSaveFilter = () => {
    if (saveFilterName && onSaveFilter) {
      onSaveFilter(saveFilterName, criteria)
      setSaveFilterName("")
      setShowSaveDialog(false)
    }
  }

  const filteredVendors = vendors.filter((v) =>
    v.toLowerCase().includes(vendorSearch.toLowerCase())
  )

  return (
    <div className="flex items-center gap-2">
      {/* Quick Filter Buttons */}
      <div className="hidden md:flex items-center gap-2 flex-wrap">
        {quickFilters.map((filter, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => handleQuickFilter(filter.getCriteria)}
            className="text-xs"
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search payouts..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            handleCriteriaChange({ searchQuery: e.target.value })
          }}
          className="pl-8"
        />
      </div>

      {/* Advanced Filters Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Advanced Filters</DialogTitle>
            <DialogDescription>
              Apply multiple filters to refine your payout search. Filters are combined with AND logic.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Quick Filters */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Quick Filters</Label>
              <div className="flex flex-wrap gap-2">
                {quickFilters.map((filter, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickFilter(filter.getCriteria)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Vendor Filter (Admin only) */}
            {isAdmin && vendors.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Vendors</Label>
                <Input
                  placeholder="Search vendors..."
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  className="mb-2"
                />
                <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                  {filteredVendors.map((vendor) => {
                    const isSelected = criteria.vendors?.includes(vendor)
                    return (
                      <div key={vendor} className="flex items-center space-x-2">
                        <Checkbox
                          id={`vendor-${vendor}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            const currentVendors = criteria.vendors || []
                            const newVendors = checked
                              ? [...currentVendors, vendor]
                              : currentVendors.filter((v) => v !== vendor)
                            handleCriteriaChange({ vendors: newVendors })
                          }}
                        />
                        <label
                          htmlFor={`vendor-${vendor}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {vendor}
                        </label>
                      </div>
                    )
                  })}
                </div>
                {criteria.vendors && criteria.vendors.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {criteria.vendors.map((vendor) => (
                      <Badge key={vendor} variant="secondary" className="gap-1">
                        {vendor}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => {
                            const newVendors = criteria.vendors?.filter((v) => v !== vendor) || []
                            handleCriteriaChange({ vendors: newVendors.length > 0 ? newVendors : undefined })
                          }}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Status Filter */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Status</Label>
              <div className="grid grid-cols-2 gap-2">
                {["pending", "processing", "completed", "paid", "failed"].map((status) => {
                  const isSelected = criteria.status?.includes(status)
                  return (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          const currentStatus = criteria.status || []
                          const newStatus = checked
                            ? [...currentStatus, status]
                            : currentStatus.filter((s) => s !== status)
                          handleCriteriaChange({ status: newStatus.length > 0 ? newStatus : undefined })
                        }}
                      />
                      <label
                        htmlFor={`status-${status}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer capitalize"
                      >
                        {status}
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Payment Method Filter */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Payment Method</Label>
              <div className="grid grid-cols-2 gap-2">
                {["paypal", "bank_transfer", "manual"].map((method) => {
                  const isSelected = criteria.paymentMethods?.includes(method)
                  return (
                    <div key={method} className="flex items-center space-x-2">
                      <Checkbox
                        id={`method-${method}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          const currentMethods = criteria.paymentMethods || []
                          const newMethods = checked
                            ? [...currentMethods, method]
                            : currentMethods.filter((m) => m !== method)
                          handleCriteriaChange({ paymentMethods: newMethods.length > 0 ? newMethods : undefined })
                        }}
                      />
                      <label
                        htmlFor={`method-${method}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer capitalize"
                      >
                        {method.replace("_", " ")}
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !criteria.dateRange?.start && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {criteria.dateRange?.start ? (
                        format(criteria.dateRange.start, "PPP")
                      ) : (
                        <span>Start date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={criteria.dateRange?.start || undefined}
                      onSelect={(date) => {
                        handleCriteriaChange({
                          dateRange: {
                            start: date || null,
                            end: criteria.dateRange?.end || null,
                          },
                        })
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !criteria.dateRange?.end && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {criteria.dateRange?.end ? (
                        format(criteria.dateRange.end, "PPP")
                      ) : (
                        <span>End date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={criteria.dateRange?.end || undefined}
                      onSelect={(date) => {
                        handleCriteriaChange({
                          dateRange: {
                            start: criteria.dateRange?.start || null,
                            end: date || null,
                          },
                        })
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Amount Range */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Amount Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Min amount"
                  value={criteria.amountRange?.min || ""}
                  onChange={(e) => {
                    const min = e.target.value ? parseFloat(e.target.value) : null
                    handleCriteriaChange({
                      amountRange: {
                        min,
                        max: criteria.amountRange?.max || null,
                      },
                    })
                  }}
                />
                <Input
                  type="number"
                  placeholder="Max amount"
                  value={criteria.amountRange?.max || ""}
                  onChange={(e) => {
                    const max = e.target.value ? parseFloat(e.target.value) : null
                    handleCriteriaChange({
                      amountRange: {
                        min: criteria.amountRange?.min || null,
                        max,
                      },
                    })
                  }}
                />
              </div>
            </div>

            {/* Saved Filters */}
            {savedFilters.length > 0 && (
              <>
                <Separator />
                <div>
                  <Label className="text-sm font-medium mb-2 block">Saved Filters</Label>
                  <div className="space-y-2">
                    {savedFilters.map((savedFilter) => (
                      <div key={savedFilter.id} className="flex items-center justify-between p-2 border rounded-md">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => applySavedFilter(savedFilter)}
                          className="flex-1 justify-start"
                        >
                          {savedFilter.name}
                        </Button>
                        {onDeleteFilter && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteFilter(savedFilter.id)}
                            className="text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <Button variant="outline" onClick={clearFilters}>
                Clear All
              </Button>
              <div className="flex gap-2">
                {onSaveFilter && (
                  <Button
                    variant="outline"
                    onClick={() => setShowSaveDialog(true)}
                    disabled={activeFilterCount === 0}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Filter
                  </Button>
                )}
                <Button onClick={() => setIsOpen(false)}>Apply Filters</Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Filter Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter</DialogTitle>
            <DialogDescription>Give this filter a name to save it for quick access.</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Filter name"
            value={saveFilterName}
            onChange={(e) => setSaveFilterName(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveFilter} disabled={!saveFilterName}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


