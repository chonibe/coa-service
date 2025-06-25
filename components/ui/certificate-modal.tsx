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
      <DialogContent 
        className={`
          max-w-5xl 
          ${isFullscreen ? 'h-screen w-screen max-w-full max-h-full' : ''}
        `}
      >
        <DialogHeader>
          <DialogTitle>{finalArtworkName} - Certificate of Authenticity</DialogTitle>
          <DialogDescription>
            {finalVendorName && `By ${finalVendorName}`}
            {editionNumber && editionTotal && ` | Edition ${editionNumber} of ${editionTotal}`}
            {` | NFC Tag: ${nfcTagStatus}`}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="certificate" className="flex items-center gap-2">
              <ScrollText className="h-4 w-4" /> Certificate
            </TabsTrigger>
            <TabsTrigger value="artwork" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" /> Artwork
            </TabsTrigger>
            <TabsTrigger value="artist" className="flex items-center gap-2">
              <UserCircle className="h-4 w-4" /> Artist
            </TabsTrigger>
            <TabsTrigger value="story" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Story
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="certificate" className="h-[60vh] overflow-auto">
            <div className="relative w-full h-full flex items-center justify-center">
              {finalCertificateUrl ? (
                <Image 
                  src={finalCertificateUrl} 
                  alt={`Certificate for ${finalArtworkName}`}
                  fill
                  className="object-contain"
                  priority
                />
              ) : (
                <p className="text-muted-foreground">No certificate available</p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="artwork" className="h-[60vh] overflow-auto p-4">
            <div className="grid md:grid-cols-2 gap-6">
              {finalArtworkImageUrl && (
                <div className="relative aspect-square">
                  <Image 
                    src={finalArtworkImageUrl} 
                    alt={finalArtworkName}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
              )}
              <div>
                <h3 className="text-xl font-semibold mb-4">{finalArtworkName}</h3>
                {artworkDescription && (
                  <p className="text-muted-foreground">{artworkDescription}</p>
                )}
                <div className="mt-4 space-y-2">
                  {finalVendorName && (
                    <Badge variant="secondary">Artist: {finalVendorName}</Badge>
                  )}
                  {editionNumber && editionTotal && (
                    <Badge variant="outline">
                      Edition: {editionNumber} of {editionTotal}
                    </Badge>
                  )}
                  <Badge variant="outline">NFC Tag: {nfcTagStatus}</Badge>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="artist" className="h-[60vh] overflow-auto p-4">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold mb-4">{finalVendorName}</h3>
              {artistBio ? (
                <p className="text-muted-foreground">{artistBio}</p>
              ) : (
                <p className="text-muted-foreground italic">
                  Artist biography not available
                </p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="story" className="h-[60vh] overflow-auto p-4">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold mb-4">Artwork Story</h3>
              {artworkStory ? (
                <p className="text-muted-foreground">{artworkStory}</p>
              ) : (
                <p className="text-muted-foreground italic">
                  Artwork story not available
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-between items-center p-4">
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleDownload}
              disabled={!finalCertificateUrl}
            >
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
            <Button 
              variant="outline" 
              onClick={handleShare}
              disabled={!finalCertificateUrl}
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
