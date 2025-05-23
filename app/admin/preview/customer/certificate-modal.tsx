"use client"

import { useState, useRef, useEffect, ReactNode } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, BadgeIcon as Certificate, User, Calendar, Hash, Tag } from "lucide-react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { getSupabaseClient } from "@/lib/supabase"

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
        className={`relative bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:border-zinc-700/50 overflow-hidden ${className}`}
        style={{ 
          willChange: "transform",
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {/* Dynamic shimmer overlay */}
        <span 
          className="pointer-events-none absolute inset-0 z-10 opacity-0 hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
          }}
        >
          <span className="block w-full h-full shimmer" />
        </span>
        {children}
      </div>
    </>
  )
}

interface CertificateModalProps {
  isOpen: boolean
  onClose: () => void
  lineItem: {
    id: string
    name: string
    description: string
    price: number
    img_url: string
    vendor_name: string
    nfc_tag_id: string | null
  }
}

export function CertificateModal({ isOpen, onClose, lineItem }: CertificateModalProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [vendorSignature, setVendorSignature] = useState<string | null>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  useEffect(() => {
    if (lineItem.vendor_name) {
      fetchVendorSignature(lineItem.vendor_name)
    }
  }, [lineItem.vendor_name])

  const fetchVendorSignature = async (vendorName: string) => {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        console.error("Failed to initialize Supabase client")
        return
      }

      const { data, error } = await supabase
        .from("vendors")
        .select("signature_url")
        .eq("vendor_name", vendorName)
        .single()

      if (error) {
        console.error("Error fetching vendor signature:", error)
        return
      }

      if (data?.signature_url) {
        setVendorSignature(data.signature_url as string)
      }
    } catch (error) {
      console.error("Error in fetchVendorSignature:", error)
    }
  }

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

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl p-0 bg-transparent border-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative w-full h-[600px] perspective-1000">
          <motion.div
            className={`w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? "rotate-y-180" : ""}`}
            style={{
              rotateX: springRotateX,
              rotateY: springRotateY,
            }}
          >
            {/* Front of the card */}
            <div
              className={`absolute w-full h-full backface-hidden ${
                lineItem.nfc_tag_id
                  ? "bg-gradient-to-br from-[rgb(30,27,75)] to-[rgb(24,24,27)]"
                  : "bg-gradient-to-br from-[rgb(76,29,29)] to-[rgb(24,24,27)]"
              } rounded-xl shadow-2xl p-8`}
            >
              <div className="flex flex-col h-full">
                <div className="flex-1 relative">
                  <motion.div
                    className="w-full h-[400px] rounded-lg overflow-hidden relative"
                    style={{
                      rotateX: springRotateX,
                      rotateY: springRotateY,
                    }}
                  >
                    <img
                      src={lineItem.img_url}
                      alt={lineItem.name}
                      className="w-full h-full object-cover"
                    />
                    {!lineItem.nfc_tag_id && (
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent flex items-center justify-center">
                        <Tag className="w-6 h-6 text-red-400" />
                      </div>
                    )}
                  </motion.div>
                </div>
                <div className="mt-6 text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">{lineItem.name}</h3>
                  <p className="text-gray-300 mb-4">{lineItem.description}</p>
                  <Button
                    onClick={handleFlip}
                    className={`${
                      lineItem.nfc_tag_id
                        ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/50"
                        : "bg-red-500/20 text-red-400 border-red-500/50"
                    } hover:bg-opacity-30 transition-all duration-300`}
                  >
                    View Certificate
                  </Button>
                </div>
              </div>
            </div>

            {/* Back of the card */}
            <div
              className={`absolute w-full h-full backface-hidden rotate-y-180 ${
                lineItem.nfc_tag_id
                  ? "bg-gradient-to-br from-[rgb(30,27,75)] to-[rgb(24,24,27)]"
                  : "bg-gradient-to-br from-[rgb(76,29,29)] to-[rgb(24,24,27)]"
              } rounded-xl shadow-2xl p-8`}
            >
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-white mb-6 text-center">Certificate of Authenticity</h2>
                  <div className="space-y-4 text-white">
                    <p className="text-lg">
                      <span className="font-semibold">Artwork:</span> {lineItem.name}
                    </p>
                    <p className="text-lg">
                      <span className="font-semibold">Artist:</span> {lineItem.vendor_name}
                    </p>
                    <p className="text-lg">
                      <span className="font-semibold">Edition Number:</span> 1/1
                    </p>
                    <p className="text-lg">
                      <span className="font-semibold">Certificate ID:</span> {lineItem.nfc_tag_id || "Not paired"}
                    </p>
                  </div>
                </div>
                <div className="mt-8 flex justify-between items-end">
                  <div className="flex-1">
                    <p className="text-white text-sm">Artist Signature</p>
                    {vendorSignature ? (
                      <img
                        src={vendorSignature}
                        alt="Artist Signature"
                        className="h-16 object-contain"
                      />
                    ) : (
                      <div className="h-16 flex items-center text-gray-400">No signature available</div>
                    )}
                  </div>
                  <Button
                    onClick={handleFlip}
                    className={`${
                      lineItem.nfc_tag_id
                        ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/50"
                        : "bg-red-500/20 text-red-400 border-red-500/50"
                    } hover:bg-opacity-30 transition-all duration-300`}
                  >
                    View Artwork
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 