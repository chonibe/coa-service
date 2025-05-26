'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'
import { Order } from '@/types/order'
import { OrderCard } from '@/components/OrderCard'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    async function fetchOrders() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          throw new Error('Not authenticated')
        }

        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select(`
            *,
            order_line_items (*)
          `)
          .eq('customer_id', user.user_metadata.customer_id)
          .order('created_at', { ascending: false })

        if (ordersError) {
          throw ordersError
        }

        setOrders(orders as Order[])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch orders')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [supabase])

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <ErrorMessage message={error} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Orders</h1>
          
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-lg font-medium text-gray-900">No orders found</h2>
              <p className="mt-1 text-sm text-gray-500">
                You haven't placed any orders yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 