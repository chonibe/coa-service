"use client"

import { useState, useRef, useEffect } from "react"
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

  // Prepare timeline data
  const timelineData = sortedOrders.map((order, index) => ({
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
      {/* Vinyl Record Box Container */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Your Vinyl Collection</h1>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="text-zinc-400 hover:text-white">
              <LayoutGrid className="h-5 w-5 mr-2" /> Grid View
            </Button>
          </div>
        </div>

        {/* Horizontal Scrollable Vinyl Collection */}
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

        {/* Detailed Artwork View */}
        <AnimatePresence>
          {selectedArtworkIndex !== null && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="mt-8 bg-zinc-900/80 backdrop-blur-sm rounded-2xl p-8 border border-zinc-800/50"
            >
              <div className="grid md:grid-cols-2 gap-8">
                {/* Artwork Details */}
                <div>
                  <h2 className="text-2xl font-bold mb-4">
                    {allItems[selectedArtworkIndex].name}
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-amber-400" />
                      <span className="text-zinc-300">
                        {allItems[selectedArtworkIndex].vendor_name || "Street Collector"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-amber-400" />
                      <span className="text-zinc-300">
                        {new Date(allItems[selectedArtworkIndex].processed_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Award className="h-5 w-5 text-amber-400" />
                      <span className="text-zinc-300">
                        Edition {allItems[selectedArtworkIndex].edition_number || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-4">
                    <Button 
                      onClick={() => setSelectedLineItem(allItems[selectedArtworkIndex])}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      View Certificate <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                    {allItems[selectedArtworkIndex].nfc_tag_id && (
                      <Button 
                        variant="outline" 
                        onClick={() => handleNfcWrite(allItems[selectedArtworkIndex])}
                        className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                      >
                        <Wifi className="h-4 w-4 mr-2" /> NFC Pairing
                      </Button>
                    )}
                  </div>
                </div>

                {/* Artwork Image */}
                <div className="flex items-center justify-center">
                  {allItems[selectedArtworkIndex].img_url ? (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border-4 border-zinc-700/50"
                    >
                      <img 
                        src={allItems[selectedArtworkIndex].img_url} 
                        alt={allItems[selectedArtworkIndex].name} 
                        className="w-full h-auto object-cover" 
                      />
                    </motion.div>
                  ) : (
                    <div className="w-full max-w-md h-96 bg-zinc-800/50 rounded-2xl flex items-center justify-center">
                      <Album className="w-32 h-32 text-zinc-600" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Collection Timeline Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-bold">Your Collection Journey</h2>
        </div>
        
        <CollectionTimeline orders={orders} />
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