"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Loader2,
  Search,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Calendar,
  Package,
  ShoppingCart,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  })
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState("asc")

  // Fetch vendors
  const fetchVendors = async (options = {}) => {
    setIsLoading(true)
    setError(null)

    const params = new URLSearchParams({
      limit: pagination.limit.toString(),
      offset: pagination.offset.toString(),
      query: searchQuery,
      sortBy,
      sortOrder,
      ...options,
    })

    try {
      const response = await fetch(`/api/vendors/list?${params}`)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`)
      }

      const data = await response.json()
      setVendors(data.vendors || [])
      setPagination(data.pagination || { total: 0, limit: 50, offset: 0, hasMore: false })
    } catch (err: any) {
      console.error("Error fetching vendors:", err)
      setError(err.message || "Failed to fetch vendors")
    } finally {
      setIsLoading(false)
    }
  }

  // Sync vendors from Shopify
  const syncVendors = async (fullSync = false) => {
    setIsSyncing(true)

    try {
      const response = await fetch(`/api/vendors/sync?full=${fullSync}`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`)
      }

      const data = await response.json()

      toast({
        title: "Vendors synced successfully",
        description: `Processed ${data.vendorsProcessed} vendors (${data.vendorsAdded} added, ${data.vendorsUpdated} updated)`,
      })

      // Refresh the vendor list
      fetchVendors()
    } catch (err: any) {
      console.error("Error syncing vendors:", err)
      toast({
        variant: "destructive",
        title: "Sync failed",
        description: err.message || "Failed to sync vendors from Shopify",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchVendors()
  }, [sortBy, sortOrder])

  // Handle search
  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, offset: 0 }))
    fetchVendors({ offset: 0 })
  }

  // Handle pagination
  const handlePrevPage = () => {
    const newOffset = Math.max(0, pagination.offset - pagination.limit)
    setPagination((prev) => ({ ...prev, offset: newOffset }))
    fetchVendors({ offset: newOffset })
  }

  const handleNextPage = () => {
    const newOffset = pagination.offset + pagination.limit
    setPagination((prev) => ({ ...prev, offset: newOffset }))
    fetchVendors({ offset: newOffset })
  }

  // Handle sort change
  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split("-")
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
  }

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="container mx-auto py-10 max-w-6xl">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
            <p className="text-muted-foreground mt-2">View and manage all vendors from Shopify</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => syncVendors(false)} disabled={isSyncing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
              Sync Vendors
            </Button>
            <Button onClick={() => syncVendors(true)} disabled={isSyncing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
              Full Sync
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vendor List</CardTitle>
            <CardDescription>All vendors from your Shopify store</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <div className="flex-1">
                  <Input
                    placeholder="Search vendors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <div className="flex space-x-2">
                  <Select value={`${sortBy}-${sortOrder}`} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name-asc">Vendor Name (A-Z)</SelectItem>
                      <SelectItem value="name-desc">Vendor Name (Z-A)</SelectItem>
                      <SelectItem value="product_count-desc">Product Count (High-Low)</SelectItem>
                      <SelectItem value="product_count-asc">Product Count (Low-High)</SelectItem>
                      <SelectItem value="order_count-desc">Order Count (High-Low)</SelectItem>
                      <SelectItem value="order_count-asc">Order Count (Low-High)</SelectItem>
                      <SelectItem value="last_synced_at-desc">Recently Synced</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleSearch} disabled={isLoading}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : vendors.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No vendors found</AlertTitle>
                  <AlertDescription>
                    {searchQuery
                      ? "No vendors match your search criteria. Try a different search term."
                      : "No vendors found in the database. Click 'Sync Vendors' to fetch vendors from Shopify."}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendor Name</TableHead>
                        <TableHead className="hidden md:table-cell">
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-1" />
                            Products
                          </div>
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          <div className="flex items-center">
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            Orders
                          </div>
                        </TableHead>
                        <TableHead className="hidden lg:table-cell">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Last Synced
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendors.map((vendor) => (
                        <TableRow key={vendor.id}>
                          <TableCell className="font-medium">{vendor.name}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="secondary">{vendor.product_count || 0}</Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline">{vendor.order_count || 0}</Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                            {formatDate(vendor.last_synced_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex items-center justify-between p-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {pagination.offset + 1}-{Math.min(pagination.offset + vendors.length, pagination.total)}{" "}
                      of {pagination.total} vendors
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevPage}
                        disabled={pagination.offset === 0 || isLoading}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={!pagination.hasMore || isLoading}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
