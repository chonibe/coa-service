"use client"

import { useState, useEffect, Component, ErrorInfo, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface LineItem {
  line_item_id: string
  order_id: string
  title: string
  quantity: number
  price: number
  image_url: string
  status: string
  vendor: string
  edition_number: number
  edition_total: number
  nfc_tag_id: string | null
  nfc_claimed_at: string | null
}

interface Order {
  id: string
  name: string
  created_at: string
  line_items: LineItem[]
}

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Customer Preview</h1>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-red-800 mb-2">Something went wrong</h2>
              <p className="text-red-600 mb-4">{this.state.error?.message}</p>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function CustomerPreviewContent() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/admin/orders', {
          credentials: 'include' // Include cookies in the request
        })
        const data = await response.json()

        if (!response.ok) {
          if (response.status === 401) {
            // Redirect to login if unauthorized
            router.push('/admin/login')
            return
          }
          throw new Error(data.message || 'Failed to fetch orders')
        }

        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch orders')
        }

        setOrders(data.orders)
      } catch (err: any) {
        console.error('Error fetching orders:', err)
        setError(err.message || 'Failed to fetch orders')
        toast.error(err.message || 'Failed to fetch orders')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Customer Preview</h1>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Customer Preview</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Customer Preview</h1>
        
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-center">No orders found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold">{order.name}</h2>
                      <p className="text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {order.line_items.map((item) => (
                      <div key={item.line_item_id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-20 h-20 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-medium">{item.title}</h3>
                          <p className="text-sm text-gray-500">Vendor: {item.vendor}</p>
                          <div className="mt-2 flex items-center space-x-4">
                            <span className="text-sm text-gray-500">
                              Edition: {item.edition_number} of {item.edition_total}
                            </span>
                            <span className="text-sm text-gray-500">
                              Status: {item.status}
                            </span>
                            {item.nfc_tag_id && (
                              <span className="text-sm text-gray-500">
                                NFC Tag: {item.nfc_tag_id}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CustomerPreviewPage() {
  return (
    <ErrorBoundary>
      <CustomerPreviewContent />
    </ErrorBoundary>
  )
} 