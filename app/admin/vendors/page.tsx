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
  RefreshCw,
  Package,
  ArrowDownUp,
  Instagram,
  Pencil,
  ExternalLink,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { VendorDialog } from "./vendor-dialog"
import Link from "next/link"

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 100,
    cursor: null as string | null,
    hasMore: false,
  })
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [selectedVendor, setSelectedVendor] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isTableInitialized, setIsTableInitialized] = useState(false)

  // Initialize the vendors table
  const initializeVendorsTable = async () => {
    try {
      const response = await fetch("/api/vendors/create-table", {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        console.error("Error initializing vendors table:", error)
      } else {
        console.log("Vendors table initialized successfully")
        setIsTableInitialized(true)
      }
    } catch (error) {
      console.error("Error initializing vendors table:", error)
    }
  }

  // Initialize table on first load
  useEffect(() => {
    initializeVendorsTable()
  }, [])

  // Fetch vendors directly from Shopify
  const fetchVendors = async (refresh = false) => {
    if (!isTableInitialized) {
      await initializeVendorsTable()
    }

    if (refresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setError(null)

    const params = new URLSearchParams({
      limit: pagination.limit.toString(),
      query: searchQuery,
    })

    if (pagination.cursor && !refresh) {
      params.append("cursor", pagination.cursor)
    }

    try {
      const response = await fetch(`/api/vendors/list?${params}`)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`)
      }

      const data = await response.json()

      if (refresh || !pagination.cursor) {
        // Replace all vendors on refresh or initial load
        setVendors(data.vendors || [])
      } else {
        // Append vendors when loading more
        setVendors((prev) => [...prev, ...(data.vendors || [])])
      }

      setPagination(data.pagination || { total: 0, limit: 100, cursor: null, hasMore: false })
    } catch (err: any) {
      console.error("Error fetching vendors:", err)
      setError(err.message || "Failed to fetch vendors")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    if (isTableInitialized) {
      fetchVendors()
    }
  }, [isTableInitialized])

  // Handle search
  const handleSearch = () => {
    fetchVendors(true)
  }

  // Handle load more
  const handleLoadMore = () => {
    if (pagination.hasMore) {
      fetchVendors()
    }
  }

  // Handle refresh
  const handleRefresh = () => {
    fetchVendors(true)
  }

  // Toggle sort order
  const toggleSortOrder = () => {
    const newSortOrder = sortOrder === "asc" ? "desc" : "asc"
    setSortOrder(newSortOrder)

    // Sort the current vendors list
    const sortedVendors = [...vendors].sort((a, b) => {
      const comparison = a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      return newSortOrder === "asc" ? comparison : -comparison
    })

    setVendors(sortedVendors)
  }

  // Open edit dialog
  const handleEditVendor = (vendor: any) => {
    setSelectedVendor(vendor)
    setDialogOpen(true)
  }

  // Format Instagram URL for display
  const formatInstagramUrl = (url: string | null) => {
    if (!url) return null

    try {
      const urlObj = new URL(url)
      const path = urlObj.pathname.replace(/^\//, "")
      return path || urlObj.hostname
    } catch (e) {
      return url
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-6xl">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
            <p className="text-muted-foreground mt-2">View all vendors from your Shopify products</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vendor List</CardTitle>
            <CardDescription>All vendors from your Shopify products</CardDescription>
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
                  <Button onClick={handleSearch} disabled={isLoading || isRefreshing}>
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

              {isLoading && !vendors.length ? (
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
                      : "No vendors found in your Shopify store."}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Button variant="ghost" className="p-0 h-auto font-semibold" onClick={toggleSortOrder}>
                            Vendor Name
                            <ArrowDownUp className="h-4 w-4 ml-2" />
                          </Button>
                        </TableHead>
                        <TableHead className="hidden md:table-cell">Instagram</TableHead>
                        <TableHead className="text-right">
                          <div className="flex items-center justify-end">
                            <Package className="h-4 w-4 mr-1" />
                            Products
                          </div>
                        </TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendors.map((vendor, index) => (
                        <Link href={`/admin/vendors/${vendor.id}`} key={vendor.id} className="block">
                          <TableRow className="cursor-pointer hover:bg-muted/50">
                            <TableCell>
                              {vendor.name}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {vendor.instagram_url ? (
                                <a
                                  href={vendor.instagram_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center text-pink-500 hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Instagram className="h-4 w-4 mr-1" />
                                  {formatInstagramUrl(vendor.instagram_url)}
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                              ) : (
                                <span className="text-muted-foreground text-sm">Not set</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary">{vendor.product_count || 0}</Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleEditVendor(vendor);
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <span className="sr-only">Edit</span>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        </Link>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex items-center justify-center p-4 border-t">
                    {isRefreshing ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : pagination.hasMore ? (
                      <Button variant="outline" onClick={handleLoadMore} disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Load More"
                        )}
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground">Showing all {vendors.length} vendors</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <VendorDialog vendor={selectedVendor} open={dialogOpen} onOpenChange={setDialogOpen} onSave={handleRefresh} />
    </div>
  )
}
