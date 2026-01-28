"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { 
  ChevronRight, 
  Clock, 
  Sparkles, 
  Grid3x3,
  ArrowRight,
  Lock,
  Unlock
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@/components/ui"

interface UnlockedContent {
  type: "series" | "artwork" | "vip_series"
  id: string
  name: string
  thumbnailUrl?: string
}

interface SeriesInfo {
  name: string
  totalCount: number
  ownedCount: number
  artworks: Array<{
    id: string
    name: string
    imgUrl: string
    isOwned: boolean
    position: number
  }>
  nextArtwork?: {
    id: string
    name: string
    imgUrl: string
  }
  unlockType?: "sequential" | "any_order" | "time_based"
}

interface Countdown {
  unlockAt: string
  artworkName: string
  artworkImgUrl?: string
}

interface MoreArtwork {
  id: string
  name: string
  imgUrl: string
  price?: number
}

interface DiscoveryData {
  unlockedContent?: UnlockedContent
  seriesInfo?: SeriesInfo
  countdown?: Countdown
  moreFromArtist?: MoreArtwork[]
}

interface DiscoverySectionProps {
  discoveryData: DiscoveryData
  isAuthenticated: boolean
  artistName: string
}

export function DiscoverySection({
  discoveryData,
  isAuthenticated,
  artistName,
}: DiscoverySectionProps) {
  const hasAnyData = 
    discoveryData.unlockedContent || 
    discoveryData.seriesInfo || 
    discoveryData.countdown || 
    (discoveryData.moreFromArtist && discoveryData.moreFromArtist.length > 0)

  // Don't render if no discovery data
  if (!hasAnyData) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.8 }}
      className="w-full max-w-5xl mx-auto px-4 py-12 space-y-8"
    >
      {/* Section Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Discover More
        </h2>
        <p className="text-muted-foreground">
          Your journey with {artistName} continues
        </p>
      </div>

      {/* Unlocked Content Reward */}
      {discoveryData.unlockedContent && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                <Unlock className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  You Unlocked Something Special!
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Collecting this artwork gave you access to:
                </p>
                <div className="flex items-center gap-3">
                  {discoveryData.unlockedContent.thumbnailUrl && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={discoveryData.unlockedContent.thumbnailUrl}
                        alt={discoveryData.unlockedContent.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {discoveryData.unlockedContent.name}
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      {discoveryData.unlockedContent.type === "series" && "Hidden Series"}
                      {discoveryData.unlockedContent.type === "artwork" && "VIP Artwork"}
                      {discoveryData.unlockedContent.type === "vip_series" && "VIP Series"}
                    </Badge>
                  </div>
                  <Button asChild size="sm" className="flex-shrink-0">
                    <Link href={`/collector/${discoveryData.unlockedContent.type}/${discoveryData.unlockedContent.id}`}>
                      View
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Series Progress */}
      {discoveryData.seriesInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Grid3x3 className="h-5 w-5" />
              {discoveryData.seriesInfo.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {discoveryData.seriesInfo.ownedCount} of {discoveryData.seriesInfo.totalCount} collected
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round((discoveryData.seriesInfo.ownedCount / discoveryData.seriesInfo.totalCount) * 100)}%
                </span>
              </div>
              <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${(discoveryData.seriesInfo.ownedCount / discoveryData.seriesInfo.totalCount) * 100}%` 
                  }}
                  transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-primary to-purple-600 rounded-full"
                />
              </div>
            </div>

            {/* Series Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {discoveryData.seriesInfo.artworks.map((artwork) => (
                <Link
                  key={artwork.id}
                  href={artwork.isOwned ? `/collector/artwork/${artwork.id}` : `/discover`}
                  className="group relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 hover:shadow-lg"
                  style={{
                    borderColor: artwork.isOwned ? "hsl(var(--primary))" : "hsl(var(--border))"
                  }}
                >
                  <Image
                    src={artwork.imgUrl}
                    alt={artwork.name}
                    fill
                    className={`object-cover transition-all ${
                      artwork.isOwned ? "" : "grayscale opacity-40 group-hover:opacity-60"
                    }`}
                  />
                  {!artwork.isOwned && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Lock className="h-6 w-6 text-white/80" />
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1">
                    <Badge 
                      variant={artwork.isOwned ? "default" : "secondary"}
                      className="text-xs px-2 py-0.5"
                    >
                      {artwork.position}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>

            {/* Next Artwork CTA */}
            {discoveryData.seriesInfo.nextArtwork && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-3">
                  Continue your collection
                </p>
                <div className="flex items-center gap-3">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={discoveryData.seriesInfo.nextArtwork.imgUrl}
                      alt={discoveryData.seriesInfo.nextArtwork.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {discoveryData.seriesInfo.nextArtwork.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Next in series
                    </p>
                  </div>
                  <Button asChild size="sm" className="flex-shrink-0">
                    <Link href={`/discover`}>
                      View
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Countdown Timer */}
      {discoveryData.countdown && (
        <Card className="border-2 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold mb-1">
                  Something's Coming
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Next unlock available soon
                </p>
                <div className="flex items-center gap-3">
                  {discoveryData.countdown.artworkImgUrl && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={discoveryData.countdown.artworkImgUrl}
                        alt={discoveryData.countdown.artworkName}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {discoveryData.countdown.artworkName}
                    </p>
                    <CountdownTimer unlockAt={discoveryData.countdown.unlockAt} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* More from Artist */}
      {discoveryData.moreFromArtist && discoveryData.moreFromArtist.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>More from {artistName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {discoveryData.moreFromArtist.map((artwork) => (
                <Link
                  key={artwork.id}
                  href={`/discover`}
                  className="group"
                >
                  <div className="relative aspect-square rounded-lg overflow-hidden border transition-all hover:scale-105 hover:shadow-lg">
                    <Image
                      src={artwork.imgUrl}
                      alt={artwork.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="mt-2 text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {artwork.name}
                  </p>
                  {artwork.price && (
                    <p className="text-xs text-muted-foreground">
                      ${artwork.price}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}

// Countdown Timer Component
function CountdownTimer({ unlockAt }: { unlockAt: string }) {
  const [timeLeft, setTimeLeft] = useState("")

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const unlock = new Date(unlockAt).getTime()
      const diff = unlock - now

      if (diff <= 0) {
        setTimeLeft("Unlocked!")
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`)
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`)
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`)
      } else {
        setTimeLeft(`${seconds}s`)
      }
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [unlockAt])

  return (
    <Badge variant="secondary" className="font-mono">
      {timeLeft || "Calculating..."}
    </Badge>
  )
}
