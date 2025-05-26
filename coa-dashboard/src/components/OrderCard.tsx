import { Order, OrderLineItem } from '@/types/order'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

interface OrderCardProps {
  order: Order
}

export function OrderCard({ order }: OrderCardProps) {
  const [isClaiming, setIsClaiming] = useState(false)
  const supabase = createClientComponentClient<Database>()

  const handleClaimNFC = async (lineItemId: string) => {
    try {
      setIsClaiming(true)
      const { error } = await supabase
        .from('order_line_items')
        .update({ nfc_claimed_at: new Date().toISOString() })
        .eq('line_item_id', lineItemId)

      if (error) throw error
    } catch (error) {
      console.error('Error claiming NFC tag:', error)
    } finally {
      setIsClaiming(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Order {order.name}</h2>
            <p className="text-sm text-gray-500">
              Placed on {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            order.financial_status === 'paid' 
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {order.financial_status.charAt(0).toUpperCase() + order.financial_status.slice(1)}
          </span>
        </div>
      </div>

      <div className="px-6 py-4">
        <div className="space-y-4">
          {order.line_items.map((item) => (
            <div key={item.id} className="flex items-start space-x-4 p-4 border rounded-lg">
              <div className="w-20 h-20 flex-shrink-0">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover rounded"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{item.title}</h3>
                <p className="text-sm text-gray-500">
                  {item.vendor} • Edition {item.edition_number} of {item.edition_total}
                </p>
                <div className="mt-2 flex items-center space-x-4">
                  <span className="text-sm">
                    Quantity: {item.quantity}
                  </span>
                  <span className="text-sm font-medium">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(parseFloat(item.total))}
                  </span>
                </div>
                {item.certificate_url && (
                  <div className="mt-2">
                    <button
                      className="text-sm text-blue-600 hover:text-blue-800"
                      onClick={() => window.open(item.certificate_url, '_blank')}
                    >
                      View Certificate
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 