"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X, BadgeIcon as Certificate, User, Calendar, Hash, ExternalLink, Award, Sparkles, Signature } from "lucide-react"
import { motion, useMotionValue, useTransform } from "framer-motion"

// Add shimmer effect styles
const shimmerStyles = `
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.shimmer {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}

@keyframes golden-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(251, 191, 36, 0.6);
  }
}

.golden-glow {
  animation: golden-glow 3s ease-in-out infinite;
}

.signature-font {
  font-family: 'Brush Script MT', cursive, serif;
  font-style: italic;
}
`

function FloatingCard({ children, className = "", isFlipped = false, ...props }: React.HTMLAttributes<HTMLDivElement> & { isFlipped?: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * 5
    const rotateY = ((x - centerX) / centerX) * -5
    
    setMousePosition({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 })
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`
  }
  
  const handleMouseLeave = () => {
    const card = cardRef.current
    if (!card) return
    card.style.transform = ""
    setMousePosition({ x: 50, y: 50 })
  }
  
  return (
    <>
      <style>{shimmerStyles}</style>
      <div
        ref={cardRef}
        className={`relative bg-gradient-to-br from-zinc-900/90 via-zinc-800/90 to-zinc-900/90 backdrop-blur-sm border border-amber-500/30 rounded-xl shadow-2xl transition-all duration-300 hover:shadow-3xl hover:border-amber-400/50 overflow-hidden golden-glow ${className}`}
        style={{ 
          willChange: "transform",
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {/* Premium border gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 via-amber-300/10 to-amber-400/20 p-[1px] rounded-xl">
          <div className="h-full w-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-xl" />
        </div>
        
        {/* Dynamic shimmer overlay */}
        <span 
          className="pointer-events-none absolute inset-0 z-10 opacity-0 hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(251,191,36,0.15) 0%, transparent 50%)`,
          }}
        >
          <span className="block w-full h-full shimmer" />
        </span>
        
        <div className="relative z-20">
          {children}
        </div>
      </div>
    </>
  )
}

interface LineItem {
  line_item_id: string
  name: string
  description?: string
  img_url?: string
  vendor_name?: string
  edition_number?: number | null
  price?: number
  certificate_url?: string
  certificate_token?: string
  nfc_tag_id?: string | null
  nfc_claimed_at?: string | null
  status?: string
}

interface CertificateModalProps {
  lineItem: LineItem | null
  onClose: () => void
}

export function CertificateModal({ lineItem, onClose }: CertificateModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)

  // Image motion values for mirrored movement
  const imageX = useMotionValue(0)
  const imageY = useMotionValue(0)
  const imageRotateX = useTransform(imageY, [-5, 5], [5, -5])
  const imageRotateY = useTransform(imageX, [-5, 5], [5, -5])

  useEffect(() => {
    setIsOpen(!!lineItem)
    setIsFlipped(false)
  }, [lineItem])

  const handleCardTilt = (x: number, y: number) => {
    imageX.set(-x)
    imageY.set(-y)
  }

  if (!lineItem) return null

  const artistName = lineItem.vendor_name || "Street Collector"
  const editionInfo = lineItem.edition_number 
    ? `Edition #${lineItem.edition_number}` 
    : "Limited Edition"

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      setIsOpen(false)
      onClose()
    }}>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:max-w-[900px] bg-transparent border-none p-0">
        <div className="perspective-[2000px]">
          <FloatingCard
            isFlipped={isFlipped}
            onClick={() => setIsFlipped(!isFlipped)}
            className="relative w-full aspect-[4/3] rounded-xl p-4 sm:p-8 shadow-2xl cursor-pointer"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const x = e.clientX - rect.left
              const y = e.clientY - rect.top
              const centerX = rect.width / 2
              const centerY = rect.height / 2
              const rotateX = ((y - centerY) / centerY) * 5
              const rotateY = ((x - centerX) / centerX) * -5
              handleCardTilt(rotateY, rotateX)
            }}
          >
            {/* Front of card - Artwork */}
            <div
              className="absolute inset-0"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transformStyle: "preserve-3d",
              }}
            >
              <div className="relative h-full flex flex-col items-center justify-center text-center p-6">
                {/* Premium Badge */}
                <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-400/30 rounded-full">
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  <span className="text-xs text-amber-300 font-medium">Authentic</span>
                </div>

                {lineItem.img_url && (
                  <motion.div
                    className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 mb-4 sm:mb-6 rounded-lg overflow-hidden border-2 border-amber-400/30 shadow-2xl"
                    style={{
                      rotateX: imageRotateX,
                      rotateY: imageRotateY,
                      transformStyle: "preserve-3d",
                    }}
                  >
                    <img
                      src={lineItem.img_url}
                      alt={lineItem.name}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                )}
                
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">{lineItem.name}</h2>
                {lineItem.description && lineItem.description !== lineItem.name && (
                  <p className="text-sm sm:text-base text-zinc-300 mb-3">{lineItem.description}</p>
                )}
                
                {/* Artist Section */}
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-amber-400" />
                  <p className="text-sm sm:text-base text-amber-300 font-medium">by {artistName}</p>
                </div>
                
                {lineItem.edition_number && (
                  <div className="flex items-center gap-2 text-amber-400 mb-4">
                    <Award className="h-4 w-4" />
                    <span className="text-sm sm:text-base font-semibold">{editionInfo}</span>
                  </div>
                )}
                
                {lineItem.nfc_tag_id && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-green-400 mb-4">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    <span>NFC Authenticated</span>
                  </div>
                )}
                
                <p className="text-xs sm:text-sm text-zinc-500 mt-4 flex items-center gap-2">
                  <Certificate className="h-3 w-3" />
                  Click to view certificate details
                </p>
              </div>
            </div>

            {/* Back of card - Certificate Details */}
            <div
              className="absolute inset-0"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transformStyle: "preserve-3d",
                transform: "rotateY(180deg)",
              }}
            >
              <div className="relative h-full flex flex-col text-center p-4 sm:p-6">
                {/* Certificate Header */}
                <div className="flex flex-col items-center mb-6 sm:mb-8">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mb-3 sm:mb-4 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-400/30 flex items-center justify-center">
                    <Certificate className="h-8 w-8 sm:h-10 sm:w-10 text-amber-400" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Certificate of Authenticity</h1>
                  <div className="h-px w-32 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent"></div>
                </div>

                {/* Certificate Content */}
                <div className="flex-1 flex flex-col justify-center space-y-4 sm:space-y-6 max-w-lg mx-auto">
                  {/* Artwork Title */}
                  <div className="text-center border-b border-zinc-700/50 pb-3">
                    <h2 className="text-lg sm:text-xl font-bold text-white mb-1">{lineItem.name}</h2>
                    <p className="text-amber-400 font-semibold">{editionInfo}</p>
                  </div>

                  {/* Artist Information */}
                  <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/30">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <User className="h-5 w-5 text-amber-400" />
                      <span className="text-sm text-zinc-400">Artist</span>
                    </div>
                    <p className="text-lg font-semibold text-white mb-2">{artistName}</p>
                    
                    {/* Artist Signature */}
                    <div className="mt-4 pt-3 border-t border-zinc-700/30">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Signature className="h-4 w-4 text-amber-400" />
                        <span className="text-xs text-zinc-400">Artist Signature</span>
                      </div>
                      <div className="signature-font text-2xl sm:text-3xl text-amber-300 opacity-80">
                        {artistName}
                      </div>
                    </div>
                  </div>

                  {/* Authentication Details */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-zinc-800/20 rounded-lg p-3 border border-zinc-700/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-amber-400" />
                        <span className="text-xs text-zinc-400">Authenticated</span>
                      </div>
                      <p className="text-sm text-white font-medium">{new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="bg-zinc-800/20 rounded-lg p-3 border border-zinc-700/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Hash className="h-4 w-4 text-amber-400" />
                        <span className="text-xs text-zinc-400">Edition</span>
                      </div>
                      <p className="text-sm text-white font-medium">
                        {lineItem.edition_number ? `#${lineItem.edition_number}` : "Limited"}
                      </p>
                    </div>
                  </div>

                  {/* Certificate Token */}
                  {lineItem.certificate_token && (
                    <div className="bg-zinc-800/20 rounded-lg p-3 border border-zinc-700/20">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Certificate className="h-4 w-4 text-amber-400" />
                        <span className="text-xs text-zinc-400">Certificate ID</span>
                      </div>
                      <p className="text-xs text-zinc-300 font-mono bg-zinc-900/50 px-2 py-1 rounded">
                        {lineItem.certificate_token.slice(0, 16)}...
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="mt-6 space-y-3">
                  {lineItem.certificate_url && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(lineItem.certificate_url, '_blank')
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-lg transition-all duration-200 shadow-lg"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Full Certificate
                    </button>
                  )}
                  
                  <p className="text-xs text-zinc-500 flex items-center justify-center gap-2">
                    <Sparkles className="h-3 w-3" />
                    Click to view artwork
                  </p>
                </div>
              </div>
            </div>
          </FloatingCard>
        </div>
      </DialogContent>
    </Dialog>
  )
} 