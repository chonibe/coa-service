"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

import { Skeleton } from "@/components/ui"

import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Lock,
  Unlock,
  ArrowLeft,
  ExternalLink,
  Image as ImageIcon,
  Eye,
  ShieldAlert,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { TextBlock } from "@/app/collector/artwork/[id]/components/TextBlock"
import { ImageBlock } from "@/app/collector/artwork/[id]/components/ImageBlock"
import { VideoBlock } from "@/app/collector/artwork/[id]/components/VideoBlock"
import { AudioBlock } from "@/app/collector/artwork/[id]/components/AudioBlock"
import { ArtistSignatureBlock } from "@/app/collector/artwork/[id]/components/ArtistSignatureBlock"
import { ArtistBioBlock } from "@/app/collector/artwork/[id]/components/ArtistBioBlock"
import { NFCUrlSection } from "@/app/collector/artwork/[id]/components/NFCUrlSection"
import LockedContentPreview from "@/app/collector/artwork/[id]/components/LockedContentPreview"
import { FrostedOverlay } from "@/app/collector/artwork/[id]/components/FrostedOverlay"
import UnlockReveal from "@/app/collector/artwork/[id]/components/UnlockReveal"
import { HeroSection } from "@/app/collector/artwork/[id]/components/HeroSection"
import { ArtistProfileCard } from "@/app/collector/artwork/[id]/components/ArtistProfileCard"
import { LockedOverlay } from "@/app/collector/artwork/[id]/components/LockedOverlay"
import { ImmersiveVideoBlock } from "@/app/collector/artwork/[id]/components/ImmersiveVideoBlock"
import { ImmersiveAudioBlock } from "@/app/collector/artwork/[id]/components/ImmersiveAudioBlock"
import { motion } from "framer-motion"

// New immersive block components
import SoundtrackSection from "@/app/collector/artwork/[id]/components/SoundtrackSection"
import VoiceNoteSection from "@/app/collector/artwork/[id]/components/VoiceNoteSection"
import ProcessGallerySection from "@/app/collector/artwork/[id]/components/ProcessGallerySection"
import InspirationBoardSection from "@/app/collector/artwork/[id]/components/InspirationBoardSection"
import ArtistNoteSection from "@/app/collector/artwork/[id]/components/ArtistNoteSection"
import { SectionGroupBlock } from "@/app/collector/artwork/[id]/components/SectionGroupBlock"
import { MapBlock } from "@/app/collector/artwork/[id]/components/MapBlock"
import { SpecialArtworkChip, type SpecialChip } from "@/app/collector/artwork/[id]/components/SpecialArtworkChip"
import { DiscoverySection } from "@/app/collector/artwork/[id]/components/DiscoverySection"

// Reels and Story components
import { ReelsViewer } from "@/app/collector/artwork/[id]/components/ReelsViewer"
import { SharedStoryTimeline } from "@/app/collector/artwork/[id]/components/story/SharedStoryTimeline"

import { Card, CardContent, Button, Badge, Alert, AlertDescription } from "@/components/ui"
import type { Slide } from "@/lib/slides/types"
import type { StoryPost } from "@/lib/story/types"

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
  specialChips?: SpecialChip[]
  discoveryData?: {
    unlockedContent?: {
      type: "series" | "artwork" | "vip_series"
      id: string
      name: string
      thumbnailUrl?: string
    }
    seriesInfo?: {
      name: string
      totalCount: number
      ownedCount: number
      artworks: Array<{
        id: string
        name: string
        imgUrl: string
        isOwned: boolean
        position: number
      }>
      nextArtwork?: {
        id: string
        name: string
        imgUrl: string
      }
      unlockType?: "sequential" | "any_order" | "time_based"
    }
    countdown?: {
      unlockAt: string
      artworkName: string
      artworkImgUrl?: string
    }
    moreFromArtist?: Array<{
      id: string
      name: string
      imgUrl: string
      price?: number
    }>
  }
  isAdminPreview?: boolean
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
  parent_block_id?: number | null
  display_order_in_parent?: number
  childBlocks?: ContentBlock[]
}

export default function AdminArtworkPreviewPage() {
  const params = useParams()
  const router = useRouter()
  const artworkId = params.id as string

  const [artwork, setArtwork] = useState<ArtworkDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [slides, setSlides] = useState<Slide[]>([])
  const [showReels, setShowReels] = useState(false)

  useEffect(() => {
    async function fetchArtwork() {
      try {
        const res = await fetch(`/api/admin/artwork-preview/${artworkId}`)
        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.message || "Failed to load artwork")
        }
        const data = await res.json()
        setArtwork(data)

        // Fetch slides if available
        try {
          const slidesRes = await fetch(`/api/slides/${artworkId}`)
          if (slidesRes.ok) {
            const slidesData = await slidesRes.json()
            if (slidesData.slides && slidesData.slides.length > 0) {
              setSlides(slidesData.slides)
            }
          }
        } catch (err) {
          console.error("Failed to load slides:", err)
        }
      } catch (err: any) {
        setError(err.message || "Failed to load artwork")
      } finally {
        setIsLoading(false)
      }
    }

    fetchArtwork()
  }, [artworkId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-slate-400" />
          <p className="text-sm font-medium text-slate-500">Loading artwork preview...</p>
        </div>
      </div>
    )
  }

  if (error || !artwork) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              <h2 className="text-xl font-bold text-slate-900">Artwork Not Found</h2>
              <p className="text-sm text-slate-500">{error || "Unable to load artwork preview"}</p>
              <Button onClick={() => router.back()} variant="outline" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const {
    artwork: artworkData,
    artist,
    contentBlocks,
    lockedContentPreview,
    series,
    isAuthenticated,
    specialChips,
    discoveryData,
  } = artwork

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Admin Preview Banner */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5" />
              <div>
                <p className="text-sm font-black uppercase tracking-wider">Admin Preview Mode</p>
                <p className="text-xs opacity-90">Viewing as collector would see this artwork</p>
              </div>
            </div>
            <Button
              onClick={() => router.back()}
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-none"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to CRM
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Sticky Header */}
      <div className="sticky top-[60px] z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-black text-slate-900 tracking-tight truncate">
                {artworkData.name}
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {artist.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reels Experience Button */}
      {slides.length > 0 && (
        <div className="container mx-auto px-4 py-6">
          <Button
            onClick={() => setShowReels(true)}
            className="w-full h-16 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-black text-lg rounded-3xl shadow-xl"
          >
            <ImageIcon className="h-6 w-6 mr-3" />
            Experience the Story
          </Button>
        </div>
      )}

      {/* Reels Viewer Modal */}
      {showReels && slides.length > 0 && (
        <ReelsViewer
          slides={slides}
          artworkId={artworkId}
          onClose={() => setShowReels(false)}
          isAuthenticated={isAuthenticated}
        />
      )}

      {/* Main Artwork Image */}
      <div className="container mx-auto px-4 mb-8">
        <div className="relative w-full aspect-square rounded-[3rem] overflow-hidden shadow-2xl bg-slate-100">
          {artworkData.imgUrl ? (
            <Image
              src={artworkData.imgUrl}
              alt={artworkData.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <ImageIcon className="h-24 w-24 text-slate-300" />
            </div>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 mb-8">
        <HeroSection
          editionNumber={artworkData.editionNumber}
          editionTotal={artworkData.editionTotal}
          purchaseDate={artworkData.purchaseDate}
          orderNumber={artworkData.orderNumber}
        />
      </div>

      {/* Special Artwork Chips */}
      {specialChips && specialChips.length > 0 && (
        <div className="container mx-auto px-4 mb-8">
          <div className="flex flex-wrap gap-3">
            {specialChips.map((chip, index) => (
              <SpecialArtworkChip key={index} chip={chip} />
            ))}
          </div>
        </div>
      )}

      {/* Authentication Status */}
      {isAuthenticated && artworkData.nfcClaimedAt && (
        <div className="container mx-auto px-4 mb-8">
          <Alert className="bg-emerald-50 border-emerald-200 rounded-3xl">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <AlertDescription className="text-emerald-800 font-bold">
              Verified on {new Date(artworkData.nfcClaimedAt).toLocaleDateString()}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* NFC Authentication Section */}
      {!isAuthenticated && (
        <div className="container mx-auto px-4 mb-8">
          <NFCUrlSection artworkId={artworkId} />
        </div>
      )}

      {/* Locked Content Preview */}
      {!isAuthenticated && lockedContentPreview.length > 0 && (
        <div className="container mx-auto px-4 mb-8">
          <LockedContentPreview items={lockedContentPreview} />
        </div>
      )}

      {/* Artist Profile Card */}
      <div className="container mx-auto px-4 mb-12">
        <ArtistProfileCard
          artistName={artist.name}
          bio={artist.bio}
          signatureUrl={artist.signatureUrl}
          profileImageUrl={artist.profileImageUrl}
        />
      </div>

      {/* Shared Story Timeline */}
      <div className="container mx-auto px-4 mb-12">
        <SharedStoryTimeline
          lineItemId={artworkData.lineItemId}
          isAuthenticated={false} // Admin cannot interact
          artworkName={artworkData.name}
          artistName={artist.name}
        />
      </div>

      {/* Content Blocks */}
      {contentBlocks.length > 0 ? (
        <div className="container mx-auto px-4 space-y-12 mb-12">
          {contentBlocks.map((block) => {
            const blockType = block.block_type

            switch (blockType) {
              case "Artwork Text Block":
                return <TextBlock key={block.id} block={block} />
              case "Artwork Image Block":
                return <ImageBlock key={block.id} block={block} />
              case "Artwork Video Block":
                return <ImmersiveVideoBlock key={block.id} block={block} />
              case "Artwork Audio Block":
                return <ImmersiveAudioBlock key={block.id} block={block} />
              case "Artwork Soundtrack Block":
                return <SoundtrackSection key={block.id} block={block} />
              case "Artwork Voice Note Block":
                return (
                  <VoiceNoteSection
                    key={block.id}
                    block={block}
                    isAuthenticated={false}
                    lineItemId={artworkData.lineItemId}
                  />
                )
              case "Artwork Process Gallery Block":
                return <ProcessGallerySection key={block.id} block={block} />
              case "Artwork Inspiration Block":
                return <InspirationBoardSection key={block.id} block={block} />
              case "Artwork Artist Note Block":
                return <ArtistNoteSection key={block.id} block={block} artistName={artist.name} />
              case "Artwork Map Block":
                return <MapBlock key={block.id} block={block} />
              case "Artwork Section Group Block":
                return <SectionGroupBlock key={block.id} block={block} artistName={artist.name} />
              default:
                return null
            }
          })}
        </div>
      ) : (
        /* No Experience Created Yet */
        <div className="container mx-auto px-4 mb-12">
          <Alert className="bg-blue-50 border-blue-200 rounded-3xl">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <AlertDescription className="text-blue-800 font-bold">
              No collector experience has been created for this artwork yet. The artist can add content blocks, stories, and immersive experiences from the artwork editor.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Discovery Section */}
      {discoveryData && (
        <div className="container mx-auto px-4 mb-12">
          <DiscoverySection
            discoveryData={discoveryData}
            artistName={artist.name}
            currentArtworkId={artworkData.id}
          />
        </div>
      )}

      {/* Admin Notice */}
      <div className="container mx-auto px-4 mb-8">
        <Alert className="bg-amber-50 border-amber-200 rounded-3xl">
          <ShieldAlert className="h-5 w-5 text-amber-600" />
          <AlertDescription className="text-amber-800 font-bold">
            This is a read-only preview. Collectors will see this exact experience when viewing their artwork.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
