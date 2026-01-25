"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface ProgressBarProps {
  current: number
  total: number
  unlockType: string
  className?: string
}

export function ProgressBar({ current, total, unlockType, className }: ProgressBarProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0

  const getUnlockTypeLabel = (type: string) => {
    switch (type) {
      case 'any_purchase':
        return 'Open Collection'
      case 'sequential':
        return 'Sequential Collection'
      case 'threshold':
        return 'Threshold Collection'
      case 'time_based':
        return 'Time-Based Collection'
      case 'vip':
        return 'VIP Exclusive'
      case 'nfc':
        return 'NFC Unlock'
      default:
        return type.replace(/_/g, ' ')
    }
  }

  return (
    <div className={cn("bg-card rounded-2xl p-4 border border-border", className)}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Your Progress</h2>
        <span className="text-2xl font-bold text-primary">
          {current}/{total}
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full h-3 bg-muted rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Unlock type badge */}
      <div className="flex items-center justify-center">
        <Badge variant="secondary" className="text-xs">
          {getUnlockTypeLabel(unlockType)}
        </Badge>
      </div>
    </div>
  )
}
