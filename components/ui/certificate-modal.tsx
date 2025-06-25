"use client"

import React, { useState, useRef, useEffect } from 'react'
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
  Minimize,
  ScrollText,
  UserCircle,
  ImageIcon,
  BookOpen,
  Nfc,
  QrCode,
  Link as LinkIcon
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

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
    nfc_tag_url?: string | null
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
  // Resolve artwork details with fallbacks
  const finalArtworkName = lineItem?.name || artworkName
  const finalVendorName = lineItem?.vendor_name || vendorName || 'Unknown Artist'
  const finalArtworkImageUrl = lineItem?.img_url || artworkImageUrl

  // Enhanced certificate URL resolution
  const finalCertificateUrl = (() => {
    const url = lineItem?.certificate_url || certificateUrl || ''
    return url.startsWith('http') ? url : ''
  })()

  // NFC Tag Status and Details
  const nfcTagStatus = lineItem?.nfc_tag_id 
    ? (lineItem.nfc_claimed_at ? 'Paired' : 'Unpaired') 
    : 'No NFC Tag'
  const nfcTagUrl = lineItem?.nfc_tag_url || ''

  // State for fullscreen and scroll tracking
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeSection, setActiveSection] = useState('certificate')
  const sectionRefs = {
    certificate: useRef<HTMLDivElement>(null),
    artwork: useRef<HTMLDivElement>(null),
    artist: useRef<HTMLDivElement>(null),
    story: useRef<HTMLDivElement>(null)
  }

  // Scroll to section
  const scrollToSection = (sectionKey: keyof typeof sectionRefs) => {
    sectionRefs[sectionKey].current?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    })
  }

  // Handle download
  const handleDownload = () => {
    if (!finalCertificateUrl) return
    const link = document.createElement('a')
    link.href = finalCertificateUrl
    link.download = `${finalArtworkName}_Certificate.pdf`
    link.click()
  }

  // Handle share
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

  // Sections configuration
  const sections = [
    {
      key: 'certificate',
      icon: ScrollText,
      title: 'Certificate of Authenticity',
      content: () => (
        <div 
          ref={sectionRefs.certificate} 
          className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
        >
          {finalCertificateUrl ? (
            <Image 
              src={finalCertificateUrl} 
              alt={`Certificate for ${finalArtworkName}`}
              width={800}
              height={600}
              className="max-w-full max-h-[70vh] object-contain shadow-lg rounded-lg"
              priority
              onError={(e) => {
                console.error('Certificate Image Load Error:', {
                  url: finalCertificateUrl,
                  event: e
                })
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className="space-y-6 max-w-md">
              <h2 className="text-2xl font-bold text-muted-foreground">
                No Certificate Available
              </h2>
              <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
                <p className="text-yellow-700 mb-4">
                  This artwork does not have a digital certificate at the moment.
                </p>
                <p className="text-sm text-yellow-600">
                  Certificates are typically generated after successful order completion.
                </p>
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'artwork',
      icon: ImageIcon,
      title: 'Artwork Details',
      content: () => (
        <div 
          ref={sectionRefs.artwork} 
          className="min-h-screen flex flex-col md:flex-row items-center justify-center p-6 gap-8"
        >
          {finalArtworkImageUrl && (
            <div className="w-full md:w-1/2 max-w-md">
              <Image 
                src={finalArtworkImageUrl} 
                alt={finalArtworkName}
                width={500}
                height={500}
                className="rounded-lg shadow-lg object-cover aspect-square"
              />
            </div>
          )}
          <div className="w-full md:w-1/2 space-y-6">
            <h2 className="text-3xl font-bold">{finalArtworkName}</h2>
            {artworkDescription && (
              <p className="text-muted-foreground">{artworkDescription}</p>
            )}
            <div className="space-y-4">
              {finalVendorName && (
                <Badge variant="secondary" className="text-base p-2">
                  Artist: {finalVendorName}
                </Badge>
              )}
              {editionNumber && editionTotal && (
                <Badge variant="outline" className="text-base p-2">
                  Edition: {editionNumber} of {editionTotal}
                </Badge>
              )}
              
              {/* NFC Pairing Section */}
              <div className="border-2 border-blue-100 rounded-lg p-4 bg-blue-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Nfc className="w-6 h-6 text-blue-600" />
                    <span className="font-semibold text-blue-800">
                      NFC Tag Status: {nfcTagStatus}
                    </span>
                  </div>
                  {nfcTagStatus !== 'Paired' && (
                    <Button 
                      variant="outline" 
                      className="border-blue-500 text-blue-600 hover:bg-blue-100"
                      onClick={() => {
                        if (nfcTagUrl) {
                          window.open(nfcTagUrl, '_blank')
                        }
                      }}
                    >
                      <QrCode className="mr-2 h-4 w-4" /> 
                      Pair NFC Tag
                    </Button>
                  )}
                </div>
                {nfcTagStatus !== 'Paired' && (
                  <p className="text-sm text-blue-700 mt-3">
                    Your artwork's NFC tag is not yet paired. Click 'Pair NFC Tag' to connect and 
                    unlock full digital experience.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'artist',
      icon: UserCircle,
      title: 'Artist Profile',
      content: () => (
        <div 
          ref={sectionRefs.artist} 
          className="min-h-screen flex items-center justify-center p-6"
        >
          <div className="max-w-2xl text-center">
            <h2 className="text-4xl font-bold mb-6">{finalVendorName}</h2>
            {artistBio ? (
              <p className="text-muted-foreground text-lg leading-relaxed">
                {artistBio}
              </p>
            ) : (
              <p className="text-muted-foreground italic">
                Artist biography not available
              </p>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'story',
      icon: BookOpen,
      title: 'Artwork Story',
      content: () => (
        <div 
          ref={sectionRefs.story} 
          className="min-h-screen flex items-center justify-center p-6"
        >
          <div className="max-w-2xl text-center">
            <h2 className="text-4xl font-bold mb-6">Artwork Story</h2>
            {artworkStory ? (
              <p className="text-muted-foreground text-lg leading-relaxed">
                {artworkStory}
              </p>
            ) : (
              <p className="text-muted-foreground italic">
                Artwork story not available
              </p>
            )}
          </div>
        </div>
      )
    }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`
          max-w-5xl p-0 overflow-hidden
          ${isFullscreen ? 'h-screen w-screen max-w-full max-h-full' : ''}
        `}
      >
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>{finalArtworkName} - Digital Experience</DialogTitle>
          <DialogDescription>
            {finalVendorName && `By ${finalVendorName}`}
            {editionNumber && editionTotal && ` | Edition ${editionNumber} of ${editionTotal}`}
          </DialogDescription>
        </DialogHeader>

        {/* Navigation Dots */}
        <div className="fixed top-1/2 right-4 transform -translate-y-1/2 z-50 space-y-2">
          {sections.map((section) => (
            <button
              key={section.key}
              onClick={() => scrollToSection(section.key as keyof typeof sectionRefs)}
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-300",
                activeSection === section.key 
                  ? "bg-primary scale-125" 
                  : "bg-muted hover:bg-primary/50"
              )}
            />
          ))}
        </div>

        {/* Scrollable Content */}
        <div 
          className="overflow-y-auto h-[80vh] scroll-smooth"
          onScroll={(e) => {
            const scrollTop = (e.target as HTMLDivElement).scrollTop
            const sectionHeights = sections.map((_, index) => 
              index * window.innerHeight
            )
            const currentSectionIndex = sectionHeights.findIndex(
              height => scrollTop < height + window.innerHeight / 2
            )
            setActiveSection(sections[currentSectionIndex || 0].key)
          }}
        >
          {sections.map((section) => section.content())}
        </div>

        {/* Actions */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
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
