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
  BookOpen
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface CertificateModalProps {
  certificateUrl: string
  artworkName: string
  editionNumber?: number
  editionTotal?: number
  vendorName?: string
  artistBio?: string
  artworkStory?: string
  artworkDescription?: string
  artworkImageUrl?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CertificateModal({
  certificateUrl, 
  artworkName,
  editionNumber,
  editionTotal,
  vendorName,
  artistBio,
  artworkStory,
  artworkDescription,
  artworkImageUrl,
  open,
  onOpenChange
}: CertificateModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeTab, setActiveTab] = useState('certificate')

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
      navigator.clipboard.writeText(certificateUrl)
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
          <DialogTitle>{artworkName} - Certificate of Authenticity</DialogTitle>
          <DialogDescription>
            {vendorName && `By ${vendorName}`}
            {editionNumber && editionTotal && ` | Edition ${editionNumber} of ${editionTotal}`}
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
              <Image 
                src={certificateUrl} 
                alt={`Certificate for ${artworkName}`}
                fill
                className="object-contain"
                priority
              />
            </div>
          </TabsContent>
          
          <TabsContent value="artwork" className="h-[60vh] overflow-auto p-4">
            <div className="grid md:grid-cols-2 gap-6">
              {artworkImageUrl && (
                <div className="relative aspect-square">
                  <Image 
                    src={artworkImageUrl} 
                    alt={artworkName}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
              )}
              <div>
                <h3 className="text-xl font-semibold mb-4">{artworkName}</h3>
                {artworkDescription && (
                  <p className="text-muted-foreground">{artworkDescription}</p>
                )}
                <div className="mt-4 space-y-2">
                  {vendorName && (
                    <Badge variant="secondary">Artist: {vendorName}</Badge>
                  )}
                  {editionNumber && editionTotal && (
                    <Badge variant="outline">
                      Edition: {editionNumber} of {editionTotal}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="artist" className="h-[60vh] overflow-auto p-4">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold mb-4">{vendorName}</h3>
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
