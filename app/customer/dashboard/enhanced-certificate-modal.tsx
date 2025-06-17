"use client"

import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Wifi, WifiOff, Scan, Loader2, Award, Image as ImageIcon, CheckCircle2, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

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

export function EnhancedCertificateModal({ artwork, onClose }: EnhancedCertificateModalProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isNfcScanning, setIsNfcScanning] = useState(false)
  const [nfcStatus, setNfcStatus] = useState<'unpaired' | 'paired' | 'no-nfc'>(
    artwork?.nfcTagId 
      ? (artwork.nfcClaimedAt ? 'paired' : 'unpaired') 
      : 'no-nfc'
  )

  const handleNfcAuthentication = useCallback(async () => {
    if (!('NDEFReader' in window)) {
      toast({
        title: "Unsupported Browser",
        description: "Web NFC is not available on this device",
        variant: "destructive"
      })
      return
    }

    setIsNfcScanning(true)
    try {
      const ndef = new NDEFReader()
      await ndef.scan()

      const scanResult = await new Promise<string>((resolve, reject) => {
        ndef.addEventListener("reading", (event: any) => {
          resolve(event.serialNumber)
        })

        setTimeout(() => reject(new Error("NFC Scanning Timeout")), 30000)
      })

      const response = await fetch('/api/nfc-tags/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagId: scanResult,
          lineItemId: artwork?.id,
        })
      })

      const result = await response.json()

      if (result.success) {
        setNfcStatus('paired')
        toast({
          title: "NFC Authentication Successful",
          description: "Your artwork has been verified"
        })
      } else {
        toast({
          title: "Authentication Failed",
          description: result.message || "Unable to verify NFC tag",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("NFC Authentication Error:", error)
      toast({
        title: "NFC Scanning Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      })
    } finally {
      setIsNfcScanning(false)
    }
  }, [artwork])

  // If no artwork, return null
  if (!artwork) return null

  // Determine NFC and edition status
  const nfcStatusDetails = {
    'paired': { 
      label: "Authenticated", 
      icon: <Wifi className="text-green-500" />,
      variant: "default" as const
    },
    'unpaired': { 
      label: "Needs Authentication", 
      icon: <WifiOff className="text-yellow-500" />,
      variant: "secondary" as const
    },
    'no-nfc': { 
      label: "No NFC Tag", 
      icon: <WifiOff className="text-red-500" />,
      variant: "destructive" as const
    }
  }[nfcStatus]

  return (
    <Dialog open={!!artwork} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 overflow-hidden">
        <motion.div 
          className="relative w-full h-[600px] perspective-1000"
          initial={false}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30 
          }}
        >
          {/* Front Side: Artwork Preview */}
          <motion.div
            className={`absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl shadow-2xl p-6 flex flex-col justify-between cursor-pointer ${!isFlipped ? 'z-20' : 'z-10 opacity-0'}`}
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(0deg)',
              transformStyle: 'preserve-3d',
            }}
            onClick={() => setIsFlipped(true)}
          >
            {/* Artwork Image */}
            <div className="flex-grow relative overflow-hidden rounded-lg mb-4">
              {artwork.imageUrl ? (
                <img 
                  src={artwork.imageUrl} 
                  alt={artwork.name} 
                  className="absolute inset-0 w-full h-full object-cover" 
                />
              ) : (
                <div className="absolute inset-0 bg-zinc-700 flex items-center justify-center">
                  <ImageIcon className="w-24 h-24 text-zinc-500" />
                </div>
              )}
            </div>

            {/* Artwork Details */}
            <div className="text-white space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">{artwork.name}</h2>
                <Badge variant={nfcStatusDetails.variant} className="flex items-center gap-2">
                  {nfcStatusDetails.icon}
                  {nfcStatusDetails.label}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-zinc-300">
                <p>{artwork.artist}</p>
                <span className="text-sm font-medium">
                  Edition {artwork.editionNumber}/{artwork.totalEdition}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Back Side: Certificate Details */}
          <motion.div
            className={`absolute inset-0 bg-white text-zinc-900 rounded-xl shadow-2xl p-6 flex flex-col justify-between cursor-pointer ${isFlipped ? 'z-20' : 'z-10 opacity-0'}`}
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              transformStyle: 'preserve-3d',
            }}
            onClick={() => setIsFlipped(false)}
          >
            <div>
              <div className="flex justify-between items-center border-b pb-4 mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Award className="text-amber-600" />
                  Certificate of Authenticity
                </h1>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-sm text-zinc-500 uppercase tracking-wider">Artwork Details</p>
                  <h2 className="text-2xl font-semibold">{artwork.name}</h2>
                  <p className="text-zinc-600 mt-2">{artwork.description || 'No description available'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-zinc-500 uppercase tracking-wider">Artist</p>
                    <p className="text-xl font-medium">{artwork.artist}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500 uppercase tracking-wider">Edition</p>
                    <p className="text-xl font-medium">
                      {artwork.editionNumber}/{artwork.totalEdition}
                    </p>
                  </div>
                </div>

                {/* NFC Authentication Section */}
                <div className="mt-6 border-t pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-zinc-500 uppercase tracking-wider">Authentication</p>
                      <div className="flex items-center space-x-2 mt-2">
                        {nfcStatusDetails.icon}
                        <span className="text-lg font-medium">
                          {nfcStatusDetails.label}
                        </span>
                      </div>
                    </div>

                    {nfcStatus !== 'paired' && (
                      <Button 
                        onClick={handleNfcAuthentication}
                        disabled={isNfcScanning || nfcStatus === 'no-nfc'}
                        className="flex items-center space-x-2"
                      >
                        {isNfcScanning ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Scan className="mr-2 h-4 w-4" />
                        )}
                        {isNfcScanning ? 'Scanning...' : 'Authenticate NFC'}
                      </Button>
                    )}
                  </div>

                  {artwork.nfcClaimedAt && (
                    <p className="text-sm text-zinc-500 mt-2">
                      Authenticated on: {new Date(artwork.nfcClaimedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
} 