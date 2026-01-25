"use client"

import { Crown } from "lucide-react"

import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui"
interface VIPBadgeProps {
  tier: number
  loyaltyPoints?: number
  className?: string
}

export function VIPBadge({ tier, loyaltyPoints, className }: VIPBadgeProps) {
  if (tier === 0) return null

  const tierColors = {
    1: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    2: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    3: "bg-pink-500/10 text-pink-600 border-pink-500/20",
    4: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    5: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "flex items-center gap-1.5 px-2 py-1",
        tierColors[tier as keyof typeof tierColors] || tierColors[1],
        className
      )}
    >
      <Crown className="h-3 w-3" />
      <span className="font-semibold">VIP {tier}</span>
      {loyaltyPoints !== undefined && (
        <span className="text-xs opacity-75">({loyaltyPoints} pts)</span>
      )}
    </Badge>
  )
}

