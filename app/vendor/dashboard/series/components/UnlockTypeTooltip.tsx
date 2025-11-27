"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Info } from "lucide-react"
import type { UnlockType } from "@/types/artwork-series"

interface UnlockTypeTooltipProps {
  unlockType: UnlockType
  children?: React.ReactNode
}

const unlockTypeDescriptions: Record<UnlockType, string> = {
  any_purchase: "All artworks in this series unlock immediately when any piece is purchased. Perfect for open collections where collectors can access everything right away.",
  sequential: "Artworks unlock one by one in order. Collectors must purchase artwork #1 to unlock #2, then #2 to unlock #3, and so on. Creates a journey of discovery.",
  threshold: "After purchasing a set number of artworks, exclusive pieces unlock. Encourages collectors to build their collection to reach milestones.",
  custom: "Define your own unlock rules with custom logic. Perfect for special events, time-based unlocks, or complex collection mechanics.",
}

export function UnlockTypeTooltip({ unlockType, children }: UnlockTypeTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children || (
            <button type="button" className="inline-flex items-center">
              <Info className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{unlockTypeDescriptions[unlockType]}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

