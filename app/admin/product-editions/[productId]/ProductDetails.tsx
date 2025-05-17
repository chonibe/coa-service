"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowUpDown, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LineItem } from '@/types'

interface Product {
  id: string
  product_id: string
  name: string
  vendor_name: string
  sku: string
  edition_size: string | null
  price: number | null
}

interface ProductDetailsProps {
  lineItems: LineItem[]
  productId: string
}

export default function ProductDetails({ lineItems, productId }: ProductDetailsProps) {
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
                Showing {lineItems.length} of {lineItems.length} items
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Order</th>
                    <th className="text-left p-4">Created</th>
                    <th className="text-left p-4">Edition</th>
                    <th className="text-left p-4">Total Editions</th>
                    <th className="text-left p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-4">
                        <Link 
                          href={`/admin/orders/${item.order_id}`}
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          Order #{item.order_id}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                      <td className="p-4">{new Date(item.created_at).toLocaleString()}</td>
                      <td className="p-4">{item.edition_number || 'Not assigned'}</td>
                      <td className="p-4">{item.edition_total || 'N/A'}</td>
                      <td className="p-4">{item.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 