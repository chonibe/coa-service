"use client"

import React from "react"
import { PenTool } from "lucide-react"
import Image from "next/image"

interface ArtistNoteSectionProps {
  content: string
  signatureUrl?: string | null
}

/**
 * ArtistNoteSection - Letter-style typography for personal artist notes
 * 
 * Features:
 * - Large, elegant typography
 * - Artist signature at bottom
 * - Clean, editorial presentation
 * - Letter-style aesthetic
 */
const ArtistNoteSection: React.FC<ArtistNoteSectionProps> = ({ content, signatureUrl }) => {
  if (!content) {
    return null
  }

  return (
    <section className="py-8 md:py-16">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-8">
        <PenTool className="h-6 w-6 text-amber-400" />
        <h2 className="text-2xl md:text-3xl font-bold text-white">A Note from the Artist</h2>
      </div>

      {/* Letter Content */}
      <div className="bg-gray-900/30 rounded-2xl p-8 md:p-12 shadow-2xl border border-gray-800/50 backdrop-blur-sm">
        {/* Opening Quote Mark */}
        <div className="text-6xl md:text-8xl font-serif text-amber-400/20 leading-none mb-4">
          "
        </div>

        {/* Content */}
        <div className="prose prose-lg prose-invert max-w-none">
          <p className="text-gray-200 text-lg md:text-xl leading-relaxed font-serif whitespace-pre-wrap">
            {content}
          </p>
        </div>

        {/* Closing Quote Mark */}
        <div className="text-6xl md:text-8xl font-serif text-amber-400/20 leading-none text-right mt-4">
          "
        </div>

        {/* Signature */}
        {signatureUrl && (
          <div className="mt-8 pt-8 border-t border-gray-800 flex justify-end">
            <div className="relative w-48 h-16 md:w-64 md:h-20">
              <Image
                src={signatureUrl}
                alt="Artist signature"
                fill
                className="object-contain object-right opacity-80"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default ArtistNoteSection
