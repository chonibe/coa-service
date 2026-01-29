"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2, AlertCircle, ArrowLeft, Lock, Unlock, User, Users, Grid3x3, Crown, Smartphone, Monitor, RotateCcw, Sparkles } from "lucide-react"
import Image from "next/image"
import { Button, Alert, AlertDescription, Skeleton, Badge, Switch, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Card } from "@/components/ui"
import { motion, AnimatePresence } from "framer-motion"

// Import ALL collector components
import { TextBlock } from "@/app/collector/artwork/[id]/components/TextBlock"
import { ImageBlock } from "@/app/collector/artwork/[id]/components/ImageBlock"
import { VideoBlock } from "@/app/collector/artwork/[id]/components/VideoBlock"
import { AudioBlock } from "@/app/collector/artwork/[id]/components/AudioBlock"
import SoundtrackSection from "@/app/collector/artwork/[id]/components/SoundtrackSection"
import VoiceNoteSection from "@/app/collector/artwork/[id]/components/VoiceNoteSection"
import ProcessGallerySection from "@/app/collector/artwork/[id]/components/ProcessGallerySection"
import InspirationBoardSection from "@/app/collector/artwork/[id]/components/InspirationBoardSection"
import ArtistNoteSection from "@/app/collector/artwork/[id]/components/ArtistNoteSection"
import { ArtistSignatureBlock } from "@/app/collector/artwork/[id]/components/ArtistSignatureBlock"
import { ArtistBioBlock } from "@/app/collector/artwork/[id]/components/ArtistBioBlock"
import { DiscoverySection } from "@/app/collector/artwork/[id]/components/DiscoverySection"
import { SpecialArtworkChip, generateSpecialChips } from "@/app/collector/artwork/[id]/components/SpecialArtworkChip"
import { MobileFrame } from "../../components/MobileFrame"

interface ArtworkDetail {
  artwork: {
    id: string
    name: string
    imgUrl: string
    editionNumber: number | null
    editionTotal: number | null
  }
  artist: {
    name: string
    bio: string | null
    signatureUrl: string | null
    profileImageUrl: string | null
  }
  contentBlocks: ContentBlock[]
  series: { id: string; name: string } | null
  isAuthenticated: boolean
  isPreview: boolean
}

interface ContentBlock {
  id: number
  benefit_type_id: number
  title: string
  description: string | null
  content_url: string | null
  block_config: any
  display_order: number
  block_type?: string
}

export default function VendorArtworkPreviewPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string

  const [artwork, setArtwork] = useState<ArtworkDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<"locked" | "unlocked">("unlocked")
  const [collectorState, setCollectorState] = useState<"new_visitor" | "existing_collector" | "series_collector" | "vip_collector">("existing_collector")
  const [viewMode, setViewMode] = useState<"mobile" | "desktop">("mobile")

  useEffect(() => {
    const fetchArtwork = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/vendor/artwork-pages/${productId}/preview`, {
          credentials: "include",
        })

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Artwork not found")
          }
          if (response.status === 403) {
            throw new Error("You don't have access to this artwork")
          }
          throw new Error("Failed to load artwork")
        }

        const data = await response.json()
        console.log("[Preview] Loaded artwork:", data)
        setArtwork(data)
      } catch (err: any) {
        console.error("[Preview] Error:", err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchArtwork()
  }, [productId])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading preview...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !artwork) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-8">
        <div className="max-w-md mx-auto mt-20">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || "Failed to load preview"}</AlertDescription>
          </Alert>
          <Button onClick={() => router.back()} variant="outline" className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Editor
          </Button>
        </div>
      </div>
    )
  }

  const isAuthenticated = previewMode === "unlocked"

  // Adjust data based on collector state
  const getCollectorData = () => {
    const hasVIPAccess = collectorState === "vip_collector"
    const hasSeriesProgress = collectorState === "series_collector" || collectorState === "vip_collector"
    const hasOtherArtworks = collectorState !== "new_visitor"
    
    return {
      specialChips: generateSpecialChips({
        editionNumber: artwork.artwork.editionNumber,
        editionTotal: artwork.artwork.editionTotal,
        nfcClaimedAt: isAuthenticated ? new Date().toISOString() : null,
        seriesInfo: artwork.series ? {
          name: artwork.series.name,
          position: 3,
          totalCount: 5,
        } : undefined,
        unlocks: {
          hiddenSeries: hasVIPAccess,
          vipArtwork: false,
          vipSeries: hasVIPAccess,
        },
        isTimedRelease: false,
      }),
      discoveryData: {
        unlockedContent: hasVIPAccess ? {
          type: "vip_series" as const,
          id: "vip-series-1",
          name: "VIP Exclusive Series",
          thumbnailUrl: artwork.artwork.imgUrl,
        } : undefined,
        seriesInfo: hasSeriesProgress && artwork.series ? {
          name: artwork.series.name,
          totalCount: 5,
          ownedCount: collectorState === "series_collector" ? 3 : (collectorState === "vip_collector" ? 4 : 1),
          artworks: [
            { id: "1", name: "Piece 1", imgUrl: artwork.artwork.imgUrl, isOwned: true, position: 1 },
            { id: "2", name: "Piece 2", imgUrl: artwork.artwork.imgUrl, isOwned: collectorState !== "existing_collector", position: 2 },
            { id: "3", name: "Piece 3", imgUrl: artwork.artwork.imgUrl, isOwned: hasSeriesProgress, position: 3 },
            { id: "4", name: "Piece 4", imgUrl: artwork.artwork.imgUrl, isOwned: collectorState === "vip_collector", position: 4 },
            { id: "5", name: "Piece 5", imgUrl: artwork.artwork.imgUrl, isOwned: false, position: 5 },
          ],
          nextArtwork: {
            id: collectorState === "vip_collector" ? "5" : "4",
            name: "Next in Series",
            imgUrl: artwork.artwork.imgUrl,
          },
          unlockType: "sequential" as const,
        } : undefined,
        moreFromArtist: hasOtherArtworks ? [
          { id: "1", name: "Other Work 1", imgUrl: artwork.artwork.imgUrl, price: 250 },
          { id: "2", name: "Other Work 2", imgUrl: artwork.artwork.imgUrl, price: 350 },
          { id: "3", name: "Other Work 3", imgUrl: artwork.artwork.imgUrl, price: 500 },
        ] : [],
      },
    }
  }

  const { specialChips, discoveryData: mockDiscoveryData } = getCollectorData()

  const collectorStateLabels = {
    new_visitor: { label: "New Visitor", icon: User, description: "First time viewing" },
    existing_collector: { label: "Collector", icon: Users, description: "Owns this artwork" },
    series_collector: { label: "Series Collector", icon: Grid3x3, description: "Owns 3 in series" },
    vip_collector: { label: "VIP Collector", icon: Crown, description: "Full access" },
  }

  const CollectorContent = () => (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero Image */}
      <div className="relative w-full aspect-[4/3]">
        <Image
          src={artwork.artwork.imgUrl}
          alt={artwork.artwork.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 leading-tight">
              {artwork.artwork.name}
            </h1>
            <p className="text-gray-300 text-sm">
              by {artwork.artist.name}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Special Chips */}
      {isAuthenticated && specialChips && specialChips.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="px-4 py-4"
        >
          <div className="flex flex-wrap gap-2">
            {specialChips.map((chip, index) => (
              <SpecialArtworkChip key={`${chip.type}-${index}`} chip={chip} size="md" />
            ))}
          </div>
        </motion.div>
      )}

      {/* Content */}
      <div className="px-4 py-6 space-y-8">
        {/* Artist Info */}
        {isAuthenticated && (
          <>
            {artwork.artist.signatureUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <ArtistSignatureBlock signatureUrl={artwork.artist.signatureUrl} />
              </motion.div>
            )}
            {artwork.artist.bio && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <ArtistBioBlock artist={artwork.artist} />
              </motion.div>
            )}
          </>
        )}

        {/* Content Blocks with Lock Overlay */}
        <div className={`space-y-8 relative ${!isAuthenticated ? "blur-sm pointer-events-none" : ""}`}>
          <AnimatePresence>
            {!isAuthenticated && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 z-10 flex items-center justify-center"
              >
                <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl p-8 text-center border border-gray-700/50 shadow-2xl max-w-sm mx-4">
                  <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                    <Lock className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Exclusive Content</h3>
                  <p className="text-gray-400 text-sm">
                    Tap your NFC tag to unlock the full collector experience
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Render all blocks */}
          {artwork.contentBlocks.map((block, index) => {
            const blockType = block.block_type || ""

            const blockContent = () => {
              switch (blockType) {
                case "Artwork Text Block":
                case "text":
                  return <TextBlock title={block.title} description={block.description} />
                case "Artwork Image Block":
                case "image":
                  return <ImageBlock title={block.title} contentUrl={block.content_url} blockConfig={block.block_config} />
                case "Artwork Video Block":
                case "video":
                  return <VideoBlock title={block.title} contentUrl={block.content_url} artworkId={undefined} />
                case "Artwork Audio Block":
                case "audio":
                  return <AudioBlock title={block.title} contentUrl={block.content_url} artworkId={undefined} />
                case "Artwork Soundtrack Block":
                  return <SoundtrackSection title={block.title} config={block.block_config || {}} />
                case "Artwork Voice Note Block":
                  return <VoiceNoteSection title={block.title} contentUrl={block.content_url || ""} config={block.block_config} />
                case "Artwork Process Gallery Block":
                  return <ProcessGallerySection title={block.title} config={block.block_config || { images: [] }} />
                case "Artwork Inspiration Block":
                  return <InspirationBoardSection title={block.title} config={block.block_config || { images: [] }} />
                case "Artwork Artist Note Block":
                  return <ArtistNoteSection content={block.description || ""} signatureUrl={block.block_config?.signature_url} artistName={artwork.artist.name} />
                default:
                  return null
              }
            }

            return (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
              >
                {blockContent()}
              </motion.div>
            )
          })}

          {/* Empty State */}
          {artwork.contentBlocks.length === 0 && (
            <div className="text-center py-16">
              <Sparkles className="h-12 w-12 mx-auto text-gray-600 mb-4" />
              <p className="text-gray-500">No content blocks yet</p>
              <p className="text-gray-600 text-sm mt-1">Add blocks in the editor to see them here</p>
            </div>
          )}
        </div>

        {/* Discovery Section */}
        {isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <DiscoverySection
              discoveryData={mockDiscoveryData}
              isAuthenticated={true}
              artistName={artwork.artist.name}
            />
          </motion.div>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Floating Header Controls */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-800/50">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Left: Back Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Editor
              </Button>

              {/* Center: Title */}
              <div className="hidden md:block text-center">
                <h1 className="text-sm font-medium text-white truncate max-w-xs">
                  {artwork.artwork.name}
                </h1>
                <p className="text-xs text-gray-500">Preview Mode</p>
              </div>

              {/* Right: Controls */}
              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-800/50 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("mobile")}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === "mobile"
                        ? "bg-blue-600 text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <Smartphone className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("desktop")}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === "desktop"
                        ? "bg-blue-600 text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <Monitor className="h-4 w-4" />
                  </button>
                </div>

                {/* Lock Toggle */}
                <button
                  onClick={() => setPreviewMode(previewMode === "locked" ? "unlocked" : "locked")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                    previewMode === "unlocked"
                      ? "bg-green-600/20 text-green-400 border border-green-600/30"
                      : "bg-gray-800/50 text-gray-400 border border-gray-700/50"
                  }`}
                >
                  {previewMode === "unlocked" ? (
                    <Unlock className="h-4 w-4" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  <span className="text-sm hidden sm:inline">
                    {previewMode === "unlocked" ? "Unlocked" : "Locked"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Side Panel - Collector State Selector */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden lg:block">
        <Card className="bg-gray-900/90 backdrop-blur-xl border-gray-800/50 p-2 shadow-2xl">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 px-2 py-1">Preview as</p>
            {(Object.entries(collectorStateLabels) as [typeof collectorState, typeof collectorStateLabels["new_visitor"]][]).map(([key, value]) => {
              const Icon = value.icon
              return (
                <button
                  key={key}
                  onClick={() => setCollectorState(key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                    collectorState === key
                      ? "bg-blue-600/20 text-blue-400 border border-blue-600/30"
                      : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{value.label}</p>
                    <p className="text-[10px] text-gray-500 truncate">{value.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Mobile Collector State Selector */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
        <Card className="bg-gray-900/90 backdrop-blur-xl border-gray-800/50 p-2 shadow-2xl">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 px-2 whitespace-nowrap">As:</span>
            {(Object.entries(collectorStateLabels) as [typeof collectorState, typeof collectorStateLabels["new_visitor"]][]).map(([key, value]) => {
              const Icon = value.icon
              return (
                <button
                  key={key}
                  onClick={() => setCollectorState(key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
                    collectorState === key
                      ? "bg-blue-600/20 text-blue-400 border border-blue-600/30"
                      : "text-gray-400 bg-gray-800/30 hover:bg-gray-800/50"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">{value.label}</span>
                </button>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Preview Content */}
      <div className="pt-16 pb-24 lg:pb-8 min-h-screen flex items-start justify-center">
        <AnimatePresence mode="wait">
          {viewMode === "mobile" ? (
            <motion.div
              key="mobile"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="py-8"
            >
              <MobileFrame enabled={true}>
                <CollectorContent />
              </MobileFrame>
            </motion.div>
          ) : (
            <motion.div
              key="desktop"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-4xl mx-4 my-8"
            >
              <div className="bg-gray-950 rounded-2xl overflow-hidden shadow-2xl border border-gray-800/50">
                <CollectorContent />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
