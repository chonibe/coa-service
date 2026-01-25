"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowRight, Lock, ShoppingBag } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface NextArtwork {
  id: string
  title: string
  image?: string
  displayOrder: number
  handle?: string
  shopifyProductId: string
}

interface NextUnlockProps {
  nextArtwork: NextArtwork | null
  unlockType: string
  className?: string
}

export function NextUnlock({ nextArtwork, unlockType, className }: NextUnlockProps) {
  if (!nextArtwork) {
    return (
      <div className={cn("bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20", className)}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary/20 mx-auto mb-3 flex items-center justify-center">
            <Check className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Collection Complete!</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You've collected all artworks in this series
          </p>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/collector/dashboard">
              View Your Collection
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const getUnlockMessage = () => {
    switch (unlockType) {
      case 'sequential':
        return `Collect #${nextArtwork.displayOrder + 1} to continue your journey`
      case 'threshold':
        return 'Collect more artworks to unlock the next piece'
      case 'vip':
        return 'Available for VIP collectors'
      case 'time_based':
        return 'Coming soon in this series'
      default:
        return 'Next artwork available'
    }
  }

  return (
    <div className={cn("bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/20", className)}>
      <div className="flex gap-4 items-center mb-3">
        {/* Thumbnail */}
        <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0 border-2 border-dashed border-primary/30">
          {nextArtwork.image ? (
            <>
              <Image
                src={nextArtwork.image}
                alt={nextArtwork.title}
                fill
                className="object-cover blur-sm opacity-40"
                sizes="64px"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="w-5 h-5 text-primary" />
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground mb-1">Next Up</p>
          <h3 className="font-semibold text-sm line-clamp-1 mb-0.5">
            {nextArtwork.title}
          </h3>
          <p className="text-xs text-muted-foreground">
            {getUnlockMessage()}
          </p>
        </div>
      </div>

      {/* CTA button */}
      <Button className="w-full h-12" asChild>
        <Link
          href={`https://${process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN || "thestreetlamp-9103.myshopify.com"}/products/${nextArtwork.handle || nextArtwork.shopifyProductId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ShoppingBag className="w-4 h-4 mr-2" />
          View Available Artworks
        </Link>
      </Button>
    </div>
  )
}

// Missing import
import { Check } from "lucide-react"
