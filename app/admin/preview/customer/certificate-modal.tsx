"use client"

import { useState, useRef, useEffect, ReactNode } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, BadgeIcon as Certificate, User, Calendar, Hash, Tag } from "lucide-react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"

// Add shimmer effect styles
const shimmerStyles = `
  .shimmer {
    position: relative;
    overflow: hidden;
  }
  .shimmer::after {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.1) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    animation: shimmer 2s infinite;
  }
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
`

// Add the styles to the document
if (typeof document !== "undefined") {
  const style = document.createElement("style")
  style.textContent = shimmerStyles
  document.head.appendChild(style)
}

interface FloatingCardProps {
  children: ReactNode
  className?: string
  isFlipped?: boolean
  [key: string]: any
}

function FloatingCard({ children, className = "", isFlipped = false, ...props }: FloatingCardProps) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    mouseX.set(e.clientX - centerX)
    mouseY.set(e.clientY - centerY)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  const rotateX = useTransform(mouseY, [-200, 200], [10, -10])
  const rotateY = useTransform(mouseX, [-200, 200], [-10, 10])
  const springConfig = { damping: 20, stiffness: 300 }
  const springRotateX = useSpring(rotateX, springConfig)
  const springRotateY = useSpring(rotateY, springConfig)

  return (
    <motion.div
      className={`relative ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformStyle: "preserve-3d",
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

interface CertificateModalProps {
  lineItem: {
    line_item_id: string
    title: string
    image_url: string | null
    vendor: string | null
    edition_number: number | null
    edition_total: number | null
    nfc_tag_id: string | null
  } | null
  onClose: () => void
}

export function CertificateModal({ lineItem, onClose }: CertificateModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // Image motion values for subtle parallax effect
  const imageX = useMotionValue(0)
  const imageY = useMotionValue(0)
  const imageRotateX = useTransform(imageY, [-5, 5], [2, -2])
  const imageRotateY = useTransform(imageX, [-5, 5], [2, -2])
  const imageTranslateX = useTransform(imageX, [-5, 5], [3, -3])
  const imageTranslateY = useTransform(imageY, [-5, 5], [3, -3])

  useEffect(() => {
    if (lineItem) {
      setIsOpen(true)
      setIsFlipped(false)
      // Fetch the vendor's Instagram profile picture
      if (lineItem.vendor) {
        fetch(`/api/vendors/instagram-profile?vendorName=${encodeURIComponent(lineItem.vendor)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.profilePicture) {
              setProfilePicture(data.profilePicture)
            }
          })
          .catch((error) => {
            console.error("Error fetching Instagram profile:", error)
          })
      }
    } else {
      setIsOpen(false)
    }
  }, [lineItem])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * 5
    const rotateY = ((x - centerX) / centerX) * -5

    // Update image motion values for subtle parallax
    imageX.set(rotateY * 0.3)
    imageY.set(rotateX * 0.3)

    // Update mouse position for shimmer effect
    setMousePosition({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 })

    // Apply card tilt
    if (cardRef.current) {
      cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`
    }
  }

  const handleMouseLeave = () => {
    if (!cardRef.current) return
    cardRef.current.style.transform = ""
    imageX.set(0)
    imageY.set(0)
    setMousePosition({ x: 50, y: 50 })
  }

  const handleCardClick = () => {
    setIsFlipped(!isFlipped)
  }

  if (!lineItem) return null

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      setIsOpen(false)
      onClose()
    }}>
      <DialogContent 
        className="w-[95vw] sm:w-[90vw] md:max-w-[900px] bg-transparent border-none p-0"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="perspective-[2000px]">
          <motion.div
            onClick={handleCardClick}
            className="relative w-full aspect-[4/3] cursor-pointer"
            style={{
              transformStyle: "preserve-3d",
            }}
            animate={{
              rotateY: isFlipped ? 180 : 0,
            }}
            transition={{
              duration: 1.2,
              type: "spring",
              stiffness: 60,
              damping: 12,
            }}
          >
            {/* Tilt container */}
            <div
              ref={cardRef}
              className="absolute inset-0 rounded-xl p-4 sm:p-8 shadow-2xl"
              style={{
                willChange: "transform",
                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden",
                background: lineItem.nfc_tag_id 
                  ? "linear-gradient(to bottom right, rgb(30 27 75), rgb(24 24 27))"
                  : "linear-gradient(to bottom right, rgb(76 29 29), rgb(24 24 27))",
              }}
            >
              {/* Front of card */}
              <div
                className="absolute inset-0"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transformStyle: "preserve-3d",
                }}
              >
                <div className="relative h-full flex flex-col items-center justify-center text-center">
                  {lineItem.image_url && (
                    <motion.div
                      className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 mb-4 sm:mb-6 rounded-lg overflow-hidden border-2 border-zinc-700 relative"
                      style={{
                        rotateX: imageRotateX,
                        rotateY: imageRotateY,
                        x: imageTranslateX,
                        y: imageTranslateY,
                        transformStyle: "preserve-3d",
                        transition: "transform 0.1s ease-out",
                      }}
                    >
                      <img
                        src={lineItem.image_url}
                        alt={lineItem.title}
                        className="w-full h-full object-cover"
                      />
                      {!lineItem.nfc_tag_id && (
                        <div className="absolute top-2 right-2">
                          <Tag className="w-6 h-6 text-red-400" />
                        </div>
                      )}
                    </motion.div>
                  )}
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{lineItem.title}</h2>
                  {lineItem.vendor && (
                    <p className="text-sm sm:text-base text-zinc-400 mb-2 sm:mb-4">{lineItem.vendor}</p>
                  )}
                  {lineItem.edition_number && lineItem.edition_total && (
                    <div className="text-sm sm:text-base text-indigo-400">
                      Edition #{lineItem.edition_number} of {lineItem.edition_total}
                    </div>
                  )}
                  <p className="text-xs sm:text-sm text-zinc-500 mt-2 sm:mt-4">Click to view certificate details</p>
                </div>
              </div>

              {/* Back of card */}
              <div
                className="absolute inset-0"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transformStyle: "preserve-3d",
                  transform: "rotateY(180deg)",
                }}
              >
                <div className="relative h-full flex flex-col items-center justify-center text-center p-4 sm:p-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6 rounded-full bg-indigo-500/10 flex items-center justify-center">
                    <Certificate className="h-8 w-8 sm:h-10 sm:w-10 text-indigo-400" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">Certificate of Authenticity</h2>
                  
                  <div className="space-y-4 sm:space-y-6 w-full max-w-md">
                    <div className="flex items-center gap-3 sm:gap-4 text-left">
                      <User className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400" />
                      <div>
                        <p className="text-xs sm:text-sm text-zinc-400">Artist</p>
                        <p className="text-base sm:text-lg text-white">{lineItem.vendor || "Unknown"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 text-left">
                      <Hash className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400" />
                      <div>
                        <p className="text-xs sm:text-sm text-zinc-400">Edition</p>
                        <p className="text-base sm:text-lg text-white">
                          {lineItem.edition_number && lineItem.edition_total
                            ? `#${lineItem.edition_number} of ${lineItem.edition_total}`
                            : "Limited Edition"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 text-left">
                      <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400" />
                      <div>
                        <p className="text-xs sm:text-sm text-zinc-400">Created</p>
                        <p className="text-base sm:text-lg text-white">{new Date().toLocaleDateString()}</p>
                      </div>
                    </div>

                    {!lineItem.nfc_tag_id && (
                      <div className="flex items-center gap-3 sm:gap-4 text-left">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-4 border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          onClick={(e) => {
                            e.stopPropagation()
                            // TODO: Implement NFC pairing logic
                          }}
                        >
                          Pair Artwork with NFC Tag
                        </Button>
                      </div>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-500 mt-6 sm:mt-8">Click to view artwork</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 