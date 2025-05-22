"use client"

import { useState, useRef, useEffect, ReactNode } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, BadgeIcon as Certificate, User, Calendar, Hash } from "lucide-react"
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion"

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

export function FloatingTiltCard({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * 8
    const rotateY = ((x - centerX) / centerX) * -8
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03,1.03,1.03)`
  }
  const handleMouseLeave = () => {
    const card = cardRef.current
    if (!card) return
    card.style.transform = ""
  }
  return (
    <>
      <style>{shimmerStyles}</style>
      <div
        ref={cardRef}
        className={`relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg transition-transform duration-400 hover:shadow-2xl overflow-hidden ${className}`}
        style={{ willChange: "transform" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        tabIndex={0}
        {...props}
      >
        {/* Shimmer overlay */}
        <span className="pointer-events-none absolute inset-0 z-10 opacity-0 hover:opacity-100 transition-opacity duration-300">
          <span className="block w-full h-full shimmer" />
        </span>
        {children}
      </div>
    </>
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
  } | null
  onClose: () => void
}

export function CertificateModal({ lineItem, onClose }: CertificateModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x)
  const mouseYSpring = useSpring(y)

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  useEffect(() => {
    setIsOpen(!!lineItem)
    setIsFlipped(false)
  }, [lineItem])

  if (!lineItem) return null

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      setIsOpen(false)
      onClose()
    }}>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:max-w-[900px] bg-zinc-900 border-zinc-800 p-4 sm:p-6">
        <div className="absolute right-2 top-2 sm:right-4 sm:top-4 z-50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsOpen(false)
              onClose()
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-4 sm:mt-6 perspective-1000">
          <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={() => setIsFlipped(!isFlipped)}
            style={{
              transformStyle: "preserve-3d",
            }}
            className="relative w-full aspect-[4/3] rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 p-4 sm:p-8 shadow-2xl cursor-pointer"
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
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] animate-shimmer" />
            
            {/* Front of card */}
            <motion.div
              className="absolute inset-0"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
            >
              <div className="relative h-full flex flex-col items-center justify-center text-center">
                {lineItem.image_url && (
                  <div className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 mb-4 sm:mb-6 rounded-lg overflow-hidden border-2 border-zinc-700">
                    <img
                      src={lineItem.image_url}
                      alt={lineItem.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
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
            </motion.div>

            {/* Back of card */}
            <motion.div
              className="absolute inset-0"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
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
                </div>

                <p className="text-xs sm:text-sm text-zinc-500 mt-6 sm:mt-8">Click to view artwork</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 