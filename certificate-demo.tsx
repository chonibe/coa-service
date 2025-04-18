"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useCollectorCircle } from "@/hooks/use-collector-circle"
import { CollectorCircleEntry } from "@/components/collector-circle-entry"
import { CollectorSocialSignals } from "@/components/collector-social-signals"
import { ConnectionOpportunities } from "@/components/connection-opportunities"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Users, FileText, Lightbulb } from "lucide-react"

export default function CertificateDemo() {
  const [showConnections, setShowConnections] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // In a real implementation, these would come from your auth and database
  const artistId = "artist123"
  const certificateId = "cert456"
  const collectorId = "collector789"
  const artworkTitle = "Chromatic Flow #42"

  const { collectorProfile, mutualConnections, interactions, opportunities, recommendedActions, loading, takeAction } =
    useCollectorCircle(artistId, collectorId)

  // Handle when an action is selected
  const handleActionSelected = async (action: string) => {
    await takeAction(action, "personal-touch")
    // In a real app, you might show a success message or update UI
  }

  // Show connections tab after image loads with a slight delay
  useEffect(() => {
    if (imageLoaded) {
      const timer = setTimeout(() => {
        setShowConnections(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [imageLoaded])

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Tabs defaultValue="certificate">
          <div className="bg-white rounded-lg shadow-sm mb-4">
            <TabsList className="p-2 gap-1 w-full">
              <TabsTrigger value="certificate" className="gap-1.5">
                <FileText className="w-4 h-4" />
                <span>Certificate</span>
              </TabsTrigger>
              <TabsTrigger value="collector" disabled={!showConnections} className="gap-1.5">
                <Users className="w-4 h-4" />
                <span>Collector Circle</span>
              </TabsTrigger>
              <TabsTrigger value="opportunities" disabled={!showConnections} className="gap-1.5">
                <Lightbulb className="w-4 h-4" />
                <span>Opportunities</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="certificate">
            <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
              <h1 className="text-2xl font-medium mb-6">Certificate of Authenticity</h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden relative group">
                    <Image
                      src="/chromatic-flow.png"
                      alt="Artwork"
                      width={500}
                      height={500}
                      className="w-full h-full object-cover transition-all duration-700 ease-in-out group-hover:scale-[1.03]"
                      onLoad={() => setImageLoaded(true)}
                    />

                    {/* Entry point to collector circle */}
                    {showConnections && (
                      <div className="absolute bottom-4 right-4 transition-opacity duration-300 group-hover:opacity-100 opacity-0">
                        <Button
                          onClick={() => document.querySelector('[data-value="collector"]')?.click()}
                          className="gap-2"
                        >
                          <Users className="w-4 h-4" />
                          <span>Collector Circle</span>
                        </Button>
                      </div>
                    )}
                  </div>
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

                    {/* Collector connection prompt */}
                    {showConnections && (
                      <div className="pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Collector Insight</h3>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Alex Mercer</span> has collected your work. Discover ways to
                          build a meaningful connection and enter their collector circle.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 gap-2"
                          onClick={() => document.querySelector('[data-value="collector"]')?.click()}
                        >
                          <Users className="w-4 h-4" />
                          <span>View Collector Profile</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="collector">
            {!loading && collectorProfile && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1">
                  <CollectorSocialSignals collectorId={collectorId} collectorProfile={collectorProfile} />
                </div>
                <div className="lg:col-span-2">
                  <CollectorCircleEntry
                    artistId={artistId}
                    collectorId={collectorId}
                    collectorProfile={collectorProfile}
                    onActionSelected={handleActionSelected}
                  />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="opportunities">
            {!loading && collectorProfile && (
              <ConnectionOpportunities
                artistId={artistId}
                collectorId={collectorId}
                opportunities={opportunities || []}
                mutualConnections={mutualConnections || []}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
