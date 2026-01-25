"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"



import { Skeleton } from "@/components/ui"



import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  Image as ImageIcon,
  Lock,
  Unlock,
  Smartphone,
  Monitor,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { TextBlock } from "@/app/collector/artwork/[id]/components/TextBlock"
import { ImageBlock } from "@/app/collector/artwork/[id]/components/ImageBlock"
import { VideoBlock } from "@/app/collector/artwork/[id]/components/VideoBlock"
import { AudioBlock } from "@/app/collector/artwork/[id]/components/AudioBlock"
import { ArtistSignatureBlock } from "@/app/collector/artwork/[id]/components/ArtistSignatureBlock"
import { ArtistBioBlock } from "@/app/collector/artwork/[id]/components/ArtistBioBlock"
import { MobileFrame } from "../../components/MobileFrame"

import { Card, CardContent, Button, Badge, Alert, AlertDescription, Switch, Label } from "@/components/ui"
interface ArtworkDetail {
  artwork: {
    id: string
    name: string
    imgUrl: string
    editionNumber: number | null
    editionTotal: number | null
    purchaseDate: string | null
    orderNumber: string | null
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
        setArtwork(data)
      } catch (err: any) {
        console.error("Error fetching artwork:", err)
        setError(err.message || "Failed to load artwork")
      } finally {
        setIsLoading(false)
      }
    }

    if (productId) {
      fetchArtwork()
    }
  }, [productId])

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-4xl space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error || !artwork) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Failed to load artwork"}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push(`/vendor/dashboard/artwork-pages/${productId}`)} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Editor
        </Button>
      </div>
    )
  }

  const isAuthenticated = previewMode === "unlocked"

  const renderPreviewContent = () => (
    <div className={showMobileFrame ? "bg-background" : "container mx-auto py-8 max-w-4xl space-y-6"}>
      {/* Artwork Image */}
      <Card className={showMobileFrame ? "m-4 mt-14" : ""}>
        <CardContent className="p-6">
          <div className={`relative aspect-square rounded-lg overflow-hidden ${!isAuthenticated ? "blur-sm" : ""}`}>
            {artwork?.artwork.imgUrl ? (
              <Image
                src={artwork.artwork.imgUrl}
                alt={artwork.artwork.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            {!isAuthenticated && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="text-center">
                  <Lock className="h-12 w-12 mx-auto text-white mb-2" />
                  <p className="text-white font-semibold">Content Locked</p>
                  <p className="text-white/80 text-sm">Authenticate with NFC to unlock</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edition Info */}
      {(artwork?.artwork.editionNumber || artwork?.artwork.editionTotal) && (
        <Card className={showMobileFrame ? "mx-4" : ""}>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-lg px-3 py-1">
                #{artwork.artwork.editionNumber}
                {artwork.artwork.editionTotal ? ` / ${artwork.artwork.editionTotal}` : ""}
              </Badge>
              <span className="text-muted-foreground">Edition</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Artist Info */}
      <Card className={showMobileFrame ? "mx-4" : ""}>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Artist</h2>
          <div className="flex items-center gap-4">
            {artwork?.artist.profileImageUrl && (
              <div className="relative w-16 h-16 rounded-full overflow-hidden">
                <Image
                  src={artwork.artist.profileImageUrl}
                  alt={artwork.artist.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-lg">{artwork?.artist.name}</h3>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Locked Content Section */}
      <div className={`space-y-6 ${!isAuthenticated ? "blur-sm pointer-events-none relative" : ""} ${showMobileFrame ? "mx-4 mb-8" : ""}`}>
        {!isAuthenticated && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="bg-background/80 backdrop-blur-sm rounded-lg p-8 text-center border-2 border-dashed">
              <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="font-semibold text-lg mb-2">Content Locked</p>
              <p className="text-muted-foreground">
                This content will be visible to collectors after they authenticate with NFC
              </p>
            </div>
          </div>
        )}

        {/* Artist Signature */}
        {artwork?.artist.signatureUrl && (
          <ArtistSignatureBlock signatureUrl={artwork.artist.signatureUrl} />
        )}

        {/* Artist Bio */}
        {artwork?.artist.bio && <ArtistBioBlock artist={artwork.artist} />}

        {/* Content Blocks */}
        {artwork?.contentBlocks.map((block) => {
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
                  artworkId={undefined} // No analytics tracking in preview
                />
              )
            case "Artwork Audio Block":
            case "audio":
              return (
                <AudioBlock
                  key={block.id}
                  title={block.title}
                  contentUrl={block.content_url}
                  artworkId={undefined} // No analytics tracking in preview
                />
              )
            default:
              return (
                <Card key={block.id}>
                  <CardContent className="p-6">
                    {block.title && <h2 className="text-xl font-semibold mb-4">{block.title}</h2>}
                    {block.description && (
                      <p className="text-muted-foreground whitespace-pre-line">{block.description}</p>
                    )}
                    {block.content_url && (
                      <a
                        href={block.content_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        View Content <ExternalLink className="h-4 w-4 inline ml-1" />
                      </a>
                    )}
                  </CardContent>
                </Card>
              )
          }
        })}

        {artwork?.contentBlocks.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No content blocks added yet</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Series Info */}
      {artwork?.series && (
        <Card className={showMobileFrame ? "mx-4 mb-8" : ""}>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Part of series:</span>
              <Badge variant="secondary">{artwork.series.name}</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-50">
        <div className="container mx-auto py-4 px-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/vendor/dashboard/artwork-pages/${productId}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Editor
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">{artwork?.artwork.name}</h1>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Preview
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-lg">
                <Monitor className={`w-4 h-4 ${!showMobileFrame ? "text-primary" : "text-muted-foreground"}`} />
                <Switch
                  checked={showMobileFrame}
                  onCheckedChange={setShowMobileFrame}
                  className="data-[state=checked]:bg-primary"
                />
                <Smartphone className={`w-4 h-4 ${showMobileFrame ? "text-primary" : "text-muted-foreground"}`} />
              </div>

              {/* Lock State Toggle */}
              <div className="flex items-center gap-2">
                <Button
                  variant={previewMode === "locked" ? "default" : "outline"}
                  onClick={() => setPreviewMode("locked")}
                  size="sm"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Locked
                </Button>
                <Button
                  variant={previewMode === "unlocked" ? "default" : "outline"}
                  onClick={() => setPreviewMode("unlocked")}
                  size="sm"
                >
                  <Unlock className="h-4 w-4 mr-2" />
                  Unlocked
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      {showMobileFrame ? (
        <MobileFrame>{renderPreviewContent()}</MobileFrame>
      ) : (
        renderPreviewContent()
      )}
    </div>
  )
}
