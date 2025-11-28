"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Copy, Trash2 } from "lucide-react"
import { UnlockProgress } from "./UnlockProgress"
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

const unlockTypeGradients: Record<string, string> = {
  any_purchase: "from-blue-500/20 to-cyan-500/20",
  sequential: "from-purple-500/20 to-pink-500/20",
  threshold: "from-orange-500/20 to-red-500/20",
  custom: "from-gray-500/20 to-slate-500/20",
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
  const gradientClass = unlockTypeGradients[series.unlock_type] || "from-gray-500/20 to-slate-500/20"

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
          `bg-gradient-to-br ${gradientClass}`
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
              "absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent",
              `bg-gradient-to-br ${gradientClass} mix-blend-overlay`
            )} />

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
                  <Badge variant="outline" className="text-xs">
                    {getUnlockTypeLabel(series.unlock_type)}
                  </Badge>
                  <UnlockTypeTooltip unlockType={series.unlock_type} />
                </div>
              </div>
            </div>
          </div>

          {/* Progress indicator */}
          {totalCount > 0 && (
            <div className="p-3 border-t">
              <UnlockProgress
                unlocked={totalCount}
                total={totalCount}
                showLabels={false}
              />
            </div>
          )}
        </motion.div>
      </Card>
    </motion.div>
  )
}

