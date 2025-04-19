"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Instagram } from "lucide-react"
import { InstagramStories } from "./instagram-stories"
import { cn } from "@/lib/utils"

interface InstagramStoriesPreviewProps {
  artistName: string
  username: string
  profilePicture: string
  stories: any[]
  onStoryView?: (storyId: string) => void
}

export function InstagramStoriesPreview({
  artistName,
  username,
  profilePicture,
  stories,
  onStoryView,
}: InstagramStoriesPreviewProps) {
  const [isOpen, setIsOpen] = useState(false)

  const hasStories = stories && stories.length > 0

  const handleStoryView = (storyId: string) => {
    if (onStoryView) {
      onStoryView(storyId)
    }
  }

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex flex-col items-center cursor-pointer"
        onClick={() => {
          if (hasStories) {
            setIsOpen(true)
          } else {
            // Open Instagram stories in a new tab
            window.open(`https://www.instagram.com/stories/${username}/`, "_blank")
          }
        }}
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

      <InstagramStories
        artistName={artistName}
        artistUsername={username}
        artistProfilePicture={profilePicture}
        stories={stories}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onStoryView={handleStoryView}
      />
    </>
  )
}
