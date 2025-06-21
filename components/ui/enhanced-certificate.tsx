"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { extractColors, type ColorPalette } from "@/lib/color-extractor"
import { DynamicBackground } from "./dynamic-background"
import { InteractiveImage } from "./interactive-image"
import { HolographicElement } from "./holographic-element"

interface EnhancedCertificateProps {
  artworkUrl: string
  artistName: string
  artworkTitle: string
  editionNumber: string
  certificateId: string
  issueDate: string
  className?: string
}

export function EnhancedCertificate({
  artworkUrl,
  artistName,
  artworkTitle,
  editionNumber,
  certificateId,
  issueDate,
  className = "",
}: EnhancedCertificateProps) {
  const [colorPalette, setColorPalette] = useState<ColorPalette>({
    primary: "#4f46e5",
    secondary: "#8b5cf6",
    accent: "#06b6d4",
    background: "linear-gradient(135deg, #1e1b4b80, #18181b80)",
    text: "#ffffff",
  })

  useEffect(() => {
    const loadColors = async () => {
      const palette = await extractColors(artworkUrl)
      setColorPalette(palette)
    }
    loadColors()
  }, [artworkUrl])

  return (
    <div className={`relative w-full max-w-4xl aspect-[1.4] rounded-xl overflow-hidden ${className}`}>
      {/* Dynamic Background */}
      <DynamicBackground palette={colorPalette} />

      {/* Certificate Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full h-full p-8 flex flex-col items-center justify-between"
        style={{ color: colorPalette.text }}
      >
        {/* Header */}
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold mb-2"
          >
            Certificate of Authenticity
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm opacity-80"
          >
            {certificateId}
          </motion.div>
        </div>

        {/* Artwork Display */}
        <div className="relative w-full max-w-lg aspect-square my-8">
          <HolographicElement className="absolute inset-0" />
          <InteractiveImage
            src={artworkUrl}
            alt={artworkTitle}
            className="relative z-10"
          />
        </div>

        {/* Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center space-y-4"
        >
          <h2 className="text-2xl font-semibold">{artworkTitle}</h2>
          <p className="text-lg">by {artistName}</p>
          <div className="flex items-center justify-center gap-8 text-sm opacity-80">
            <div>Edition {editionNumber}</div>
            <div>Issued {issueDate}</div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
