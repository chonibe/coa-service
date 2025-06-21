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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { NFCWizardDialog } from './nfc-wizard-dialog'

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
  onCertificateView,
  onNFCPaired
}: { 
  item: LineItem, 
  isSelected: boolean, 
  onSelect: () => void, 
  onCertificateView: () => void,
  onNFCPaired: () => void
}) => {
  const [isNFCWizardOpen, setIsNFCWizardOpen] = useState(false)

  const getCertificationStatus = () => {
    if (item.nfc_claimed_at) return "nfc-paired";
    if (!item.certificate_url) return "no-certificate";
    return "unpaired";
  }

  const status = getCertificationStatus()
  const price = item.price ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.price) : null

  return (
    <>
      <div 
        className={`
          relative w-full h-auto aspect-[1.618/1] rounded-2xl overflow-hidden
          ${isSelected ? 'ring-2 ring-amber-500/50 shadow-xl shadow-amber-500/10' : 'shadow-lg'}
          bg-gradient-to-br from-zinc-900/90 via-zinc-800/90 to-zinc-900/90 
          backdrop-blur-sm border border-zinc-700/50
          flex flex-col sm:flex-row
          transition-all duration-300 ease-in-out
          hover:shadow-xl hover:border-zinc-600/50
          group
        `}
        onClick={() => onSelect()}
      >
        {/* Artwork Image */}
        <div className="relative w-full sm:w-[45%] aspect-square sm:aspect-auto">
          {item.img_url ? (
            <img 
              src={item.img_url} 
              alt={item.name} 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
            />
          ) : (
            <div className="w-full h-full bg-zinc-800/50 flex items-center justify-center">
              <Album className="w-16 h-16 text-zinc-600" />
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

        {/* Content Container */}
        <div className="flex-1 p-4 sm:p-6 flex flex-col justify-between min-w-0">
          {/* Top Section - Title, Artist, and Price */}
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2 truncate">
              {item.name}
            </h3>
            <div className="flex justify-between items-start gap-2">
              <p className="text-sm text-zinc-400 truncate flex-1">
                {item.vendor_name || "Street Collector"}
              </p>
              {price && item.quantity && (
                <p className="text-sm text-zinc-400 whitespace-nowrap">
                  {price} × {item.quantity}
                </p>
              )}
            </div>
          </div>

          {/* Middle Section - Status Badges */}
          <div className="space-y-2 my-4">
            {status === "nfc-paired" && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2.5 flex items-center gap-2">
                <Wifi className="h-4 w-4 text-green-400 flex-shrink-0" />
                <span className="text-sm text-green-400 truncate">NFC Tag Paired</span>
              </div>
            )}
            {status === "unpaired" && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2.5 flex items-center gap-2">
                <WifiOff className="h-4 w-4 text-orange-400 flex-shrink-0" />
                <span className="text-sm text-orange-400 truncate">Ready to Pair NFC Tag</span>
              </div>
            )}
            {status === "no-certificate" && (
              <div className="bg-zinc-500/10 border border-zinc-500/20 rounded-lg p-2.5 flex items-center gap-2">
                <Certificate className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                <span className="text-sm text-zinc-400 truncate">No Certificate Available</span>
              </div>
            )}
          </div>

          {/* Bottom Section - Actions */}
          <div className="flex flex-col sm:flex-row gap-2 mt-auto">
            {item.certificate_url && (
              <Button 
                size="sm" 
                variant="outline" 
                className="text-amber-400 border-amber-500/30 hover:bg-amber-500/10 w-full sm:flex-1"
                onClick={(e) => {
                  e.stopPropagation()
                  onCertificateView()
                }}
              >
                <Certificate className="h-4 w-4 mr-2 flex-shrink-0" /> View Certificate
              </Button>
            )}
            {status === "unpaired" && (
              <Button 
                size="sm" 
                variant="outline" 
                className="text-blue-400 border-blue-500/30 hover:bg-blue-500/10 w-full sm:flex-1"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsNFCWizardOpen(true)
                }}
              >
                <Wifi className="h-4 w-4 mr-2 flex-shrink-0" /> Pair NFC Tag
              </Button>
            )}
          </div>
        </div>
      </div>

      <NFCWizardDialog
        isOpen={isNFCWizardOpen}
        onClose={() => setIsNFCWizardOpen(false)}
        item={item}
        onSuccess={() => {
          onNFCPaired()
          setIsNFCWizardOpen(false)
        }}
      />
    </>
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

const NFCWizardDialog = ({ 
  isOpen, 
  onClose, 
  item,
  onSuccess 
}: { 
  isOpen: boolean
  onClose: () => void
  item: LineItem
  onSuccess: () => void
}) => {
  const [step, setStep] = useState(1)
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
          onSuccess()
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
        onClose()
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

  useEffect(() => {
    if (!isOpen) {
      setStep(1)
      stopScanning()
    }
  }, [isOpen, stopScanning])

  const steps = [
    {
      title: "Prepare Your Device",
      description: "Ensure NFC is enabled on your device. On most phones, you can enable it in your device settings."
    },
    {
      title: "Get Your NFC Tag Ready",
      description: "Take your NFC tag out of its packaging and keep it ready for scanning."
    },
    {
      title: "Position the Tag",
      description: "Hold the NFC tag close to the back of your phone where the NFC reader is located."
    },
    {
      title: "Scan the Tag",
      description: "Keep the tag steady while we scan and pair it with your artwork."
    }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      stopScanning()
      onClose()
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pair NFC Tag</DialogTitle>
          <DialogDescription>
            Follow these steps to authenticate your artwork with an NFC tag.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Progress Bar */}
          <div className="relative h-2 bg-zinc-200 rounded-full overflow-hidden">
            <div 
              className="absolute left-0 top-0 h-full bg-amber-500 transition-all duration-300"
              style={{ width: `${(step / steps.length) * 100}%` }}
            />
          </div>

          {/* Step Content */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Step {step}: {steps[step - 1].title}
            </h3>
            <p className="text-zinc-600">
              {steps[step - 1].description}
            </p>
          </div>

          {/* Error Display */}
          {nfcError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm font-medium">{nfcError}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                if (step > 1) {
                  setStep(step - 1)
                } else {
                  onClose()
                }
              }}
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>
            
            {step < steps.length ? (
              <Button onClick={() => setStep(step + 1)}>
                Next
              </Button>
            ) : (
              <Button 
                onClick={() => {
                  if (!isScanning && !isPairing) {
                    startScanning()
                  } else {
                    stopScanning()
                  }
                }}
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
                  'Start Scanning'
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
  const [isNFCWizardOpen, setIsNFCWizardOpen] = useState(false)
  const { scrollYProgress } = useScroll()

  // Fetch orders
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

  // Error handling
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

  // Stats calculation
  const stats = useMemo(() => {
    const totalArtworks = orders.reduce((acc, order) => acc + order.line_items.length, 0)
    const authenticatedArtworks = orders.reduce((acc, order) => 
      acc + order.line_items.filter(item => item.nfc_claimed_at).length, 0)
    return {
      total: totalArtworks,
      authenticated: authenticatedArtworks,
      pending: totalArtworks - authenticatedArtworks
    }
  }, [orders])

  // Filtered line items
  const filteredLineItems = useMemo(() => {
    return orders.flatMap(order => 
      order.line_items.filter(item => {
        if (filter === 'authenticated') return item.nfc_claimed_at
        if (filter === 'pending') return !item.nfc_claimed_at
        return true
      })
    )
  }, [orders, filter])

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900">
      {/* Progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-amber-500 origin-left z-50"
        style={{ scaleX: scrollYProgress }}
      />

      <div className="max-w-[90rem] mx-auto px-4 py-8 space-y-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 p-6 sm:p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent" />
          <div className="relative z-10">
            <h1 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
              Your Collection
            </h1>
            <p className="mt-2 text-zinc-400 text-sm sm:text-base">
              View and manage your authenticated artworks
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 mt-6 sm:grid-cols-3">
              <div className="glass-effect rounded-xl p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <Album className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Total Artworks</p>
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                  </div>
                </div>
              </div>
              <div className="glass-effect rounded-xl p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Wifi className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Authenticated</p>
                    <p className="text-2xl font-bold text-white">{stats.authenticated}</p>
                  </div>
                </div>
              </div>
              <div className="glass-effect rounded-xl p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <WifiOff className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Pending</p>
                    <p className="text-2xl font-bold text-white">{stats.pending}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className="flex-1 sm:flex-none"
            >
              All Artworks
            </Button>
            <Button
              variant={filter === 'authenticated' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('authenticated')}
              className="flex-1 sm:flex-none"
            >
              <Wifi className="w-4 h-4 mr-2" />
              Authenticated
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('pending')}
              className="flex-1 sm:flex-none"
            >
              <WifiOff className="w-4 h-4 mr-2" />
              Pending
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant={view === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={view === 'timeline' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('timeline')}
            >
              <Calendar className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Grid View */}
        {view === 'grid' && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {filteredLineItems.map((item, index) => (
              <VinylArtworkCard
                key={item.line_item_id}
                item={item}
                isSelected={selectedArtworkIndex === index}
                onSelect={() => setSelectedArtworkIndex(index)}
                onCertificateView={() => {
                  setSelectedLineItem(item)
                  setSelectedArtworkIndex(index)
                }}
                onNFCPaired={() => {
                  // Refresh the orders
                  window.location.reload()
                }}
              />
            ))}
          </div>
        )}

        {/* Timeline View */}
        {view === 'timeline' && (
          <div className="space-y-8">
            {orders.map((order) => {
              const orderItems = order.line_items.filter(item => {
                if (filter === 'authenticated') return item.nfc_claimed_at
                if (filter === 'pending') return !item.nfc_claimed_at
                return true
              })

              if (orderItems.length === 0) return null

              return (
                <div key={order.id} className="glass-effect rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Order #{order.order_number}
                      </h3>
                      <p className="text-sm text-zinc-400">
                        {new Date(order.processed_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {orderItems.length} {orderItems.length === 1 ? 'Artwork' : 'Artworks'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {orderItems.map((item, index) => (
                      <VinylArtworkCard
                        key={item.line_item_id}
                        item={item}
                        isSelected={selectedArtworkIndex === index}
                        onSelect={() => setSelectedArtworkIndex(index)}
                        onCertificateView={() => {
                          setSelectedLineItem(item)
                          setSelectedArtworkIndex(index)
                        }}
                        onNFCPaired={() => {
                          // Refresh the orders
                          window.location.reload()
                        }}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {filteredLineItems.length === 0 && (
          <div className="text-center py-12">
            <Album className="w-12 h-12 mx-auto text-zinc-600" />
            <h3 className="mt-4 text-lg font-semibold text-white">No Artworks Found</h3>
            <p className="mt-2 text-zinc-400">
              {filter === 'all' 
                ? "You don't have any artworks yet"
                : filter === 'authenticated'
                ? "You don't have any authenticated artworks"
                : "You don't have any pending artworks"}
            </p>
          </div>
        )}
      </div>

      {/* Certificate Modal */}
      {selectedLineItem && (
        <CertificateModal
          lineItem={selectedLineItem}
          onClose={() => setSelectedLineItem(undefined)}
        />
      )}
    </div>
  )
}