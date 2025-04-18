"use client"

import type React from "react"

import { useState } from "react"
import { ArtworkFrame } from "./artwork-frame"
import { useArtistVisitations } from "@/hooks/use-artist-visitations"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, ImageIcon, FileText, Sparkles } from "lucide-react"

interface CollectionGalleryProps {
  collectorId: string
  artworks: Array<{
    id: string
    title: string
    imageUrl: string
    artist: {
      id: string
      name: string
      profileImageUrl: string
    }
    themes: string[]
  }>
}

export function CollectionGallery({ collectorId, artworks }: CollectionGalleryProps) {
  const { hasVisitation, getPresenceType } = useArtistVisitations(collectorId, artworks)
  const [selectedArtwork, setSelectedArtwork] = useState<string | null>(null)

  // Icons for different presence types
  const presenceTypeIcons: Record<string, React.ReactNode> = {
    whisper: <MessageSquare className="w-4 h-4" />,
    glimpse: <ImageIcon className="w-4 h-4" />,
    artifact: <FileText className="w-4 h-4" />,
    dialogue: <MessageSquare className="w-4 h-4" />,
    revelation: <Sparkles className="w-4 h-4" />,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-medium">Your Collection</h2>

        {/* Visitation indicator */}
        {artworks.some((artwork) => hasVisitation(artwork.id)) && (
          <Badge
            variant="outline"
            className="bg-purple-100 text-purple-800 border-purple-200 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Artist Visitation</span>
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {artworks.map((artwork) => (
          <div key={artwork.id} className="space-y-2">
            <ArtworkFrame
              artwork={artwork}
              presenceType={getPresenceType(artwork.id) || "whisper"}
              hasVisitation={hasVisitation(artwork.id)}
              className={selectedArtwork === artwork.id ? "ring-2 ring-blue-500" : ""}
            />
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{artwork.title}</h3>
                <p className="text-sm text-gray-500">{artwork.artist.name}</p>
              </div>

              {/* Show presence type if there's a visitation */}
              {hasVisitation(artwork.id) && getPresenceType(artwork.id) && (
                <Badge
                  variant="outline"
                  className="bg-purple-50 text-purple-700 border-purple-100 flex items-center gap-1"
                >
                  {presenceTypeIcons[getPresenceType(artwork.id) || "whisper"]}
                  <span className="capitalize text-xs">{getPresenceType(artwork.id)}</span>
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
