'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@supabase/supabase-js'
import { AssignEditionNumbersButton, RevokeEditionButton } from './AssignEditionNumbersButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import ProductDetails from './ProductDetails'
import { LineItem } from '@/types'
import Link from 'next/link'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ProductEditionsPage({ params }: { params: Promise<{ productId: string }> }) {
  const resolvedParams = use(params)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [filters, setFilters] = useState({
    status: '',
    hasEditionNumber: false,
  })
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const pageSize = 10

  const fetchLineItems = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('order_line_items_v2')
        .select('*', { count: 'exact' })
        .eq('product_id', resolvedParams.productId)

      // Apply search
      if (searchQuery) {
        query = query.or(`order_name.ilike.%${searchQuery}%,order_id.ilike.%${searchQuery}%`)
      }

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }
      if (filters.hasEditionNumber) {
        query = query.not('edition_number', 'is', null)
      }

      // Apply sorting and pagination
      const start = (currentPage - 1) * pageSize
      const end = start + pageSize - 1

      const { data, error, count } = await query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(start, end)

      if (error) throw error

      setLineItems(data || [])
      setTotalItems(count || 0)
      setTotalPages(Math.ceil((count || 0) / pageSize))
    } catch (error) {
      toast.error('Failed to fetch line items')
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLineItems()
  }, [resolvedParams.productId, currentPage, searchQuery, filters, sortBy, sortOrder])

  const handleSuccess = () => {
    fetchLineItems()
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchLineItems()
  }

  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Product Editions</h1>
        <AssignEditionNumbersButton productId={resolvedParams.productId} onSuccess={handleSuccess} />
      </div>

      <div className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by order name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Created Date</SelectItem>
              <SelectItem value="edition_number">Edition Number</SelectItem>
              <SelectItem value="order_name">Order Name</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}>
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
          <Button type="submit">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </form>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {lineItems.length} of {totalItems} items
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      <ProductDetails lineItems={lineItems} productId={resolvedParams.productId} />
      
      <div className="grid gap-4">
        {lineItems.map((item) => (
          <div 
            key={item.id} 
            className="border p-4 rounded-lg flex justify-between items-center"
          >
            <div>
              <p>
                Order: {item.order_name ? (
                  <Link href={`/admin/orders/${item.order_id}`} className="text-blue-600 hover:underline">
                    Order #{item.order_name}
                  </Link>
                ) : (
                  <Link href={`/admin/orders/${item.order_id}`} className="text-blue-600 hover:underline">
                    {item.order_id}
                  </Link>
                )}
              </p>
              <p>Created: {new Date(item.created_at).toLocaleString()}</p>
              <p>Edition: {item.edition_number || 'Not assigned'}</p>
              {item.edition_total && <p>Total Editions: {item.edition_total}</p>}
            </div>
            {item.edition_number && (
              <RevokeEditionButton 
                lineItemId={item.id} 
                onSuccess={handleSuccess}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
