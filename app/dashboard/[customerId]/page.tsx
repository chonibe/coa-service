"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion, AnimatePresence, useMotionValue, useTransform, LayoutGroup, Variants } from "framer-motion"
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

interface LineItem {
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

interface Order {
  id: string
  order_number: number
  processed_at: string
  total_price: number
  financial_status: string
  fulfillment_status: string | null
  line_items: LineItem[]
}

// Timeline data type
type TimelineMilestone = {
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
  const customerId = params.customerId as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedLineItem, setSelectedLineItem] = useState<LineItem | null>(null)
  const [selectedArtworkIndex, setSelectedArtworkIndex] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'vinyl' | 'grid'>('vinyl')

  // Timeline data type
  type TimelineMilestone = {
    date: Date
    items: LineItem[]
    orderId: string
    orderNumber: number
  }

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

  // Add state for mouse position and interaction
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isInteracting, setIsInteracting] = useState(false)

  // Interactive Timeline Component
  const InteractiveTimeline = () => {
    const containerRef = useRef<HTMLDivElement>(null)

    // Handle mouse move for parallax and interaction
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = ((e.clientY - rect.top) / rect.height) * 2 - 1

      setMousePosition({ x, y })
      setIsInteracting(true)
    }

    const handleMouseLeave = () => {
      setMousePosition({ x: 0, y: 0 })
      setIsInteracting(false)
    }

    return (
      <div 
        ref={containerRef}
        className="relative w-full h-[800px] overflow-hidden perspective-[1000px]"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          background: `
            radial-gradient(
              circle at ${50 + mousePosition.x * 20}% ${50 + mousePosition.y * 20}%, 
              rgba(79, 209, 197, 0.1) 0%, 
              transparent 60%
            ),
            linear-gradient(
              to bottom, 
              rgba(9,9,11,0) 0%, 
              rgba(9,9,11,0.5) 20%, 
              rgba(9,9,11,1) 50%, 
              rgba(9,9,11,0.5) 80%, 
              rgba(9,9,11,0) 100%
            )
          `,
          transition: 'background-position 0.3s ease'
        }}
      >
        {/* Road Horizon with Parallax */}
        <motion.div 
          className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-zinc-900/50 via-zinc-800/30 to-transparent"
          style={{ 
            perspective: '1000px',
            transformStyle: 'preserve-3d',
            transform: `
              rotateX(70deg) 
              translateX(${mousePosition.x * 20}px) 
              translateY(${mousePosition.y * 20}px)
            `,
            transition: 'transform 0.3s ease'
          }}
        />

        {/* Interactive Lighting Effect */}
        <motion.div 
          className="absolute inset-0 pointer-events-none z-50"
          style={{
            background: `
              radial-gradient(
                circle at ${50 + mousePosition.x * 20}% ${50 + mousePosition.y * 20}%, 
                rgba(79, 209, 197, 0.1) 0%, 
                transparent 40%
              )
            `,
            opacity: isInteracting ? 0.5 : 0,
            transition: 'opacity 0.3s ease'
          }}
        />

        {/* Timeline Markers Container */}
        <motion.div 
          className="absolute inset-0"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { 
              opacity: 1,
              transition: { 
                staggerChildren: 0.1,
                delayChildren: 0.2 
              }
            }
          }}
        >
          {timelineData.map((milestone: TimelineMilestone, index: number) => (
            <motion.div
              key={milestone.orderId}
              variants={{
                hidden: { 
                  opacity: 0, 
                  scale: 0.5,
                  y: 200,
                  x: index % 2 === 0 ? -100 : 100
                },
                visible: { 
                  opacity: 1, 
                  scale: 1,
                  y: 0,
                  x: 0,
                  transition: { 
                    type: "spring", 
                    stiffness: 100, 
                    damping: 20 
                  }
                }
              }}
              whileHover={{
                scale: 1.05,
                rotate: index % 2 === 0 ? -2 : 2,
                transition: { duration: 0.2 }
              }}
              className={`
                absolute w-[300px] bg-zinc-900/80 backdrop-blur-sm 
                border border-zinc-800/50 rounded-xl p-6 
                transform 
                transition-all duration-300 ease-out
                ${index % 2 === 0 
                  ? 'left-1/4 -translate-x-full' 
                  : 'right-1/4 translate-x-full'}
              `}
              style={{ 
                top: '50%',
                zIndex: timelineData.length - index,
                transformStyle: 'preserve-3d',
                perspective: '1000px',
                transform: `
                  translateY(50%)
                  translateX(${index % 2 === 0 ? '-120%' : '120%'})
                  translateZ(${-500 + index * 200}px)
                  rotateX(${70}deg)
                  translateX(${mousePosition.x * (index % 2 === 0 ? -10 : 10)}px)
                  translateY(${mousePosition.y * (index % 2 === 0 ? -10 : 10)}px)
                  scale(${1 - index * 0.2})
                `,
                boxShadow: isInteracting 
                  ? '0 10px 25px rgba(79, 209, 197, 0.2)' 
                  : '0 4px 15px rgba(0,0,0,0.2)'
              }}
            >
              <div className="text-center">
                <p className="text-sm text-zinc-400 mb-2">
                  {milestone.date.toLocaleDateString('en-US', {
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric'
                  })}
                </p>
                <div className="flex justify-center space-x-2 mb-4">
                  {milestone.items.map((item: LineItem) => (
                    <motion.div 
                      key={item.line_item_id} 
                      className="w-24 h-24 rounded-lg overflow-hidden"
                      whileHover={{ 
                        scale: 1.1,
                        rotate: 2,
                        transition: { duration: 0.2 }
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
                          <Album className="w-12 h-12 text-zinc-600" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
                <p className="text-sm text-white truncate">
                  Order #{milestone.orderNumber}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    )
  }

  useEffect(() => {
    // Set cookie for the customer ID if it's not already set
    const existingCustomerId = document.cookie
      .split('; ')
      .find(row => row.startsWith('shopify_customer_id='))
      ?.split('=')[1]

    if (!existingCustomerId && customerId) {
      // Set the customer ID cookie for API calls
      document.cookie = `shopify_customer_id=${customerId}; path=/; max-age=86400`
    }

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

    if (customerId) {
      fetchOrders()
    } else {
      setError('Customer ID is required')
      setIsLoading(false)
    }
  }, [customerId, router])

  const handleCertificateClick = (lineItem: LineItem) => {
    setSelectedLineItem(lineItem)
  }

  const handleNfcWrite = async (lineItem: LineItem) => {
    if (!lineItem.nfc_tag_id || !lineItem.certificate_url) {
      toast({
        title: "NFC Not Available",
        description: "This artwork doesn't support NFC pairing",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if Web NFC is supported
      if (!('NDEFReader' in window)) {
        toast({
          title: "NFC Not Supported",
          description: "Your device doesn't support NFC writing",
          variant: "destructive",
        });
        return;
      }

      const ndef = new (window as any).NDEFReader();
      await ndef.write({
        records: [{
          recordType: "url",
          data: lineItem.certificate_url
        }]
      });

      toast({
        title: "NFC Tag Programmed",
        description: `Successfully wrote certificate URL to NFC tag for "${lineItem.name}"`,
      });

    } catch (error: any) {
      console.error("NFC Write Error:", error);
      toast({
        title: "NFC Write Failed",
        description: error.message || "Failed to write to NFC tag",
        variant: "destructive",
      });
    }
  };

  const handleNfcTagScanned = async (tagId: string) => {
    try {
      const response = await fetch('/api/nfc-tags/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tagId }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "NFC Tag Verified",
          description: `Artwork authenticated: ${result.artworkTitle}`,
        });
      } else {
        toast({
          title: "NFC Tag Verification Failed",
          description: result.message || "Unable to verify the NFC tag",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("NFC Tag Verification Error:", error);
      toast({
        title: "Verification Error",
        description: "An error occurred while verifying the NFC tag",
        variant: "destructive",
      });
    }
  };

  // Flatten orders into individual items
  const allItems = orders.flatMap(order => 
    order.line_items.map(item => ({
      ...item,
      order_number: order.order_number,
      processed_at: order.processed_at,
      financial_status: order.financial_status
    }))
  )

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-full max-w-md">
          <div>
            <h2 className="text-white">Authentication Error</h2>
            <p className="text-destructive">{error}</p>
            <Button 
              onClick={() => {
                window.location.href = `/api/auth/shopify`
              }} 
              className="mt-4 w-full"
            >
              Authenticate with Shopify
            </Button>
          </div>
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
          <motion.div 
            className="flex overflow-x-auto pb-8 no-scrollbar"
            style={{ 
              cursor: 'grab',
              userSelect: 'none'
            }}
          >
            <div className="flex space-x-6">
              {allItems.map((item, index) => (
                <VinylArtworkCard 
                  key={item.line_item_id}
                  item={item}
                  isSelected={selectedArtworkIndex === index}
                  onSelect={() => setSelectedArtworkIndex(index)}
                  onNfcWrite={() => handleNfcWrite(item)}
                  onCertificateView={() => setSelectedLineItem(item)}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {allItems.map((item) => (
              <motion.div
                key={item.line_item_id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-zinc-900/80 rounded-xl overflow-hidden shadow-lg border border-zinc-800/50"
              >
                {item.img_url ? (
                  <img 
                    src={item.img_url} 
                    alt={item.name} 
                    className="w-full h-48 object-cover" 
                  />
                ) : (
                  <div className="w-full h-48 bg-zinc-800/50 flex items-center justify-center">
                    <Album className="w-24 h-24 text-zinc-600" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-lg font-bold mb-2 truncate">{item.name}</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">
                      {item.vendor_name || "Street Collector"}
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedLineItem(item)
                        setSelectedArtworkIndex(null)
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Collection Timeline Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Your Artistic Journey</h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Cruise through your collection, where memories come alive with every movement.
          </p>
        </div>

        {/* Interactive Timeline */}
        <InteractiveTimeline />
      </div>

      {/* NFC Scanner Sidebar */}
      <div className="fixed bottom-8 right-8">
        <NfcTagScanner onTagScanned={handleNfcTagScanned} />
      </div>
      
      {/* Certificate Modal */}
      <CertificateModal 
        lineItem={selectedLineItem} 
        onClose={() => setSelectedLineItem(null)} 
      />
      
      <Toaster />
    </div>
  )
} 