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
import { NfcTagScanner } from '@/components/NfcTagScanner'
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { CertificateModal } from './certificate-modal'

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
const RoadTimeline: React.FC<{ timelineData: TimelineMilestone[] }> = ({ timelineData }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const { scrollYProgress } = useScroll({
    container: containerRef,
    offset: ["start start", "end end"]
  })

  // Road Sign Variants
  const roadSignVariants: Variants = {
    initial: { 
      opacity: 0, 
      x: 200,  // Start far to the right
      scale: 0.6,
      rotateY: 90  // Rotated away from view
    },
    enter: (index: number) => ({ 
      opacity: 1, 
      x: 0,
      scale: 1,
      rotateY: 0,
      transition: { 
        type: "spring",
        stiffness: 100,
        damping: 20,
        delay: index * 0.2
      }
    }),
    exit: { 
      opacity: 0, 
      x: -200,  // Move far to the left
      scale: 0.6,
      rotateY: -90  // Rotate away
    }
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[800px] overflow-y-scroll perspective-[1500px]"
      style={{ 
        transformStyle: 'preserve-3d',
        scrollSnapType: 'y mandatory'
      }}
    >
      {/* Road Background Simulation */}
      <div 
        className="fixed inset-0 bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900 
          before:absolute before:inset-0 
          before:bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] 
          before:bg-[size:4px_4px]"
        style={{
          transform: `
            translateZ(-500px)
            rotateX(${scrollYProgress.get() * 30}deg)
          `
        }}
      />

      {/* Road Lane Markers */}
      <div 
        className="fixed left-1/2 top-0 bottom-0 w-1 
          bg-gradient-to-b from-amber-500/30 via-amber-500/50 to-amber-500/30 
          transform -translate-x-1/2"
      />

      {/* Timeline Content */}
      <div className="relative w-full min-h-[3000px] px-4 pt-[200px]">
        {timelineData.map((milestone: TimelineMilestone, index: number) => (
          <motion.div
            key={milestone.orderId}
            custom={index}
            initial="initial"
            animate="enter"
            exit="exit"
            variants={roadSignVariants}
            style={{
              position: 'absolute',
              top: `${index * 500}px`,
              left: index % 2 === 0 ? '20%' : '80%',
              transformStyle: 'preserve-3d',
              perspective: '1000px',
              transform: `
                translateZ(${
                  Math.abs(scrollYProgress.get() - index / timelineData.length) * -500
                }px)
                rotateX(${
                  (scrollYProgress.get() - index / timelineData.length) * 30
                }deg)
                scale(${
                  1 - Math.abs(scrollYProgress.get() - index / timelineData.length) * 0.3
                })
              `,
              opacity: Math.max(
                0, 
                1 - Math.abs(scrollYProgress.get() - index / timelineData.length) * 2
              )
            }}
            className={`
              absolute w-[500px] p-8 
              bg-white/10 backdrop-blur-md 
              border-2 border-amber-500/20
              rounded-3xl 
              shadow-2xl
              transition-all duration-500
              will-change-transform
              ${index % 2 === 0 ? 'text-left' : 'text-right'}
            `}
          >
            {/* Road Sign Inspired Design */}
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
              {/* Date Header with Road Sign Styling */}
              <motion.h3 
                className={`
                  text-2xl font-bold mb-6 
                  ${index % 2 === 0 ? 'text-left' : 'text-right'}
                  text-amber-400
                `}
              >
                {milestone.date.toLocaleDateString('en-US', {
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric'
                })}
              </motion.h3>

              {/* Artwork Road Sign Thumbnails */}
              <motion.div 
                className="flex space-x-4 mb-6"
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
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
                        x: index % 2 === 0 ? -50 : 50,
                        rotate: index % 2 === 0 ? -10 : 10
                      },
                      visible: { 
                        opacity: 1, 
                        x: 0,
                        rotate: 0,
                        transition: { 
                          type: "spring", 
                          stiffness: 200, 
                          damping: 20 
                        }
                      }
                    }}
                    className={`
                      w-32 h-32 rounded-lg overflow-hidden 
                      border-2 border-amber-500/30
                      ${index % 2 === 0 ? 'mr-auto' : 'ml-auto'}
                    `}
                    whileHover={{ 
                      scale: 1.1,
                      rotate: index % 2 === 0 ? 5 : -5,
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

              {/* Order Details with Road Sign Styling */}
              <motion.div 
                className={`
                  space-y-3 
                  ${index % 2 === 0 ? 'text-left' : 'text-right'}
                `}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
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

      {/* Road Navigation Indicator */}
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
  const customerId = params.customerId as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
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
          <div className="relative">
            <motion.div 
              className="flex overflow-x-auto pb-8 no-scrollbar"
              style={{ 
                cursor: 'grab',
                userSelect: 'none'
              }}
            >
              <div className="flex space-x-6 relative">
                {/* Timeline Line */}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-zinc-800 z-0"></div>
                
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
          </div>
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