"use client"

import React from "react"
import { FileText, Image, Video, Music, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

interface ContentBlock {
  type: string
  label: string
}

interface LockedContentPreviewProps {
  contentBlocks: ContentBlock[]
  className?: string
}

const getIconForType = (type: string) => {
  switch (type) {
    case "text":
    case "Artwork Text Block":
      return FileText
    case "image":
    case "Artwork Image Block":
      return Image
    case "video":
    case "Artwork Video Block":
      return Video
    case "audio":
    case "Artwork Audio Block":
      return Music
    default:
      return FileText
  }
}

const getLabelForType = (type: string) => {
  switch (type) {
    case "text":
    case "Artwork Text Block":
      return "Text"
    case "image":
    case "Artwork Image Block":
      return "Photo"
    case "video":
    case "Artwork Video Block":
      return "Video"
    case "audio":
    case "Artwork Audio Block":
      return "Audio"
    default:
      return "Content"
  }
}

export function LockedContentPreview({
  contentBlocks,
  className,
}: LockedContentPreviewProps) {
  // Always show signature and bio + dynamic blocks
  const allBlocks = [
    { type: "text", label: "Signature" },
    { type: "text", label: "Bio" },
    ...contentBlocks,
  ]

  return (
    <div className={cn("space-y-4", className)}>
      <p className="text-sm text-muted-foreground px-4">
        {allBlocks.length} exclusive {allBlocks.length === 1 ? "item" : "items"} to unlock
      </p>
      
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide touch-pan-x">
        {allBlocks.map((block, index) => {
          const Icon = getIconForType(block.type)
          return (
            <div
              key={index}
              className="flex-shrink-0 w-20 h-24 snap-start
                         bg-muted/50 rounded-xl flex flex-col 
                         items-center justify-center gap-2
                         border border-border/50 relative
                         animate-pulse"
            >
              <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-background flex items-center justify-center">
                <Lock className="w-2.5 h-2.5 text-muted-foreground" />
              </div>
              <Icon className="w-8 h-8 text-muted-foreground" />
              <span className="text-xs text-muted-foreground text-center px-1">
                {block.label || getLabelForType(block.type)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
