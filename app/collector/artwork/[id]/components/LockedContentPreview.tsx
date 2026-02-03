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
    <div className="py-8 px-5">
      {/* Lock Icon */}
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200 shadow-sm">
        <Lock className="h-8 w-8 text-gray-400" />
      </div>

      {/* Heading */}
      <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
        Exclusive Content Awaits
      </h3>

      {/* Count */}
      <p className="text-gray-500 text-center mb-6 text-sm">
        <span className="text-indigo-600 font-bold text-lg">
          {contentBlocks.length}
        </span>{" "}
        {contentBlocks.length === 1 ? "piece" : "pieces"} of exclusive content
      </p>

      {/* Content Type Icons */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        {uniqueTypes.slice(0, 6).map((type, index) => (
          <div
            key={index}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 border border-gray-200 min-w-[70px]"
          >
            <div className="text-indigo-500">
              {getIconForType(type)}
            </div>
            <span className="text-xs text-gray-600 text-center line-clamp-2 font-medium">
              {type.replace(/^Artwork\s+/i, "").replace(/\s+Block$/i, "")}
            </span>
          </div>
        ))}
      </div>

      {/* Blurred Preview Hint */}
      <div className="relative max-w-sm mx-auto">
        <div className="grid grid-cols-3 gap-2 blur-sm opacity-30">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-gray-200"
            />
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-sm px-5 py-2.5 rounded-full border border-gray-200 shadow-md">
            <p className="text-gray-700 font-medium text-sm">
              Authenticate to unlock
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LockedContentPreview
