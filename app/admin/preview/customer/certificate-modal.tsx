import React, { useRef, ReactNode } from 'react'
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
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
  if (!lineItem) return null

  return (
    <Dialog open={!!lineItem} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-zinc-900 border-zinc-800 text-white">
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center p-2 bg-green-900/50 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Certificate of Authenticity</h2>
            {lineItem.edition_number && lineItem.edition_total && (
              <p className="text-zinc-400">
                Edition #{lineItem.edition_number} of {lineItem.edition_total}
              </p>
            )}
          </div>

          {lineItem.image_url && (
            <div className="aspect-video relative bg-zinc-800 rounded-lg overflow-hidden">
              <img
                src={lineItem.image_url}
                alt={lineItem.title}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-zinc-800 rounded-lg p-4">
              <div className="flex items-start">
                <Certificate className="h-5 w-5 text-indigo-400 mt-0.5 mr-2" />
                <div>
                  <h3 className="font-semibold text-white">Edition Details</h3>
                  {lineItem.edition_number && lineItem.edition_total && (
                    <p className="text-indigo-400 font-bold text-lg">
                      #{lineItem.edition_number} of {lineItem.edition_total}
                    </p>
                  )}
                  <p className="text-sm text-zinc-400">Limited Edition</p>
                </div>
              </div>
            </div>

            {lineItem.vendor && (
              <div className="border border-zinc-800 rounded-lg p-4">
                <div className="flex items-start">
                  <User className="h-5 w-5 text-indigo-400 mt-0.5 mr-2" />
                  <div>
                    <h3 className="font-semibold text-white">Artist</h3>
                    <p className="text-zinc-300">{lineItem.vendor}</p>
                    <p className="text-sm text-zinc-400">Original Creator</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 