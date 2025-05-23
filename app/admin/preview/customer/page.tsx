"use client"

import { useState, useEffect, Component, ErrorInfo, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Clock, ShoppingBag, User, BadgeIcon as Certificate } from "lucide-react"
import FloatingTiltCard from "./certificate-modal"

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

// Add certificate interface
interface Certificate {
  lineItem: {
    editionNumber: number
    editionTotal: number
    updatedAt: string
    certificateGeneratedAt: string
    accessToken: string
  }
  product: {
    title: string
    description: string
    vendor: string
    images: Array<{ src: string; alt: string }>
  }
  order: {
    orderName: string
    processedAt: string
    customer: {
      firstName: string
      lastName: string
    }
  }
}

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

// Helper function to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Helper function to get status color
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'inactive':
      return 'bg-gray-100 text-gray-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'completed':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Add shimmer effect component
const Shimmer = () => (
  <div className="animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] h-full w-full" />
)

// Add 3D card effect styles
const cardStyles = {
  transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
  transition: 'transform 0.3s ease-in-out',
  transformStyle: 'preserve-3d',
  '&:hover': {
    transform: 'perspective(1000px) rotateX(5deg) rotateY(5deg)',
  },
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
  
  // Add state for certificate preview
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null)
  const [isCertificateLoading, setIsCertificateLoading] = useState(false)
  const [certificateError, setCertificateError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/admin/orders', {
          credentials: 'include', // Include cookies in the request
          headers: {
            'x-preview-mode': 'true'
          }
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

  // Add function to fetch certificate
  const fetchCertificate = async (lineItemId: string) => {
    try {
      setIsCertificateLoading(true)
      setCertificateError(null)
      
      const response = await fetch(`/api/certificate/${lineItemId}`, {
        headers: {
          'x-preview-mode': 'true'
        }
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch certificate')
      }

      setSelectedCertificate(data.certificate)
    } catch (err: any) {
      console.error('Error fetching certificate:', err)
      setCertificateError(err.message || 'Failed to fetch certificate')
      toast.error(err.message || 'Failed to fetch certificate')
    } finally {
      setIsCertificateLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Customer Preview</h1>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                      <div className="h-6 bg-gray-200 rounded w-1/3">
                        <Shimmer />
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-1/4">
                        <Shimmer />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {[1, 2].map((j) => (
                      <div key={j} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div className="w-20 h-20 bg-gray-200 rounded overflow-hidden">
                          <Shimmer />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="h-5 bg-gray-200 rounded w-1/2">
                            <Shimmer />
                          </div>
                          <div className="h-4 bg-gray-200 rounded w-1/4">
                            <Shimmer />
                          </div>
                          <div className="flex space-x-4">
                            <div className="h-4 bg-gray-200 rounded w-1/6">
                              <Shimmer />
                            </div>
                            <div className="h-4 bg-gray-200 rounded w-1/6">
                              <Shimmer />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Orders</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Please try the following:</p>
              <ul className="list-disc list-inside text-sm text-gray-600">
                <li>Check your internet connection</li>
                <li>Make sure you're logged in</li>
                <li>Try refreshing the page</li>
              </ul>
            </div>
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
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-gray-500 text-center">No orders found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <FloatingTiltCard 
                key={order.id} 
                className="mb-6"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-white">{order.name}</h2>
                      <p className="text-zinc-400">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {order.line_items.map((item) => (
                      <div 
                        key={item.line_item_id} 
                        className="flex items-start space-x-4 p-4 bg-zinc-800/50 rounded-lg cursor-pointer transition-all duration-200 hover:bg-zinc-800"
                        onClick={() => fetchCertificate(item.line_item_id)}
                      >
                        {item.image_url && (
                          <div className="w-20 h-20 rounded overflow-hidden relative">
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 transition-opacity duration-200 group-hover:bg-opacity-10" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-medium text-white">{item.title}</h3>
                          <p className="text-sm text-zinc-400">{item.vendor}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                            <span className="text-sm text-zinc-400">
                              Edition #{item.edition_number} of {item.edition_total}
                            </span>
                          </div>
                          <p className="text-sm font-medium mt-1 text-white">
                            {formatCurrency(item.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </FloatingTiltCard>
            ))}
          </div>
        )}
      </div>

      {/* Certificate Preview Dialog */}
      <Dialog open={!!selectedCertificate} onOpenChange={() => setSelectedCertificate(null)}>
        <DialogContent className="max-w-3xl">
          {isCertificateLoading ? (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold">Loading Certificate...</h2>
                <p className="text-gray-500">Please wait while we fetch the certificate details</p>
              </div>
              <div className="space-y-4">
                <div className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden">
                  <Skeleton className="absolute inset-0" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
            </div>
          ) : certificateError ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{certificateError}</AlertDescription>
              </Alert>
            </div>
          ) : selectedCertificate && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center p-2 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold">Certificate of Authenticity</h2>
                <p className="text-gray-500">
                  Edition #{selectedCertificate.lineItem.editionNumber} of {selectedCertificate.lineItem.editionTotal}
                </p>
              </div>

              {selectedCertificate.product.images && selectedCertificate.product.images.length > 0 && (
                <div className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={selectedCertificate.product.images[0].src}
                    alt={selectedCertificate.product.images[0].alt}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-start">
                    <Certificate className="h-5 w-5 text-indigo-600 mt-0.5 mr-2" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Edition Details</h3>
                      <p className="text-indigo-600 font-bold text-lg">
                        #{selectedCertificate.lineItem.editionNumber} of {selectedCertificate.lineItem.editionTotal}
                      </p>
                      <p className="text-sm text-gray-500">Limited Edition</p>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-indigo-600 mt-0.5 mr-2" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Authentication Date</h3>
                      <p className="text-gray-600">
                        {formatDate(selectedCertificate.lineItem.updatedAt)}
                      </p>
                      <p className="text-sm text-gray-500">Last verified edition number</p>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-start">
                    <ShoppingBag className="h-5 w-5 text-indigo-600 mt-0.5 mr-2" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Purchase Information</h3>
                      <p className="text-gray-600">{selectedCertificate.order.orderName}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(selectedCertificate.order.processedAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-start">
                    <User className="h-5 w-5 text-indigo-600 mt-0.5 mr-2" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Ownership</h3>
                      <p className="text-gray-600">
                        {selectedCertificate.order.customer.firstName} {selectedCertificate.order.customer.lastName}
                      </p>
                      <p className="text-sm text-gray-500">Original Purchaser</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-2">Product Description</h3>
                <div className="text-gray-600 prose prose-sm max-w-none">
                  <p>{selectedCertificate.product.description}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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