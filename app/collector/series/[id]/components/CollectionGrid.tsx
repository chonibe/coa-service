"use client"

import { cn } from "@/lib/utils"
import { Check, Lock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Artwork {
  id: string
  title: string
  image?: string
  isOwned: boolean
  isLocked: boolean
  displayOrder: number
  handle?: string
  shopifyProductId: string
}

interface CollectionGridProps {
  artworks: Artwork[]
  unlockType: string
  className?: string
}

export function CollectionGrid({ artworks, unlockType, className }: CollectionGridProps) {
  const isSequential = unlockType === 'sequential'

  return (
    <div className={cn("", className)}>
      <h2 className="text-lg font-semibold mb-4 px-4">Collection</h2>
      
      {/* Horizontal scrolling collection */}
      <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide touch-pan-x">
        {artworks.map((artwork, index) => {
          const isCollected = artwork.isOwned
          const isLocked = artwork.isLocked && !artwork.isOwned
          
          return (
            <div key={artwork.id} className="flex items-center flex-shrink-0">
              {/* Artwork card */}
              <Link
                href={`/collector/artwork/${artwork.id}`}
                className={cn(
                  "w-[72px] rounded-xl snap-start",
                  "flex flex-col items-center justify-center gap-2",
                  "transition-all duration-200 active:scale-95",
                  "relative group"
                )}
              >
                {/* Card background with image or placeholder */}
                <div
                  className={cn(
                    "w-full aspect-[3/4] rounded-xl overflow-hidden relative",
                    "border-2 transition-all",
                    isCollected
                      ? "border-primary bg-primary/10"
                      : isLocked
                      ? "border-dashed border-muted-foreground/30 bg-muted"
                      : "border-border bg-muted hover:border-primary/50"
                  )}
                >
                  {artwork.image && !isLocked && (
                    <Image
                      src={artwork.image}
                      alt={artwork.title}
                      fill
                      className={cn(
                        "object-cover",
                        isCollected ? "opacity-100" : "opacity-60 group-hover:opacity-80"
                      )}
                      sizes="72px"
                    />
                  )}
                  
                  {/* Status icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isCollected ? (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
                        <Check className="w-5 h-5 text-primary-foreground" />
                      </div>
                    ) : isLocked ? (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    ) : null}
                  </div>
                </div>

                {/* Order number */}
                <span
                  className={cn(
                    "text-xs font-medium",
                    isCollected
                      ? "text-primary"
                      : isLocked
                      ? "text-muted-foreground"
                      : "text-foreground"
                  )}
                >
                  #{index + 1}
                </span>
              </Link>

              {/* Connector line (for sequential) */}
              {isSequential && index < artworks.length - 1 && (
                <div
                  className={cn(
                    "w-2 h-0.5 flex-shrink-0 mx-1",
                    isCollected ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
