"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion, AnimatePresence, useMotionValue, useTransform, LayoutGroup, Variants, useScroll } from "framer-motion"
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
  const ConveyorTimeline = () => {
    const containerRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
      container: containerRef,
      offset: ["start start", "end end"]
    })

    // Animated scroll-driven timeline
    const timelineVariants: Variants = {
      initial: { 
        opacity: 0, 
        x: -100,
        scale: 0.8 
      },
      animate: (index) => ({ 
        opacity: 1, 
        x: 0,
        scale: 1,
        transition: { 
          delay: index * 0.1,
          type: "spring",
          stiffness: 100,
          damping: 15
        }
      }),
      exit: { 
        opacity: 0, 
        x: 100,
        scale: 0.8 
      }
    }

    return (
      <div className="relative w-full h-[800px] overflow-hidden perspective-[1000px]">
        {/* Scrollable Container */}
        <motion.div 
          ref={containerRef}
          className="h-full overflow-y-scroll no-scrollbar"
          style={{ 
            perspective: '1000px',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Infinite Scroll Content */}
          <div className="relative w-full min-h-[2000px]">
            {timelineData.map((milestone, index) => (
              <motion.div
                key={milestone.orderId}
                custom={index}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={timelineVariants}
                style={{
                  position: 'absolute',
                  top: `${index * 300}px`, // Stagger vertically
                  left: '50%',
                  translateX: '-50%',
                  translateZ: `${-index * 100}px`, // Create depth effect
                  rotateX: scrollYProgress.get() * (index % 2 === 0 ? 20 : -20), // Subtle rotation
                  opacity: scrollYProgress.get() > index / timelineData.length ? 0.5 : 1,
                  scale: 1 - Math.abs(scrollYProgress.get() - index / timelineData.length) * 0.3
                }}
                className={`
                  w-[500px] p-8 
                  bg-zinc-900/80 backdrop-blur-sm 
                  border border-zinc-800/50 
                  rounded-2xl 
                  shadow-xl
                  transition-all duration-300
                `}
              >
                {/* Milestone Details */}
                <div className="text-center">
                  <p className="text-xl font-bold text-zinc-200 mb-4">
                    {milestone.date.toLocaleDateString('en-US', {
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric'
                    })}
                  </p>

                  {/* Artwork Carousel */}
                  <motion.div 
                    className="flex justify-center space-x-4 mb-6"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      transition: { 
                        staggerChildren: 0.1,
                        delayChildren: 0.2 
                      }
                    }}
                  >
                    {milestone.items.map((item, itemIndex) => (
                      <motion.div
                        key={item.line_item_id}
                        variants={{
                          hidden: { opacity: 0, y: 50 },
                          visible: { 
                            opacity: 1, 
                            y: 0,
                            transition: { 
                              type: "spring", 
                              stiffness: 300, 
                              damping: 20 
                            }
                          }
                        }}
                        className="w-32 h-32 rounded-lg overflow-hidden"
                        whileHover={{ 
                          scale: 1.1,
                          rotate: 3,
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
                            <Album className="w-16 h-16 text-zinc-600" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Order Details */}
                  <div className="space-y-2">
                    {milestone.items.map(item => (
                      <p 
                        key={item.line_item_id} 
                        className="text-sm text-zinc-400 truncate"
                      >
                        {item.name}
                      </p>
                    ))}
                    <Badge className="mt-4 mx-auto">
                      Order #{milestone.orderNumber}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 
            w-12 h-20 border-2 border-zinc-700 rounded-full 
            flex items-center justify-center"
        >
          <motion.div 
            className="w-2 h-2 bg-zinc-500 rounded-full"
            animate={{
              y: [0, 10, 0],
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
            Scroll through your collection, watching memories flow like a digital time machine.
          </p>
        </div>

        {/* Conveyor Timeline */}
        <ConveyorTimeline />
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