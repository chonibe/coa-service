"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Clock, ShoppingBag, User, BadgeIcon as Certificate } from "lucide-react"

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
  }, [lineItem])

  if (!lineItem) return null

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      setIsOpen(false)
      onClose()
    }}>
      <DialogContent className="sm:max-w-[600px] bg-zinc-900 border-zinc-800">
        <div className="absolute right-4 top-4">
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
        <div className="mt-6">
          <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              rotateX,
              rotateY,
              transformStyle: "preserve-3d",
            }}
            className="relative w-full aspect-[3/4] rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 p-8 shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] animate-shimmer" />
            <div className="relative h-full flex flex-col items-center justify-center text-center">
              {lineItem.image_url && (
                <div className="w-32 h-32 mb-6 rounded-full overflow-hidden border-2 border-zinc-700">
                  <img
                    src={lineItem.image_url}
                    alt={lineItem.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <h2 className="text-2xl font-bold text-white mb-2">{lineItem.title}</h2>
              {lineItem.vendor && (
                <p className="text-zinc-400 mb-4">{lineItem.vendor}</p>
              )}
              {lineItem.edition_number && lineItem.edition_total && (
                <div className="text-indigo-400">
                  Edition #{lineItem.edition_number} of {lineItem.edition_total}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 