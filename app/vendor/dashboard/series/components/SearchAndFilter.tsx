"use client"



import { Search, X } from "lucide-react"

import type { UnlockType } from "@/types/artwork-series"

import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button } from "@/components/ui"
interface SearchAndFilterProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  unlockTypeFilter: string
  onUnlockTypeFilterChange: (type: string) => void
}

export function SearchAndFilter({
  searchQuery,
  onSearchChange,
  unlockTypeFilter,
  onUnlockTypeFilterChange,
}: SearchAndFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search series..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => onSearchChange("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Select value={unlockTypeFilter} onValueChange={onUnlockTypeFilterChange}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Filter by unlock type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="any_purchase">Any Purchase</SelectItem>
          <SelectItem value="sequential">Sequential</SelectItem>
          <SelectItem value="threshold">Threshold</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

