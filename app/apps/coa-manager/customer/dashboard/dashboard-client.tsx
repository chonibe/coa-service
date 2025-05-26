'use client'

import { useEffect, useState } from 'react'

declare global {
  interface Window {
    Shopify?: {
      customer?: {
        id: string
      }
    }
  }
}

export default function DashboardClient({ customerId }: { customerId: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    async function loadOrders() {
      try {
        // Get customer ID from Shopify first
        const shopifyCustomerId = window.Shopify?.customer?.id
        if (!shopifyCustomerId) {
          throw new Error('Please log in to your Shopify account')
        }

        const response = await fetch('/api/customer/orders', {
          headers: {
            'X-Customer-ID': shopifyCustomerId
          }
        })
        
        if (!response.ok) throw new Error('Failed to fetch orders')
        
        const data = await response.json()
        setOrders(data.orders)
      } catch (error) {
        console.error('Error loading orders:', error)
        setError(error instanceof Error ? error.message : 'Failed to load orders')
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [customerId])

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading your orders...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-state">
        <p>{error}</p>
        <a href="/account/login" className="action-button outline">
          Log In to Shopify
        </a>
      </div>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="empty-state">
        <p>You haven't placed any orders yet</p>
        <a href="/collections/all" className="action-button outline">
          Start Shopping
        </a>
      </div>
    )
  }

  return (
    <div className="orders-list">
      {orders.map(order => (
        <div key={order.id} className="order-card">
          <div className="order-header">
            <div>
              <h2 className="order-title">Order {order.name}</h2>
              <p className="order-date">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
              <p className="order-total">Total: {formatMoney(order.total_price)}</p>
            </div>
            <div className="order-status">
              <span className={`status-badge ${order.financial_status}`}>
                {order.financial_status.charAt(0).toUpperCase() + order.financial_status.slice(1)}
              </span>
            </div>
          </div>

          <div className="line-items">
            {order.line_items.map((item: any) => {
              const nfcStatus = getNfcStatus(item)
              return (
                <div key={item.line_item_id} className="line-item">
                  <div className="line-item-info">
                    {item.image_url && (
                      <div className="line-item-image">
                        <img src={item.image_url} alt={item.title} />
                      </div>
                    )}
                    <div className="line-item-details">
                      <h3>{item.title}</h3>
                      <p>Quantity: {item.quantity}</p>
                      <p>Price: {formatMoney(item.price)}</p>
                      {item.edition_number && (
                        <p className="edition-info">
                          Edition {item.edition_number} of {item.edition_total}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="line-item-actions">
                    <span className={`nfc-badge ${nfcStatus.className}`}>{nfcStatus.label}</span>
                    {nfcStatus.status === 'unpaired' ? (
                      <a href={`/pages/authenticate?lineItemId=${item.line_item_id}`} className="action-button outline">
                        Pair NFC Tag
                      </a>
                    ) : nfcStatus.status === 'paired' && item.certificate_url ? (
                      <a href={item.certificate_url} className="action-button outline">
                        View Certificate
                      </a>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function getNfcStatus(lineItem: any) {
  if (lineItem.nfc_tag_id && lineItem.nfc_claimed_at) {
    return { status: 'paired', label: 'Paired', className: 'paired' }
  }
  if (lineItem.nfc_tag_id) {
    return { status: 'unclaimed', label: 'Unclaimed', className: 'unclaimed' }
  }
  return { status: 'unpaired', label: 'Unpaired', className: 'unpaired' }
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount / 100)
} 