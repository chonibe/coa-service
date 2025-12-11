"use client"

import { motion } from "framer-motion"
import { Check, Lock, ArrowRight, Crown, Clock, Radio } from "lucide-react"
import type { UnlockType } from "@/types/artwork-series"
import { cn } from "@/lib/utils"

interface UnlockTypeCardsProps {
  value: UnlockType
  onChange: (value: UnlockType) => void
}

const baseUnlockTypes = [
  {
    value: "any_purchase" as UnlockType,
    label: "Open Collection",
    shortLabel: "Open",
    visual: "🔓",
    icon: Lock,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    layout: "horizontal" as const,
  },
  {
    value: "sequential" as UnlockType,
    label: "Finish the Set",
    shortLabel: "Sequential",
    visual: "1→2→3",
    icon: ArrowRight,
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    borderColor: "border-purple-200 dark:border-purple-800",
    layout: "vertical" as const,
  },
  {
    value: "threshold" as UnlockType,
    label: "VIP Unlocks",
    shortLabel: "VIP",
    visual: "👑",
    icon: Crown,
    color: "from-orange-500 to-red-500",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-800",
    layout: "horizontal" as const,
  },
  {
    value: "time_based" as UnlockType,
    label: "Time-Based",
    shortLabel: "Time",
    visual: "⏰",
    icon: Clock,
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-800",
    layout: "vertical" as const,
  },
] as const

// Add NFC unlock option
const nfcUnlockType = {
  value: "nfc" as UnlockType,
  label: "NFC Unlock",
  shortLabel: "NFC",
  visual: "📡",
  icon: Radio,
  color: "from-indigo-500 to-blue-500",
  bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
  borderColor: "border-indigo-200 dark:border-indigo-800",
  layout: "horizontal" as const,
} as const

const unlockTypes = [...baseUnlockTypes, nfcUnlockType] as const

export function UnlockTypeCards({ value, onChange }: UnlockTypeCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {unlockTypes.map((type) => {
        const Icon = type.icon
        const isSelected = value === type.value
        const isHorizontal = type.layout === "horizontal"
        
        return (
          <motion.button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            className={cn(
              "relative rounded-xl border-2 transition-all text-left overflow-hidden",
              isSelected
                ? `${type.borderColor} ${type.bgColor} shadow-lg scale-105`
                : "border-muted hover:border-primary/50 hover:bg-muted/50",
              isHorizontal ? "p-4" : "p-6"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isHorizontal ? (
              // Horizontal layout for Open and VIP
              <div className="flex items-center gap-4">
                <div className="text-4xl">{type.visual}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg">{type.label}</h3>
                    <div className={cn(
                      "px-2 py-0.5 rounded text-xs font-semibold bg-gradient-to-r text-white",
                      type.color
                    )}>
                      {type.shortLabel}
                    </div>
                  </div>
                  <div className={cn(
                    "h-1 rounded-full bg-gradient-to-r",
                    type.color
                  )} />
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center bg-gradient-to-r text-white",
                      type.color
                    )}
                  >
                    <Check className="h-5 w-5" />
                  </motion.div>
                )}
              </div>
            ) : (
              // Vertical layout for Sequential and Time-Based
              <div className="flex flex-col items-center text-center">
                <div className="text-5xl mb-3">{type.visual}</div>
                <div className={cn(
                  "px-4 py-1 rounded-full mb-2 bg-gradient-to-r text-white text-sm font-bold",
                  type.color
                )}>
                  {type.shortLabel}
                </div>
                <h3 className="font-bold text-lg mb-2">{type.label}</h3>
                <div className={cn(
                  "w-full h-2 rounded-full bg-gradient-to-r",
                  type.color
                )} />
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      "absolute top-2 right-2 h-6 w-6 rounded-full flex items-center justify-center bg-gradient-to-r text-white",
                      type.color
                    )}
                  >
                    <Check className="h-4 w-4" />
                  </motion.div>
                )}
              </div>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}

