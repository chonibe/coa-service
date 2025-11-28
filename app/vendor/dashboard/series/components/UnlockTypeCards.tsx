"use client"

import { motion } from "framer-motion"
import { Check, Lock, ArrowRight, Crown, Clock, Settings } from "lucide-react"
import type { UnlockType } from "@/types/artwork-series"
import { cn } from "@/lib/utils"

interface UnlockTypeCardsProps {
  value: UnlockType
  onChange: (value: UnlockType) => void
}

const unlockTypes = [
  {
    value: "any_purchase" as UnlockType,
    label: "Any Purchase",
    description: "Open collections where collectors can access everything right away",
    icon: Lock,
    color: "from-blue-500 to-cyan-500",
  },
  {
    value: "sequential" as UnlockType,
    label: "Finish the Set",
    description: "Satisfy the collector instinct to complete the series. Each purchase naturally leads to the next.",
    icon: Check,
    color: "from-purple-500 to-pink-500",
  },
  {
    value: "threshold" as UnlockType,
    label: "VIP Unlocks",
    description: "Reward loyalty and make owning earlier pieces matter. Build a hierarchy that keeps collectors inside the ecosystem.",
    icon: Crown,
    color: "from-orange-500 to-red-500",
  },
  {
    value: "time_based" as UnlockType,
    label: "Time-Based",
    description: "Create anticipation and daily return behavior. More attention over more days.",
    icon: Clock,
    color: "from-green-500 to-emerald-500",
  },
  {
    value: "custom" as UnlockType,
    label: "Custom",
    description: "Define your own unlock rules including time-based schedules and complex mechanics",
    icon: Settings,
    color: "from-gray-500 to-slate-500",
  },
]

export function UnlockTypeCards({ value, onChange }: UnlockTypeCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {availableTypes.map((type) => {
        const Icon = type.icon
        const isSelected = value === type.value
        
        return (
          <motion.button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            className={cn(
              "relative p-6 rounded-xl border-2 transition-all text-left",
              isSelected
                ? "border-primary bg-primary/5 shadow-lg scale-105"
                : "border-muted hover:border-primary/50 hover:bg-muted/50"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "p-3 rounded-lg bg-gradient-to-br",
                  type.color,
                  isSelected ? "opacity-100" : "opacity-60"
                )}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-base mb-1">{type.label}</h3>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </div>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2"
                >
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                </motion.div>
              )}
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}

