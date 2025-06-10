"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X, BadgeIcon as Certificate, User, Calendar, Hash, ExternalLink, Award, Sparkles, Signature, Wifi, WifiOff, Album } from "lucide-react"
import { motion, useMotionValue, useTransform } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

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

.postcard-tilt {
  transform-style: preserve-3d;
  transition: transform 0.1s ease-out;
}
`

function PostcardCertificate({ children, className = "", isFlipped = false, onMouseMove, onMouseLeave, ...props }: React.HTMLAttributes<HTMLDivElement> & { 
  isFlipped?: boolean
  onMouseMove?: (e: React.MouseEvent<HTMLDivElement>) => void
  onMouseLeave?: () => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 })
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    // Calculate rotation based on mouse position relative to center
    const rotateX = ((y - centerY) / centerY) * -15 // Increased intensity
    const rotateY = ((x - centerX) / centerX) * 15   // Increased intensity
    
    setMousePosition({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 })
    
    // Apply 3D transform with enhanced tilt
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) ${isFlipped ? 'rotateY(' + (180 + rotateY) + 'deg)' : ''} scale3d(1.02,1.02,1.02)`
    
    // Call parent mouse move handler
    onMouseMove?.(e)
  }
  
  const handleMouseLeave = () => {
    const card = cardRef.current
    if (!card) return
    card.style.transform = isFlipped ? "perspective(1000px) rotateY(180deg)" : "perspective(1000px)"
    setMousePosition({ x: 50, y: 50 })
    onMouseLeave?.()
  }
  
  return (
    <>
      <style>{shimmerStyles}</style>
      <div
        ref={cardRef}
        className={`postcard-tilt relative bg-gradient-to-br from-zinc-900/95 via-zinc-800/95 to-zinc-900/95 backdrop-blur-sm border border-amber-500/30 rounded-xl shadow-2xl hover:shadow-3xl hover:border-amber-400/50 overflow-hidden golden-glow ${className}`}
        style={{ 
          willChange: "transform",
          transformStyle: "preserve-3d",
          transform: isFlipped ? "perspective(1000px) rotateY(180deg)" : "perspective(1000px)",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {/* Premium border gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 via-amber-300/10 to-amber-400/20 p-[1px] rounded-xl">
          <div className="h-full w-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-xl" />
        </div>
        
        {/* Enhanced shimmer overlay with mouse tracking */}
        <span 
          className="pointer-events-none absolute inset-0 z-10 opacity-0 hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(251,191,36,0.2) 0%, transparent 60%)`,
          }}
        >
          <span className="block w-full h-full shimmer" />
        </span>
        
        <div className="relative z-20 h-full">
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
  edition_total?: number | null
  price?: number
  certificate_url?: string
  certificate_token?: string
  nfc_tag_id?: string | null
  nfc_claimed_at?: string | null
  status?: string
  order_id?: string
}

interface CertificateModalProps {
  lineItem: LineItem | null
  onClose: () => void
}

export function CertificateModal({ lineItem, onClose }: CertificateModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)

  useEffect(() => {
    setIsOpen(!!lineItem)
    setIsFlipped(false)
  }, [lineItem])

  if (!lineItem) return null

  const artistName = lineItem.vendor_name || "Street Collector"
  const editionInfo = lineItem.edition_number && lineItem.edition_total
    ? `${lineItem.edition_number} of ${lineItem.edition_total}`
    : lineItem.edition_number 
    ? `${lineItem.edition_number}`
    : "Limited Edition"

  const nfcStatus = lineItem.nfc_tag_id 
    ? (lineItem.nfc_claimed_at ? "paired" : "unpaired")
    : "no-nfc"

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      setIsOpen(false)
      onClose()
    }}>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:max-w-[800px] lg:max-w-[900px] bg-transparent border-none p-4 sm:p-8">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="perspective-[2000px] w-full max-w-2xl">
            <PostcardCertificate
              isFlipped={isFlipped}
              onClick={() => setIsFlipped(!isFlipped)}
              className="relative w-full aspect-[3/2] rounded-xl cursor-pointer"
            >
              {/* FRONT OF POSTCARD - Just Image and Basic Info */}
              <div
                className="absolute inset-0 p-0"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Background Image */}
                {lineItem.img_url && (
                  <div className="absolute inset-0 rounded-xl overflow-hidden">
                    <img
                      src={lineItem.img_url}
                      alt={lineItem.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Dark overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  </div>
                )}

                {/* Postcard Front Content - Bottom overlay */}
                <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
                  {/* Premium Badge - Top Right */}
                  <div className="absolute top-6 right-6">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-sm border border-amber-400/30 rounded-full">
                      <Sparkles className="h-3 w-3 text-amber-400" />
                      <span className="text-xs text-amber-300 font-medium">Authenticated</span>
                    </div>
                  </div>

                  {/* Artwork Title */}
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 drop-shadow-2xl">
                    {lineItem.name}
                  </h1>
                  
                  {/* Artist Name */}
                  <div className="flex items-center gap-2 mb-4">
                    <User className="h-5 w-5 text-amber-400" />
                    <p className="text-xl text-amber-300 font-medium drop-shadow-lg">
                      {artistName}
                    </p>
                  </div>

                  {/* Edition Badge */}
                  <div className="flex items-center gap-3">
                    <Badge className="bg-amber-500/30 text-amber-200 border-amber-400/50 text-sm px-3 py-1">
                      <Award className="h-4 w-4 mr-1" />
                      Edition #{editionInfo}
                    </Badge>
                  </div>

                  {/* Instruction */}
                  <p className="text-sm text-zinc-300 mt-6 flex items-center gap-2 opacity-80">
                    <Certificate className="h-4 w-4" />
                    Click to view certificate details
                  </p>
                </div>
              </div>

              {/* BACK OF POSTCARD - All Certificate Details */}
              <div
                className="absolute inset-0 p-8"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transformStyle: "preserve-3d",
                  transform: "rotateY(180deg)",
                }}
              >
                <div className="h-full flex flex-col justify-between">
                  {/* Certificate Header */}
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <div className="w-24 h-16 bg-zinc-900/30 border border-zinc-700/30 rounded-lg flex items-center justify-center">
                        <Certificate className="h-8 w-8 text-amber-400" />
                      </div>
                      <div className="text-right">
                        <h1 className="text-2xl font-bold text-white">Certificate of Authenticity</h1>
                        <p className="text-sm text-zinc-400">Unique Digital Artwork</p>
                      </div>
                    </div>

                    {/* Artwork Image Thumbnail */}
                    <div className="w-full aspect-video rounded-lg overflow-hidden mb-6 border-2 border-zinc-700/50">
                      {lineItem.img_url ? (
                        <img 
                          src={lineItem.img_url} 
                          alt={lineItem.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full bg-zinc-800/50 flex items-center justify-center">
                          <Album className="w-24 h-24 text-zinc-600" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Certificate Details */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-xs text-zinc-400 mb-1">Artwork Title</p>
                      <h2 className="text-lg font-bold text-white truncate">{lineItem.name}</h2>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400 mb-1">Artist</p>
                      <p className="text-lg font-semibold text-amber-400">
                        {artistName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400 mb-1">Edition</p>
                      <p className="text-base text-white">
                        {lineItem.edition_number && lineItem.edition_total
                          ? `#${lineItem.edition_number} of ${lineItem.edition_total}`
                          : "Limited Edition"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400 mb-1">Authenticated</p>
                      <p className="text-base text-white">
                        {new Date().toLocaleDateString('en-US', {
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* NFC Pairing Section */}
                  <div className="mt-4 bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/30">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        {nfcStatus === "paired" ? (
                          <Wifi className="h-5 w-5 text-green-400" />
                        ) : nfcStatus === "unpaired" ? (
                          <WifiOff className="h-5 w-5 text-yellow-400" />
                        ) : (
                          <WifiOff className="h-5 w-5 text-red-400" />
                        )}
                        <p className="text-sm font-medium text-white">
                          NFC Tag Status: {
                            nfcStatus === "paired" ? "Paired" : 
                            nfcStatus === "unpaired" ? "Unclaimed" : 
                            "No NFC Tag"
                          }
                        </p>
                      </div>
                      {nfcStatus !== "paired" && lineItem.nfc_tag_id && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-xs"
                          onClick={async () => {
                            try {
                              // Prompt for NFC tag scanning
                              const tagId = await new Promise<string>((resolve, reject) => {
                                // You might want to replace this with a proper NFC scanning modal/component
                                const scannedTagId = prompt("Please scan your NFC tag")
                                if (scannedTagId) {
                                  resolve(scannedTagId)
                                } else {
                                  reject(new Error("No tag scanned"))
                                }
                              })

                              // Call the NFC claim API
                              const response = await fetch('/api/nfc-tags/claim', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  tagId,
                                  lineItemId: lineItem.line_item_id,
                                  orderId: lineItem.order_id,
                                  customerId: document.cookie
                                    .split('; ')
                                    .find(row => row.startsWith('shopify_customer_id='))
                                    ?.split('=')[1]
                                })
                              })

                              const result = await response.json()

                              if (result.success) {
                                toast({
                                  title: "NFC Tag Paired",
                                  description: "Your NFC tag has been successfully paired with this artwork.",
                                  variant: "default"
                                })
                                
                                // Optionally, you might want to refresh the line item data
                                // This would require passing a refresh callback from the parent component
                              } else {
                                toast({
                                  title: "NFC Pairing Failed",
                                  description: result.message || "Unable to pair NFC tag",
                                  variant: "destructive"
                                })
                              }
                            } catch (error) {
                              console.error("NFC Pairing Error:", error)
                              toast({
                                title: "NFC Pairing Error",
                                description: error instanceof Error ? error.message : "An unexpected error occurred",
                                variant: "destructive"
                              })
                            }
                          }}
                        >
                          Pair NFC Tag
                        </Button>
                      )}
                    </div>
                    {nfcStatus === "paired" && (
                      <div className="text-xs text-zinc-400">
                        <p>Paired on: {lineItem.nfc_claimed_at ? new Date(lineItem.nfc_claimed_at).toLocaleString() : 'Unknown'}</p>
                      </div>
                    )}
                  </div>

                  {/* Signature and Seal Area */}
                  <div className="flex justify-between items-end border-t border-zinc-700/30 pt-4">
                    <div className="w-1/3">
                      <p className="text-xs text-zinc-400 mb-2">Authorized Signature</p>
                      <div className="h-16 border-b border-zinc-700/50"></div>
                    </div>
                    <div className="w-1/3 text-center">
                      <div className="w-24 h-24 mx-auto bg-zinc-900/30 border border-zinc-700/30 rounded-full flex items-center justify-center">
                        <Sparkles className="h-12 w-12 text-amber-400 opacity-50" />
                      </div>
                      <p className="text-xs text-zinc-400 mt-2">Official Seal</p>
                    </div>
                    <div className="w-1/3 text-right">
                      <p className="text-xs text-zinc-400 mb-2">Certificate Number</p>
                      <p className="text-sm text-white font-mono">
                        {lineItem.certificate_token?.slice(0, 8) || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </PostcardCertificate>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 