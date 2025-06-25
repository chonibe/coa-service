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
          data-section="intro"
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
    {
      key: 'certificate',
      title: 'Digital Certificate',
      component: () => (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="min-h-screen flex flex-col items-center justify-center p-8"
          data-section="certificate"
        >
          <div className="max-w-4xl bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl">
            <h2 className="text-4xl font-bold text-center mb-8 text-white">
              Certificate of Authenticity
            </h2>
            
            {certificateUrl ? (
              <div className="flex justify-center mb-8">
                <Image 
                  src={certificateUrl}
                  alt="Digital Certificate"
                  width={800}
                  height={600}
                  className="rounded-lg shadow-lg"
                />
              </div>
            ) : (
              <div className="text-center text-yellow-200">
                <p className="text-xl mb-4">Digital Certificate Pending</p>
                <p>Certificate will be generated upon final verification</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-white">
              <div>
                <strong>Artwork:</strong> {artworkName}
              </div>
              <div>
                <strong>Artist:</strong> {artistName}
              </div>
              <div>
                <strong>Edition:</strong> {editionNumber} of {totalEditions}
              </div>
              <div>
                <strong>Blockchain Verification:</strong> 
                <Badge 
                  variant={verifyBlockchainCertificate() === 'verified' ? 'default' : 'destructive'}
                  className="ml-2"
                >
                  {verifyBlockchainCertificate()}
                </Badge>
              </div>
            </div>
          </div>
        </motion.div>
      )
    },
    {
      key: 'artist-journey',
      title: 'Artist Journey',
      component: () => (
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="min-h-screen flex items-center justify-center p-8"
          data-section="artist-journey"
        >
          <div className="max-w-5xl grid md:grid-cols-2 gap-12 items-center">
            {artistPortrait && (
              <div className="relative aspect-square">
                <Image 
                  src={artistPortrait}
                  alt={`Portrait of ${artistName}`}
                  fill
                  className="object-cover rounded-full shadow-2xl"
                />
              </div>
            )}
            <div>
              <h2 className="text-4xl font-bold mb-6">Artist's Journey</h2>
              <p className="text-lg mb-4">{artistBio}</p>
              
              {artistInterviewVideo && (
                <div className="mt-6">
                  <h3 className="text-2xl font-semibold mb-4">Artist Interview</h3>
                  <div className="relative aspect-video">
                    <video 
                      ref={videoRef}
                      src={artistInterviewVideo}
                      className="w-full rounded-lg"
                      controls
                    />
                    <button 
                      onClick={toggleVideoPlayback}
                      className="absolute top-4 right-4 bg-white/20 p-2 rounded-full"
                    >
                      {isVideoPlaying ? <Pause /> : <Play />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )
    },
    {
      key: 'nfc-pairing',
      title: 'NFC Pairing',
      component: () => (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="min-h-screen flex items-center justify-center p-8 bg-blue-50"
          data-section="nfc-pairing"
        >
          <div className="text-center max-w-2xl">
            <h2 className="text-4xl font-bold mb-6">Unlock Your Digital Artwork</h2>
            
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="flex justify-center mb-6">
                {nfcTagStatus === 'paired' ? (
                  <Unlock className="w-24 h-24 text-green-500" />
                ) : (
                  <Nfc className="w-24 h-24 text-blue-500" />
                )}
              </div>

              <p className="text-xl mb-4">
                {nfcTagStatus === 'paired' 
                  ? "Your artwork is successfully paired!" 
                  : "Pair your NFC tag to unlock exclusive digital experiences"}
              </p>

              {nfcTagStatus !== 'paired' && (
                <Button 
                  onClick={handleNfcPairing}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  <QrCode className="mr-2" /> Pair NFC Tag
                </Button>
              )}

              {nfcTagStatus === 'paired' && (
                <div className="mt-6 bg-green-50 p-4 rounded-lg">
                  <p className="text-green-700">
                    You've unlocked special digital content and provenance tracking!
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )
    }
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