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
import { Button } from "@/components/ui/button"
import { 
  Download, 
  Share2, 
  Maximize, 
  Minimize 
} from "lucide-react"

interface CertificateModalProps {
  certificateUrl: string
  artworkName: string
  editionNumber?: number
  editionTotal?: number
  vendorName?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CertificateModal({
  certificateUrl, 
  artworkName,
  editionNumber,
  editionTotal,
  vendorName,
  open,
  onOpenChange
}: CertificateModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = certificateUrl
    link.download = `${artworkName}_Certificate.pdf`
    link.click()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Certificate for ${artworkName}`,
          text: `Certificate of Authenticity for ${artworkName}`,
          url: certificateUrl
        })
      } catch (error) {
        console.error('Share failed:', error)
      }
    } else {
      // Fallback for browsers without Web Share API
      navigator.clipboard.writeText(certificateUrl)
      alert('Certificate link copied to clipboard')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`
          max-w-4xl 
          ${isFullscreen ? 'h-screen w-screen max-w-full max-h-full' : ''}
        `}
      >
        <DialogHeader>
          <DialogTitle>{artworkName} - Certificate of Authenticity</DialogTitle>
          <DialogDescription>
            {vendorName && `By ${vendorName}`}
            {editionNumber && editionTotal && ` | Edition ${editionNumber} of ${editionTotal}`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative w-full h-[70vh] flex items-center justify-center">
          <Image 
            src={certificateUrl} 
            alt={`Certificate for ${artworkName}`}
            fill
            className="object-contain"
            priority
          />
        </div>
        
        <div className="flex justify-between items-center p-4">
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleDownload}
            >
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
            <Button 
              variant="outline" 
              onClick={handleShare}
            >
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 