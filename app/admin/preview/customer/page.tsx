"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { CertificateModal } from "./certificate-modal"
import { formatDate } from "../../../utils/date"
import { Button } from "@/components/ui/button"
import { Tag } from "lucide-react"
import React, { ReactNode, MouseEvent } from "react"

interface LineItem {
  line_item_id: string
  order_id: string
  title: string
  quantity: number
  price: number
  image_url: string | null
  status: string
  created_at: string
  vendor: string | null
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

function FloatingTiltCard({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null)

  // 3D tilt effect
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * 8 // max 8deg
    const rotateY = ((x - centerX) / centerX) * -8
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03,1.03,1.03)`
  }
  const handleMouseLeave = () => {
    const card = cardRef.current
    if (!card) return
    card.style.transform = ""
  }

  return (
    <div
      ref={cardRef}
      className={`relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg transition-transform duration-200 hover:shadow-2xl overflow-hidden ${className}`}
      style={{ willChange: "transform" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      tabIndex={0}
      {...props}
    >
      {/* Shimmer overlay */}
      <span className="pointer-events-none absolute inset-0 z-10 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <span className="block w-full h-full shimmer" />
      </span>
      {children}
    </div>
  )
}

export default function CustomerPreviewPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLineItem, setSelectedLineItem] = useState<LineItem | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/admin/orders")
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch orders")
      }

      setOrders(data.orders)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => 
    order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.line_items.some(item => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const handlePairNFC = async (item: LineItem) => {
    try {
      const response = await fetch("/api/nfc-tags/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          line_item_id: item.line_item_id,
          order_id: item.order_id,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to pair NFC tag")
      }

      // Refresh orders to show updated NFC status
      fetchOrders()
    } catch (err: any) {
      console.error("Error pairing NFC tag:", err)
      // You might want to show an error toast here
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Order Preview</h1>
        <div className="w-64">
          <Input
            placeholder="Search orders by name, ID, or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6">
        {filteredOrders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{order.name}</CardTitle>
                  <p className="text-sm text-gray-500">
                    Created: {formatDate(order.created_at)}
                  </p>
                </div>
                <Badge variant="outline">
                  {order.line_items.length} items
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {order.line_items.map((item) => (
                  <FloatingTiltCard
                    key={item.line_item_id}
                    className="flex items-center justify-between p-4 mb-2 cursor-pointer group"
                    onClick={() => setSelectedLineItem(item)}
                  >
                    <div className="flex items-center gap-4">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div>
                        <h3 className="font-medium text-white">{item.title}</h3>
                        <div className="text-sm space-y-1 mt-1">
                          {item.vendor && (
                            <p className="text-zinc-300 font-medium">Artist: {item.vendor}</p>
                          )}
                          {item.edition_number && item.edition_total && (
                            <p className="text-zinc-300 font-medium">Edition: {item.edition_number}/{item.edition_total}</p>
                          )}
                          <p className="text-zinc-400">Quantity: {item.quantity} × ${item.price}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                      {item.status === 'active' && !item.nfc_tag_id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePairNFC(item)
                          }}
                        >
                          <Tag className="w-4 h-4 mr-2" />
                          Pair NFC
                        </Button>
                      )}
                      {item.nfc_tag_id && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          Paired
                        </Badge>
                      )}
                    </div>
                  </FloatingTiltCard>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CertificateModal
        isOpen={!!selectedLineItem}
        onClose={() => setSelectedLineItem(null)}
        lineItem={selectedLineItem}
      />
      <style jsx global>{`
        .shimmer {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(120deg, rgba(255,255,255,0) 60%, rgba(255,255,255,0.12) 80%, rgba(255,255,255,0) 100%);
          background-size: 200% 100%;
          animation: shimmer-move 1.2s linear infinite;
          pointer-events: none;
        }
        @keyframes shimmer-move {
          0% { background-position: -100% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  )
} 