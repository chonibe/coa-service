"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Product {
  id: string
  product_id: string
  name: string
  vendor_name: string
  sku: string
  edition_size: string | null
  price: number | null
}

interface LineItem {
  id: number
  order_id: string
  order_name: string | null
  line_item_id: string
  product_id: string
  variant_id: string | null
  title: string
  sku: string | null
  vendor_name: string | null
  quantity: number
  price: number
  total_discount: number | null
  fulfillment_status: string | null
  status: string
  edition_number: number | null
  edition_total: number | null
  created_at: string
  certificate_generated_at: string | null
}

interface ProductDetailsProps {
  data: {
    product: Product
    lineItems: LineItem[]
    totalPages: number
    currentPage: number
    totalItems: number
  }
  productId: string
}

export default function ProductDetails({ data, productId }: ProductDetailsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pageSize, setPageSize] = useState('10')
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    hasEditionNumber: searchParams.get('hasEditionNumber') === 'true'
  })

  useEffect(() => {
    const size = searchParams.get('pageSize') || '10'
    setPageSize(size)
  }, [searchParams])

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (filters.status) params.set('status', filters.status)
    if (filters.minPrice) params.set('minPrice', filters.minPrice)
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
    if (filters.hasEditionNumber) params.set('hasEditionNumber', 'true')
    router.push(`/admin/product-editions/${productId}?${params.toString()}`)
  }

  const handleSort = (column: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const currentSort = params.get('sortBy')
    const currentOrder = params.get('sortOrder')
    
    const newOrder = currentSort === column && currentOrder === 'asc' ? 'desc' : 'asc'
    params.set('sortBy', column)
    params.set('sortOrder', newOrder)
    
    router.push(`/admin/product-editions/${productId}?${params.toString()}`)
  }

  const handlePageSizeChange = (size: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('pageSize', size)
    params.set('page', '1') // Reset to first page when changing page size
    router.push(`/admin/product-editions/${productId}?${params.toString()}`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link 
          href="/admin/product-editions"
          className="text-muted-foreground hover:text-foreground mb-4 inline-block"
        >
          ← Back to Products
        </Link>
        
        <Card>
          <CardHeader>
            <CardTitle>{data.product.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Vendor</p>
                <p>{data.product.vendor_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">SKU</p>
                <p>{data.product.sku}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Edition Size</p>
                <p>{data.product.edition_size || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p>{data.product.price ? `$${data.product.price.toFixed(2)}` : 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Select
              value={filters.status || "all"}
              onValueChange={(value) => updateFilters({ status: value === "all" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="removed">Removed</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min Price"
                value={filters.minPrice}
                onChange={(e) => updateFilters({ minPrice: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Max Price"
                value={filters.maxPrice}
                onChange={(e) => updateFilters({ maxPrice: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasEditionNumber"
                checked={filters.hasEditionNumber}
                onCheckedChange={(checked) => 
                  updateFilters({ hasEditionNumber: checked as boolean })
                }
              />
              <label htmlFor="hasEditionNumber" className="text-sm">Has Edition Number</label>
            </div>

            <Button onClick={applyFilters}>Apply Filters</Button>
          </div>

          {/* Page Size Selector */}
          <div className="flex justify-between items-center mb-4">
            <Select
              value={pageSize}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Items per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground">
              Showing {data.lineItems.length} of {data.totalItems} items
            </div>
          </div>
          
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    <button 
                      onClick={() => handleSort('order_id')}
                      className="flex items-center space-x-1"
                    >
                      <span>Order ID</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    <button 
                      onClick={() => handleSort('title')}
                      className="flex items-center space-x-1"
                    >
                      <span>Title</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    <button 
                      onClick={() => handleSort('quantity')}
                      className="flex items-center space-x-1"
                    >
                      <span>Quantity</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    <button 
                      onClick={() => handleSort('price')}
                      className="flex items-center space-x-1"
                    >
                      <span>Price</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    <button 
                      onClick={() => handleSort('edition_number')}
                      className="flex items-center space-x-1"
                    >
                      <span>Edition Number</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    <button 
                      onClick={() => handleSort('status')}
                      className="flex items-center space-x-1"
                    >
                      <span>Status</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    <button 
                      onClick={() => handleSort('created_at')}
                      className="flex items-center space-x-1"
                    >
                      <span>Created At</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.lineItems.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-4">
                      <Link 
                        href={`/admin/orders/${item.order_id}`}
                        className="text-primary hover:underline"
                      >
                        {item.order_id}
                      </Link>
                    </td>
                    <td className="p-4">{item.title}</td>
                    <td className="p-4">{item.quantity}</td>
                    <td className="p-4">${item.price.toFixed(2)}</td>
                    <td className="p-4">{item.edition_number || 'N/A'}</td>
                    <td className="p-4">
                      <Badge variant={item.status === 'active' ? 'default' : 'destructive'}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="mt-4 flex justify-center items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString())
                  params.set('page', (data.currentPage - 1).toString())
                  router.push(`/admin/product-editions/${productId}?${params.toString()}`)
                }}
                disabled={data.currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <span className="text-sm text-muted-foreground">
                Page {data.currentPage} of {data.totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString())
                  params.set('page', (data.currentPage + 1).toString())
                  router.push(`/admin/product-editions/${productId}?${params.toString()}`)
                }}
                disabled={data.currentPage === data.totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 