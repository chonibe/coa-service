"use client"

import React from "react"
import { motion } from "framer-motion"
import { Sparkles, FileText, Image, Video, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface WhyUnlockStepProps {
  artistName: string
  artistPhoto?: string | null
  contentBlocks: {
    type: string
    label: string
  }[]
  onContinue: () => void
}

const getIconForType = (type: string) => {
  switch (type) {
    case "text":
    case "Artwork Text Block":
      return <FileText className="w-4 h-4" />
    case "image":
    case "Artwork Image Block":
      return <Image className="w-4 h-4" />
    case "video":
    case "Artwork Video Block":
      return <Video className="w-4 h-4" />
    case "audio":
    case "Artwork Audio Block":
      return <Music className="w-4 h-4" />
    default:
      return <Sparkles className="w-4 h-4" />
  }
}

export function WhyUnlockStep({
  artistName,
  artistPhoto,
  contentBlocks,
  onContinue,
}: WhyUnlockStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col h-full py-6"
    >
      {/* Artist info */}
      <div className="flex flex-col items-center text-center mb-6">
        <Avatar className="w-20 h-20 mb-4">
          {artistPhoto && <AvatarImage src={artistPhoto} alt={artistName} />}
          <AvatarFallback className="text-2xl">
            {artistName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-semibold px-4">
          {artistName} created exclusive content just for you
        </h2>
      </div>

      {/* Divider */}
      <div className="w-16 h-px bg-border mx-auto my-6" />

      {/* What you'll unlock */}
      <div className="flex-1">
        <p className="text-sm text-muted-foreground mb-4 text-center">
          What you'll unlock:
        </p>
        <div className="space-y-3">
          {/* Default items always shown */}
          <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-lg">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-3 h-3 text-primary" />
            </div>
            <span className="text-sm">Artist's signature</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-lg">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-3 h-3 text-primary" />
            </div>
            <span className="text-sm">Artist bio</span>
          </div>

          {/* Dynamic content blocks */}
          {contentBlocks.map((block, index) => (
            <div
              key={index}
              className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-lg"
            >
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                {getIconForType(block.type)}
              </div>
              <span className="text-sm">{block.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <Button
        onClick={onContinue}
        className="w-full h-14 text-lg font-semibold rounded-xl mt-6"
      >
        Continue to Unlock
      </Button>
    </motion.div>
  )
}
