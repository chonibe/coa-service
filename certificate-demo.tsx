"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ArtworkPortal } from "@/components/artwork-portal"
import { ExclusiveDrops } from "@/components/exclusive-drops"
import { InstagramFeed } from "@/components/instagram-feed"
import { useArtworkPortal } from "@/hooks/use-artwork-portal"
import { useArtistInstagram } from "@/hooks/use-artist-instagram"
import { Button } from "@/components/ui/button"
import { MessageCircle, Instagram } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function CertificateDemo() {
  const [showVisitDialog, setShowVisitDialog] = useState(false)
  const [visitToShow, setVisitToShow] = useState<any | null>(null)
  const [showingHint, setShowingHint] = useState(false)
  const [activeTab, setActiveTab] = useState("artwork")

  // In a real implementation, these would come from your auth and database
  const artistId = "artist123"
  const artworkId = "artwork456"
  const collectorId = "collector789"

  const artist = {
    id: artistId,
    name: "Street Collector",
    profileImageUrl: "/creative-portrait.png",
  }

  const artwork = {
    id: artworkId,
    title: "Chromatic Flow #42",
    imageUrl: "/chromatic-flow.png",
    createdAt: "April 2023",
    edition: "1 of 10",
    medium: "Digital Art, Giclée print on archival paper",
    dimensions: "24 × 36 inches",
  }

  const { pendingVisits, upcomingDrops, activeVisit, hasActivity, handlePortalEvent, triggerVisit } = useArtworkPortal(
    artworkId,
    artistId,
    collectorId,
  )

  // Use our updated hook to fetch real Instagram data
  const { profile, posts, stories, isConnected, loading } = useArtistInstagram(artistId)

  // Show hint about interaction after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowingHint(true)

      // Hide hint after 5 seconds
      const hideTimer = setTimeout(() => {
        setShowingHint(false)
      }, 5000)

      return () => clearTimeout(hideTimer)
    }, 10000)

    return () => clearTimeout(timer)
  }, [])

  // Handle showing a visit dialog
  const handleShowVisit = (visit: any) => {
    setVisitToShow(visit)
    setShowVisitDialog(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <h1 className="text-2xl font-medium mb-6">Certificate of Authenticity</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="artwork">Artwork</TabsTrigger>
                  <TabsTrigger value="instagram" className="flex items-center gap-1">
                    <Instagram size={14} />
                    <span>Instagram</span>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="artwork" className="pt-4">
                  {/* The artwork as a portal */}
                  <div className="rounded-lg overflow-hidden mb-4 relative">
                    <ArtworkPortal
                      artistId={artistId}
                      artworkId={artworkId}
                      collectorId={collectorId}
                      artworkImageUrl={artwork.imageUrl}
                      artworkTitle={artwork.title}
                      artistName={artist.name}
                      artistImageUrl={artist.profileImageUrl}
                      onPortalEvent={handlePortalEvent}
                    />

                    {/* Interaction hint */}
                    <AnimatePresence>
                      {showingHint && (
                        <motion.div
                          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-sm rounded-full px-3 py-1.5"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                        >
                          Try interacting with your artwork...
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Badge for pending visits */}
                    <AnimatePresence>
                      {pendingVisits.length > 0 && (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="absolute top-3 right-3 bg-indigo-500 text-white rounded-full px-2 py-1 flex items-center text-xs shadow-md cursor-pointer"
                          onClick={() => handleShowVisit(pendingVisits[0])}
                        >
                          <MessageCircle className="w-3.5 h-3.5 mr-1" />
                          <span>{pendingVisits.length} new from artist</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </TabsContent>
                <TabsContent value="instagram" className="pt-4">
                  {loading ? (
                    <div className="flex items-center justify-center p-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                    </div>
                  ) : isConnected && profile && posts && posts.length > 0 ? (
                    <InstagramFeed
                      artistName={artist.name}
                      username={profile.username || "streetcollector_"}
                      posts={posts}
                      profileUrl={`https://instagram.com/${profile.username || "streetcollector_"}`}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <Instagram size={32} className="text-gray-400 mb-2" />
                      <p className="text-gray-500">Instagram feed not available</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Upcoming drops panel */}
              {upcomingDrops.length > 0 && (
                <div className="mt-4">
                  <ExclusiveDrops upcomingDrops={upcomingDrops} />
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-medium">{artwork.title}</h2>
              <p className="text-gray-600 mb-6">By {artist.name}</p>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Edition</h3>
                  <p>{artwork.edition}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created</h3>
                  <p>{artwork.createdAt}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Medium</h3>
                  <p>{artwork.medium}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Dimensions</h3>
                  <p>{artwork.dimensions}</p>
                </div>

                {/* Portal concept explainer */}
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">About Your Artist Connection</h3>
                  <p className="text-sm text-gray-600">
                    This artwork is more than just a static piece - it's a living connection to the artist. Like a
                    magical portrait, the artist may occasionally visit, leave messages, or share exclusive content
                    through your artwork.
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Keep an eye on your piece, as it might reveal special moments and insights that are meant just for
                    you as the collector.
                  </p>
                </div>

                {/* Instagram connection */}
                {isConnected && profile && (
                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1">
                      <Instagram size={14} className="text-pink-500" />
                      <span>Instagram Connection</span>
                    </h3>
                    <p className="text-sm text-gray-600">
                      Follow {artist.name} on Instagram to see their latest street art discoveries, festival coverage,
                      and urban art insights.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        <Image
                          src={profile.profile_picture_url || "/placeholder.svg"}
                          alt={artist.name}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium">@{profile.username || "streetcollector_"}</div>
                        <div className="text-xs text-gray-500">
                          {profile.followers_count?.toLocaleString() || "8.7K"} followers
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="ml-auto" onClick={() => setActiveTab("instagram")}>
                        View Feed
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Artist Visit Dialog */}
      <Dialog open={showVisitDialog} onOpenChange={setShowVisitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Message from {artist.name}</DialogTitle>
            <DialogDescription>The artist has left a message through your artwork</DialogDescription>
          </DialogHeader>

          <div className="flex items-start gap-4 my-4">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
              <Image
                src={artist.profileImageUrl || "/placeholder.svg"}
                alt={artist.name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>

            <div
              className={cn(
                "bg-gray-50 p-4 rounded-lg relative",
                "after:absolute after:top-4 after:-left-2 after:w-2 after:h-2 after:rotate-45 after:bg-gray-50",
              )}
            >
              <p className="text-gray-800">
                {visitToShow?.content ||
                  "I wanted to connect with you about this piece. The colors were inspired by a sunset I witnessed last summer..."}
              </p>
              <p className="text-right text-sm text-gray-500 mt-2">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowVisitDialog(false)}>
              Close
            </Button>
            <Button>Respond</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
