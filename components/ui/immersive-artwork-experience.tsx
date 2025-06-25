import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Nfc, 
  QrCode, 
  Play, 
  Pause, 
  Share2, 
  Award, 
  Video, 
  Image as ImageIcon,
  Lock,
  Unlock
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Comprehensive Artwork Experience Types
interface ArtworkMediaItem {
  type: 'image' | 'video'
  url: string
  caption?: string
}

interface ArtistTestimonial {
  quote: string
  name: string
  avatar?: string
  role?: string
}

interface CollectibleMetrics {
  totalEdition: number
  currentEdition: number
  remainingEditions: number
  rarityScore: number
}

interface ImmersiveArtworkExperienceProps {
  // Core Artwork Details
  artworkName: string
  artistName: string
  editionNumber: number
  totalEditions: number

  // Multimedia Content
  mainArtworkImage: string
  certificateUrl?: string
  artistPortrait?: string
  
  // Storytelling Elements
  artworkDescription: string
  artistBio: string
  creationStory: string

  // Media Galleries
  creationProcessMedia?: ArtworkMediaItem[]
  artistInterviewVideo?: string

  // NFC and Blockchain Details
  nfcTagId?: string
  nfcTagStatus?: 'unpaired' | 'paired'
  nfcPairingUrl?: string
  blockchainCertificateHash?: string

  // Social and Community
  artistTestimonials?: ArtistTestimonial[]
  collectibleMetrics?: CollectibleMetrics

  // Experience Controls
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImmersiveArtworkExperience({
  artworkName,
  artistName,
  editionNumber,
  totalEditions,
  mainArtworkImage,
  certificateUrl,
  artistPortrait,
  artworkDescription,
  artistBio,
  creationStory,
  creationProcessMedia = [],
  artistInterviewVideo,
  nfcTagId,
  nfcTagStatus = 'unpaired',
  nfcPairingUrl,
  blockchainCertificateHash,
  artistTestimonials = [],
  collectibleMetrics,
  open,
  onOpenChange
}: ImmersiveArtworkExperienceProps) {
  // State Management
  const [activeSection, setActiveSection] = useState('intro')
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Blockchain Verification Simulation
  const verifyBlockchainCertificate = () => {
    // Placeholder for blockchain verification logic
    return blockchainCertificateHash ? 'verified' : 'unverified'
  }

  // NFC Pairing Handler
  const handleNfcPairing = () => {
    if (nfcPairingUrl) {
      window.open(nfcPairingUrl, '_blank')
    }
  }

  // Video Control
  const toggleVideoPlayback = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsVideoPlaying(!isVideoPlaying)
    }
  }

  // Sections Configuration
  const sections = [
    {
      key: 'intro',
      title: 'Cinematic Intro',
      component: () => (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="relative min-h-screen flex items-center justify-center"
        >
          <Image 
            src={mainArtworkImage}
            alt={artworkName}
            fill
            className="absolute inset-0 object-cover opacity-50"
          />
          <div className="relative z-10 text-center text-white p-8 bg-black/40 rounded-lg">
            <h1 className="text-5xl font-bold mb-4">{artworkName}</h1>
            <p className="text-2xl mb-6">Edition {editionNumber} of {totalEditions}</p>
            <Badge variant="secondary" className="text-lg">
              Artist: {artistName}
            </Badge>
          </div>
        </motion.div>
      )
    },
    // More sections will be added here...
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden">
        <div className="relative h-full overflow-y-auto scroll-smooth">
          {/* Scrollable Sections */}
          {sections.map(section => section.component())}
        </div>

        {/* Navigation Dots */}
        <div className="fixed top-1/2 right-8 transform -translate-y-1/2 z-50 space-y-2">
          {sections.map(section => (
            <button
              key={section.key}
              onClick={() => {
                const element = document.querySelector(`[data-section="${section.key}"]`)
                element?.scrollIntoView({ behavior: 'smooth' })
              }}
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-300",
                activeSection === section.key 
                  ? "bg-primary scale-125" 
                  : "bg-muted hover:bg-primary/50"
              )}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
} 