"use client"

import { useState, useEffect, useRef, ReactNode } from "react"





import { Skeleton } from "@/components/ui/skeleton"

import { AlertCircle, CheckCircle, Clock, ShoppingBag, User, BadgeIcon as Certificate, Tag } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { CertificateModal } from "./certificate-modal"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"

import { Card, CardContent, CardHeader, CardTitle, Input, Button, Badge, Dialog, DialogContent, Alert, AlertDescription, AlertTitle } from "@/components/ui"
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
        const response = await fetch('/api/customer/orders', {
          credentials: 'include',
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
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">My Orders</h1>
          <p className="text-zinc-400">View and manage your orders</p>
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
            <FloatingCard key={order.id} className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold mb-1">{order.name}</h2>
                  <p className="text-sm text-zinc-400">
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <Badge className="mt-2 sm:mt-0">
                  {order.line_items.length} {order.line_items.length === 1 ? 'item' : 'items'}
                </Badge>
              </div>

              <div className="space-y-4">
                {order.line_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/50"
                  >
                    {item.img_url && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden">
                        <img
                          src={item.img_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{item.name}</h3>
                      {item.vendor_name && (
                        <p className="text-sm text-zinc-400 mb-2">{item.vendor_name}</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                        {item.edition_number && item.edition_total && (
                          <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                            Edition #{item.edition_number} of {item.edition_total}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="font-medium">{formatCurrency(item.price)}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedLineItem(item)}
                      >
                        View Certificate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </FloatingCard>
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