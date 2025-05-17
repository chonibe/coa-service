'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@supabase/supabase-js'
import { AssignEditionNumbersButton, RevokeEditionButton } from './AssignEditionNumbersButton'
import { toast } from 'sonner'
import ProductDetails from './ProductDetails'
import { LineItem } from '@/types'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ProductEditionsPage({ params }: { params: Promise<{ productId: string }> }) {
  const resolvedParams = use(params)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchLineItems = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('order_line_items_v2')
        .select('*')
        .eq('product_id', resolvedParams.productId)

      const { data, error } = await query
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
              <p>
                Order: {item.order_name ? (
                  <Link href={`/admin/orders/${item.order_id}`} className="text-blue-600 hover:underline">
                    {item.order_name}
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
