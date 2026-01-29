"use client"

import { Sparkles, Eye, Crown, Grid3x3, ExternalLink } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui"

interface UnlockItem {
  type: "hidden_series" | "vip_artwork" | "vip_series"
  id: string
  name: string
}

interface UnlockRelationships {
  unlocks: UnlockItem[]
}

interface UnlockRelationshipVisualizerProps {
  unlockRelationships: UnlockRelationships | null
  className?: string
}

export function UnlockRelationshipVisualizer({
  unlockRelationships,
  className = "",
}: UnlockRelationshipVisualizerProps) {
  // Don't render if no unlock relationships
  if (!unlockRelationships || unlockRelationships.unlocks.length === 0) {
    return null
  }

  const getUnlockIcon = (type: string) => {
    switch (type) {
      case "hidden_series":
        return <Sparkles className="h-4 w-4" />
      case "vip_artwork":
        return <Eye className="h-4 w-4" />
      case "vip_series":
        return <Crown className="h-4 w-4" />
      default:
        return <Grid3x3 className="h-4 w-4" />
    }
  }

  const getUnlockLabel = (type: string) => {
    switch (type) {
      case "hidden_series":
        return "Hidden Series"
      case "vip_artwork":
        return "VIP Artwork"
      case "vip_series":
        return "VIP Series"
      default:
        return "Unlocks"
    }
  }

  const getUnlockColor = (type: string) => {
    switch (type) {
      case "hidden_series":
        return "bg-amber-500/10 border-amber-500/20 text-amber-400"
      case "vip_artwork":
        return "bg-purple-500/10 border-purple-500/20 text-purple-400"
      case "vip_series":
        return "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
      default:
        return "bg-gray-500/10 border-gray-500/20 text-gray-400"
    }
  }

  return (
    <Card className={`border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5 ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Unlock Rewards
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-400">
          Collectors who own this artwork will unlock:
        </p>
        <div className="space-y-2">
          {unlockRelationships.unlocks.map((unlock, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg border ${getUnlockColor(unlock.type)}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-current/10 flex items-center justify-center">
                  {getUnlockIcon(unlock.type)}
                </div>
                <div>
                  <p className="font-medium text-sm">{unlock.name}</p>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {getUnlockLabel(unlock.type)}
                  </Badge>
                </div>
              </div>
              {unlock.type === "hidden_series" || unlock.type === "vip_series" ? (
                <Link
                  href={`/vendor/dashboard/series/${unlock.id}`}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  View Series
                  <ExternalLink className="h-3 w-3" />
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
