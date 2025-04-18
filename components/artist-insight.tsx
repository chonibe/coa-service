"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useArtistInsights } from "@/hooks/use-artist-insights"
import { cn } from "@/lib/utils"
import { connectionInsights } from "@/lib/connection-philosophy"
import Image from "next/image"

interface ArtistInsightProps {
  isOpen: boolean
  onClose: () => void
  artistId: string
  certificateId: string
  collectorId: string
}

export function ArtistInsight({ isOpen, onClose, artistId, certificateId, collectorId }: ArtistInsightProps) {
  const { insights, loading, markInsightAsViewed, submitResponse } = useArtistInsights(
    artistId,
    certificateId,
    collectorId,
  )
  const [activeInsightId, setActiveInsightId] = useState<string | null>(null)
  const [response, setResponse] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [activeTab, setActiveTab] = useState("insight")

  // Find the active insight
  const activeInsight = insights?.find((insight) => insight.id === activeInsightId) || null

  // Set the first unviewed insight as active, or the most recent one
  useEffect(() => {
    if (isOpen && insights && insights.length > 0) {
      const unviewedInsight = insights.find((insight) => !insight.viewedAt)
      const mostRecentInsight = [...insights].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0]

      setActiveInsightId(unviewedInsight?.id || mostRecentInsight.id)

      // Mark the insight as viewed
      if (unviewedInsight) {
        markInsightAsViewed(unviewedInsight.id)
      }
    }
  }, [isOpen, insights, markInsightAsViewed])

  // Reset response state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setResponse("")
      setSubmitted(false)
    }
  }, [isOpen])

  const handleSubmitResponse = async () => {
    if (!activeInsightId || !response.trim()) return

    setSubmitting(true)

    try {
      const success = await submitResponse(activeInsightId, response)
      if (success) {
        setSubmitted(true)
      }
    } catch (error) {
      console.error("Error submitting response:", error)
    } finally {
      setSubmitting(false)
    }
  }

  // Determine the connection stage based on insights
  const connectionStage =
    insights && insights.length > 0
      ? insights.filter((i) => i.hasCollectorResponse).length > 2
        ? "correspondent"
        : insights.length > 3
          ? "interpreter"
          : "observer"
      : "observer"

  const connectionInfo = connectionInsights[connectionStage]

  if (loading || !insights) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Artist's Insight</DialogTitle>
          <DialogDescription>Exclusive thoughts and process from the artist</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="insight" value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList>
            <TabsTrigger value="insight">Insight</TabsTrigger>
            <TabsTrigger value="territory">Territory</TabsTrigger>
            <TabsTrigger value="archive">Archive</TabsTrigger>
          </TabsList>

          <TabsContent value="insight" className="pt-4">
            {activeInsight ? (
              <div className="space-y-4">
                <div className="text-sm text-gray-500">
                  {new Date(activeInsight.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>

                <h3 className="text-xl font-medium">{activeInsight.title}</h3>

                {activeInsight.type === "image" && activeInsight.mediaUrl && (
                  <div className="my-4">
                    <Image
                      src={activeInsight.mediaUrl || "/placeholder.svg"}
                      alt={activeInsight.title}
                      width={600}
                      height={400}
                      className="rounded-md w-full object-cover max-h-[300px]"
                    />
                  </div>
                )}

                <div className="prose prose-gray max-w-none">
                  <p>{activeInsight.content}</p>
                </div>

                <div className={cn("pt-6 space-y-4", activeInsight.hasCollectorResponse && "opacity-50")}>
                  {submitted ? (
                    <div className="text-sm text-green-600">Your response has been shared with the artist.</div>
                  ) : (
                    <>
                      <h4 className="text-sm font-medium">Share your thoughts with the artist</h4>
                      <Textarea
                        placeholder="What does this insight make you think or feel? (Optional)"
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        disabled={activeInsight.hasCollectorResponse}
                        rows={4}
                      />
                      <div className="flex justify-end">
                        <Button
                          onClick={handleSubmitResponse}
                          disabled={!response.trim() || submitting || activeInsight.hasCollectorResponse}
                        >
                          {submitting ? "Sending..." : "Share with Artist"}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">No insights available yet.</div>
            )}
          </TabsContent>

          <TabsContent value="territory" className="pt-4">
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                <h3 className="text-amber-800 font-medium mb-2">Artwork Territory</h3>
                <p className="text-amber-700 text-sm">
                  Like street art that claims and transforms public space, this artwork has established a territory in
                  your environment.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-2">Artist's Territory</h4>
                  <p className="text-sm text-gray-600">
                    "I create work that extends beyond its physical boundaries, claiming space in the viewer's
                    environment and consciousness. The piece continues to speak and evolve in your space, creating a
                    dialogue that changes with light, perspective, and time."
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-2">Your Environment</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Placement</span>
                      <span>Living room, north wall</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Lighting</span>
                      <span>Natural light, morning</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Surroundings</span>
                      <span>Urban view, plants nearby</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Viewing Frequency</span>
                      <span>Daily</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Reported Mood</span>
                      <span>Contemplative, energizing</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="text-sm font-medium mb-2">Record Your Observation</h4>
                <p className="text-sm text-gray-600 mb-3">
                  How does this artwork interact with and transform your space? Share your observations with the artist.
                </p>
                <Textarea placeholder="The colors seem to shift with the morning light..." rows={3} className="mb-3" />
                <div className="flex justify-end">
                  <Button>Share Observation</Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="archive" className="pt-4">
            <div className="space-y-4">
              {insights.length > 0 ? (
                insights
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((insight) => (
                    <div
                      key={insight.id}
                      className={cn(
                        "border rounded-lg p-4 cursor-pointer hover:border-gray-300 transition-colors",
                        activeInsightId === insight.id && "border-gray-400 bg-gray-50",
                      )}
                      onClick={() => {
                        setActiveInsightId(insight.id)
                        setActiveTab("insight")
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{insight.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(insight.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {!insight.viewedAt && <div className="w-2 h-2 bg-amber-500 rounded-full" />}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="py-8 text-center text-gray-500">No insights available yet.</div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
