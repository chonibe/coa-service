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
      <DialogContent className="sm:max-w-[800px] p-0">
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
          className="p-6"
        />
      </DialogContent>
    </Dialog>
  )
} 