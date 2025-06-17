"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { X, BadgeIcon as Certificate, User, Calendar, Hash, ExternalLink, Award, Sparkles, Signature, Wifi, WifiOff, Album, Scan, Loader2 } from "lucide-react"
import { motion, useMotionValue, useTransform } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

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
  const [isNfcPairing, setIsNfcPairing] = useState(false)
  const [nfcError, setNfcError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    setIsOpen(!!lineItem)
    setIsFlipped(false)
    setNfcError(null)
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

  const handleNfcPairing = useCallback(async () => {
    setNfcError(null)
    setIsNfcPairing(true)

    if (!('NDEFReader' in window)) {
      setNfcError("Web NFC is not supported in your browser")
      setIsNfcPairing(false)
      return
    }

    try {
      const ndef = new NDEFReader()
      await ndef.scan()

      const pairingTimeout = setTimeout(() => {
        setNfcError("NFC pairing timed out. Please try again.")
        setIsNfcPairing(false)
      }, 30000)

      ndef.addEventListener("reading", async ({ serialNumber }) => {
        clearTimeout(pairingTimeout)
        
        try {
          const { data: { user } } = await supabase.auth.getUser()
          
          if (!user) {
            throw new Error("User not authenticated")
          }

          const response = await fetch('/api/nfc-tags/claim', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tagId: serialNumber,
              lineItemId: lineItem?.line_item_id,
              orderId: lineItem?.order_id,
              customerId: user.id
            })
          })

          const result = await response.json()

          if (result.success) {
            toast({
              title: "NFC Tag Paired",
              description: "Your artwork has been successfully authenticated.",
              variant: "default"
            })
            onClose()
          } else {
            setNfcError(result.message || "Unable to pair NFC tag")
          }
        } catch (error) {
          console.error("NFC Claim Error:", error)
          setNfcError(error instanceof Error ? error.message : "An unexpected error occurred")
        } finally {
          setIsNfcPairing(false)
        }
      })
    } catch (scanError) {
      console.error("NFC Scanning Error:", scanError)
      setNfcError("Failed to start NFC scanning")
      setIsNfcPairing(false)
    }
  }, [lineItem, onClose, supabase])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-zinc-900 border-amber-500/30">
        <DialogHeader>
          <DialogTitle className="flex items-center text-amber-400">
            <Certificate className="mr-2" /> Certificate of Authenticity
          </DialogTitle>
          <DialogDescription>
            Authenticate your limited edition artwork
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-amber-300">
              {lineItem.name}
            </h3>
            <Badge variant="secondary">
              Edition {lineItem.edition_number} of {lineItem.edition_total}
            </Badge>
          </div>

          {/* NFC Pairing Section */}
          <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
            {nfcError && (
              <div className="text-red-400 flex items-center mb-4">
                <WifiOff className="mr-2" />
                {nfcError}
              </div>
            )}

            <Button 
              onClick={handleNfcPairing} 
              disabled={isNfcPairing}
              className="w-full"
              variant="secondary"
            >
              {isNfcPairing ? (
                <>
                  <Loader2 className="mr-2 animate-spin" />
                  Scanning for NFC Tag...
                </>
              ) : (
                "Pair NFC Tag"
              )}
            </Button>

            {/* Non-NFC Fallback */}
            {!('NDEFReader' in window) && (
              <div className="text-yellow-400 text-sm mt-2 text-center">
                Your browser does not support NFC. Please use a compatible device.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 