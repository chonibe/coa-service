"use client"

import { cn } from "@/lib/utils"
import { Check, Lock, Gift, Image as ImageIcon, FileText, Video, Music } from "lucide-react"


import { Badge } from "@/components/ui"
interface Milestone {
  threshold: number
  type: string
  title: string
  isUnlocked: boolean
}

interface MilestoneRewardsProps {
  milestones: Milestone[]
  currentCount: number
  className?: string
}

export function MilestoneRewards({ milestones, currentCount, className }: MilestoneRewardsProps) {
  if (milestones.length === 0) {
    return null
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case 'image':
        return ImageIcon
      case 'video':
        return Video
      case 'audio':
        return Music
      case 'text':
        return FileText
      default:
        return Gift
    }
  }

  return (
    <div className={cn("", className)}>
      <h2 className="text-lg font-semibold mb-4 px-4">Rewards</h2>
      
      <div className="space-y-3 px-4">
        {milestones.map((milestone, index) => {
          const Icon = getIconForType(milestone.type)
          const isUnlocked = currentCount >= milestone.threshold
          
          return (
            <div
              key={index}
              className={cn(
                "rounded-xl p-4 border-2 transition-all",
                "flex items-center gap-3",
                isUnlocked
                  ? "bg-primary/10 border-primary/30"
                  : "bg-muted/50 border-border/50"
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                  isUnlocked ? "bg-primary/20" : "bg-muted"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5",
                    isUnlocked ? "text-primary" : "text-muted-foreground"
                  )}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isUnlocked ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    At {milestone.threshold}/{milestones[milestones.length - 1]?.threshold || milestone.threshold}
                  </span>
                  <Badge
                    variant={isUnlocked ? "default" : "secondary"}
                    className="h-5 text-xs"
                  >
                    {isUnlocked ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Unlocked
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 mr-1" />
                        Locked
                      </>
                    )}
                  </Badge>
                </div>
                <p
                  className={cn(
                    "text-sm font-medium",
                    isUnlocked ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {milestone.title}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
