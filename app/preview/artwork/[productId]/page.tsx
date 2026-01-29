"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  Loader2, 
  AlertCircle, 
  ArrowLeft, 
  Lock, 
  Unlock, 
  Sparkles, 
  Smartphone,
  Grid3x3,
  Check,
  ChevronRight,
  Shield,
  Award,
  Fingerprint,
  Camera,
  Plus
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button, Alert, AlertDescription, Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
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
import { MapBlock } from "@/app/collector/artwork/[id]/components/MapBlock"
import { DiscoverySection } from "@/app/collector/artwork/[id]/components/DiscoverySection"
import { StoryCircles } from "@/app/collector/artwork/[id]/components/story/StoryCircles"
import type { StoryUser, StoryPost } from "@/lib/story/types"

interface SeriesArtwork {
  id: string
  name: string
  imgUrl: string
  isOwned: boolean
  isLocked: boolean
  displayOrder: number
  position: number
}

interface SeriesMilestone {
  threshold: number
  type: string
  title: string
  isUnlocked: boolean
}

interface SeriesData {
  id: string
  name: string
  description: string | null
  unlockType: string
  totalCount: number
  ownedCount: number
  artworks: SeriesArtwork[]
  nextArtwork: {
    id: string
    name: string
    imgUrl: string
    displayOrder: number
    handle: string | null
    shopifyProductId: string
  } | null
  currentPosition: number
  milestones: SeriesMilestone[]
}

interface ArtworkDetail {
  artwork: {
    id: string
    name: string
    imgUrl: string
    editionNumber: number | null
    editionTotal: number | null
    purchaseDate: string | null
    orderNumber: string | null
  }
  artist: {
    name: string
    bio: string | null
    signatureUrl: string | null
    profileImageUrl: string | null
  }
  contentBlocks: ContentBlock[]
  lockedContentPreview: { type: string; label: string }[]
  series: SeriesData | null
  isAuthenticated: boolean
  isPreview: boolean
  isSubmission?: boolean // True if artwork is in submission stage (not yet published)
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

export default function ArtworkPreviewPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string

  const [artwork, setArtwork] = useState<ArtworkDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(true)

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading preview...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !artwork) {
    return (
      <div className="min-h-screen bg-white p-8">
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

  // Create mock series data for demo purposes (used when artwork doesn't have real series)
  const mockSeriesData: SeriesData = {
    id: "mock-series",
    name: "Example Series",
    description: "This is how a series will appear when your artwork belongs to one.",
    unlockType: "sequential",
    totalCount: 5,
    ownedCount: 1,
    artworks: [
      { id: "1", name: "Artwork 1", imgUrl: artwork?.artwork?.imgUrl || "", isOwned: true, isLocked: false, displayOrder: 1, position: 1 },
      { id: "2", name: "Artwork 2", imgUrl: artwork?.artwork?.imgUrl || "", isOwned: false, isLocked: true, displayOrder: 2, position: 2 },
      { id: "3", name: "Artwork 3", imgUrl: artwork?.artwork?.imgUrl || "", isOwned: false, isLocked: true, displayOrder: 3, position: 3 },
      { id: "4", name: "Artwork 4", imgUrl: artwork?.artwork?.imgUrl || "", isOwned: false, isLocked: true, displayOrder: 4, position: 4 },
      { id: "5", name: "Artwork 5", imgUrl: artwork?.artwork?.imgUrl || "", isOwned: false, isLocked: true, displayOrder: 5, position: 5 },
    ],
    nextArtwork: {
      id: "2",
      name: "Artwork 2",
      imgUrl: artwork?.artwork?.imgUrl || "",
      displayOrder: 2,
      handle: null,
      shopifyProductId: "2",
    },
    currentPosition: 1,
    milestones: [
      { threshold: 2, type: "text", title: "Exclusive Text Block", isUnlocked: false },
      { threshold: 3, type: "image", title: "Behind-the-Scenes Photos", isUnlocked: false },
      { threshold: 5, type: "video", title: "Exclusive Artist Video", isUnlocked: false },
    ],
  }

  // Helper to get unlock type label
  const getUnlockTypeLabel = (type: string) => {
    switch (type) {
      case "any_purchase": return "Open Collection"
      case "sequential": return "Sequential"
      case "threshold": return "Threshold"
      case "time_based": return "Time-Based"
      case "vip": return "VIP Exclusive"
      case "nfc": return "NFC Unlock"
      default: return type.replace(/_/g, " ")
    }
  }

  // Build discovery data from series
  const discoveryData = {
    unlockedContent: undefined,
    seriesInfo: artwork.series ? {
      name: artwork.series.name,
      totalCount: artwork.series.totalCount,
      ownedCount: artwork.series.ownedCount,
      artworks: artwork.series.artworks.map(a => ({
        id: a.id,
        name: a.name,
        imgUrl: a.imgUrl,
        isOwned: a.isOwned,
        position: a.position,
      })),
      nextArtwork: artwork.series.nextArtwork ? {
        id: artwork.series.nextArtwork.id,
        name: artwork.series.nextArtwork.name,
        imgUrl: artwork.series.nextArtwork.imgUrl,
      } : undefined,
      unlockType: artwork.series.unlockType as "sequential" | "any_order" | "time_based",
    } : undefined,
    moreFromArtist: [
      { id: "1", name: "Other Work 1", imgUrl: artwork.artwork.imgUrl, price: 250 },
      { id: "2", name: "Other Work 2", imgUrl: artwork.artwork.imgUrl, price: 350 },
      { id: "3", name: "Other Work 3", imgUrl: artwork.artwork.imgUrl, price: 500 },
    ],
  }

  // Filter out structure/section group blocks - these are organizational only
  const visibleContentBlocks = artwork.contentBlocks.filter(block => {
    const blockType = block.block_type || ""
    // Hide structure blocks - they are for organization, not display
    if (blockType.toLowerCase().includes("section group") || 
        blockType.toLowerCase().includes("structure")) {
      return false
    }
    return true
  })

  // Render content block based on type
  const renderContentBlock = (block: ContentBlock) => {
    const blockType = block.block_type || ""

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
      case "Artwork Map Block":
      case "Location":
        return <MapBlock title={block.title} config={block.block_config || {}} />
      default:
        // Don't show unknown blocks in preview
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* Preview Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Editor</span>
            </Button>

            <div className="text-center flex-1 min-w-0">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                {artwork.isSubmission ? "Draft Preview" : "Preview Mode"}
              </p>
            </div>

            <button
              onClick={() => setIsAuthenticated(!isAuthenticated)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                isAuthenticated
                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  : "bg-amber-100 text-amber-700 hover:bg-amber-200"
              }`}
            >
              {isAuthenticated ? (
                <>
                  <Unlock className="h-4 w-4" />
                  <span className="hidden sm:inline">Unlocked</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span className="hidden sm:inline">Locked</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Preview Content */}
      <main className="md:py-6">
        <div className="w-full md:max-w-[480px] md:mx-auto bg-white md:rounded-3xl md:shadow-xl overflow-hidden">
          
          {/* Hero Image */}
          <div className="relative w-full aspect-square">
            {artwork.artwork.imgUrl ? (
              <Image
                src={artwork.artwork.imgUrl}
                alt={artwork.artwork.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">No image uploaded</p>
                </div>
              </div>
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Submission Badge */}
            {artwork.isSubmission && (
              <div className="absolute top-4 left-4">
                <Badge className="bg-amber-500 text-white border-0 shadow-lg px-3 py-1.5 text-xs font-semibold">
                  Draft
                </Badge>
              </div>
            )}
            
            {/* Edition Badge */}
            {artwork.artwork.editionNumber && artwork.artwork.editionTotal && !artwork.isSubmission && (
              <div className="absolute bottom-4 left-4">
                <Badge className="bg-white/95 text-gray-900 border-0 shadow-lg px-3 py-1.5 text-sm font-semibold">
                  #{artwork.artwork.editionNumber} / {artwork.artwork.editionTotal}
                </Badge>
              </div>
            )}
          </div>

          {/* Artwork Title */}
          <div className="px-5 py-5">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              {artwork.artwork.name}
            </h1>
            <p className="text-gray-600 mt-1">
              by <span className="font-medium text-gray-900">{artwork.artist.name}</span>
            </p>
          </div>

          {/* Certificate of Authenticity Section */}
          <div className="mx-5 mb-6">
            <div className="relative bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl overflow-hidden">
              {/* Certificate Header */}
              <div className="px-5 py-4 border-b border-gray-100 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Certificate of Authenticity</h3>
                    <p className="text-xs text-gray-500">Verified Original Artwork</p>
                  </div>
                </div>
              </div>

              {/* Certificate Details */}
              <div className="p-5 space-y-4">
                {/* Edition & Size Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Edition</p>
                    <p className="text-lg font-bold text-gray-900">
                      {artwork.artwork.editionNumber || 1} of {artwork.artwork.editionTotal || 50}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Acquired</p>
                    <p className="text-sm font-medium text-gray-900">
                      {artwork.artwork.purchaseDate 
                        ? new Date(artwork.artwork.purchaseDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Jan 29, 2026"
                      }
                    </p>
                  </div>
                </div>

                {/* Order Number */}
                {artwork.artwork.orderNumber && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Order Reference</p>
                    <p className="text-sm font-mono text-gray-700">{artwork.artwork.orderNumber}</p>
                  </div>
                )}

                {/* Artist Signature */}
                {artwork.artist.signatureUrl && isAuthenticated && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Artist Signature</p>
                    <div className="relative h-16 w-48">
                      <Image
                        src={artwork.artist.signatureUrl}
                        alt={`${artwork.artist.name}'s signature`}
                        fill
                        className="object-contain object-left"
                      />
                    </div>
                  </div>
                )}

                {/* Locked Signature Placeholder */}
                {artwork.artist.signatureUrl && !isAuthenticated && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Artist Signature</p>
                    <div className="h-16 w-48 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Lock className="h-4 w-4" />
                        <span className="text-sm">Unlock to reveal</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Decorative corner elements */}
              <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-gray-200 rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-gray-200 rounded-bl-2xl" />
            </div>
          </div>

          {/* Artist Profile Section */}
          {artwork.artist.bio && (
            <div className="mx-5 mb-6">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl">
                {/* Artist Photo */}
                <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-md">
                  {artwork.artist.profileImageUrl ? (
                    <Image
                      src={artwork.artist.profileImageUrl}
                      alt={artwork.artist.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-400">
                        {artwork.artist.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{artwork.artist.name}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-3">{artwork.artist.bio}</p>
                </div>
              </div>
            </div>
          )}

          {/* Series Progress Section - Show if artwork belongs to a series OR show demo for draft artworks */}
          {(artwork.series || artwork.isSubmission) && isAuthenticated && (() => {
            // Use real series data if available, otherwise use mock for demo
            const seriesInfo = artwork.series || (artwork.isSubmission ? mockSeriesData : null)
            if (!seriesInfo) return null
            
            const isDemo = !artwork.series && artwork.isSubmission
            
            return (
              <div className="mx-5 mb-6">
                {isDemo && (
                  <div className="mb-2 px-3 py-1.5 bg-amber-100 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-700 font-medium">
                      Preview: This is how series will appear when your artwork is part of one
                    </p>
                  </div>
                )}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl overflow-hidden">
                  {/* Series Header */}
                  <div className="px-5 py-4 border-b border-indigo-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                          <Grid3x3 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{seriesInfo.name}</h3>
                          <p className="text-xs text-gray-500">{getUnlockTypeLabel(seriesInfo.unlockType)}</p>
                        </div>
                      </div>
                      <Badge className="bg-white text-indigo-700 border-indigo-200">
                        {seriesInfo.ownedCount}/{seriesInfo.totalCount}
                      </Badge>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2 text-sm">
                      <span className="font-medium text-gray-700">Collection Progress</span>
                      <span className="text-indigo-600 font-semibold">
                        {Math.round((seriesInfo.ownedCount / seriesInfo.totalCount) * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white rounded-full overflow-hidden shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(seriesInfo.ownedCount / seriesInfo.totalCount) * 100}%` }}
                        transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Collection Grid */}
                  <div className="px-5 pb-4">
                    <div className="flex gap-2 overflow-x-auto py-2 -mx-1 px-1 scrollbar-hide">
                      {seriesInfo.artworks.map((item, index) => (
                        <div
                          key={item.id}
                          className={`flex-shrink-0 w-14 rounded-lg overflow-hidden transition-all ${
                            item.isOwned
                              ? "ring-2 ring-indigo-500 ring-offset-2"
                              : "opacity-50"
                          }`}
                        >
                          <div className="relative aspect-square">
                            {item.imgUrl ? (
                              <Image
                                src={item.imgUrl}
                                alt={item.name}
                                fill
                                className={`object-cover ${!item.isOwned ? "grayscale" : ""}`}
                              />
                            ) : (
                              <div className={`w-full h-full bg-gray-200 ${!item.isOwned ? "grayscale" : ""}`} />
                            )}
                            {item.isOwned ? (
                              <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                                <Check className="h-2.5 w-2.5 text-white" />
                              </div>
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <Lock className="h-3 w-3 text-white/80" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Next Unlock CTA */}
                  {seriesInfo.nextArtwork && (
                    <div className="px-5 pb-5">
                      <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-indigo-100">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          {seriesInfo.nextArtwork.imgUrl ? (
                            <Image
                              src={seriesInfo.nextArtwork.imgUrl}
                              alt={seriesInfo.nextArtwork.name}
                              fill
                              className="object-cover blur-[2px] opacity-60"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 blur-[2px] opacity-60" />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <Lock className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {seriesInfo.nextArtwork.name}
                          </p>
                          <p className="text-xs text-gray-500">Next in series</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  )}

                  {/* Milestone Rewards */}
                  {seriesInfo.milestones && seriesInfo.milestones.length > 0 && (
                    <div className="px-5 pb-5 border-t border-indigo-100 pt-4">
                      <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <Award className="h-4 w-4 text-indigo-500" />
                        Collection Rewards
                      </p>
                      <div className="space-y-2">
                        {seriesInfo.milestones.map((milestone, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                              milestone.isUnlocked
                                ? "bg-emerald-50 border border-emerald-200"
                                : "bg-white border border-gray-200"
                            }`}
                          >
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                                milestone.isUnlocked
                                  ? "bg-emerald-500 text-white"
                                  : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              {milestone.isUnlocked ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <span className="text-xs font-bold">{milestone.threshold}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{milestone.title}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })()}

          {/* Content Blocks Section */}
          {isAuthenticated && visibleContentBlocks.length > 0 && (
            <div className="px-5 pb-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-gray-900">Exclusive Content</h2>
              </div>
              <div className="space-y-6">
                {visibleContentBlocks.map((block, index) => {
                  const blockContent = renderContentBlock(block)
                  if (!blockContent) return null
                  return (
                    <motion.div
                      key={block.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index, duration: 0.4 }}
                    >
                      {blockContent}
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {isAuthenticated && visibleContentBlocks.length === 0 && (
            <div className="px-5 pb-6">
              <div className="text-center py-12 bg-gray-50 rounded-2xl">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">No content blocks yet</p>
                <p className="text-gray-400 text-sm mt-1">Add blocks in the editor</p>
              </div>
            </div>
          )}

          {/* Collector Stories - Instagram-style story circles */}
          {isAuthenticated && (() => {
            // Create mock story users for preview
            const mockStoryUsers: StoryUser[] = [
              {
                id: "artist-1",
                name: artwork.artist.name,
                avatarUrl: artwork.artist.profileImageUrl || undefined,
                isArtist: true,
                hasUnseenStories: false,
                stories: [
                  {
                    id: "artist-story-1",
                    product_id: productId,
                    author_type: "artist",
                    author_id: "artist-1",
                    author_name: artwork.artist.name,
                    author_avatar_url: artwork.artist.profileImageUrl || undefined,
                    content_type: "photo",
                    media_url: artwork.artwork.imgUrl,
                    text_content: "The making of this piece",
                    city: "New York",
                    country: "USA",
                    is_artist_reply: false,
                    is_visible: true,
                    is_pinned: false,
                    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                ],
              },
              {
                id: "collector-1",
                name: "Sarah M.",
                avatarUrl: undefined,
                isArtist: false,
                hasUnseenStories: true,
                stories: [
                  {
                    id: "collector-story-1",
                    product_id: productId,
                    author_type: "collector",
                    author_id: "collector-1",
                    author_name: "Sarah M.",
                    content_type: "photo",
                    media_url: artwork.artwork.imgUrl,
                    text_content: "Love how this looks in my living room!",
                    city: "London",
                    country: "UK",
                    is_artist_reply: false,
                    is_visible: true,
                    is_pinned: false,
                    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                ],
              },
              {
                id: "collector-2",
                name: "James K.",
                avatarUrl: undefined,
                isArtist: false,
                hasUnseenStories: true,
                stories: [
                  {
                    id: "collector-story-2",
                    product_id: productId,
                    author_type: "collector",
                    author_id: "collector-2",
                    author_name: "James K.",
                    content_type: "text",
                    text_content: "This piece brings such energy to my home office. Best investment I've made!",
                    city: "Los Angeles",
                    country: "USA",
                    is_artist_reply: false,
                    is_visible: true,
                    is_pinned: false,
                    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                ],
              },
              {
                id: "collector-3",
                name: "Mike R.",
                avatarUrl: undefined,
                isArtist: false,
                hasUnseenStories: false,
                stories: [
                  {
                    id: "collector-story-3",
                    product_id: productId,
                    author_type: "collector",
                    author_id: "collector-3",
                    author_name: "Mike R.",
                    content_type: "photo",
                    media_url: artwork.artwork.imgUrl,
                    text_content: "Just hung it up!",
                    city: "Tokyo",
                    country: "Japan",
                    is_artist_reply: false,
                    is_visible: true,
                    is_pinned: false,
                    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                ],
              },
            ]

            return (
              <div className="pb-6">
                <StoryCircles
                  productId={productId}
                  productName={artwork.artwork.name}
                  isOwner={true}
                  isArtist={false}
                  onAddStory={() => {}}
                  users={mockStoryUsers}
                  isPreview={true}
                />
                {/* Info text */}
                <p className="text-xs text-gray-400 mt-1 text-center px-5">
                  Tap circles to view full-screen stories with tap navigation
                </p>
              </div>
            )
          })()}

          {/* Locked State - Content Preview */}
          {!isAuthenticated && (
            <div className="px-5 pb-6">
              {/* Locked Content Preview */}
              <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                  <Lock className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
                  Exclusive Content Awaits
                </h3>
                <p className="text-gray-500 text-center text-sm mb-6">
                  <span className="font-semibold text-indigo-600">{visibleContentBlocks.length}</span> pieces of exclusive content
                </p>

                {/* Content Type Pills */}
                <div className="flex flex-wrap justify-center gap-2">
                  {Array.from(new Set(visibleContentBlocks.map(b => 
                    (b.block_type || "").replace(/^Artwork\s+/i, "").replace(/\s+Block$/i, "")
                  ).filter(t => t))).slice(0, 4).map((type, i) => (
                    <span key={i} className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600">
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              {/* Blurred Content Preview */}
              <div className="relative rounded-2xl overflow-hidden">
                <div className="blur-md pointer-events-none opacity-40 space-y-4 p-4 bg-gray-50">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-gray-200 rounded-xl" />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full border border-gray-200 shadow-lg">
                    <p className="text-gray-700 font-medium text-sm">Authenticate to unlock</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Discovery Section */}
          {isAuthenticated && (
            <div className="px-5 pb-6">
              <DiscoverySection
                discoveryData={discoveryData}
                isAuthenticated={true}
                artistName={artwork.artist.name}
              />
            </div>
          )}
        </div>
      </main>

      {/* Sticky NFC Pair Button - Only show when locked */}
      <AnimatePresence>
        {!isAuthenticated && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-5 py-4 md:max-w-[480px] md:mx-auto md:left-0 md:right-0"
            style={{ boxShadow: "0 -4px 20px rgba(0,0,0,0.1)" }}
          >
            <Button
              onClick={() => setIsAuthenticated(true)}
              className="w-full h-14 text-base font-semibold bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
            >
              <Fingerprint className="h-5 w-5 mr-3" />
              Pair NFC Tag to Unlock
            </Button>
            <p className="text-center text-xs text-gray-500 mt-2">
              Hold your phone near the NFC tag on your artwork
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
