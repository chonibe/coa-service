"use client"

import { useState, useEffect } from "react"
import { Loader2, Package, DollarSign, Calendar, Search, Filter, ExternalLink } from "lucide-react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  PageHeader,
} from "@/components/ui"

interface FirstEditionReserve {
  id: string
  product_id: string
  vendor_name: string
  order_id: string
  line_item_id: string
  reserved_at: string
  reserved_by: string
  purchase_price: number
  payout_amount: number
  status: "reserved" | "fulfilled" | "cancelled"
  product_name?: string
  product_image?: string | null
}

export default function FirstEditionReservesPage() {
  const [reserves, setReserves] = useState<FirstEditionReserve[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [vendorFilter, setVendorFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchReserves()
  }, [statusFilter, vendorFilter])

  const fetchReserves = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }
      if (vendorFilter !== "all") {
        params.append("vendor_name", vendorFilter)
      }

      const response = await fetch(`/api/admin/first-edition-reserves?${params.toString()}`)
      if (!response.ok) {
        throw new Error("Failed to fetch reserves")
      }

      const data = await response.json()
      setReserves(data.reserves || [])
    } catch (err: any) {
      console.error("Error fetching reserves:", err)
      setError(err.message || "Failed to fetch reserves")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredReserves = reserves.filter((reserve) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        reserve.product_name?.toLowerCase().includes(query) ||
        reserve.vendor_name.toLowerCase().includes(query) ||
        reserve.product_id.toLowerCase().includes(query) ||
        reserve.order_id.toLowerCase().includes(query)
      )
    }
    return true
  })

  const totalValue = reserves.reduce((sum, r) => sum + r.purchase_price, 0)
  const totalPayout = reserves.reduce((sum, r) => sum + r.payout_amount, 0)
  const fulfilledCount = reserves.filter((r) => r.status === "fulfilled").length

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "fulfilled":
        return <Badge className="bg-green-500">Fulfilled</Badge>
      case "reserved":
        return <Badge className="bg-yellow-500">Reserved</Badge>
      case "cancelled":
        return <Badge className="bg-gray-500">Cancelled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const uniqueVendors = Array.from(new Set(reserves.map((r) => r.vendor_name))).sort()

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="First Edition Reserves"
        description="Manage and view all first edition reserves for choni@thestreetlamp.com"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reserves</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reserves.length}</div>
            <p className="text-xs text-muted-foreground">{fulfilledCount} fulfilled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Product Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Product prices (reference)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPayout.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">25% artist payout (actual cost)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fulfilled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fulfilledCount}</div>
            <p className="text-xs text-muted-foreground">
              {reserves.length > 0 ? Math.round((fulfilledCount / reserves.length) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by product, vendor, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={vendorFilter} onValueChange={setVendorFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                {uniqueVendors.map((vendor) => (
                  <SelectItem key={vendor} value={vendor}>
                    {vendor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={fetchReserves} variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reserves Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reserves ({filteredReserves.length})</CardTitle>
          <CardDescription>All first edition reserves for approved artworks</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">{error}</div>
          ) : filteredReserves.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No reserves found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Payout</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reserved</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReserves.map((reserve) => (
                    <TableRow key={reserve.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {reserve.product_image && (
                            <img
                              src={reserve.product_image}
                              alt={reserve.product_name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium">{reserve.product_name || "Unknown"}</div>
                            <div className="text-xs text-muted-foreground">{reserve.product_id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{reserve.vendor_name}</TableCell>
                      <TableCell>
                        <div>${reserve.purchase_price.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">Product price</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">${reserve.payout_amount.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">25% paid to artist</div>
                      </TableCell>
                      <TableCell>{getStatusBadge(reserve.status)}</TableCell>
                      <TableCell>
                        {new Date(reserve.reserved_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/admin/orders/${reserve.order_id}`}>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
