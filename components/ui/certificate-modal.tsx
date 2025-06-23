"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { EnhancedCertificate } from "@/components/ui/enhanced-certificate"
import { useState } from "react"

interface CertificateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  name: string
  description?: string
  artistName: string
  editionInfo: string
  nfcTagId?: string
  nfcClaimedAt?: string
  imgUrl?: string
  certificateUrl?: string
  onStartPairing?: () => void
}

export function CertificateModal({
  open,
  onOpenChange,
  name,
  description,
  artistName,
  editionInfo,
  nfcTagId,
  nfcClaimedAt,
  imgUrl,
  certificateUrl,
  onStartPairing,
}: CertificateModalProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[700px] lg:max-w-[800px] p-0 max-h-[90vh] overflow-y-auto">
        <EnhancedCertificate
          name={name}
          description={description}
          artistName={artistName}
          editionInfo={editionInfo}
          nfcTagId={nfcTagId}
          nfcClaimedAt={nfcClaimedAt}
          imgUrl={imgUrl}
          certificateUrl={certificateUrl}
          isFlipped={isFlipped}
          onFlip={() => setIsFlipped(!isFlipped)}
          onStartPairing={onStartPairing}
          className="p-4 sm:p-6"
        />
      </DialogContent>
    </Dialog>
  )
} 