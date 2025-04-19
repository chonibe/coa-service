"use client"

import { Button } from "@/components/ui/button"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Instagram } from "lucide-react"
import { InstagramStories } from "./instagram-stories"
import { InstagramViewButton } from "./instagram-view-button"
import { cn } from "@/lib/utils"

interface InstagramStoriesPreviewProps {
  artistName: string
  username: string
  profilePicture: string
  stories: any[]
  onStoryView?: (storyId: string) => void
  permissionError?: boolean
}

export function InstagramStoriesPreview({
  artistName,
  username,
  profilePicture,
  stories,
  onStoryView,
  permissionError = false,
}: InstagramStoriesPreviewProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showFallbackDialog, setShowFallbackDialog] = useState(false)

  const hasStories = stories && stories.length > 0

  const handleStoryView = (storyId: string) => {
    if (onStoryView) {
      onStoryView(storyId)
    }
  }

  const handleClick = () => {
    if (hasStories) {
      setIsOpen(true)
    } else if (permissionError) {
      // Show a dialog with the Instagram button
      setShowFallbackDialog(true)
    } else {
      // No stories available
      setIsOpen(true) // Still open our viewer to show the "no stories" message
    }
  }

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex flex-col items-center cursor-pointer"
        onClick={handleClick}
      >
        <div
          className={cn(
            "w-16 h-16 rounded-full p-[2px]",
            hasStories ? "bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600" : "bg-gray-200",
          )}
        >
          <div className="w-full h-full rounded-full border-2 border-white overflow-hidden">
            <Image
              src={profilePicture || "/placeholder.svg"}
              alt={artistName}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="mt-1 text-xs text-center flex items-center gap-1">
          <Instagram size={10} />
          <span>{hasStories ? "Stories" : "Profile"}</span>
        </div>
      </motion.div>

      {/* Our custom stories viewer */}
      <InstagramStories
        artistName={artistName}
        artistUsername={username}
        artistProfilePicture={profilePicture}
        stories={stories}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onStoryView={handleStoryView}
        permissionError={permissionError}
      />

      {/* Fallback dialog when we have permission errors */}
      {showFallbackDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium mb-2">View Instagram Stories</h3>
            <p className="text-gray-600 mb-4">
              To view {artistName}'s Instagram stories, you'll need to open them directly on Instagram.
            </p>
            <div className="flex flex-col gap-3">
              <InstagramViewButton username={username} type="stories" />
              <Button variant="outline" onClick={() => setShowFallbackDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
