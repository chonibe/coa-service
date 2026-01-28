"use client"

import Image from "next/image"
import { PenTool } from "lucide-react"
import { Card, CardContent } from "@/components/ui"

interface ArtistNoteSectionProps {
  content: string
  signatureUrl?: string
  artistName: string
}

export default function ArtistNoteSection({ content, signatureUrl, artistName }: ArtistNoteSectionProps) {
  if (!content) return null

  return (
    <Card className="max-w-3xl mx-auto border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-pink-500/5">
      <CardContent className="p-6 sm:p-10 space-y-8">
        <div className="flex items-center justify-center gap-3">
          <div className="p-2 rounded-full bg-rose-500/10">
            <PenTool className="h-6 w-6 text-rose-500" />
          </div>
          <h2 className="text-2xl font-bold">A Note from the Artist</h2>
        </div>

        {/* Letter-style content */}
        <div className="bg-secondary/30 rounded-2xl p-6 sm:p-10 border border-border/50 shadow-inner">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-foreground/90 leading-relaxed whitespace-pre-line text-base sm:text-lg font-serif">
              {content}
            </p>
          </div>

          {/* Signature */}
          <div className="mt-10 sm:mt-12 flex flex-col items-end">
            {signatureUrl && (
              <div className="relative h-12 sm:h-16 w-36 sm:w-48 mb-2">
                <Image
                  src={signatureUrl}
                  alt={`${artistName}'s signature`}
                  fill
                  className="object-contain object-right dark:invert dark:brightness-200"
                />
              </div>
            )}
            <p className="text-muted-foreground text-sm font-serif italic">
              — {artistName}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
