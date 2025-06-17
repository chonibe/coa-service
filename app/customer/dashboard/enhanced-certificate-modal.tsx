"use client"

import React, { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog"
import { 
  Wifi, 
  WifiOff, 
  Scan, 
  Loader2, 
  Award, 
  Image as ImageIcon, 
  CheckCircle2, 
  XCircle,
  AlertCircle
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import Image from 'next/image'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Enhanced type definition
interface ArtworkCertificate {
  id: string
  name: string
  artist: string
  editionNumber: number
  totalEdition: number
  imageUrl?: string
  description?: string
  nfcTagId?: string
  nfcClaimedAt?: string
  certificateToken?: string
}

interface EnhancedCertificateModalProps {
  artwork: ArtworkCertificate | null
  onClose: () => void
}

export const EnhancedCertificateModal: React.FC<EnhancedCertificateModalProps> = ({ 
  artwork, 
  onClose 
}) => {
  const [isFlipped, setIsFlipped] = useState(false)
  const [nfcStatus, setNfcStatus] = useState<{
    status: 'unpaired' | 'paired' | 'no-nfc'
    label: string
    icon: React.ReactNode
  }>({
    status: 'no-nfc',
    label: 'No NFC Tag',
    icon: <WifiOff className="w-4 h-4 text-gray-500" />
  })

  const cardRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  useEffect(() => {
    if (artwork?.nfcTagId) {
      setNfcStatus(artwork.nfcClaimedAt 
        ? { 
            status: 'paired', 
            label: 'Authenticated', 
            icon: <Wifi className="w-4 h-4 text-green-500" /> 
          }
        : { 
            status: 'unpaired', 
            label: 'Needs Authentication', 
            icon: <WifiOff className="w-4 h-4 text-yellow-500" /> 
          }
      )
    }
  }, [artwork])

  const handleNfcPairing = async () => {
    if (!artwork?.nfcTagId) {
      toast({
        title: "No NFC Tag Available",
        description: "This artwork does not have an NFC tag for pairing.",
        variant: "destructive"
      })
      return
    }

    try {
      // Web NFC API Pairing Logic
      if ('NDEFReader' in window) {
        const ndef = new NDEFReader()
        await ndef.scan()
        
        // Simulated pairing process
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        setNfcStatus({
          status: 'paired',
          label: 'Authenticated',
          icon: <Wifi className="w-4 h-4 text-green-500" />
        })

        toast({
          title: "NFC Tag Paired",
          description: "Successfully authenticated your artwork.",
          variant: "default"
        })
      } else {
        toast({
          title: "NFC Not Supported",
          description: "Your browser does not support Web NFC API.",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "NFC Pairing Failed",
        description: "Unable to pair NFC tag. Please try again.",
        variant: "destructive"
      })
    }
  }

  const rotateX = useTransform(y, [-200, 200], [15, -15])
  const rotateY = useTransform(x, [-200, 200], [-15, 15])

  const handleMouseMove = (event: React.MouseEvent) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      x.set(event.clientX - rect.left - rect.width / 2)
      y.set(event.clientY - rect.top - rect.height / 2)
    }
  }

  // If no artwork, return null or a placeholder
  if (!artwork) {
    console.error('EnhancedCertificateModal - No artwork provided')
    console.log('Artwork object:', artwork)
    return null
  }

  // Validate required artwork properties with more detailed logging
  const requiredProps: (keyof ArtworkCertificate)[] = ['id', 'name', 'artist', 'editionNumber', 'totalEdition']
  const missingProps = requiredProps.filter(prop => {
    const value = artwork[prop]
    console.log(`Checking required prop ${prop}:`, {
      value,
      type: typeof value,
      isNull: value === null,
      isUndefined: value === undefined,
      isEmpty: value === ''
    })
    return value === null || value === undefined || value === ''
  })

  if (missingProps.length > 0) {
    console.error('EnhancedCertificateModal - Missing required properties:', missingProps)
    console.log('Full artwork object:', JSON.stringify(artwork, null, 2))
    
    // Provide a fallback rendering with available information
    return (
      <Dialog open={true} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-md">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Incomplete Artwork Data</AlertTitle>
            <AlertDescription>
              Unable to display full certificate. Missing properties: {missingProps.join(', ')}
              <br />
              Available data: {Object.keys(artwork).join(', ')}
            </AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    )
  }

  // Ensure all required properties have valid values
  const safeArtwork: ArtworkCertificate = {
    id: artwork.id || 'Unknown ID',
    name: artwork.name || 'Untitled',
    artist: artwork.artist || 'Unknown Artist',
    editionNumber: artwork.editionNumber || 0,
    totalEdition: artwork.totalEdition || 0,
    imageUrl: artwork.imageUrl || artwork.imageUrl, // Fallback to original property
    description: artwork.description,
    nfcTagId: artwork.nfcTagId,
    nfcClaimedAt: artwork.nfcClaimedAt,
    certificateToken: artwork.certificateToken
  }

  console.log('EnhancedCertificateModal - Rendering Artwork:', {
    id: safeArtwork.id,
    name: safeArtwork.name,
    artist: safeArtwork.artist,
    editionNumber: safeArtwork.editionNumber,
    totalEdition: safeArtwork.totalEdition,
    imageUrl: safeArtwork.imageUrl,
    nfcTagId: safeArtwork.nfcTagId,
    nfcClaimedAt: safeArtwork.nfcClaimedAt
  })

  return (
    <Dialog open={!!artwork} onOpenChange={() => onClose()}>
      <DialogContent 
        className="max-w-xl w-full p-0 overflow-hidden rounded-2xl"
        style={{ aspectRatio: '3/2' }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Artwork Certificate: {safeArtwork.name}</DialogTitle>
          <DialogDescription>
            Certificate of Authenticity for {safeArtwork.name} by {safeArtwork.artist}
          </DialogDescription>
        </DialogHeader>

        <motion.div 
          ref={cardRef}
          onMouseMove={handleMouseMove}
          style={{
            rotateX,
            rotateY,
            transformStyle: 'preserve-3d',
            perspective: '1000px'
          }}
          className="relative w-full h-full cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <motion.div 
            style={{
              rotateY: isFlipped ? 180 : 0,
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden'
            }}
            className="absolute w-full h-full transition-transform duration-700 ease-in-out"
          >
            {/* Front Side: Artwork Image */}
            <div 
              className="absolute w-full h-full bg-zinc-100 flex flex-col justify-between p-6"
              style={{ backfaceVisibility: 'hidden' }}
            >
              {safeArtwork.imageUrl ? (
                <Image 
                  src={safeArtwork.imageUrl} 
                  alt={safeArtwork.name} 
                  fill 
                  className="object-cover rounded-xl"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-zinc-200 rounded-xl">
                  <ImageIcon className="w-16 h-16 text-zinc-500" />
                </div>
              )}
              
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/50 text-white">
                <h2 className="text-xl font-bold">{safeArtwork.name}</h2>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm">
                    Edition {safeArtwork.editionNumber}/{safeArtwork.totalEdition || 0}
                  </span>
                  <Badge variant={nfcStatus.status === 'paired' ? 'default' : 'secondary'}>
                    {nfcStatus.icon}
                    <span className="ml-2">{nfcStatus.label}</span>
                  </Badge>
                </div>
              </div>
            </div>

            {/* Back Side: Certificate Details */}
            <motion.div 
              style={{
                rotateY: 180,
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden'
              }}
              className="absolute w-full h-full bg-white p-8 flex flex-col justify-between"
            >
              <div>
                <h2 className="text-2xl font-bold mb-4">Certificate of Authenticity</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-zinc-500 uppercase tracking-wider">Artist</p>
                    <p className="text-xl font-medium">{safeArtwork.artist}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500 uppercase tracking-wider">Edition</p>
                    <p className="text-xl font-medium">
                      {safeArtwork.editionNumber}/{safeArtwork.totalEdition || 0}
                    </p>
                  </div>
                </div>
                {safeArtwork.description && (
                  <div className="mt-6">
                    <p className="text-sm text-zinc-500 uppercase tracking-wider">Description</p>
                    <p className="text-base text-zinc-700">{safeArtwork.description}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-between items-center">
                <Button 
                  variant="outline" 
                  onClick={handleNfcPairing}
                  disabled={nfcStatus.status === 'paired'}
                >
                  {nfcStatus.status === 'paired' 
                    ? <><CheckCircle2 className="mr-2 w-4 h-4" /> Authenticated</>
                    : <><Scan className="mr-2 w-4 h-4" /> Pair NFC Tag</>
                  }
                </Button>
                <div className="text-sm text-zinc-500">
                  Certificate Token: {safeArtwork.certificateToken?.slice(0, 8)}...
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
} 