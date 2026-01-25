"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Lock,
  Unlock,
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
}

interface ContentBlock {
  id: number
  benefit_type_id: number
  title: string
  description: string | null
  content_url: string | null
  block_config: any
  display_order: number
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
            throw new Error("Artwork not found")
          }
          if (response.status === 403) {
            throw new Error("You don't have access to this artwork")
          }
          throw new Error("Failed to load artwork")
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
  // This would ideally come from the API, but we'll infer it
  const getBlockTypeFromBenefitId = (benefitTypeId: number): string => {
    // This is a placeholder - the API should return block type names
    // For now, we'll rely on block.block_type if available
    return "text"
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
      <div className="container mx-auto py-8 max-w-4xl space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-64 w-full" />
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
        <Button onClick={() => router.push("/collector/dashboard")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    )
  }

  const isAuthenticated = artwork.isAuthenticated

  return (
    <div>
      {/* Unlock Reveal Animation */}
      {showUnlockReveal && (
        <UnlockReveal
          artworkName={artwork.artwork.name}
          onComplete={() => setShowUnlockReveal(false)}
        />
      )}

      <div className="min-h-screen bg-background pb-safe-4">
        {/* Mobile-first header - compact */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b px-4 py-3">
          <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => router.push("/collector/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold tracking-tight truncate">{artwork.artwork.name}</h1>
            {artwork.artist.name && (
              <p className="text-xs text-muted-foreground truncate">
                by{" "}
                <Link
                  href={`/artist/${encodeURIComponent(artwork.artist.name)}`}
                  className="hover:underline"
                >
                  {artwork.artist.name}
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Artwork Image - Full bleed on mobile */}
      <div className="relative">
        <div className={`relative aspect-square ${!isAuthenticated ? "filter blur-lg" : ""}`}>
          {artwork.artwork.imgUrl ? (
            <Image
              src={artwork.artwork.imgUrl}
              alt={artwork.artwork.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <ImageIcon className="h-24 w-24 text-muted-foreground" />
            </div>
          )}
        </div>
        {!isAuthenticated && (
          <FrostedOverlay 
            message="Tap to reveal" 
            submessage="exclusive content from the artist"
          />
        )}
      </div>

      {/* Content area with padding */}
      <div className="px-4 py-6 space-y-6 md:max-w-4xl md:mx-auto">
        {/* Edition Info - Compact pill design */}
        <div className="flex items-center justify-between gap-4">
          {artwork.artwork.editionNumber && artwork.artwork.editionTotal && (
            <Badge variant="outline" className="text-base px-3 py-1.5 rounded-full">
              #{artwork.artwork.editionNumber}/{artwork.artwork.editionTotal}
            </Badge>
          )}
          <div className="text-right text-xs text-muted-foreground">
            <p>{new Date(artwork.artwork.purchaseDate).toLocaleDateString()}</p>
            <p className="text-[10px]">Order {artwork.artwork.orderNumber}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Locked Content Preview or Authenticated Badge */}
        {!isAuthenticated ? (
          <LockedContentPreview contentBlocks={artwork.lockedContentPreview || []} />
        ) : (
          <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-900/50">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-green-900 dark:text-green-100 text-sm">Authenticated</p>
              <p className="text-xs text-green-700 dark:text-green-300">
                {new Date(artwork.artwork.nfcClaimedAt!).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {/* Locked Content with enhanced blur */}
        <div className={`space-y-6 ${!isAuthenticated ? "filter blur-md pointer-events-none" : ""}`}>
          {/* Artist Signature */}
          <ArtistSignatureBlock signatureUrl={artwork.artist.signatureUrl} />

          {/* Artist Bio */}
          <ArtistBioBlock
            name={artwork.artist.name}
            bio={artwork.artist.bio}
            profileImageUrl={artwork.artist.profileImageUrl}
          />

          {/* Content Blocks */}
          {artwork.contentBlocks.map((block) => {
            const blockType = block.block_type || getBlockTypeFromBenefitId(block.benefit_type_id)

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
                    artworkId={artworkId}
                  />
                )
              case "Artwork Audio Block":
              case "audio":
                return (
                  <AudioBlock
                    key={block.id}
                    title={block.title}
                    contentUrl={block.content_url}
                    artworkId={artworkId}
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
        </div>

        {/* NFC URL Section (only when authenticated) */}
        {isAuthenticated && <NFCUrlSection artworkId={artworkId} />}
      </div>

      {/* Sticky Bottom CTA - Mobile First */}
      {!isAuthenticated && (
        <div className="fixed bottom-0 left-0 right-0 z-50 
                        bg-background/95 backdrop-blur-md border-t
                        p-4 pb-safe-4 md:hidden">
          <Button
            onClick={() => setIsNfcSheetOpen(true)}
            className="w-full h-14 text-lg font-semibold rounded-xl"
          >
            Authenticate Now
          </Button>
          <button
            onClick={() => setIsNfcSheetOpen(true)}
            className="w-full text-center text-sm text-muted-foreground mt-2 py-2 min-h-[44px]"
          >
            or enter code manually
          </button>
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
