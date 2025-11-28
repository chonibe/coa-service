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
  sequential: "Finish the Set - Each purchase unlocks the next artwork, satisfying the collector instinct to complete the series. Like collecting trading cards or completing game achievements.",
  threshold: "VIP Unlocks - Reward loyalty and make owning earlier pieces matter. Exclusive pieces unlock for collectors who own earlier works, building a hierarchy that keeps collectors engaged. Like Patreon tiers or loyalty programs.",
  time_based: "Time-Based Unlocks - Create anticipation and daily return behavior. Artworks unlock at specific times or on schedules, driving more attention over more days. Like daily drops or scheduled releases.",
  custom: "Define your own unlock rules with custom logic. Perfect for special events, time-based unlocks, or complex collection mechanics. Like games, drops, loyalty programs, Patreon tiers - collectors instantly recognize these patterns.",
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

