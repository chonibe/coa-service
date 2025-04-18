"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { portalStates, portalEvents, type PortalState, type PortalEvent } from "@/lib/artwork-portal"
import { MessageCircle, ImageIcon, Calendar, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { InstagramStoriesPreview } from "./instagram-stories-preview"
import { useArtistInstagram } from "@/hooks/use-artist-instagram"

interface ArtworkPortalProps {
  artistId: string
  artworkId: string
  collectorId: string
  artworkImageUrl: string
  artworkTitle: string
  artistName: string
  artistImageUrl: string
  onPortalEvent?: (event: PortalEvent) => void
}

export function ArtworkPortal({
  artistId,
  artworkId,
  collectorId,
  artworkImageUrl,
  artworkTitle,
  artistName,
  artistImageUrl,
  onPortalEvent,
}: ArtworkPortalProps) {
  const [portalState, setPortalState] = useState<PortalState>("dormant")
  const [activeEvent, setActiveEvent] = useState<PortalEvent | null>(null)
  const [eventHistory, setEventHistory] = useState<string[]>([])
  const [interactionCount, setInteractionCount] = useState(0)
  const [hasVisited, setHasVisited] = useState(false)
  const [shimmering, setShimmering] = useState(false)
  const [showInstagramIndicator, setShowInstagramIndicator] = useState(false)

  // Get Instagram data
  const { stories, profile, isConnected, viewStory } = useArtistInstagram(artistId)

  // References for animation timing
  const shimmerTimerRef = useRef<NodeJS.Timeout | null>(null)
  const eventTimerRef = useRef<NodeJS.Timeout | null>(null)
  const portalTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Collection age - in real app would be fetched from DB
  const collectionAge = 14 // days

  // Show Instagram indicator if connected and has stories
  useEffect(() => {
    if (isConnected && stories && stories.length > 0) {
      setShowInstagramIndicator(true)
    }
  }, [isConnected, stories])

  // For demo purposes, we'll randomly trigger events
  useEffect(() => {
    // Set up occasional shimmering
    const shimmerInterval = setInterval(() => {
      if (Math.random() < 0.3 && portalState === "dormant") {
        setShimmering(true)
        shimmerTimerRef.current = setTimeout(
          () => {
            setShimmering(false)

            // Small chance of transitioning to resonating after shimmer
            if (Math.random() < 0.2) {
              setPortalState("resonating")

              // Set up potential portal activation
              portalTimerRef.current = setTimeout(
                () => {
                  if (Math.random() < 0.7) {
                    // Portal activates
                    activatePortal()
                  } else {
                    // Portal returns to dormant
                    setPortalState("dormant")
                  }
                },
                5000 + Math.random() * 5000,
              )
            }
          },
          2000 + Math.random() * 3000,
        )
      }
    }, 10000)

    return () => {
      clearInterval(shimmerInterval)
      if (shimmerTimerRef.current) clearTimeout(shimmerTimerRef.current)
      if (eventTimerRef.current) clearTimeout(eventTimerRef.current)
      if (portalTimerRef.current) clearTimeout(portalTimerRef.current)
    }
  }, [portalState])

  // Simulated artist-initiated visit for demo purposes
  useEffect(() => {
    // Simulate an artist visit after 15 seconds for demo
    const artistVisitTimer = setTimeout(() => {
      if (!hasVisited) {
        setHasVisited(true)
        setShimmering(true)

        setTimeout(() => {
          setShimmering(false)
          setPortalState("resonating")

          setTimeout(() => {
            setPortalState("awakened")
            const visitEvent = portalEvents.find((e) => e.type === "visit")!
            setActiveEvent(visitEvent)

            if (onPortalEvent) {
              onPortalEvent(visitEvent)
            }

            // End the event after its duration
            eventTimerRef.current = setTimeout(
              () => {
                setActiveEvent(null)
                setPortalState("lingering")

                // Return to dormant after lingering
                portalTimerRef.current = setTimeout(() => {
                  setPortalState("dormant")
                }, 10000)
              },
              visitEvent.duration ? visitEvent.duration * 1000 : 5000,
            )
          }, 3000)
        }, 2000)
      }
    }, 15000)

    return () => clearTimeout(artistVisitTimer)
  }, [hasVisited, onPortalEvent])

  // Function to activate the portal and trigger an event
  const activatePortal = () => {
    setPortalState("awakened")

    // Select a random event
    const event = portalEvents[Math.floor(Math.random() * portalEvents.length)]
    setActiveEvent(event)
    setEventHistory([...eventHistory, event.type])

    if (onPortalEvent) {
      onPortalEvent(event)
    }

    // End the event after its duration
    eventTimerRef.current = setTimeout(
      () => {
        setActiveEvent(null)
        setPortalState("lingering")

        // Return to dormant after lingering
        portalTimerRef.current = setTimeout(() => {
          setPortalState("dormant")
        }, 10000)
      },
      event.duration ? event.duration * 1000 : 5000,
    )
  }

  // Handle interaction with the artwork
  const handleInteraction = () => {
    setInteractionCount((prev) => prev + 1)

    if (portalState === "dormant") {
      // Small chance of awakening on interaction
      if (Math.random() < 0.2) {
        setPortalState("responsive")

        setTimeout(() => {
          setPortalState("dormant")
        }, 3000)
      }
    }
  }

  // Handle story view
  const handleStoryView = (storyId: string) => {
    viewStory(storyId, collectorId)
  }

  // Render the portal event content
  const renderEventContent = () => {
    if (!activeEvent) return null

    switch (activeEvent.type) {
      case "visit":
        return (
          <div className="text-center p-4">
            <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 border-2 border-white shadow-glow">
              <Image
                src={artistImageUrl || "/placeholder.svg"}
                alt={artistName}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">{artistName} is visiting</h3>
            <p className="text-white/80 text-sm">
              "I'm working on a new series that was inspired by this piece. I wanted to share a glimpse with you
              first..."
            </p>
          </div>
        )

      case "message":
        return (
          <div className="text-center p-4">
            <div className="bg-white/20 backdrop-blur-md rounded-lg p-4 mb-3">
              <MessageCircle className="w-6 h-6 text-white mx-auto mb-2" />
              <p className="text-white italic">
                "Thank you for living with this piece. I was thinking of you and wanted to share that this work has a
                hidden element - try viewing it at sunset..."
              </p>
              <div className="text-white/60 text-sm mt-2">- {artistName}</div>
            </div>
          </div>
        )

      case "revelation":
        return (
          <div className="text-center p-4">
            <div className="bg-white/20 backdrop-blur-md rounded-lg p-4 mb-3">
              <ImageIcon className="w-6 h-6 text-white mx-auto mb-2" />
              <h3 className="text-white font-medium mb-1">Hidden Detail Revealed</h3>
              <p className="text-white/80 text-sm">
                A new detail in the artwork has become visible, revealing deeper meaning...
              </p>
            </div>
          </div>
        )

      case "invitation":
        return (
          <div className="text-center p-4">
            <div className="bg-white/20 backdrop-blur-md rounded-lg p-4 mb-3">
              <Calendar className="w-6 h-6 text-white mx-auto mb-2" />
              <h3 className="text-white font-medium mb-1">Exclusive Invitation</h3>
              <p className="text-white/80 text-sm mb-3">You're invited to a private studio visit next week.</p>
              <Button size="sm" variant="secondary">
                Accept Invitation
              </Button>
            </div>
          </div>
        )

      case "transformation":
        return (
          <div className="text-center p-4">
            <div className="bg-white/20 backdrop-blur-md rounded-lg p-4 mb-3">
              <Sparkles className="w-6 h-6 text-white mx-auto mb-2" />
              <h3 className="text-white font-medium mb-1">The Artwork Is Changing</h3>
              <p className="text-white/80 text-sm">
                The piece is revealing a new dimension, evolving before your eyes...
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="relative w-full aspect-square" onClick={handleInteraction}>
      {/* Artwork - the portal */}
      <div
        className={cn(
          "w-full h-full rounded-lg overflow-hidden relative",
          (portalState !== "dormant" || shimmering) && "shadow-glow animate-glow",
        )}
        style={
          portalState !== "dormant" || shimmering
            ? {
                boxShadow: "0 0 15px rgba(99, 102, 241, 0.4), 0 0 30px rgba(99, 102, 241, 0.2)",
              }
            : undefined
        }
      >
        <Image
          src={artworkImageUrl || "/placeholder.svg"}
          alt={artworkTitle}
          width={800}
          height={800}
          className={cn(
            "w-full h-full object-cover transition-all duration-700",
            portalState === "awakened" && "scale-[1.02] brightness-110",
            portalState === "resonating" && "scale-[1.01] brightness-105",
            portalState === "responsive" && "scale-[1.005] brightness-102",
          )}
        />

        {/* Shimmer overlay */}
        <AnimatePresence>
          {shimmering && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent"
              initial={{ opacity: 0, left: "-100%" }}
              animate={{ opacity: 0.3, left: "100%" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          )}
        </AnimatePresence>

        {/* Portal state visual effects */}
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-1000",
            portalState === "resonating" && "bg-gradient-to-t from-indigo-500/20 to-transparent opacity-70",
            portalState === "awakened" && "bg-gradient-to-t from-indigo-600/30 to-indigo-300/20 opacity-80",
            portalState === "lingering" && "bg-gradient-to-t from-indigo-400/10 to-transparent opacity-50",
            portalState === "responsive" && "bg-gradient-to-t from-amber-500/10 to-transparent opacity-40",
            portalState === "dormant" && !shimmering && "opacity-0",
          )}
        />

        {/* Portal event overlay */}
        <AnimatePresence>
          {activeEvent && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 via-indigo-900/40 to-indigo-900/20 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {renderEventContent()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Instagram Stories Indicator */}
      {showInstagramIndicator && profile && stories && stories.length > 0 && (
        <div className="absolute top-3 right-3">
          <InstagramStoriesPreview
            artistName={artistName}
            username={profile.username || "streetcollector_"}
            profilePicture={profile.profile_picture_url || "/creative-portrait.png"}
            stories={stories}
            onStoryView={handleStoryView}
          />
        </div>
      )}

      {/* Status indicator (subtle) */}
      <div
        className={cn(
          "absolute bottom-3 left-3 p-1.5 rounded-full transition-all duration-500",
          portalState === "dormant" && "opacity-0",
          portalState === "resonating" && "bg-indigo-400/30 opacity-70",
          portalState === "awakened" && "bg-indigo-500/40 opacity-90",
          portalState === "lingering" && "bg-indigo-300/30 opacity-60",
          portalState === "responsive" && "bg-amber-400/30 opacity-70",
        )}
      >
        <div
          className={cn(
            "w-2 h-2 rounded-full",
            portalState === "resonating" && "bg-indigo-400 animate-pulse",
            portalState === "awakened" && "bg-indigo-500",
            portalState === "lingering" && "bg-indigo-300",
            portalState === "responsive" && "bg-amber-400",
          )}
        />
      </div>

      {/* Portal tooltip - only shown in certain states */}
      <AnimatePresence>
        {portalState !== "dormant" && !activeEvent && (
          <motion.div
            className="absolute bottom-3 right-3 bg-black/60 text-white text-xs rounded-full px-2 py-1 max-w-[200px]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
          >
            {portalStates[portalState]}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
