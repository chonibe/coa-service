"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { 
  Download, 
  Share2, 
  Maximize, 
  Minimize,
  ScrollText,
  UserCircle,
  ImageIcon,
  BookOpen,
  Album,
  Hash,
  Calendar,
  Nfc,
  ExternalLink
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface CertificateModalProps {
  certificateUrl?: string
  artworkName?: string
  editionNumber?: number | null
  editionTotal?: number | null
  vendorName?: string | null
  artistBio?: string | null
  artworkStory?: string | null
  artworkDescription?: string | null
  artworkImageUrl?: string | null
  lineItem?: {
    line_item_id?: string
    name?: string
    img_url?: string | null
    vendor_name?: string | null
    description?: string | null
    certificate_url?: string | null
    nfc_tag_id?: string | null
    nfc_claimed_at?: string | null
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CertificateModal({
  certificateUrl = '', 
  artworkName = 'Untitled Artwork',
  editionNumber = null,
  editionTotal = null,
  vendorName = null,
  artistBio = null,
  artworkStory = null,
  artworkDescription = null,
  artworkImageUrl = null,
  lineItem = null,
  open,
  onOpenChange
}: CertificateModalProps) {
  // Use lineItem props if provided, with fallbacks
  const finalArtworkName = lineItem?.name || artworkName
  const finalVendorName = lineItem?.vendor_name || vendorName || 'Unknown Artist'
  const finalArtworkImageUrl = lineItem?.img_url || artworkImageUrl
  const finalCertificateUrl = lineItem?.certificate_url || certificateUrl

  // NFC Tag Status
  const nfcTagStatus = lineItem?.nfc_tag_id 
    ? (lineItem.nfc_claimed_at ? 'Paired' : 'Unpaired') 
    : 'No NFC Tag'

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeTab, setActiveTab] = useState('certificate')

  const handleDownload = () => {
    if (!finalCertificateUrl) return
    const link = document.createElement('a')
    link.href = finalCertificateUrl
    link.download = `${finalArtworkName}_Certificate.pdf`
    link.click()
  }

  const handleShare = async () => {
    if (!finalCertificateUrl) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Certificate for ${finalArtworkName}`,
          text: `Certificate of Authenticity for ${finalArtworkName}`,
          url: finalCertificateUrl
        })
      } catch (error) {
        console.error('Share failed:', error)
      }
    } else {
      navigator.clipboard.writeText(finalCertificateUrl)
      alert('Certificate link copied to clipboard')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <ScrollText className="w-6 h-6 text-amber-500" />
              Certificate of Authenticity
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <UserCircle className="w-5 h-5 text-muted-foreground" />
              <span>{finalVendorName}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Album className="w-5 h-5 text-muted-foreground" />
              <span>{finalArtworkName}</span>
            </div>

            {editionNumber && editionTotal && (
              <div className="flex items-center gap-3">
                <Hash className="w-5 h-5 text-muted-foreground" />
                <span>Edition {editionNumber} of {editionTotal}</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <span>Issued: {new Date().toLocaleDateString()}</span>
            </div>

            <div className="flex items-center gap-3">
              <Nfc className="w-5 h-5 text-muted-foreground" />
              <span>NFC Tag: {nfcTagStatus}</span>
            </div>

            {finalCertificateUrl && (
              <div className="flex items-center gap-3">
                <ExternalLink className="w-5 h-5 text-muted-foreground" />
                <a 
                  href={finalCertificateUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  View Online Certificate
                </a>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-between">
            <Button variant="outline" size="sm">View Certificate</Button>
            <Button variant="outline" size="sm">Artists</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
