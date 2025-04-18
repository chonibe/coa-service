"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ArtistVisitation } from "./artist-visitation"
import { cn } from "@/lib/utils"
import type { PresenceType } from "@/lib/artist-presence"

interface ArtworkFrameProps {
  artwork: {
    id: string
    title: string
    imageUrl: string
    artist: {
      id: string
      name: string
      profileImageUrl: string
    }
  }
  presenceType?: PresenceType
  hasVisitation?: boolean
  className?: string
}

export function ArtworkFrame({
  artwork,
  presenceType = "whisper",
  hasVisitation = false,
  className,
}: ArtworkFrameProps) {
  const [isVisitationOpen, setIsVisitationOpen] = useState(false)
  const [showIndicator, setShowIndicator] = useState(false)
  const [visitationContent, setVisitationContent] = useState<any>(null)
  const frameRef = useRef<HTMLDivElement>(null)

  // Simulate the artist "visiting" their artwork
  useEffect(() => {
    if (hasVisitation) {
      // Delay the appearance of the indicator to make it feel magical
      const timer = setTimeout(() => {
        setShowIndicator(true)
      }, 2000)

      return () => clearTimeout(timer)
    } else {
      setShowIndicator(false)
    }
  }, [hasVisitation])

  // Generate mock content based on presence type
  useEffect(() => {
    // This would come from your API in a real implementation
    const mockContent = {
      whisper: {
        type: "text",
        text: "I created this piece during a particularly stormy week in my studio. The way the light filtered through the rain-streaked windows inspired these particular blue tones. There's something about the quality of light during a storm that I've always found captivating - it has a weight to it that clear daylight lacks.",
      },
      glimpse: {
        type: "image",
        imageUrl: "/cluttered-creative-space.png",
        caption: "A glimpse of my studio while working on this piece last month",
      },
      artifact: {
        type: "image",
        imageUrl: "/chromatic-flow.png",
        caption: "An early study for this work, showing the initial color relationships",
      },
      dialogue: {
        type: "message",
        message:
          "I noticed you collected this piece - it's one of my favorites from this series. The central motif actually came to me in a dream. I'd love to hear what drew you to this particular work?",
      },
      revelation: {
        type: "insight",
        title: "Hidden Symbolism",
        text: "The recurring spiral pattern in this piece represents the golden ratio, which appears throughout nature. I've been exploring mathematical patterns in my recent work as a way to connect abstract art to the underlying structures of our world.\n\nIf you look closely at the top right quadrant, you'll notice a subtle reference to Hokusai's 'Great Wave' - an homage to an artist who has deeply influenced my approach to movement in static images.",
        imageUrl: "/chromatic-flow.png",
      },
    }

    setVisitationContent(mockContent[presenceType])
  }, [presenceType])

  // Different indicator styles based on presence type
  const indicatorStyles: Record<PresenceType, string> = {
    whisper: "bg-purple-500/20 border-purple-500/40",
    glimpse: "bg-blue-500/20 border-blue-500/40",
    artifact: "bg-amber-500/20 border-amber-500/40",
    dialogue: "bg-green-500/20 border-green-500/40",
    revelation: "bg-rose-500/20 border-rose-500/40",
  }

  // Different animations based on presence type
  const indicatorAnimations: Record<PresenceType, string> = {
    whisper: "animate-pulse-slow",
    glimpse: "animate-flicker",
    artifact: "animate-float",
    dialogue: "animate-bounce-gentle",
    revelation: "animate-glow",
  }

  return (
    <div
      ref={frameRef}
      className={cn("relative overflow-hidden rounded-lg border-2 border-gray-200 bg-white", className)}
    >
      {/* The artwork itself */}
      <div className="relative aspect-square">
        <Image src={artwork.imageUrl || "/placeholder.svg"} alt={artwork.title} fill className="object-cover" />
      </div>

      {/* Artist presence indicator */}
      <AnimatePresence>
        {showIndicator && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
            className={cn(
              "absolute bottom-3 right-3 w-10 h-10 rounded-full border-2 flex items-center justify-center",
              "cursor-pointer shadow-md backdrop-blur-sm",
              indicatorStyles[presenceType],
              indicatorAnimations[presenceType],
            )}
            onClick={() => setIsVisitationOpen(true)}
            aria-label="View artist presence"
          >
            <div className="relative w-6 h-6 rounded-full overflow-hidden">
              <Image
                src={artwork.artist.profileImageUrl || "/placeholder.svg"}
                alt={artwork.artist.name}
                fill
                className="object-cover"
              />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Artist visitation modal */}
      <ArtistVisitation
        artist={artwork.artist}
        artwork={artwork}
        presenceType={presenceType}
        content={visitationContent}
        isOpen={isVisitationOpen}
        onClose={() => setIsVisitationOpen(false)}
      />
    </div>
  )
}
