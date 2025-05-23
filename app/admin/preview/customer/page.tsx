"use client"

import { useState, useEffect, useRef, ReactNode, MouseEvent } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Clock, ShoppingBag, User, BadgeIcon as Certificate, Tag } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { CertificateModal } from "./certificate-modal"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"

// Utility functions
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'paid':
      return 'bg-green-500/10 text-green-400 border-green-500/20'
    case 'pending':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    case 'cancelled':
      return 'bg-red-500/10 text-red-400 border-red-500/20'
    default:
      return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

interface LineItem {
  id: string
  order_id: string
  name: string
  description: string | null
  price: number
  quantity: number
  vendor_name: string | null
  status: string
  created_at: string
  img_url: string | null
  edition_number: number | null
  edition_total: number | null
  nfc_tag_id: string | null
  nfc_claimed_at: string | null
}

interface Order {
  id: string
  name: string
  created_at: string
  line_items: LineItem[]
}

// Add shimmer effect styles
const shimmerStyles = `
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.shimmer {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}
`

function FloatingCard({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const cardRef = useRef<HTMLDivElement>(null)
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * 5
    const rotateY = ((x - centerX) / centerX) * -5
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`
  }
  
  const handleMouseLeave = () => {
    const card = cardRef.current
    if (!card) return
    card.style.transform = ""
  }
  
  return (
    <>
      <style>{shimmerStyles}</style>
      <div
        ref={cardRef}
        className={`relative bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:border-zinc-700/50 overflow-hidden ${className}`}
        style={{ willChange: "transform" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {/* Shimmer overlay */}
        <span className="pointer-events-none absolute inset-0 z-10 opacity-0 hover:opacity-100 transition-opacity duration-300">
          <span className="block w-full h-full shimmer" />
        </span>
        {children}
      </div>
    </>
  )
}

export default function CustomerPreviewPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLineItem, setSelectedLineItem] = useState<LineItem | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        console.log('Fetching orders...')
        const response = await fetch('/api/admin/orders', {
          credentials: 'include', // Include cookies in the request
          headers: {
            'x-preview-mode': 'true'
          }
        })
        console.log('Response status:', response.status)
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error('Error response:', errorData)
          throw new Error(errorData.message || 'Failed to fetch orders')
        }

        const data = await response.json()
        console.log('Received data:', data)

        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch orders')
        }

        if (!Array.isArray(data.orders)) {
          console.error('Invalid orders data:', data)
          throw new Error('Invalid orders data received')
        }

        setOrders(data.orders)
      } catch (err) {
        console.error('Error in fetchOrders:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
        toast.error('Failed to load orders')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const filteredOrders = orders.filter(order => {
    if (!order || !order.line_items) return false
    
    return order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.line_items.some(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
  })

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No orders found</AlertTitle>
        <AlertDescription>
          You haven't placed any orders yet
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Customer Preview</h1>
          <p className="text-zinc-400">View and manage customer orders</p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-96 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden"
            >
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold">Order #{order.id}</h2>
                    <p className="text-sm text-zinc-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      order.line_items[0]?.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      order.line_items[0]?.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {order.line_items[0]?.status?.charAt(0).toUpperCase() + order.line_items[0]?.status?.slice(1) || 'Unknown'}
                    </span>
                    <span className="text-lg font-semibold">
                      ${order.line_items.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {order.line_items.map((item) => (
                    <FloatingCard
                      key={item.id}
                      className="group relative flex items-start gap-4 p-4 cursor-pointer"
                      onClick={() => setSelectedLineItem(item)}
                    >
                      {item.img_url && (
                        <div className="relative w-24 h-24 flex-shrink-0">
                          <img
                            src={item.img_url}
                            alt={item.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate">{item.name}</h3>
                        {item.vendor_name && (
                          <p className="text-sm text-zinc-400 mt-1">{item.vendor_name}</p>
                        )}
                        {item.edition_number && item.edition_total && (
                          <div className="flex items-center gap-2 mt-2">
                            <Tag className="h-4 w-4 text-indigo-400" />
                            <span className="text-sm text-indigo-400">
                              Edition #{item.edition_number} of {item.edition_total}
                            </span>
                          </div>
                        )}
                      </div>
                    </FloatingCard>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CertificateModal
        lineItem={selectedLineItem ? {
          line_item_id: selectedLineItem.id,
          title: selectedLineItem.name,
          image_url: selectedLineItem.img_url,
          vendor: selectedLineItem.vendor_name,
          edition_number: selectedLineItem.edition_number,
          edition_total: selectedLineItem.edition_total
        } : null}
        onClose={() => setSelectedLineItem(null)}
      />
    </div>
  )
} 