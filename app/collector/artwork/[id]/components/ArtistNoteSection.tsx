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
    <div className="py-12 md:py-16 max-w-3xl mx-auto">
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className="p-2 rounded-full bg-rose-500/10">
          <PenTool className="h-5 w-5 text-rose-500" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold">A Note from the Artist</h2>
      </div>

      {/* Letter-style content */}
      <div className="bg-rose-50/50 rounded-3xl p-8 md:p-12 shadow-inner">
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-800 leading-relaxed whitespace-pre-line text-lg md:text-xl font-serif">
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
          <p className="text-muted-foreground text-base font-serif italic">
            — {artistName}
          </p>
        </div>
      </div>
    </div>
  )
}
