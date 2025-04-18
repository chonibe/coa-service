"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, ImageIcon, FileText, Sparkles, Music } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PresenceType } from "@/lib/artist-presence"

interface ArtistVisitationProps {
  artist: {
    id: string
    name: string
    profileImageUrl: string
  }
  artwork: {
    id: string
    title: string
    imageUrl: string
  }
  presenceType: PresenceType
  content: any
  isOpen: boolean
  onClose: () => void
}

export function ArtistVisitation({ artist, artwork, presenceType, content, isOpen, onClose }: ArtistVisitationProps) {
  const [animationComplete, setAnimationComplete] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Reset animation state when opening
      setAnimationComplete(false)
    }
  }, [isOpen])

  // Different animations based on presence type
  const animations = {
    whisper: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
      transition: { duration: 0.5 },
    },
    glimpse: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.9 },
      transition: { type: "spring", stiffness: 300, damping: 25 },
    },
    artifact: {
      initial: { opacity: 0, rotate: -5, y: 20 },
      animate: { opacity: 1, rotate: 0, y: 0 },
      exit: { opacity: 0, rotate: 5, y: -20 },
      transition: { type: "spring", stiffness: 200, damping: 20 },
    },
    dialogue: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 },
      transition: { type: "spring", stiffness: 300, damping: 25 },
    },
    revelation: {
      initial: { opacity: 0, scale: 1.1 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 1.1 },
      transition: { duration: 0.6 },
    },
  }

  // Icons for different content types
  const contentTypeIcons: Record<string, React.ReactNode> = {
    text: <FileText className="w-4 h-4" />,
    image: <ImageIcon className="w-4 h-4" />,
    audio: <Music className="w-4 h-4" />,
    message: <MessageSquare className="w-4 h-4" />,
    insight: <Sparkles className="w-4 h-4" />,
  }

  // Presence type colors
  const presenceColors: Record<PresenceType, string> = {
    whisper: "bg-purple-100 text-purple-800 border-purple-200",
    glimpse: "bg-blue-100 text-blue-800 border-blue-200",
    artifact: "bg-amber-100 text-amber-800 border-amber-200",
    dialogue: "bg-green-100 text-green-800 border-green-200",
    revelation: "bg-rose-100 text-rose-800 border-rose-200",
  }

  // Render different content based on type
  const renderContent = () => {
    if (!content) return null

    switch (content.type) {
      case "text":
        return (
          <div className="p-4 text-gray-800">
            <p className="whitespace-pre-line">{content.text}</p>
          </div>
        )
      case "image":
        return (
          <div className="relative aspect-video w-full overflow-hidden rounded-md">
            <Image
              src={content.imageUrl || "/placeholder.svg"}
              alt={content.caption || "Artist shared image"}
              fill
              className="object-cover"
            />
            {content.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 text-white text-sm">
                {content.caption}
              </div>
            )}
          </div>
        )
      case "audio":
        return (
          <div className="p-4">
            <div className="mb-2 text-sm text-gray-500">{content.title}</div>
            <audio src={content.audioUrl} controls className="w-full" />
            {content.transcript && (
              <details className="mt-2">
                <summary className="text-sm text-gray-500 cursor-pointer">View transcript</summary>
                <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">{content.transcript}</p>
              </details>
            )}
          </div>
        )
      case "message":
        return (
          <div className="p-4">
            <div className="flex items-start gap-3">
              <Avatar className="w-8 h-8 border">
                <AvatarImage src={artist.profileImageUrl || "/placeholder.svg"} alt={artist.name} />
                <AvatarFallback>{artist.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="bg-gray-100 rounded-lg p-3 relative">
                <div className="absolute w-2 h-2 bg-gray-100 transform rotate-45 left-[-4px] top-3"></div>
                <p className="text-gray-800">{content.message}</p>
              </div>
            </div>
          </div>
        )
      case "insight":
        return (
          <div className="p-4">
            <h3 className="font-medium text-lg mb-2">{content.title}</h3>
            <p className="text-gray-700 whitespace-pre-line">{content.text}</p>
            {content.imageUrl && (
              <div className="mt-3 relative aspect-video w-full overflow-hidden rounded-md">
                <Image src={content.imageUrl || "/placeholder.svg"} alt={content.title} fill className="object-cover" />
              </div>
            )}
          </div>
        )
      default:
        return <div className="p-4 text-gray-500">Content unavailable</div>
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative max-w-md w-full"
            {...animations[presenceType]}
            onAnimationComplete={() => setAnimationComplete(true)}
          >
            <Card className="overflow-hidden shadow-xl">
              <div className="relative">
                {/* Header with artist info */}
                <div className="flex items-center gap-3 p-4 border-b">
                  <Avatar className="w-10 h-10 border">
                    <AvatarImage src={artist.profileImageUrl || "/placeholder.svg"} alt={artist.name} />
                    <AvatarFallback>{artist.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{artist.name}</div>
                    <div className="text-sm text-gray-500">
                      {new Date().toLocaleDateString(undefined, { month: "long", day: "numeric" })}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("ml-auto flex items-center gap-1.5", presenceColors[presenceType])}
                  >
                    {contentTypeIcons[content?.type || "text"]}
                    <span className="capitalize">{presenceType}</span>
                  </Badge>
                </div>

                {/* Content area */}
                <CardContent className="p-0">{renderContent()}</CardContent>

                {/* Footer */}
                <div className="p-3 border-t flex justify-end">
                  <Button onClick={onClose}>Close</Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
