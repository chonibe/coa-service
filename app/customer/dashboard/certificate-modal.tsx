"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { EnhancedCertificate } from "@/components/ui/enhanced-certificate"
import { useState } from "react"

interface CertificateModalProps {
  isOpen: boolean
  onClose: () => void
  certificate: {
    id: string
    artwork_url: string
    artwork_title: string
    artist_name: string
    edition_number: string
    issue_date: string
  }
}

export function CertificateModal({ isOpen, onClose, certificate }: CertificateModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0 bg-transparent border-0">
        <EnhancedCertificate
          artworkUrl={certificate.artwork_url}
          artworkTitle={certificate.artwork_title}
          artistName={certificate.artist_name}
          editionNumber={certificate.edition_number}
          certificateId={certificate.id}
          issueDate={new Date(certificate.issue_date).toLocaleDateString()}
          className="w-full"
        />
      </DialogContent>
    </Dialog>
  )
} 