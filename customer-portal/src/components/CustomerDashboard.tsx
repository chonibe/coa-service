"use client"

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, LayoutGroup, Variants } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Loader2, 
  AlertCircle, 
  BadgeIcon as Certificate, 
  Wifi, 
  WifiOff, 
  ExternalLink, 
  Award, 
  User, 
  Calendar, 
  Album, 
  LayoutGrid, 
  ArrowRight 
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { Toaster } from "@/components/ui"

// Type Definitions
export interface LineItem {
  line_item_id: string
  name: string
  description?: string
  quantity: number
  price?: number
  img_url?: string
  nfc_tag_id: string | null
  certificate_url: string
  certificate_token?: string
  nfc_claimed_at?: string | null
  order_id?: string
  edition_number?: number | null
  edition_total?: number | null
  vendor_name?: string
  status?: string
}

export interface Order {
  id: string
  order_number: number
  processed_at: string
  total_price: number
  financial_status: string
  fulfillment_status: string | null
  line_items: LineItem[]
}

// Timeline data type
export type TimelineMilestone = {
  date: Date
  items: LineItem[]
  orderId: string
  orderNumber: number
}

// Vinyl-like artwork card component
const VinylArtworkCard = ({ 
  item, 
  isSelected, 
  onSelect, 
  onNfcWrite, 
  onCertificateView 
}: { 
  item: LineItem, 
  isSelected: boolean, 
  onSelect: () => void, 
  onNfcWrite: () => void, 
  onCertificateView: () => void 
}) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-100, 0, 100], [-15, 0, 15])
  const scale = useTransform(x, [-100, 0, 100], [0.9, 1, 0.9])

  const getCertificationStatus = () => {
    if (!item.certificate_url) return "no-certificate";
    if (!item.nfc_tag_id) return "digital-only";
    if (item.nfc_claimed_at) return "nfc-paired";
    return "nfc-unpaired";
  }

  const status = getCertificationStatus()

  return (
    <motion.div 
      ref={cardRef}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      style={{ 
        x, 
        rotate, 
        scale,
        cursor: 'grab',
        zIndex: isSelected ? 10 : 1
      }}
      whileTap={{ cursor: 'grabbing' }}
      onClick={onSelect}
      className={`
        relative min-w-[420px] h-[245px] mx-4 rounded-2xl 
        transition-all duration-300 
        ${isSelected ? 'shadow-2xl scale-105' : 'shadow-lg'}
        bg-gradient-to-br from-zinc-900/80 via-zinc-800/80 to-zinc-900/80 
        backdrop-blur-sm border border-zinc-700/50
        flex items-stretch
      `}
    >
      {/* Artwork Image - Left Side */}
      <div className="w-[245px] flex-shrink-0 relative overflow-hidden rounded-l-2xl">
        {item.img_url ? (
          <img 
            src={item.img_url} 
            alt={item.name} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full bg-zinc-800/50 flex items-center justify-center">
            <Album className="w-24 h-24 text-zinc-600" />
          </div>
        )}
      </div>

      {/* Artwork Details - Right Side */}
      <div className="flex-grow p-6 flex flex-col justify-between">
        {/* Top Section - Title and Artist */}
        <div>
          <h3 className="text-xl font-bold text-white mb-2 truncate">{item.name}</h3>
          <p className="text-sm text-zinc-400 truncate mb-4">
            {item.vendor_name || "Street Collector"}
          </p>
        </div>

        {/* Middle Section - Status Badges */}
        <div className="space-y-2">
          {status === "nfc-paired" && (
            <Badge className="bg-green-500/20 text-green-400 border-green-400/30">
              <Wifi className="h-3 w-3 mr-1" /> NFC Paired
            </Badge>
          )}
          {status === "nfc-unpaired" && (
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-400/30">
              <WifiOff className="h-3 w-3 mr-1" /> Ready to Pair
            </Badge>
          )}
          {status === "digital-only" && (
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/30">
              <Certificate className="h-3 w-3 mr-1" /> Digital Only
            </Badge>
          )}
        </div>

        {/* Bottom Section - Actions */}
        <div className="flex gap-2 mt-4">
          <Button 
            size="sm" 
            variant="outline" 
            className="text-amber-400 border-amber-500/30 hover:bg-amber-500/10 flex-1"
            onClick={(e) => {
              e.stopPropagation()
              onCertificateView()
            }}
          >
            <Certificate className="h-4 w-4 mr-2" /> Certificate
          </Button>
          {item.nfc_tag_id && (
            <Button 
              size="sm" 
              variant="outline" 
              className="text-blue-400 border-blue-500/30 hover:bg-blue-500/10 flex-1"
              onClick={(e) => {
                e.stopPropagation()
                onNfcWrite()
              }}
            >
              <Wifi className="h-4 w-4 mr-2" /> NFC
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Timeline Component
const CollectionTimeline = ({ orders }: { orders: Order[] }) => {
  // Sort orders by processed date
  const sortedOrders = [...orders].sort((a, b) => 
    new Date(a.processed_at).getTime() - new Date(b.processed_at).getTime()
  )

  // Prepare timeline data with proper typing
  const timelineData: TimelineMilestone[] = sortedOrders.map((order, index) => ({
    date: new Date(order.processed_at),
    items: order.line_items,
    orderId: order.id,
    orderNumber: order.order_number
  }))

  // Timeline Item Variants
  const itemVariants: Variants = {
    hidden: { opacity: 0, x: -50 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 30 
      }
    },
    hover: { 
      scale: 1.05,
      transition: { type: "spring", stiffness: 300 }
    }
  }

  return (
    <div className="relative w-full py-12">
      {/* Timeline Line */}
      <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-1 bg-zinc-800"></div>
      
      <LayoutGroup>
        <motion.div className="relative space-y-12">
          {timelineData.map((milestone, index) => (
            <motion.div 
              key={milestone.orderId}
              layout
              variants={itemVariants}
              initial="hidden"
              whileInView="visible"
              whileHover="hover"
              viewport={{ once: true, amount: 0.3 }}
              className={`
                flex items-center w-full 
                ${index % 2 === 0 ? 'flex-row-reverse' : ''}
              `}
            >
              {/* Timeline Dot */}
              <motion.div 
                layoutId={`dot-${milestone.orderId}`}
                className="absolute left-1/2 transform -translate-x-1/2 
                  w-6 h-6 bg-amber-500 rounded-full 
                  border-4 border-zinc-900 z-10"
              />
            </motion.div>
          ))}
        </motion.div>
      </LayoutGroup>
    </div>
  )
}

export default function CustomerDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLineItem, setSelectedLineItem] = useState<LineItem | null>(null)
  const [selectedArtworkIndex, setSelectedArtworkIndex] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'vinyl' | 'grid'>('vinyl')

  // Prepare timeline data with proper typing using useMemo
  const timelineData = useMemo<TimelineMilestone[]>(() => 
    orders.map(order => ({
      date: new Date(order.processed_at),
      items: order.line_items,
      orderId: order.id,
      orderNumber: order.order_number
    })),
    [orders]
  )

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Use the customer API endpoint
        const response = await fetch('/api/customer/orders')
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || 'Failed to fetch orders')
        }

        const data = await response.json()
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch orders')
        }

        setOrders(data.orders || [])
      } catch (err: any) {
        console.error('Dashboard Fetch Error:', err)
        setError(err.message || 'An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const handleCertificateClick = (lineItem: LineItem) => {
    setSelectedLineItem(lineItem)
  }

  const handleNfcWrite = async (lineItem: LineItem) => {
    // Placeholder for NFC writing logic
    toast({
      title: "NFC Pairing",
      description: `Preparing to pair NFC tag for ${lineItem.name}`,
      variant: "default"
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-zinc-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-zinc-200 mb-2">Dashboard Error</h2>
          <p className="text-zinc-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Vinyl Collection Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Your Vinyl Collection</h1>
          <div className="flex items-center gap-4">
            <Button 
              variant={viewMode === 'vinyl' ? 'default' : 'outline'} 
              onClick={() => setViewMode('vinyl')}
              className="text-zinc-400 hover:text-white"
            >
              <Album className="h-5 w-5 mr-2" /> Vinyl View
            </Button>
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'outline'} 
              onClick={() => setViewMode('grid')}
              className="text-zinc-400 hover:text-white"
            >
              <LayoutGrid className="h-5 w-5 mr-2" /> Grid View
            </Button>
          </div>
        </div>

        {/* Conditional Rendering for Vinyl or Grid View */}
        {viewMode === 'vinyl' ? (
          <div className="relative overflow-x-auto pb-8">
            <div className="flex items-center space-x-4 min-w-max">
              <AnimatePresence>
                {orders.flatMap(order => order.line_items).map((item, index) => (
                  <VinylArtworkCard 
                    key={item.line_item_id}
                    item={item}
                    isSelected={selectedArtworkIndex === index}
                    onSelect={() => setSelectedArtworkIndex(index)}
                    onNfcWrite={() => handleNfcWrite(item)}
                    onCertificateView={() => handleCertificateClick(item)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.flatMap(order => order.line_items).map((item, index) => (
              <VinylArtworkCard 
                key={item.line_item_id}
                item={item}
                isSelected={selectedArtworkIndex === index}
                onSelect={() => setSelectedArtworkIndex(index)}
                onNfcWrite={() => handleNfcWrite(item)}
                onCertificateView={() => handleCertificateClick(item)}
              />
            ))}
          </div>
        )}

        {/* Timeline Section */}
        <CollectionTimeline orders={orders} />
      </div>

      <Toaster />
    </div>
  )
} 