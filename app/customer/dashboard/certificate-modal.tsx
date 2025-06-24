"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X, BadgeIcon as Certificate, User, Calendar, Hash, ExternalLink, Award, Sparkles, Signature, Wifi, WifiOff, Album, Scan, Loader2 } from "lucide-react"
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
  lineItem: LineItem
  onClose: () => void
}

export function CertificateModal({ lineItem, onClose }: CertificateModalProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isNfcPairing, setIsNfcPairing] = useState(false)

  // Ensure lineItem has default values
  const safeLineItem: LineItem = {
    line_item_id: lineItem.line_item_id || '',
    name: lineItem.name || 'Untitled Artwork',
    description: lineItem.description || '',
    img_url: lineItem.img_url || undefined,
    vendor_name: lineItem.vendor_name || 'Unknown Artist',
    edition_number: lineItem.edition_number ?? null,
    edition_total: lineItem.edition_total ?? null,
    price: lineItem.price ?? undefined,
    certificate_url: lineItem.certificate_url || undefined,
    certificate_token: lineItem.certificate_token || undefined,
    nfc_tag_id: lineItem.nfc_tag_id ?? null,
    nfc_claimed_at: lineItem.nfc_claimed_at || undefined,
    status: lineItem.status || undefined,
    order_id: lineItem.order_id || undefined
  }

  useEffect(() => {
    setIsOpen(true)
    setIsFlipped(false)
  }, [safeLineItem.line_item_id])

  const artistName = safeLineItem.vendor_name
  const editionInfo = safeLineItem.edition_number && safeLineItem.edition_total
    ? `${safeLineItem.edition_number} of ${safeLineItem.edition_total}`
    : safeLineItem.edition_number 
    ? `${safeLineItem.edition_number}`
    : "Limited Edition"

  const nfcStatus = safeLineItem.nfc_tag_id 
    ? (safeLineItem.nfc_claimed_at ? "paired" : "unpaired")
    : "no-nfc"

  const handleNfcPairing = async () => {
    // Check if Web NFC is supported
    if ('NDEFReader' in window) {
      try {
        setIsNfcPairing(true)
        const ndef = new NDEFReader()
        await ndef.scan()

        ndef.addEventListener("reading", async ({ message, serialNumber }) => {
          try {
            // Send tag to backend for verification and claim
                              const response = await fetch('/api/nfc-tags/claim', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                tagId: serialNumber,
                lineItemId: safeLineItem?.line_item_id,
                orderId: safeLineItem?.order_id,
                customerId: null // TODO: Get actual customer ID
                                })
                              })

                              const result = await response.json()

                              if (result.success) {
                                toast({
                                  title: "NFC Tag Paired",
                description: "Your artwork has been successfully authenticated.",
                                  variant: "default"
                                })
              // Optionally refresh the line item or close modal
              onClose()
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
            setIsNfcPairing(false)
          }
        })
      } catch (error) {
        console.error("NFC Scanning Error:", error)
        toast({
          title: "NFC Error",
          description: "Unable to start NFC scanning",
          variant: "destructive"
        })
        setIsNfcPairing(false)
      }
    } else {
                              toast({
        title: "Unsupported Browser",
        description: "Web NFC is not supported in your browser",
                                variant: "destructive"
                              })
                            }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl w-full p-0 overflow-hidden">
        <PostcardCertificate 
          isFlipped={isFlipped}
          className="w-full h-[600px] flex flex-col"
        >
          <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
            <Badge 
              variant={
                nfcStatus === "paired" 
                  ? "default" 
                  : nfcStatus === "unpaired" 
                  ? "secondary" 
                  : "destructive"
              }
              className="flex items-center gap-2"
            >
              {nfcStatus === "paired" ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : nfcStatus === "unpaired" ? (
                <WifiOff className="w-4 h-4 text-yellow-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              {nfcStatus === "paired" 
                ? "Authenticated" 
                : nfcStatus === "unpaired" 
                ? "Needs Authentication" 
                : "No NFC Tag"}
            </Badge>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onClose()}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="grid md:grid-cols-2 h-full">
            <div className="relative overflow-hidden">
              {safeLineItem.img_url ? (
                <img 
                  src={safeLineItem.img_url} 
                  alt={safeLineItem.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                  <Album className="w-24 h-24 text-zinc-600" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-4 text-white">
                <h2 className="text-2xl font-bold">{safeLineItem.name}</h2>
                <p className="text-sm text-zinc-300">{artistName}</p>
              </div>
            </div>

            <div className="p-8 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Certificate className="w-6 h-6 text-amber-500" />
                      Certificate of Authenticity
                    </h3>
                    <p className="text-muted-foreground">{editionInfo}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsFlipped(!isFlipped)}
                  >
                    {isFlipped ? "View Artwork" : "View Certificate"}
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Signature className="w-5 h-5 text-muted-foreground" />
                    <span>Artist: {artistName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <span>
                      Issued: {new Date().toLocaleDateString()}
                    </span>
                  </div>
                  {safeLineItem.certificate_url && (
                    <div className="flex items-center gap-3">
                      <ExternalLink className="w-5 h-5 text-muted-foreground" />
                      <a 
                        href={safeLineItem.certificate_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        View Online Certificate
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6">
                {nfcStatus === "unpaired" && (
                  <Button 
                    className="w-full" 
                    onClick={handleNfcPairing}
                    disabled={isNfcPairing}
                  >
                    {isNfcPairing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scanning for NFC Tag
                      </>
                    ) : (
                      <>
                        <Scan className="mr-2 h-4 w-4" />
                        Pair NFC Tag
                      </>
                    )}
                  </Button>
                )}
                {nfcStatus === "paired" && (
                  <div className="bg-green-50 border border-green-200 p-3 rounded-lg flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-green-500" />
                    <span className="text-green-800">
                      Artwork Authenticated with NFC
                    </span>
                  </div>
                )}
                {nfcStatus === "no-nfc" && (
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex items-center gap-3">
                    <WifiOff className="w-6 h-6 text-yellow-500" />
                    <span className="text-yellow-800">
                      No NFC Tag Available for this Artwork
                    </span>
                </div>
                )}
              </div>
            </div>
          </div>

          {isFlipped && (
            <div className="absolute inset-0 bg-white text-black p-8 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center border-b pb-4 mb-6">
                  <h1 className="text-3xl font-bold text-gray-900">Certificate of Authenticity</h1>
                  <div className="flex items-center gap-2">
                    <Certificate className="w-8 h-8 text-amber-600" />
                    <span className="text-lg font-semibold text-gray-700">Street Collector</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wider">Artwork Title</p>
                    <h2 className="text-2xl font-semibold text-gray-900">{safeLineItem.name}</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 uppercase tracking-wider">Artist</p>
                      <p className="text-xl font-medium text-gray-800">{artistName}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 uppercase tracking-wider">Edition</p>
                      <p className="text-xl font-medium text-gray-800">
                        {safeLineItem.edition_number && safeLineItem.edition_total
                          ? `${safeLineItem.edition_number} of ${safeLineItem.edition_total}`
                          : "Limited Edition"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Wifi className="w-6 h-6 text-green-600" />
                        <span className="text-sm text-gray-600">
                          {nfcStatus === "paired" 
                            ? "NFC Authenticated" 
                            : "NFC Authentication Pending"}
                        </span>
                      </div>
                      {safeLineItem.nfc_claimed_at && (
                        <p className="text-sm text-gray-500">
                          Authenticated on: {new Date(safeLineItem.nfc_claimed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t pt-4 flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500">Certificate Number</p>
                  <p className="font-mono text-sm text-gray-800">
                    {safeLineItem.certificate_token?.slice(0, 12) || 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Issued Date</p>
                  <p className="text-sm text-gray-800">
                    {new Date().toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </PostcardCertificate>
      </DialogContent>
    </Dialog>
  )
} 