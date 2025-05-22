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
import { FloatingTiltCard, CertificateModal } from "./certificate-modal"

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
        const response = await fetch('/api/admin/orders')
        if (!response.ok) {
          throw new Error('Failed to fetch orders')
        }
        const data = await response.json()
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch orders')
        }
        setOrders(data.orders)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        toast.error('Failed to load orders')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const filteredOrders = orders.filter(order => 
    order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.line_items.some(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Your Orders</h1>
        <div className="relative w-64">
          <Input
            type="search"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
          />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No orders found</AlertTitle>
          <AlertDescription>
            {searchTerm ? 'Try adjusting your search terms' : 'You haven\'t placed any orders yet'}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6">
          {filteredOrders.map((order) => (
            <FloatingTiltCard key={order.id} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingBag className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm text-zinc-400">Order #{order.id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm text-zinc-400">{formatDate(order.created_at)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline" className={getStatusColor(order.line_items[0]?.status || '')}>
                    {order.line_items[0]?.status || 'Unknown'}
                  </Badge>
                  <span className="text-lg font-semibold text-white">
                    {formatCurrency(order.line_items.reduce((total, item) => total + (item.price * item.quantity), 0))}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {order.line_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50 hover:border-zinc-600/50 transition-colors"
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLineItem(item)}
                      className="ml-4"
                    >
                      View Certificate
                    </Button>
                  </div>
                ))}
              </div>
            </FloatingTiltCard>
          ))}
        </div>
      )}

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