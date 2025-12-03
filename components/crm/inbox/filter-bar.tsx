"use client"

import { Search, Filter, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PlatformBadge } from "@/components/crm/platform-badge"

export interface FilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  platformFilter: string
  onPlatformFilterChange: (platform: string) => void
  statusFilter: string
  onStatusFilterChange: (status: string) => void
  unreadOnly: boolean
  onUnreadOnlyChange: (unreadOnly: boolean) => void
  starredOnly: boolean
  onStarredOnlyChange: (starredOnly: boolean) => void
  className?: string
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  platformFilter,
  onPlatformFilterChange,
  statusFilter,
  onStatusFilterChange,
  unreadOnly,
  onUnreadOnlyChange,
  starredOnly,
  onStarredOnlyChange,
  className = "",
}: FilterBarProps) {
  const hasActiveFilters =
    platformFilter !== "all" ||
    statusFilter !== "all" ||
    unreadOnly ||
    starredOnly ||
    searchQuery

  const clearFilters = () => {
    onSearchChange("")
    onPlatformFilterChange("all")
    onStatusFilterChange("all")
    onUnreadOnlyChange(false)
    onStarredOnlyChange(false)
  }

  return (
    <div className={`border-b border-gray-200 bg-white p-4 space-y-3 ${className}`}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Platform filter */}
        <Select value={platformFilter} onValueChange={onPlatformFilterChange}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="shopify">Shopify</SelectItem>
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        {/* Quick filters */}
        <Button
          variant={unreadOnly ? "default" : "outline"}
          size="sm"
          onClick={() => onUnreadOnlyChange(!unreadOnly)}
          className="h-9"
        >
          Unread
        </Button>

        <Button
          variant={starredOnly ? "default" : "outline"}
          size="sm"
          onClick={() => onStarredOnlyChange(!starredOnly)}
          className="h-9"
        >
          Starred
        </Button>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 text-gray-500"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">Active filters:</span>
          {platformFilter !== "all" && (
            <Badge variant="secondary" className="text-xs">
              Platform: {platformFilter}
            </Badge>
          )}
          {statusFilter !== "all" && (
            <Badge variant="secondary" className="text-xs">
              Status: {statusFilter}
            </Badge>
          )}
          {unreadOnly && (
            <Badge variant="secondary" className="text-xs">
              Unread only
            </Badge>
          )}
          {starredOnly && (
            <Badge variant="secondary" className="text-xs">
              Starred only
            </Badge>
          )}
          {searchQuery && (
            <Badge variant="secondary" className="text-xs">
              Search: {searchQuery}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

