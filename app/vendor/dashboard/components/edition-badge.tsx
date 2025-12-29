"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface EditionBadgeProps {
  soldCount: number
  editionSize: number | null
  className?: string
}

export function EditionBadge({ soldCount, editionSize, className }: EditionBadgeProps) {
  // Don't show badge for open editions (null or 0 edition size)
  if (!editionSize || editionSize === 0) {
    return null
  }

  // Ensure soldCount doesn't exceed editionSize (defensive check)
  const actualSoldCount = Math.min(soldCount, editionSize)
  const remaining = Math.max(0, editionSize - actualSoldCount)
  const percentageRemaining = (remaining / editionSize) * 100

  // Determine color based on remaining stock
  let variant: "default" | "secondary" | "destructive" | "outline" = "default"
  let colorClass = "" // High stock (> 50% remaining) - use default blue

  if (percentageRemaining < 20) {
    variant = "destructive"
    colorClass = "" // Low stock (< 20% remaining) - use destructive red
  } else if (percentageRemaining < 50) {
    variant = "secondary"
    colorClass = "bg-yellow-500 hover:bg-yellow-600 text-yellow-950 dark:text-yellow-50" // Medium stock (20-50% remaining)
  }

  const displayText = `${actualSoldCount}/${editionSize}`
  const tooltipText = `${remaining} remaining (${percentageRemaining.toFixed(1)}%)`

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={variant}
            className={cn(
              "font-mono font-semibold cursor-help",
              colorClass,
              className
            )}
          >
            {displayText}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

