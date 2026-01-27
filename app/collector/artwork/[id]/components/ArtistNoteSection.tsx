"use client"

import Image from "next/image"
import { PenTool } from "lucide-react"

interface ArtistNoteSectionProps {
  content: string
  signatureUrl?: string
  artistName: string
}

export default function ArtistNoteSection({ content, signatureUrl, artistName }: ArtistNoteSectionProps) {
  if (!content) return null

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8">
      <div className="flex items-center justify-center gap-3 mb-8">
        <PenTool className="h-6 w-6 text-amber-500" />
        <h2 className="text-2xl font-bold">A Note from the Artist</h2>
      </div>

      {/* Letter-style content */}
      <div className="bg-gradient-to-br from-amber-900/10 to-gray-900/50 rounded-lg p-12 border border-amber-500/20 shadow-xl">
        <div className="prose prose-lg prose-invert max-w-none">
          <p className="text-gray-300 leading-relaxed whitespace-pre-line text-lg font-serif">
            {content}
          </p>
        </div>

        {/* Signature */}
        <div className="mt-12 flex flex-col items-end">
          {signatureUrl && (
            <div className="relative h-16 w-48 mb-2">
              <Image
                src={signatureUrl}
                alt={`${artistName}'s signature`}
                fill
                className="object-contain object-right"
              />
            </div>
          )}
          <p className="text-gray-400 text-sm font-serif italic">
            — {artistName}
          </p>
        </div>
      </div>
    </div>
  )
}
