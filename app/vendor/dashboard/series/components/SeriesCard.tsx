"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Copy, Trash2, Lock, ArrowRight, Crown, Clock } from "lucide-react"
import { UnlockTypeTooltip } from "./UnlockTypeTooltip"
import type { ArtworkSeries } from "@/types/artwork-series"
import { cn } from "@/lib/utils"

interface SeriesCardProps {
  series: ArtworkSeries
  index: number
  isHovered: boolean
  onHover: (id: string | null) => void
  onView: () => void
  onDuplicate: () => void
  onDelete: () => void
  getUnlockTypeLabel: (type: string) => string
}

const unlockTypeConfig: Record<string, {
  gradient: string
  borderColor: string
  icon: typeof Lock
  badgeColor: string
  badgeBg: string
}> = {
  any_purchase: {
    gradient: "from-blue-500/30 to-cyan-500/30",
    borderColor: "border-blue-400/50",
    icon: Lock,
    badgeColor: "text-blue-600 dark:text-blue-400",
    badgeBg: "bg-blue-100 dark:bg-blue-900/30",
  },
  sequential: {
    gradient: "from-purple-500/30 to-pink-500/30",
    borderColor: "border-purple-400/50",
    icon: ArrowRight,
    badgeColor: "text-purple-600 dark:text-purple-400",
    badgeBg: "bg-purple-100 dark:bg-purple-900/30",
  },
  threshold: {
    gradient: "from-orange-500/30 to-red-500/30",
    borderColor: "border-orange-400/50",
    icon: Crown,
    badgeColor: "text-orange-600 dark:text-orange-400",
    badgeBg: "bg-orange-100 dark:bg-orange-900/30",
  },
  time_based: {
    gradient: "from-green-500/30 to-emerald-500/30",
    borderColor: "border-green-400/50",
    icon: Clock,
    badgeColor: "text-green-600 dark:text-green-400",
    badgeBg: "bg-green-100 dark:bg-green-900/30",
  },
  vip: {
    gradient: "from-orange-500/30 to-red-500/30",
    borderColor: "border-orange-400/50",
    icon: Crown,
    badgeColor: "text-orange-600 dark:text-orange-400",
    badgeBg: "bg-orange-100 dark:bg-orange-900/30",
  },
}

export function SeriesCard({
  series,
  index,
  isHovered,
  onHover,
  onView,
  onDuplicate,
  onDelete,
  getUnlockTypeLabel,
}: SeriesCardProps) {
  const totalCount = series.member_count || 0
  const config = unlockTypeConfig[series.unlock_type] || {
    gradient: "from-gray-500/20 to-slate-500/20",
    borderColor: "border-gray-400/50",
    icon: Lock,
    badgeColor: "text-gray-600 dark:text-gray-400",
    badgeBg: "bg-gray-100 dark:bg-gray-900/30",
  }
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="group relative"
      onMouseEnter={() => onHover(series.id)}
      onMouseLeave={() => onHover(null)}
    >
      <Card
        className={cn(
          "overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 relative",
          `bg-gradient-to-br ${config.gradient}`,
          `border-2 ${config.borderColor}`
        )}
        onClick={onView}
      >
        <motion.div
          whileHover={{ scale: 1.02, rotateY: 5 }}
          transition={{ duration: 0.3 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className="aspect-square relative overflow-hidden bg-muted">
            {series.thumbnail_url ? (
              <motion.img
                src={series.thumbnail_url}
                alt={series.name}
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="h-12 w-12 text-muted-foreground/50" />
              </div>
            )}

            {/* Gradient overlay based on unlock type */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
            )} />
            
            {/* Unlock type icon indicator */}
            <div className={cn(
              "absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-sm",
              config.badgeBg,
              config.badgeColor
            )}>
              <Icon className="h-4 w-4" />
            </div>

            {/* Hover overlay with actions */}
            {isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-2 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onView}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onDuplicate}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </motion.div>
            )}

            {/* Series name overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4 z-0">
              <h3 className="font-semibold text-white text-sm truncate">{series.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {totalCount} {totalCount === 1 ? "artwork" : "artworks"}
                </Badge>
                <div className="flex items-center gap-1">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs border-2",
                      config.borderColor,
                      config.badgeBg,
                      config.badgeColor
                    )}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {getUnlockTypeLabel(series.unlock_type)}
                  </Badge>
                  <UnlockTypeTooltip unlockType={series.unlock_type} />
                </div>
              </div>
            </div>
          </div>

          {/* Artwork count */}
          {totalCount > 0 && (
            <div className="p-3 border-t">
              <div className="text-xs text-muted-foreground text-center">
                {totalCount} {totalCount === 1 ? "artwork" : "artworks"}
              </div>
            </div>
          )}
        </motion.div>
      </Card>
    </motion.div>
  )
}

