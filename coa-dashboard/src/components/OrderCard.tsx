import { Order, OrderLineItem } from '@/types/order'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

interface OrderCardProps {
  order: Order
}

export function OrderCard({ order }: OrderCardProps) {
  const [isClaiming, setIsClaiming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient<Database>()

  const handleClaimNFC = async (lineItemId: string, nfcTagId: string) => {
    setIsClaiming(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('order_line_items')
        .update({ nfc_claimed_at: new Date().toISOString() })
        .eq('id', lineItemId)

      if (updateError) throw updateError

      // Refresh the page to show updated state
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim NFC tag')
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
          {order.order_line_items.map((item: OrderLineItem) => (
            <div key={item.id} className="flex gap-6 p-4 border border-gray-200 rounded-lg">
              <div className="w-24 h-24 flex-shrink-0">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover rounded-md"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                {item.vendor_name && (
                  <p className="text-sm text-gray-500">{item.vendor_name}</p>
                )}
                <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(parseFloat(item.price))}
                </p>

                {item.nfc_tag_id && (
                  <div className="mt-2">
                    <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      item.nfc_claimed_at
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.nfc_claimed_at ? 'NFC Tag Claimed' : 'NFC Tag Unclaimed'}
                    </div>
                    {!item.nfc_claimed_at && (
                      <button
                        onClick={() => handleClaimNFC(item.id, item.nfc_tag_id!)}
                        disabled={isClaiming}
                        className="ml-2 inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 disabled:opacity-50"
                      >
                        {isClaiming ? 'Claiming...' : 'Claim NFC Tag'}
                      </button>
                    )}
                  </div>
                )}

                {item.edition_number && (
                  <div className="mt-2 text-sm text-gray-600">
                    Edition {item.edition_number} of {item.edition_total}
                  </div>
                )}

                {item.certificate_url && (
                  <a
                    href={item.certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800"
                  >
                    View Certificate
                  </a>
                )}

                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 