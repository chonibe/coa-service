"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
} from "lucide-react"
import { NfcTagScanner } from '@/src/components/NfcTagScanner'
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { CertificateModal } from '../../customer/dashboard/certificate-modal'
import { useNFCScan } from '@/hooks/use-nfc-scan'
import { motion, LayoutGroup, Variants, useScroll } from "framer-motion"

// Type Definitions
interface LineItem {
  line_item_id: string
  order_id: string
  name: string
  img_url?: string
  price?: number
  quantity?: number
  vendor_name?: string
  edition_number?: number
  edition_total?: number
  certificate_url?: string
  nfc_tag_id?: string
  nfc_claimed_at?: string
  status?: string
}

interface Order {
  id: string
  order_number: number
  processed_at: string
  total_price: number
  financial_status: string
  fulfillment_status: string | null
  line_items: LineItem[]
}

interface TimelineMilestone {
  orderId: string
  orderNumber: string
  date: Date
  items: LineItem[]
}

// Vinyl-like artwork card component
const VinylArtworkCard = ({ 
  item, 
  isSelected, 
  onSelect, 
  onCertificateView 
}: { 
  item: LineItem, 
  isSelected: boolean, 
  onSelect: () => void, 
  onCertificateView: () => void 
}) => {
  const [isPairing, setIsPairing] = useState(false)

  const { startScanning, stopScanning, isScanning, error: nfcError } = useNFCScan({
    onSuccess: async (tagData) => {
      try {
        setIsPairing(true)
        const response = await fetch('/api/nfc-tags/claim', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tagId: tagData.serialNumber,
            lineItemId: item.line_item_id,
            orderId: item.order_id,
          })
        })

        const result = await response.json()

        if (result.success) {
          toast({
            title: "NFC Tag Paired",
            description: `Artwork "${item.name}" has been successfully authenticated.`,
            variant: "default"
          })
          // Trigger a refresh of the orders
          window.location.reload()
        } else {
          toast({
            title: "Pairing Failed",
            description: result.message || "Unable to pair NFC tag",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error("NFC Claim Error:", error)
        toast({
          title: "Pairing Error",
          description: "An unexpected error occurred",
          variant: "destructive"
        })
      } finally {
        setIsPairing(false)
        stopScanning()
      }
    },
    onError: (error) => {
      toast({
        title: "NFC Error",
        description: error,
        variant: "destructive"
      })
    }
  })

  const getCertificationStatus = () => {
    if (!item.certificate_url) return "no-certificate";
    if (!item.nfc_tag_id) return "digital-only";
    if (item.nfc_claimed_at) return "nfc-paired";
    return "nfc-unpaired";
  }

  const status = getCertificationStatus()
  const price = item.price ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.price) : null

  const handleNfcClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isScanning && !isPairing) {
      startScanning()
    } else {
      stopScanning()
    }
  }

  return (
    <div 
      className={`
        relative w-full max-w-[420px] h-[245px] rounded-2xl 
        ${isSelected ? 'shadow-2xl' : 'shadow-lg'}
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
        {item.edition_number && item.edition_total && (
          <Badge 
            className="absolute top-2 right-2 bg-black/60 text-white border-zinc-700"
          >
            Edition #{item.edition_number}/{item.edition_total}
          </Badge>
        )}
      </div>

      {/* Artwork Details - Right Side */}
      <div className="flex-grow p-6 flex flex-col justify-between">
        {/* Top Section - Title, Artist, and Price */}
        <div>
          <h3 className="text-xl font-bold text-white mb-2 truncate">{item.name}</h3>
          <div className="flex justify-between items-start">
            <p className="text-sm text-zinc-400 truncate">
              {item.vendor_name || "Street Collector"}
            </p>
            {price && item.quantity && (
              <p className="text-sm text-zinc-400">
                {price} × {item.quantity}
              </p>
            )}
          </div>
        </div>

        {/* Middle Section - Status Badges */}
        <div className="space-y-2">
          {status === "nfc-paired" && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-2">
              <Wifi className="h-4 w-4 text-green-400" />
              <span className="text-sm text-green-400">NFC Tag Paired</span>
            </div>
          )}
          {status === "nfc-unpaired" && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 flex items-center gap-2">
              <WifiOff className="h-4 w-4 text-orange-400" />
              <span className="text-sm text-orange-400">Ready to Pair NFC Tag</span>
            </div>
          )}
          {status === "digital-only" && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-center gap-2">
              <Certificate className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-blue-400">Digital Certificate Only</span>
            </div>
          )}
          {nfcError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-sm text-red-400">{nfcError}</span>
            </div>
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
            <Certificate className="h-4 w-4 mr-2" /> View Certificate
          </Button>
          {item.nfc_tag_id && !item.nfc_claimed_at && (
            <Button 
              size="sm" 
              variant="outline" 
              className={`
                flex-1
                ${isScanning || isPairing 
                  ? 'text-blue-400 border-blue-500/30 bg-blue-500/10'
                  : 'text-blue-400 border-blue-500/30 hover:bg-blue-500/10'}
              `}
              onClick={handleNfcClick}
              disabled={isPairing}
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : isPairing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Pairing...
                </>
              ) : (
                <>
                  <Wifi className="h-4 w-4 mr-2" /> Pair NFC Tag
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
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
    orderNumber: order.order_number.toString()
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
                  border-4 border-zinc-900 
                  shadow-lg z-10"
              />

              {/* Timeline Card */}
              <motion.div 
                className={`
                  w-[calc(50%-4rem)] p-6 rounded-2xl 
                  bg-zinc-900/80 backdrop-blur-sm 
                  border border-zinc-800/50 
                  shadow-xl
                  ${index % 2 === 0 ? 'mr-auto' : 'ml-auto'}
                `}
              >
                {/* Date and Order Number */}
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-zinc-400">
                    {milestone.date.toLocaleDateString('en-US', {
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric'
                    })}
                  </span>
                  <span className="text-xs text-zinc-500">
                    Order #{milestone.orderNumber}
                  </span>
                </div>

                {/* Artwork Thumbnails */}
                <div className="flex space-x-3 mb-4">
                  {milestone.items.map(item => (
                    <div 
                      key={item.line_item_id} 
                      className="w-16 h-16 rounded-lg overflow-hidden"
                    >
                      {item.img_url ? (
                        <img 
                          src={item.img_url} 
                          alt={item.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                          <Album className="w-8 h-8 text-zinc-600" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Artwork Names */}
                <div className="space-y-2">
                  {milestone.items.map(item => (
                    <div 
                      key={item.line_item_id} 
                      className="text-sm text-white truncate"
                    >
                      {item.name}
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </LayoutGroup>
    </div>
  )
}

export default function CustomerDashboardById() {
  const router = useRouter()
  const params = useParams()
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedLineItem, setSelectedLineItem] = useState<LineItem>()
  const [selectedArtworkIndex, setSelectedArtworkIndex] = useState<number>(-1)
  const [view, setView] = useState<'grid' | 'timeline'>('grid')
  const [filter, setFilter] = useState<'all' | 'authenticated' | 'pending'>('all')
  const { scrollYProgress } = useScroll()

  // Stats calculation
  const stats = useMemo(() => {
    const totalArtworks = orders.reduce((acc, order) => acc + order.line_items.length, 0)
    const authenticatedArtworks = orders.reduce((acc, order) => 
      acc + order.line_items.filter(item => item.nfc_claimed_at).length, 0
    )
    const pendingAuthentication = totalArtworks - authenticatedArtworks

    return {
      total: totalArtworks,
      authenticated: authenticatedArtworks,
      pending: pendingAuthentication
    }
  }, [orders])

  // Filter items based on authentication status
  const filteredItems = useMemo(() => {
    return orders.flatMap(order => order.line_items).filter(item => {
      if (filter === 'authenticated') return item.nfc_claimed_at
      if (filter === 'pending') return !item.nfc_claimed_at
      return true
    })
  }, [orders, filter])

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`/api/customer/dashboard/${params.customerId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch orders')
        }

        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch orders')
        }

        setOrders(data.orders || [])
      } catch (err) {
        console.error('Error fetching orders:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch orders')
      }
    }

    fetchOrders()
  }, [params.customerId])

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
          <p className="text-zinc-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900">
      {/* Progress bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-amber-500 origin-left z-50"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-purple-500/10 pointer-events-none" />
        <div className="container mx-auto py-12 px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Your Digital Collection
              </h1>
              <p className="text-zinc-400 text-lg max-w-xl">
                Explore your authenticated digital artworks and manage your collection
              </p>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-zinc-800/50 backdrop-blur-sm p-4 rounded-xl border border-zinc-700"
              >
                <div className="text-3xl font-bold text-white">{stats.total}</div>
                <div className="text-zinc-400">Total Artworks</div>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-zinc-800/50 backdrop-blur-sm p-4 rounded-xl border border-zinc-700"
              >
                <div className="text-3xl font-bold text-green-500">{stats.authenticated}</div>
                <div className="text-zinc-400">Authenticated</div>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-zinc-800/50 backdrop-blur-sm p-4 rounded-xl border border-zinc-700"
              >
                <div className="text-3xl font-bold text-amber-500">{stats.pending}</div>
                <div className="text-zinc-400">Pending Auth</div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant={view === 'grid' ? 'default' : 'outline'}
              onClick={() => setView('grid')}
              className="gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              Grid
            </Button>
            <Button
              variant={view === 'timeline' ? 'default' : 'outline'}
              onClick={() => setView('timeline')}
              className="gap-2"
            >
              <Calendar className="w-4 h-4" />
              Timeline
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={filter === 'authenticated' ? 'default' : 'outline'}
              onClick={() => setFilter('authenticated')}
              size="sm"
              className="gap-2"
            >
              <Wifi className="w-4 h-4" />
              Authenticated
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              onClick={() => setFilter('pending')}
              size="sm"
              className="gap-2"
            >
              <WifiOff className="w-4 h-4" />
              Pending
            </Button>
          </div>
        </div>

        {/* Grid View */}
        {view === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.line_item_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <VinylArtworkCard
                  item={item}
                  isSelected={selectedArtworkIndex === index}
                  onSelect={() => setSelectedArtworkIndex(index)}
                  onCertificateView={() => setSelectedLineItem(item)}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Timeline View */}
        {view === 'timeline' && (
          <CollectionTimeline timelineData={timelineData} />
        )}
      </div>

      {/* Certificate Modal */}
      {selectedLineItem && (
        <CertificateModal
          lineItem={selectedLineItem}
          onClose={() => setSelectedLineItem(undefined)}
        />
      )}

      <Toaster />
    </div>
  )
}