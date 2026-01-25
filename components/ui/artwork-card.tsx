"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'



import { 
  Wifi, 
  WifiOff, 
  FileText, 
  ExternalLink, 
  Album,
  Nfc 
} from "lucide-react"
import { cn } from "@/lib/utils"


import { Card, CardContent, CardFooter, CardHeader, CardTitle, Badge, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui"
export interface ArtworkCardProps {
  artwork: {
    id: string
    name: string
    imageUrl?: string
    vendorName?: string
    editionNumber?: number
    editionTotal?: number
    price?: number
    certificateUrl?: string
    nfcClaimedAt?: string
    nfcTagId?: string
  }
  variant?: 'default' | 'compact' | 'detailed'
  onCertificateView?: () => void
  onSelect?: () => void
  onNfcPair?: () => Promise<void>
  isSelected?: boolean
}

export function ArtworkCard({
  artwork,
  variant = 'default',
  onCertificateView,
  onSelect,
  onNfcPair,
  isSelected = false
}: ArtworkCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isNfcPairingModalOpen, setIsNfcPairingModalOpen] = useState(false)
  const [isNfcPairing, setIsNfcPairing] = useState(false)

  const handleNfcPair = async () => {
    if (!onNfcPair) return

    setIsNfcPairing(true)
    try {
      await onNfcPair()
      setIsNfcPairingModalOpen(false)
    } catch (error) {
      console.error('NFC Pairing Error:', error)
      // TODO: Add error toast or notification
    } finally {
      setIsNfcPairing(false)
    }
  }

  const renderNfcPairingModal = () => (
    <Dialog open={isNfcPairingModalOpen} onOpenChange={setIsNfcPairingModalOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pair NFC Tag</DialogTitle>
          <DialogDescription>
            Hold your NFC tag close to the device to pair with this artwork.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 p-4">
          <Nfc className="w-24 h-24 text-primary animate-pulse" />
          <Button 
            onClick={handleNfcPair} 
            disabled={isNfcPairing}
            className="w-full"
          >
            {isNfcPairing ? 'Pairing...' : 'Start Pairing'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  const renderNfcPairingIcon = () => {
    if (artwork.nfcClaimedAt) return null

    return (
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 z-10 bg-background/50 backdrop-blur-sm"
        onClick={(e) => {
          e.stopPropagation()
          setIsNfcPairingModalOpen(true)
        }}
      >
        <Nfc className="w-5 h-5 text-primary" />
      </Button>
    )
  }

  const calculateRarityScore = () => {
    if (!artwork.editionNumber || !artwork.editionTotal) return 'Limited'
    const rarityPercentage = ((artwork.editionTotal - artwork.editionNumber + 1) / artwork.editionTotal) * 100
    
    if (rarityPercentage > 90) return 'Ultra Rare'
    if (rarityPercentage > 70) return 'Rare'
    if (rarityPercentage > 50) return 'Limited'
    return 'Common'
  }

  const renderAuthenticationStatus = () => {
    const isAuthenticated = artwork.nfcClaimedAt

    return isAuthenticated ? (
      <Badge variant="secondary" className="bg-green-500/20 text-green-400">
        <Wifi className="w-3 h-3 mr-1" />
        Authenticated
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-amber-500/20 text-amber-400">
        <WifiOff className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    )
  }

  const renderCardContent = () => {
    switch (variant) {
      case 'compact':
        return (
          <Card 
            className={cn(
              "w-full transition-all duration-300 hover:shadow-lg",
              isSelected && "ring-2 ring-primary"
            )}
            onClick={onSelect}
          >
            <CardContent className="p-3 flex items-center space-x-3">
              {artwork.imageUrl ? (
                <Image 
                  src={artwork.imageUrl} 
                  alt={artwork.name} 
                  width={64} 
                  height={64} 
                  className="rounded-md object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-muted flex items-center justify-center rounded-md">
                  <Album className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-sm truncate">{artwork.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {artwork.vendorName || 'Unknown Artist'}
                </p>
              </div>
              {renderAuthenticationStatus()}
            </CardContent>
          </Card>
        )
      
      case 'detailed':
        return (
          <Card 
            className={cn(
              "w-full group overflow-hidden transition-all duration-300",
              isSelected && "ring-2 ring-primary"
            )}
            onClick={onSelect}
          >
            <div className="relative aspect-square">
              {artwork.imageUrl ? (
                <Image 
                  src={artwork.imageUrl} 
                  alt={artwork.name} 
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Album className="w-20 h-20 text-muted-foreground" />
                </div>
              )}
              <div className="absolute top-4 right-4">
                {renderAuthenticationStatus()}
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-lg truncate">{artwork.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {artwork.vendorName || 'Unknown Artist'}
              </p>
            </CardHeader>
            <CardFooter className="flex justify-between items-center">
              <div className="text-sm">
                Edition {artwork.editionNumber} of {artwork.editionTotal}
              </div>
              {artwork.certificateUrl && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={(e) => {
                    e.stopPropagation()
                    onCertificateView?.()
                  }}
                >
                  <FileText className="w-4 h-4" />
                </Button>
              )}
            </CardFooter>
          </Card>
        )
      
      default:
        return (
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={cn(
              "w-full group relative transition-all duration-300",
              isSelected && "ring-2 ring-primary"
            )}
            onClick={onSelect}
          >
            {renderNfcPairingIcon()}
            <Card>
              <div className="relative aspect-square overflow-hidden">
                {artwork.imageUrl ? (
                  <Image 
                    src={artwork.imageUrl} 
                    alt={artwork.name} 
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Album className="w-20 h-20 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  {renderAuthenticationStatus()}
                </div>
                <div className="
                  absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent
                  opacity-0 group-hover:opacity-100 transition-opacity duration-300
                  flex items-end justify-between p-4
                ">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Edition {artwork.editionNumber} of {artwork.editionTotal}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Rarity: {calculateRarityScore()}
                    </p>
                  </div>
                  
                  {artwork.certificateUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-background/50 backdrop-blur-sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onCertificateView?.()
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Certificate
                    </Button>
                  )}
                </div>
              </div>
              
              <CardHeader>
                <CardTitle>{artwork.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {artwork.vendorName || 'Unknown Artist'}
                </p>
              </CardHeader>
              
              <CardFooter className="flex justify-between items-center">
                {artwork.price && (
                  <div className="text-sm font-semibold">
                    ${artwork.price.toFixed(2)}
                  </div>
                )}
                
                {artwork.certificateUrl && (
                  <a
                    href={artwork.certificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </CardFooter>
            </Card>
          </motion.div>
        )
    }
  }

  return (
    <>
      {renderCardContent()}
      {renderNfcPairingModal()}
    </>
  )
} 