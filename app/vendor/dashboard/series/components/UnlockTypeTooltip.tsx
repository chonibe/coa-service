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
  any_purchase: "All artworks unlock immediately when any piece is purchased.",
  sequential: "Each purchase unlocks the next artwork in order.",
  threshold: "Exclusive pieces unlock when collectors reach purchase thresholds.",
  time_based: "Artworks unlock at specific times or on schedules.",
  vip: "Exclusive pieces unlock for collectors who own earlier works.",
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

