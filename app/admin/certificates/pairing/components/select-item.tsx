"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem as SelectOption, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface LineItem {
  id: string
  product_name: string
  order_number: string
  quantity: number
}

interface SelectItemProps {
  onSelect: (itemId: string, item: LineItem) => void
  selectedItemId?: string
}

interface PaginationData {
  total: number
  page: number
  limit: number
  totalPages: number
}

export function SelectItem({ onSelect, selectedItemId }: SelectItemProps) {
  const [items, setItems] = useState<LineItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState("desc")
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  })

  const fetchItems = async (page = 1) => {
    try {
      setIsLoading(true)
      setError(undefined)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        search,
        sortBy,
        sortOrder
      })

      const response = await fetch(`/api/nfc-tags/pair/unpaired-items?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch items")
      }

      setItems(data.items)
      setPagination(data.pagination)
    } catch (err) {
      console.error("Error fetching items:", err)
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while fetching items"
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [search, sortBy, sortOrder])

  const handleSearch = (value: string) => {
    setSearch(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleSort = (value: string) => {
    const [newSortBy, newSortOrder] = value.split("-")
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
    fetchItems(newPage)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Item to Pair</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search and Sort Controls */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by product name or order number..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            value={`${sortBy}-${sortOrder}`}
            onValueChange={handleSort}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectOption value="created_at-desc">Newest First</SelectOption>
              <SelectOption value="created_at-asc">Oldest First</SelectOption>
              <SelectOption value="product_name-asc">Product Name (A-Z)</SelectOption>
              <SelectOption value="product_name-desc">Product Name (Z-A)</SelectOption>
              <SelectOption value="order_number-asc">Order Number (Asc)</SelectOption>
              <SelectOption value="order_number-desc">Order Number (Desc)</SelectOption>
            </SelectContent>
          </Select>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Items List */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No items found to pair
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={`
                  p-4 rounded-lg border cursor-pointer transition-colors
                  ${
                    selectedItemId === item.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-accent"
                  }
                `}
                onClick={() => onSelect(item.id, item)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{item.product_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Order #{item.order_number}
                    </p>
                  </div>
                  <Badge variant="outline">
                    Qty: {item.quantity}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-1 mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              Previous
            </Button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
              (page) => (
                <Button
                  key={page}
                  variant={pagination.page === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              )
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 