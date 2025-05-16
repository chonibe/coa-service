"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LineItem } from '@/types'
import { StatusToggle } from './StatusToggle'

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
  productId: string
  searchParams: URLSearchParams
}

interface Filters {
  status: string
  hasEditionNumber: boolean
}

export function ProductDetails({ productId, searchParams }: ProductDetailsProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [totalEditions, setTotalEditions] = useState(0)
  const [activeEditions, setActiveEditions] = useState(0)
  const [pageSize, setPageSize] = useState('10')
  const [filters, setFilters] = useState<Filters>({
    status: searchParams.get('status') || 'all',
    hasEditionNumber: searchParams.get('hasEditionNumber') === 'true'
  })

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      const size = searchParams.get('pageSize') || '10'
      setPageSize(size)
    }
  }, [searchParams, mounted])

  useEffect(() => {
    if (mounted && lineItems.length > 0) {
      setTotalEditions(lineItems.length)
      setActiveEditions(lineItems.filter((item: LineItem) => item.status === 'active').length)
    }
  }, [lineItems, mounted])

  const updateFilters = (newFilters: Partial<Filters>) => {
    if (mounted) {
      setFilters((prev: Filters) => ({ ...prev, ...newFilters }))
    }
  }

  const handleStatusChange = () => {
    // Refresh the line items after status change
    if (mounted) {
      fetchLineItems()
    }
  }

  const fetchLineItems = async () => {
    if (!mounted) return

    try {
      const response = await fetch(`/api/line-items?productId=${productId}&pageSize=${pageSize}`)
      const data = await response.json()
      setLineItems(data)
    } catch (error) {
      console.error('Error fetching line items:', error)
    }
  }

  useEffect(() => {
    if (mounted) {
      fetchLineItems()
    }
  }, [productId, pageSize, mounted])

  const applyFilters = () => {
    if (!mounted) return

    const params = new URLSearchParams(searchParams.toString())
    if (filters.status) params.set('status', filters.status)
    if (filters.hasEditionNumber) params.set('hasEditionNumber', 'true')
    router.push(`/admin/product-editions/${productId}?${params.toString()}`)
  }

  const handleSort = (column: string) => {
    if (!mounted) return

    const params = new URLSearchParams(searchParams.toString())
    const currentSort = params.get('sortBy')
    const currentOrder = params.get('sortOrder')
    
    const newOrder = currentSort === column && currentOrder === 'asc' ? 'desc' : 'asc'
    params.set('sortBy', column)
    params.set('sortOrder', newOrder)
    
    router.push(`/admin/product-editions/${productId}?${params.toString()}`)
  }

  const handlePageSizeChange = (size: string) => {
    if (!mounted) return

    const params = new URLSearchParams(searchParams.toString())
    params.set('pageSize', size)
    params.set('page', '1') // Reset to first page when changing page size
    router.push(`/admin/product-editions/${productId}?${params.toString()}`)
  }

  // Don't render anything until mounted
  if (!mounted) {
    return null
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
                value={filters.status}
                onValueChange={(value: string) => updateFilters({ status: value })}
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

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasEditionNumber"
                  checked={filters.hasEditionNumber}
                  onCheckedChange={(checked: boolean) => 
                    updateFilters({ hasEditionNumber: checked })
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
                    <th className="text-left p-4">Order ID</th>
                    <th className="text-left p-4">Created</th>
                    <th className="text-left p-4">Edition</th>
                    <th className="text-left p-4">Total Editions</th>
                    <th className="text-left p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item: LineItem) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-4">
                        {item.order_name ? (
                          <Link href={`/admin/orders/${item.order_id}`} className="text-blue-600 hover:underline">
                            Order #{item.order_name}
                          </Link>
                        ) : (
                          <Link href={`/admin/orders/${item.order_id}`} className="text-blue-600 hover:underline">
                            {item.order_id}
                          </Link>
                        )}
                      </td>
                      <td className="p-4">{new Date(item.created_at).toLocaleString()}</td>
                      <td className="p-4">{item.edition_number || 'Not assigned'}</td>
                      <td className="p-4">{item.edition_total !== null ? item.edition_total.toString() : 'N/A'}</td>
                      <td className="p-4">
                        <StatusToggle
                          lineItemId={item.id}
                          orderId={item.order_id}
                          initialStatus={item.status}
                          onStatusChange={handleStatusChange}
                          totalEditions={totalEditions}
                          activeEditions={activeEditions}
                        />
                      </td>
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