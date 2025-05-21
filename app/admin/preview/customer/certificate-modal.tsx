import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "../../../utils/date"
import React, { useRef, ReactNode, MouseEvent } from "react"

interface LineItem {
  line_item_id: string
  order_id: string
  title: string
  quantity: number
  price: number
  image_url: string | null
  status: string
  created_at: string
  vendor: string | null
  edition_number: number | null
  edition_total: number | null
  nfc_tag_id: string | null
  nfc_claimed_at: string | null
}

interface CertificateModalProps {
  isOpen: boolean
  onClose: () => void
  lineItem: LineItem | null
}

function FloatingTiltCard({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
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
    <div
      ref={cardRef}
      className={`relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg transition-transform duration-200 hover:shadow-2xl overflow-hidden ${className}`}
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
  )
}

export function CertificateModal({ isOpen, onClose, lineItem }: CertificateModalProps) {
  if (!lineItem) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl" aria-describedby="certificate-description">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Certificate of Authenticity</DialogTitle>
        </DialogHeader>
        
        <div id="certificate-description" className="mt-6 space-y-8">
          {/* Product Information */}
          <div className="flex gap-6">
            {lineItem.image_url && (
              <div className="w-48 h-48 flex-shrink-0">
                <img
                  src={lineItem.image_url}
                  alt={lineItem.title}
                  className="w-full h-full object-cover rounded-lg shadow-lg"
                />
              </div>
            )}
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-xl font-semibold">{lineItem.title}</h3>
                <p className="text-sm text-gray-500">
                  Created on {formatDate(lineItem.created_at)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Quantity</p>
                  <p className="text-lg">{lineItem.quantity}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Price</p>
                  <p className="text-lg">${lineItem.price}</p>
                </div>
                {lineItem.edition_number && lineItem.edition_total && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Edition</p>
                    <p className="text-lg">{lineItem.edition_number}/{lineItem.edition_total}</p>
                  </div>
                )}
                {lineItem.vendor && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Artist</p>
                    <p className="text-lg">{lineItem.vendor}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={lineItem.status === 'active' ? 'default' : 'secondary'}>
                  {lineItem.status}
                </Badge>
                {lineItem.nfc_tag_id && (
                  <Badge variant="outline">
                    NFC Tag: {lineItem.nfc_tag_id}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Certificate Content */}
          <FloatingTiltCard className="mt-4">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="text-center">
                  <h4 className="text-lg font-semibold">Certificate of Authenticity</h4>
                  <p className="text-sm text-gray-500">This certifies that the above item is authentic</p>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-600">
                    This certificate verifies the authenticity of the artwork and confirms its provenance.
                    The item has been verified and authenticated by our team of experts.
                  </p>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-sm font-medium">Certificate ID</p>
                    <p className="text-sm text-gray-500">{lineItem.line_item_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Date Issued</p>
                    <p className="text-sm text-gray-500">{formatDate(lineItem.created_at)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </FloatingTiltCard>
        </div>
        <style jsx global>{`
          .shimmer {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(120deg, rgba(255,255,255,0) 60%, rgba(255,255,255,0.12) 80%, rgba(255,255,255,0) 100%);
            background-size: 200% 100%;
            animation: shimmer-move 1.2s linear infinite;
            pointer-events: none;
          }
          @keyframes shimmer-move {
            0% { background-position: -100% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
} 