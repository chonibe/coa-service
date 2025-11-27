"use client"

import { motion } from "framer-motion"
import { Lock, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface UnlockProgressProps {
  unlocked: number
  total: number
  showLabels?: boolean
}

export function UnlockProgress({ unlocked, total, showLabels = true }: UnlockProgressProps) {
  const percentage = total > 0 ? (unlocked / total) * 100 : 0

  return (
    <div className="space-y-2">
      {showLabels && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {unlocked} of {total} unlocked
          </span>
          <span className="font-medium">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <div className="flex items-center gap-1 mt-2">
        {Array.from({ length: total }).map((_, index) => {
          const isUnlocked = index < unlocked
          return (
            <motion.div
              key={index}
              className={cn(
                "h-2 w-2 rounded-full",
                isUnlocked ? "bg-primary" : "bg-muted-foreground/30"
              )}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.05 }}
            />
          )
        })}
      </div>
    </div>
  )
}

