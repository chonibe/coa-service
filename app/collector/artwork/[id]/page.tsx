"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

import { Skeleton } from "@/components/ui"

import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Lock,
  ArrowLeft,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { NFCAuthSheet } from "@/components/nfc/nfc-auth-sheet"
import { formatCurrency } from "@/lib/utils"
import { TextBlock } from "./components/TextBlock"
import { ImageBlock } from "./components/ImageBlock"
import { VideoBlock } from "./components/VideoBlock"
import { AudioBlock } from "./components/AudioBlock"
import { ArtistSignatureBlock } from "./components/ArtistSignatureBlock"
import { ArtistBioBlock } from "./components/ArtistBioBlock"
import { NFCUrlSection } from "./components/NFCUrlSection"
import { LockedContentPreview } from "./components/LockedContentPreview"
import { FrostedOverlay } from "./components/FrostedOverlay"
import { UnlockReveal } from "./components/UnlockReveal"
import { HeroSection } from "./components/HeroSection"
import { ArtistProfileCard } from "./components/ArtistProfileCard"
import { LockedOverlay } from "./components/LockedOverlay"
import { ImmersiveVideoBlock } from "./components/ImmersiveVideoBlock"
import { ImmersiveAudioBlock } from "./components/ImmersiveAudioBlock"
import { motion } from "framer-motion"

// New immersive sections
import SoundtrackSection from "./components/SoundtrackSection"
import VoiceNoteSection from "./components/VoiceNoteSection"
import ProcessGallerySection from "./components/ProcessGallerySection"
import InspirationBoardSection from "./components/InspirationBoardSection"
import ArtistNoteSection from "./components/ArtistNoteSection"
import DiscoverySection from "./components/DiscoverySection"
import SpecialArtworkChip from "./components/SpecialArtworkChip"

import { Button, Badge, Alert, AlertDescription, Input } from "@/components/ui"

interface ArtworkDetail {
  artwork: {
    id: string
    lineItemId: string
    orderId: string
    name: string
    imgUrl: string
    editionNumber: number | null
    editionTotal: number | null
    purchaseDate: string
    orderNumber: string
    nfcTagId: string | null
    nfcClaimedAt: string | null
    authCode: string | null
  }
  artist: {
    name: string
    bio: string | null
    signatureUrl: string | null
    profileImageUrl: string | null
  }
  contentBlocks: ContentBlock[]
  lockedContentPreview: { type: string; label: string }[]
  series: { id: string; name: string } | null
  isAuthenticated: boolean
  discoveryData?: any // New field
  specialChips?: Array<{ type: string; label: string; sublabel?: string; icon?: string }>; // New field
}

interface ContentBlock {
  id: number
  benefit_type_id: number
  title: string
  description: string | null
  content_url: string | null
  block_config: any
  display_order: number
  block_type?: string // Added block_type for clarity
}

export default function CollectorArtworkPage() {
  const params = useParams()
  const router = useRouter()
  const artworkId = params.id as string

  const [artwork, setArtwork] = useState<ArtworkDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isNfcSheetOpen, setIsNfcSheetOpen] = useState(false)
  const [showManualAuth, setShowManualAuth] = useState(false)
  const [authCode, setAuthCode] = useState("")
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [showUnlockReveal, setShowUnlockReveal] = useState(false)

  useEffect(() => {
    const fetchArtwork = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/collector/artwork/${artworkId}`, {
          credentials: "include",
        })

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Artwork not found. Please check the artwork ID or contact support if you believe this is an error.")
          }
          if (response.status === 403) {
            throw new Error("You don't have access to this artwork. Please make sure you're logged in with the correct account.")
          }
          if (response.status === 401) {
            throw new Error("Authentication required. Please log in to view this artwork.")
          }
          throw new Error(`Failed to load artwork (${response.status}). Please try again or contact support.`)
        }

        const data = await response.json()
        setArtwork(data)

        // Track page view if authenticated
        if (data.isAuthenticated) {
          fetch(`/api/collector/artwork/${artworkId}/analytics`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              eventType: "page_view",
              eventData: {},
            }),
          }).catch((err) => console.error("Failed to track page view:", err))

          // Track time spent (send after 30 seconds)
          const timeSpentTimer = setTimeout(() => {
            fetch(`/api/collector/artwork/${artworkId}/analytics`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                eventType: "time_spent",
                eventData: { seconds: 30 },
              }),
            }).catch((err) => console.error("Failed to track time spent:", err))
          }, 30000)

          return () => clearTimeout(timeSpentTimer)
        }
      } catch (err: any) {
        console.error("Error fetching artwork:", err)
        setError(err.message || "Failed to load artwork")
      } finally {
        setIsLoading(false)
      }
    }

    if (artworkId) {
      fetchArtwork()
    }
  }, [artworkId])

  const handleNfcSuccess = () => {
    // Show unlock celebration
    setShowUnlockReveal(true)
    
    // Refresh artwork data
    const fetchArtwork = async () => {
      const response = await fetch(`/api/collector/artwork/${artworkId}`, {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setArtwork(data)
      }
    }
    fetchArtwork()
    setIsNfcSheetOpen(false)
  }

  // Helper to determine block type from benefit_type_id
  const getBlockType = (block: ContentBlock): string => {
    if (block.block_type) return block.block_type;
    // Fallback or more complex mapping can be added here if benefit_type_id needs to be used
    switch (block.benefit_type_id) {
        case 1: return "Artwork Text Block";
        case 2: return "Artwork Image Block";
        case 3: return "Artwork Video Block";
        case 4: return "Artwork Audio Block";
        // New immersive types - assuming these IDs are mapped in the DB
        case 5: return "Artwork Soundtrack Block";
        case 6: return "Artwork Voice Note Block";
        case 7: return "Artwork Process Gallery Block";
        case 8: return "Artwork Inspiration Block";
        case 9: return "Artwork Artist Note Block"; // Assuming a new block type for Artist Note
        default: return "Artwork Text Block";
    }
  }

  const handleManualAuth = async () => {
    if (!authCode.trim()) {
      return
    }

    setIsAuthenticating(true)
    try {
      const response = await fetch(`/api/collector/artwork/${artworkId}/authenticate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ authCode: authCode.trim() }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Authentication failed")
      }

      // Show unlock celebration
      setShowUnlockReveal(true)

      // Refresh artwork data
      const artworkResponse = await fetch(`/api/collector/artwork/${artworkId}`, {
        credentials: "include",
      })
      if (artworkResponse.ok) {
        const data = await artworkResponse.json()
        setArtwork(data)
        setShowManualAuth(false)
        setAuthCode("")
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed")
    } finally {
      setIsAuthenticating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-4xl space-y-6 bg-gray-950 text-white">
        <Skeleton className="h-10 w-64 bg-gray-800" />
        <Skeleton className="h-96 w-full bg-gray-800" />
        <Skeleton className="h-64 w-full bg-gray-800" />
      </div>
    )
  }

  if (error || !artwork) {
    return (
      <div className="container mx-auto py-8 max-w-4xl bg-gray-950 text-white">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">{error || "Failed to load artwork"}</p>
              <p className="text-sm">
                If this issue persists, please contact support with the artwork ID: {artworkId}
              </p>
            </div>
          </AlertDescription>
        </Alert>
        <div className="flex gap-2 mt-4">
          <Button onClick={() => router.push("/collector/dashboard")} variant="default" className="bg-green-600 hover:bg-green-700 text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            className="bg-gray-800 text-white hover:bg-gray-700 border-gray-700"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const isAuthenticated = artwork.isAuthenticated

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Unlock Reveal Animation */}
      {showUnlockReveal && (
        <UnlockReveal
          artworkName={artwork.artwork.name}
          onComplete={() => setShowUnlockReveal(false)}
        />
      )}

      <div className="pb-safe-4">
        {/* Mobile-first header - compact */}
        <div className="sticky top-0 z-40 bg-gray-950/90 backdrop-blur-md border-b border-gray-800 px-4 py-3">
          <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-gray-300 hover:text-white"
            onClick={() => router.push("/collector/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold tracking-tight truncate">{artwork.artwork.name}</h1>
            {artwork.artist.name && (
              <p className="text-xs text-gray-400 truncate">
                by{" "}
                <Link
                  href={`/artist/${encodeURIComponent(artwork.artist.name)}`}
                  className="hover:underline hover:text-white"
                >
                  {artwork.artist.name}
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Artwork Image - Full bleed on mobile - ALWAYS VISIBLE */}
      <div className="relative">
        <div className="relative aspect-square">
          {artwork.artwork.imgUrl ? (
            <Image
              src={artwork.artwork.imgUrl}
              alt={artwork.artwork.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <ImageIcon className="h-24 w-24 text-gray-600" />
            </div>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <HeroSection
        imageUrl={artwork.artwork.imgUrl}
        artworkName={artwork.artwork.name}
        editionNumber={artwork.artwork.editionNumber}
        editionTotal={artwork.artwork.editionTotal}
        purchaseDate={artwork.artwork.purchaseDate}
        orderNumber={artwork.artwork.orderNumber}
      />

      {/* Special Artwork Chips */}
      {artwork.specialChips && artwork.specialChips.length > 0 && (
        <div className="px-4 py-4 md:px-8 max-w-5xl mx-auto flex flex-wrap gap-2">
          {artwork.specialChips.map((chip, index) => (
            <SpecialArtworkChip key={index} type={chip.type} label={chip.label} sublabel={chip.sublabel} icon={chip.icon} />
          ))}
        </div>
      )}

      {/* Content area with max-width for readability */}
      <div className="px-4 py-8 md:py-16 space-y-12 md:space-y-24 max-w-5xl mx-auto">
        
        {/* Authenticated Status or Lock Preview */}
        {!isAuthenticated ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8 bg-gray-900 rounded-lg shadow-xl"
          >
            <LockedContentPreview contentBlocks={artwork.lockedContentPreview || []} />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 p-6 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 rounded-2xl border-2 border-green-500/20 shadow-lg"
          >
            <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
            <div>
              <p className="font-bold text-green-100">Authenticated</p>
              <p className="text-sm text-green-300">
                {new Date(artwork.artwork.nfcClaimedAt!).toLocaleDateString()}
              </p>
            </div>
          </motion.div>
        )}

        {/* Artist Profile Card */}
        <ArtistProfileCard
          name={artwork.artist.name}
          bio={artwork.artist.bio}
          profileImageUrl={artwork.artist.profileImageUrl}
          signatureUrl={artwork.artist.signatureUrl}
          isLocked={!isAuthenticated}
        />

        {/* Content Blocks with Lock Overlay */}
        <div className={`space-y-16 ${!isAuthenticated ? "relative" : ""}`}>
          {!isAuthenticated && <LockedOverlay />}
          
          {artwork.contentBlocks.map((block, index) => {
            const blockType = getBlockType(block)

            const animationDelay = index * 0.1

            switch (blockType) {
              case "Artwork Text Block":
              case "text":
                return (
                  <motion.div
                    key={block.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: animationDelay, duration: 0.6 }}
                  >
                    <TextBlock
                      title={block.title}
                      description={block.description}
                    />
                  </motion.div>
                )
              case "Artwork Image Block":
              case "image":
                return (
                  <motion.div
                    key={block.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: animationDelay, duration: 0.6 }}
                  >
                    <ImageBlock
                      title={block.title}
                      contentUrl={block.content_url}
                      blockConfig={block.block_config}
                    />
                  </motion.div>
                )
              case "Artwork Video Block":
              case "video":
                return (
                  <ImmersiveVideoBlock
                    key={block.id}
                    title={block.title}
                    contentUrl={block.content_url}
                    artworkId={artworkId}
                  />
                )
              case "Artwork Audio Block":
              case "audio":
                return (
                  <ImmersiveAudioBlock
                    key={block.id}
                    title={block.title}
                    contentUrl={block.content_url}
                    artworkId={artworkId}
                    artworkImageUrl={artwork.artwork.imgUrl}
                  />
                )
              case "Artwork Soundtrack Block":
                return (
                  <motion.div
                    key={block.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: animationDelay, duration: 0.6 }}
                  >
                    <SoundtrackSection
                      spotifyUrl={block.block_config?.spotify_url}
                      note={block.block_config?.note}
                    />
                  </motion.div>
                )
              case "Artwork Voice Note Block":
                return (
                  <motion.div
                    key={block.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: animationDelay, duration: 0.6 }}
                  >
                    <VoiceNoteSection
                      title={block.title}
                      contentUrl={block.content_url || ''}
                      transcript={block.block_config?.transcript}
                      artistPhoto={artwork.artist.profileImageUrl || ''}
                    />
                  </motion.div>
                )
              case "Artwork Process Gallery Block":
                return (
                  <motion.div
                    key={block.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: animationDelay, duration: 0.6 }}
                  >
                    <ProcessGallerySection
                      intro={block.block_config?.intro}
                      images={block.block_config?.images || []}
                    />
                  </motion.div>
                )
              case "Artwork Inspiration Block":
                return (
                  <motion.div
                    key={block.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: animationDelay, duration: 0.6 }}
                  >
                    <InspirationBoardSection
                      story={block.block_config?.story}
                      images={block.block_config?.images || []}
                    />
                  </motion.div>
                )
              case "Artwork Artist Note Block":
                return (
                  <motion.div
                    key={block.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: animationDelay, duration: 0.6 }}
                  >
                    <ArtistNoteSection
                      content={block.description || ''}
                      signatureUrl={artwork.artist.signatureUrl}
                    />
                  </motion.div>
                )
              default:
                return (
                  <motion.div
                    key={block.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: animationDelay, duration: 0.6 }}
                  >
                    <div className="rounded-lg p-6 bg-gray-900 shadow-xl">
                        {block.title && <h2 className="text-xl font-semibold mb-4">{block.title}</h2>}
                        {block.description && (
                          <p className="text-gray-300 whitespace-pre-line">{block.description}</p>
                        )}
                        {block.content_url && !["video", "audio", "image"].includes(blockType) && (
                          <a
                            href={block.content_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-400 hover:underline inline-flex items-center gap-2 mt-4"
                          >
                            View Content <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                    </div>
                  </motion.div>
                )
            }
          })}
        </div>

        {/* Discovery Section */}
        {artwork.discoveryData && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: artwork.contentBlocks.length * 0.1 + 0.1, duration: 0.6 }}
          >
            <DiscoverySection
              artworkId={artwork.artwork.id}
              artistName={artwork.artist.name}
              unlockedContent={artwork.discoveryData.unlockedContent}
              seriesInfo={artwork.discoveryData.seriesInfo}
              countdown={artwork.discoveryData.countdown}
              moreFromArtist={artwork.discoveryData.moreFromArtist}
            />
          </motion.div>
        )}

        {/* NFC URL Section (only when authenticated) */}
        {isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (artwork.contentBlocks.length * 0.1) + 0.3, duration: 0.6 }}
          >
            <NFCUrlSection artworkId={artworkId} />
          </motion.div>
        )}
      </div>

      {/* Sticky Bottom CTA - Mobile First */}
      {!isAuthenticated && (
        <div className="fixed bottom-0 left-0 right-0 z-50 
                        bg-gray-900/90 backdrop-blur-xl border-t border-gray-800
                        p-4 pb-safe-4 md:hidden">
          <Button
            onClick={() => setIsNfcSheetOpen(true)}
            className="w-full h-14 text-lg font-semibold rounded-xl bg-green-600 hover:bg-green-700 text-white"
          >
            Pair NFC
          </Button>
          <button
            onClick={() => setShowManualAuth(true)}
            className="w-full text-center text-sm text-gray-400 mt-2 py-2 min-h-[44px]"
          >
            or enter code manually
          </button>
          {showManualAuth && (
            <div className="mt-4 flex flex-col gap-2">
              <Input
                type="text"
                placeholder="Enter authentication code"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
              <Button onClick={handleManualAuth} disabled={isAuthenticating} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isAuthenticating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                Authenticate Manually
              </Button>
              <Button variant="ghost" onClick={() => setShowManualAuth(false)} className="text-gray-400 hover:text-white">
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}

      {/* NFC Auth Sheet with enhanced props */}
      {artwork && (
        <NFCAuthSheet
          isOpen={isNfcSheetOpen}
          onClose={() => setIsNfcSheetOpen(false)}
          item={{
            line_item_id: artwork.artwork.lineItemId,
            order_id: artwork.artwork.orderId,
            name: artwork.artwork.name,
            edition_number: artwork.artwork.editionNumber,
          }}
          artistInfo={{
            name: artwork.artist.name,
            photo: artwork.artist.profileImageUrl,
          }}
          contentPreview={artwork.lockedContentPreview || []}
          onSuccess={handleNfcSuccess}
        />
      )}
      </div>
    </div>
  )
}