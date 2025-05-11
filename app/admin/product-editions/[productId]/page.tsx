'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@supabase/supabase-js'
import { AssignEditionNumbersButton, RevokeEditionButton } from './AssignEditionNumbersButton'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import ProductDetails from './ProductDetails'
import { LineItem } from '@/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getProductData(
  productId: string, 
  page: number = 1, 
  pageSize: number = 10,
  sortBy: string = 'created_at',
  sortOrder: 'asc' | 'desc' = 'desc',
  filters: {
    status?: string;
    minPrice?: number;
    maxPrice?: number;
    hasEditionNumber?: boolean;
  } = {}
) {
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('product_id', productId)
    .single()

  if (productError) {
    throw new Error('Error loading product details')
  }

  const start = (page - 1) * pageSize
  const end = start + pageSize - 1

  let query = supabase
    .from('order_line_items_v2')
    .select('*', { count: 'exact' })
    .eq('product_id', productId)

  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice)
  }
  if (filters.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice)
  }
  if (filters.hasEditionNumber) {
    query = query.not('edition_number', 'is', null)
  }

  const { data: lineItems, error: lineItemsError, count } = await query
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(start, end)

  if (lineItemsError) {
    throw new Error('Error loading line items')
  }

  const totalPages = count ? Math.ceil(count / pageSize) : 0

  return { 
    product, 
    lineItems, 
    totalPages, 
    currentPage: page,
    totalItems: count || 0
  }
}

export default function ProductEditionsPage({ params }: { params: Promise<{ productId: string }> }) {
  const resolvedParams = use(params)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchLineItems = async () => {
    try {
      const { data, error } = await supabase
        .from('order_line_items_v2')
        .select('*')
        .eq('product_id', resolvedParams.productId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setLineItems(data || [])
    } catch (error) {
      toast.error('Failed to fetch line items')
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLineItems()
  }, [resolvedParams.productId])

  const handleSuccess = () => {
    fetchLineItems()
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
      <ProductDetails lineItems={lineItems} productId={resolvedParams.productId} />
      <div className="grid gap-4">
        {lineItems.map((item) => (
          <div 
            key={item.id} 
            className="border p-4 rounded-lg flex justify-between items-center"
          >
            <div>
              <p>Order ID: {item.order_id}</p>
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
