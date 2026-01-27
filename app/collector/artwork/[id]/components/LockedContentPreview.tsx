"use client"

import React from "react"
import { Lock, Music, Mic, Camera, Lightbulb, FileText, Image as ImageIcon, Video, Headphones } from "lucide-react"

interface ContentPreview {
  type: string
  label: string
}

interface LockedContentPreviewProps {
  contentBlocks: ContentPreview[]
}

/**
 * LockedContentPreview - Teaser design showing what's locked
 * 
 * Features:
 * - Blurred content thumbnails (teaser, not paywall)
 * - Count of exclusive pieces
 * - Icons representing content types
 * - Less aggressive "paywall" feel
 */
const LockedContentPreview: React.FC<LockedContentPreviewProps> = ({ contentBlocks }) => {
  const getIconForType = (type: string) => {
    const iconClass = "h-6 w-6"
    
    switch (type.toLowerCase()) {
      case "artwork soundtrack block":
      case "soundtrack":
        return <Music className={iconClass} />
      case "artwork voice note block":
      case "voice note":
        return <Mic className={iconClass} />
      case "artwork process gallery block":
      case "process gallery":
        return <Camera className={iconClass} />
      case "artwork inspiration block":
      case "inspiration":
        return <Lightbulb className={iconClass} />
      case "artwork artist note block":
      case "artist note":
        return <FileText className={iconClass} />
      case "artwork image block":
      case "image":
        return <ImageIcon className={iconClass} />
      case "artwork video block":
      case "video":
        return <Video className={iconClass} />
      case "artwork audio block":
      case "audio":
        return <Headphones className={iconClass} />
      default:
        return <FileText className={iconClass} />
    }
  }

  const uniqueTypes = Array.from(
    new Set(contentBlocks.map((block) => block.type))
  )

  return (
    <div className="py-12 px-6 md:px-8">
      {/* Lock Icon */}
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center border-2 border-gray-700 shadow-xl">
        <Lock className="h-10 w-10 text-gray-400" />
      </div>

      {/* Heading */}
      <h3 className="text-2xl md:text-3xl font-bold text-white text-center mb-4">
        Exclusive Content Awaits
      </h3>

      {/* Count */}
      <p className="text-gray-400 text-center mb-8">
        <span className="text-green-400 font-bold text-xl">
          {contentBlocks.length}
        </span>{" "}
        {contentBlocks.length === 1 ? "piece" : "pieces"} of exclusive content unlocked when you authenticate this artwork
      </p>

      {/* Content Type Icons */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
        {uniqueTypes.slice(0, 6).map((type, index) => (
          <div
            key={index}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-800/50 border border-gray-700 backdrop-blur-sm min-w-[80px]"
          >
            <div className="text-green-400">
              {getIconForType(type)}
            </div>
            <span className="text-xs text-gray-400 text-center line-clamp-2">
              {type.replace(/^Artwork\s+/i, "").replace(/\s+Block$/i, "")}
            </span>
          </div>
        ))}
      </div>

      {/* Blurred Preview Hint */}
      <div className="relative max-w-md mx-auto">
        <div className="grid grid-cols-3 gap-3 blur-sm opacity-40">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-gradient-to-br from-gray-700 to-gray-800"
            />
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-gray-900/90 backdrop-blur-sm px-6 py-3 rounded-full border border-gray-700 shadow-xl">
            <p className="text-white font-semibold text-sm">
              Authenticate to unlock
            </p>
          </div>
        </div>
      </div>

      {/* CTA Hint */}
      <p className="text-center text-gray-500 text-sm mt-8">
        Use the button below to authenticate your artwork
      </p>
    </div>
  )
}

export default LockedContentPreview
