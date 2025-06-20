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

// Road-Like Timeline Component
const RoadTimeline: React.FC<{ 
  timelineData: TimelineMilestone[],
  onCertificateClick: (item: LineItem) => void 
}> = ({ 
  timelineData,
  onCertificateClick
}) => {
  return (
    <div className="relative">
      {timelineData.map((milestone, index) => (
        <div key={milestone.orderId} className="mb-12">
          {/* ... existing milestone header code ... */}
          
          <div className="flex overflow-x-auto pb-6 gap-4 mt-4">
            {milestone.items.map((item) => (
              <VinylArtworkCard
                key={item.line_item_id}
                item={item}
                isSelected={false}
                onSelect={() => {}}
                onCertificateView={() => onCertificateClick(item)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// 3D Interactive Timeline Component
const InteractiveTimeline: React.FC<{ timelineData: TimelineMilestone[] }> = ({ timelineData }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const { scrollYProgress } = useScroll({
    container: containerRef,
    offset: ["start start", "end end"]
  })

  // 3D Animation Variants
  const timelineVariants: Variants = {
    initial: { 
      opacity: 0, 
      scale: 0.6,
      z: -500,
      rotateX: 45,
      rotateY: 15
    },
    animate: (index: number) => ({ 
      opacity: 1, 
      scale: 1,
      z: 0,
      rotateX: 0,
      rotateY: 0,
      transition: { 
        type: "spring",
        stiffness: 50,
        damping: 15,
        delay: index * 0.2
      }
    }),
    hover: {
      scale: 1.05,
      boxShadow: "0 15px 30px rgba(0,0,0,0.3)",
      transition: { duration: 0.3 }
    }
  }

  // Handle mouse movement for 3D effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1
    setMousePosition({ x, y })
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full min-h-[1200px] overflow-hidden perspective-[2000px]"
      onMouseMove={handleMouseMove}
    >
      {/* 3D Road Background */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900 
          before:absolute before:inset-0 
          before:bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] 
          before:bg-[size:4px_4px]"
        style={{
          transform: `
            rotateX(${mousePosition.y * 10}deg) 
            rotateY(${mousePosition.x * 10}deg)
          `,
          transition: 'transform 0.1s ease'
        }}
      />

      {/* Timeline Content Container */}
      <div className="relative w-full min-h-[2000px] px-4 overflow-hidden">
        {timelineData.map((milestone: TimelineMilestone, index: number) => (
          <motion.div
            key={milestone.orderId}
            custom={index}
            initial="initial"
            animate="animate"
            whileHover="hover"
            variants={timelineVariants}
            style={{
              position: 'absolute',
              top: `${index * 500}px`,
              left: index % 2 === 0 ? '20%' : '80%',
              translateX: index % 2 === 0 ? '-100%' : '100%',
              transformStyle: 'preserve-3d',
              perspective: '1500px',
              transform: `
                translateZ(${
                  Math.abs(scrollYProgress.get() - index / timelineData.length) * 
                  (index % 2 === 0 ? -400 : 400)
                }px)
                rotateX(${
                  (scrollYProgress.get() - index / timelineData.length) * 
                  (index % 2 === 0 ? 30 : -30)
                }deg)
                rotateY(${mousePosition.x * 15}deg)
                scale(${
                  1 - Math.abs(scrollYProgress.get() - index / timelineData.length) * 0.5
                })
              `,
              opacity: Math.max(
                0, 
                1 - Math.abs(scrollYProgress.get() - index / timelineData.length) * 2
              )
            }}
            className={`
              absolute w-[600px] p-10 
              bg-zinc-900/90 backdrop-blur-md 
              border-2 border-amber-500/20
              rounded-3xl 
              shadow-2xl
              transition-all duration-500
              will-change-transform
              ${index % 2 === 0 ? 'text-left' : 'text-right'}
            `}
          >
            {/* 3D Milestone Content */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: { 
                  delay: index * 0.2,
                  type: "spring",
                  stiffness: 100
                }
              }}
            >
              {/* Date Header with 3D Tilt */}
              <motion.h3 
                className={`
                  text-2xl font-bold mb-6 
                  ${index % 2 === 0 ? 'text-left' : 'text-right'}
                  text-amber-400
                `}
                style={{
                  transform: `
                    rotateY(${
                      (scrollYProgress.get() - index / timelineData.length) * 
                      (index % 2 === 0 ? 15 : -15)
                    }deg)
                    rotateX(${mousePosition.y * 10}deg)
                  `
                }}
              >
                {milestone.date.toLocaleDateString('en-US', {
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric'
                })}
              </motion.h3>

              {/* Artwork 3D Carousel */}
              <motion.div 
                className="flex justify-center space-x-6 mb-8"
                initial={{ opacity: 0, z: -200 }}
                animate={{ 
                  opacity: 1, 
                  z: 0,
                  transition: { 
                    staggerChildren: 0.1,
                    delayChildren: 0.2 
                  }
                }}
              >
                {milestone.items.map((item: LineItem, itemIndex: number) => (
                  <motion.div
                    key={item.line_item_id}
                    variants={{
                      hidden: { 
                        opacity: 0, 
                        z: -300,
                        scale: 0.6,
                        rotateY: index % 2 === 0 ? 45 : -45
                      },
                      visible: { 
                        opacity: 1, 
                        z: 0,
                        scale: 1,
                        rotateY: 0,
                        transition: { 
                          type: "spring", 
                          stiffness: 200, 
                          damping: 20 
                        }
                      }
                    }}
                    className={`
                      w-40 h-40 rounded-xl overflow-hidden 
                      border-2 border-amber-500/30
                      ${index % 2 === 0 ? 'mr-auto' : 'ml-auto'}
                    `}
                    whileHover={{ 
                      scale: 1.1,
                      rotate: index % 2 === 0 ? 5 : -5,
                      z: 50,
                      transition: { duration: 0.2 }
                    }}
                    style={{
                      transform: `
                        rotateY(${mousePosition.x * 15}deg)
                        rotateX(${mousePosition.y * 15}deg)
                      `,
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    {item.img_url ? (
                      <img 
                        src={item.img_url} 
                        alt={item.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                        <Album className="w-20 h-20 text-zinc-600" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>

              {/* Order Details with 3D Interaction */}
              <motion.div 
                className={`
                  space-y-3 
                  ${index % 2 === 0 ? 'text-left' : 'text-right'}
                `}
                initial={{ opacity: 0, z: -100 }}
                animate={{ 
                  opacity: 1, 
                  z: 0,
                  transition: { 
                    delay: index * 0.3,
                    type: "spring",
                    stiffness: 100
                  }
                }}
              >
                {milestone.items.map((item: LineItem) => (
                  <p 
                    key={item.line_item_id} 
                    className="text-sm text-zinc-400 truncate"
                  >
                    {item.name}
                  </p>
                ))}
                <Badge 
                  className={`
                    mt-6 
                    ${index % 2 === 0 ? 'mr-auto' : 'ml-auto'}
                    bg-amber-500/20 text-amber-400
                  `}
                >
                  Order #{milestone.orderNumber}
                </Badge>
              </motion.div>
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* 3D Navigation Indicator */}
      <motion.div 
        className="fixed bottom-12 left-1/2 transform -translate-x-1/2 
          w-16 h-24 border-2 border-amber-700 rounded-full 
          flex items-center justify-center"
        initial={{ opacity: 0, y: 50 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          transition: { 
            type: "spring",
            stiffness: 100
          }
        }}
        style={{
          transform: `
            translateX(-50%) 
            rotateX(${mousePosition.y * 10}deg)
            rotateY(${mousePosition.x * 10}deg)
          `,
          transformStyle: 'preserve-3d'
        }}
      >
        <motion.div 
          className="w-3 h-3 bg-amber-500 rounded-full"
          animate={{
            y: [0, 15, 0],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>
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

  // Transform orders into timeline data
  const timelineData: TimelineMilestone[] = useMemo(() => {
    return orders.map(order => ({
      orderId: order.id,
      orderNumber: order.order_number.toString(),
      date: new Date(order.processed_at),
      items: order.line_items
    })).sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [orders])

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
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Your Vinyl Collection</h1>
        </div>

        <div className="mt-8">
          {timelineData.map((milestone, index) => (
            <div key={milestone.orderId} className="mb-12">
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-xl font-semibold text-white">
                  {milestone.date.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h2>
                <Badge variant="outline">
                  Order #{milestone.orderNumber}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {milestone.items.map((item, index) => (
                  <VinylArtworkCard
                    key={item.line_item_id}
                    item={item}
                    isSelected={selectedArtworkIndex === index}
                    onSelect={() => setSelectedArtworkIndex(index)}
                    onCertificateView={() => setSelectedLineItem(item)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
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