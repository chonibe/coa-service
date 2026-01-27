"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2, AlertCircle, ArrowLeft, Eye, Lock, Unlock } from "lucide-react"
import Image from "next/image"
import { Button, Alert, AlertDescription, Skeleton, Badge, Switch, Label } from "@/components/ui"

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
  const [showMobileFrame, setShowMobileFrame] = useState(true)

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
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <Skeleton className="aspect-video w-full mb-8" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  // Error state
  if (error || !artwork) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Failed to load preview"}</AlertDescription>
        </Alert>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Editor
        </Button>
      </div>
    )
  }

  const isAuthenticated = previewMode === "unlocked"

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header Controls */}
      <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Editor
          </Button>

          <div className="flex items-center gap-4">
            {/* Mobile Frame Toggle */}
            <div className="flex items-center gap-2">
              <Label htmlFor="mobile-frame" className="text-sm text-gray-400">
                Mobile Frame
              </Label>
              <Switch
                id="mobile-frame"
                checked={showMobileFrame}
                onCheckedChange={setShowMobileFrame}
              />
            </div>

            {/* Locked/Unlocked Toggle */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-2">
                {previewMode === "locked" ? (
                  <Lock className="h-3 w-3" />
                ) : (
                  <Unlock className="h-3 w-3" />
                )}
                {previewMode === "locked" ? "Locked" : "Unlocked"}
              </Badge>
              <Switch
                checked={previewMode === "unlocked"}
                onCheckedChange={(checked) => setPreviewMode(checked ? "unlocked" : "locked")}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className={showMobileFrame ? "flex justify-center p-8" : ""}>
        <MobileFrame enabled={showMobileFrame}>
          <div className="min-h-screen bg-gray-950 text-white">
            {/* Hero Image */}
            <div className="relative w-full aspect-[16/9]">
              <Image
                src={artwork.artwork.imgUrl}
                alt={artwork.artwork.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {artwork.artwork.name}
                </h1>
                {artwork.artwork.editionNumber && artwork.artwork.editionTotal && (
                  <p className="text-gray-300">
                    Edition {artwork.artwork.editionNumber} of {artwork.artwork.editionTotal}
                  </p>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-12 space-y-16">
              {/* Artist Info */}
              {isAuthenticated && (
                <>
                  {artwork.artist.signatureUrl && (
                    <ArtistSignatureBlock signatureUrl={artwork.artist.signatureUrl} />
                  )}
                  {artwork.artist.bio && <ArtistBioBlock artist={artwork.artist} />}
                </>
              )}

              {/* Content Blocks with Lock Overlay */}
              <div className={`space-y-16 relative ${!isAuthenticated ? "blur-sm" : ""}`}>
                {!isAuthenticated && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <div className="bg-gray-900/90 backdrop-blur-sm rounded-xl p-8 text-center border border-gray-700">
                      <Lock className="h-12 w-12 mx-auto text-gray-500 mb-4" />
                      <p className="font-semibold text-lg mb-2">Content Locked</p>
                      <p className="text-gray-400">
                        This content will be visible after authentication
                      </p>
                    </div>
                  </div>
                )}

                {/* Render all blocks */}
                {artwork.contentBlocks.map(block => {
                  const blockType = block.block_type || ""

                  switch (blockType) {
                    case "Artwork Text Block":
                    case "text":
                      return (
                        <TextBlock
                          key={block.id}
                          title={block.title}
                          description={block.description}
                        />
                      )

                    case "Artwork Image Block":
                    case "image":
                      return (
                        <ImageBlock
                          key={block.id}
                          title={block.title}
                          contentUrl={block.content_url}
                          blockConfig={block.block_config}
                        />
                      )

                    case "Artwork Video Block":
                    case "video":
                      return (
                        <VideoBlock
                          key={block.id}
                          title={block.title}
                          contentUrl={block.content_url}
                          artworkId={undefined}
                        />
                      )

                    case "Artwork Audio Block":
                    case "audio":
                      return (
                        <AudioBlock
                          key={block.id}
                          title={block.title}
                          contentUrl={block.content_url}
                          artworkId={undefined}
                        />
                      )

                    case "Artwork Soundtrack Block":
                      return (
                        <SoundtrackSection
                          key={block.id}
                          title={block.title}
                          config={block.block_config || {}}
                        />
                      )

                    case "Artwork Voice Note Block":
                      return (
                        <VoiceNoteSection
                          key={block.id}
                          title={block.title}
                          contentUrl={block.content_url || ""}
                          config={block.block_config}
                        />
                      )

                    case "Artwork Process Gallery Block":
                      return (
                        <ProcessGallerySection
                          key={block.id}
                          title={block.title}
                          config={block.block_config || { images: [] }}
                        />
                      )

                    case "Artwork Inspiration Block":
                      return (
                        <InspirationBoardSection
                          key={block.id}
                          title={block.title}
                          config={block.block_config || { images: [] }}
                        />
                      )

                    case "Artwork Artist Note Block":
                      return (
                        <ArtistNoteSection
                          key={block.id}
                          content={block.description || ""}
                          signatureUrl={block.block_config?.signature_url}
                          artistName={artwork.artist.name}
                        />
                      )

                    default:
                      // Fallback for unknown types (should not happen)
                      return null
                  }
                })}

                {/* Empty State */}
                {artwork.contentBlocks.length === 0 && (
                  <div className="text-center py-24">
                    <p className="text-gray-500">No content blocks yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </MobileFrame>
      </div>
    </div>
  )
}
