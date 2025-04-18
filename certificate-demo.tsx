"use client"

import { useState } from "react"
import Image from "next/image"
import { ArtworkFrame } from "@/components/artwork-frame"
import { CollectionGallery } from "@/components/collection-gallery"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GalleryThumbnailsIcon as Gallery, Home, User } from "lucide-react"

export default function CertificateDemo() {
  const [imageLoaded, setImageLoaded] = useState(false)

  // Mock data for the demo
  const artistId = "artist123"
  const certificateId = "cert456"
  const collectorId = "collector789"
  const artworkTitle = "Chromatic Flow #42"

  // Mock artwork collection
  const artworkCollection = [
    {
      id: certificateId,
      title: artworkTitle,
      imageUrl: "/chromatic-flow.png",
      artist: {
        id: artistId,
        name: "Chanchal Banga",
        profileImageUrl: "/creative-portrait.png",
      },
      themes: ["abstract", "color theory", "digital"],
    },
    {
      id: "cert789",
      title: "Urban Fragments #3",
      imageUrl: "/cluttered-creative-space.png",
      artist: {
        id: "artist456",
        name: "Maya Lin",
        profileImageUrl: "/diverse-professional-profiles.png",
      },
      themes: ["urban", "collage", "photography"],
    },
    {
      id: "cert101",
      title: "Ethereal Landscape",
      imageUrl: "/diverse-group-city.png",
      artist: {
        id: "artist789",
        name: "Takashi Murakami",
        profileImageUrl: "/mystical-forest-spirit.png",
      },
      themes: ["landscape", "surreal", "digital"],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Tabs defaultValue="certificate">
          <div className="bg-white rounded-lg shadow-sm mb-4">
            <TabsList className="p-2 gap-1 w-full">
              <TabsTrigger value="certificate" className="gap-1.5">
                <Home className="w-4 h-4" />
                <span>Certificate</span>
              </TabsTrigger>
              <TabsTrigger value="collection" className="gap-1.5">
                <Gallery className="w-4 h-4" />
                <span>Collection</span>
              </TabsTrigger>
              <TabsTrigger value="artist" className="gap-1.5">
                <User className="w-4 h-4" />
                <span>Artist</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="certificate">
            <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
              <h1 className="text-2xl font-medium mb-6">Certificate of Authenticity</h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <ArtworkFrame
                    artwork={{
                      id: certificateId,
                      title: artworkTitle,
                      imageUrl: "/chromatic-flow.png",
                      artist: {
                        id: artistId,
                        name: "Chanchal Banga",
                        profileImageUrl: "/creative-portrait.png",
                      },
                    }}
                    presenceType="whisper"
                    hasVisitation={true}
                    className="aspect-square"
                  />
                </div>

                <div>
                  <h2 className="text-xl font-medium">{artworkTitle}</h2>
                  <p className="text-gray-600 mb-6">By Chanchal Banga</p>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Edition</h3>
                      <p>1 of 10</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Created</h3>
                      <p>April 2023</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Medium</h3>
                      <p>Digital Art, Giclée print on archival paper</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Dimensions</h3>
                      <p>24 × 36 inches</p>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Artist Note</h3>
                      <p className="text-sm text-gray-600 italic">
                        "This piece explores the relationship between color and emotion. The flowing forms represent the
                        way our feelings shift and blend into one another, never static but always in motion."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="collection">
            <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
              <CollectionGallery collectorId={collectorId} artworks={artworkCollection} />
            </div>
          </TabsContent>

          <TabsContent value="artist">
            <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full overflow-hidden">
                  <Image
                    src="/creative-portrait.png"
                    alt="Chanchal Banga"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-medium">Chanchal Banga</h2>
                  <p className="text-gray-600">Digital Artist</p>
                </div>
              </div>

              <div className="prose max-w-none">
                <p>
                  Chanchal Banga is a digital artist exploring the intersection of technology and consciousness through
                  abstract forms and vibrant color relationships. Their work examines how perception shapes our
                  understanding of reality.
                </p>
                <p>
                  Based in Chicago, Banga has exhibited internationally and is known for creating immersive digital
                  experiences that blur the line between the physical and digital worlds.
                </p>
                <p>
                  As a collector of Banga's work, you'll occasionally receive exclusive glimpses into their creative
                  process, thoughts, and inspirations directly through your collected pieces - as if the artist
                  occasionally visits the artwork in your collection.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
