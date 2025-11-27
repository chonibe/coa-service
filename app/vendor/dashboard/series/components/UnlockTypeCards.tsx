"use client"

import { motion } from "framer-motion"
import { Check, Lock, ArrowRight, Target, Settings } from "lucide-react"
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
    description: "Unlock all artworks when any piece is purchased",
    icon: Lock,
    color: "from-blue-500 to-cyan-500",
  },
  {
    value: "sequential" as UnlockType,
    label: "Sequential",
    description: "Unlock artworks one by one in order",
    icon: ArrowRight,
    color: "from-purple-500 to-pink-500",
  },
  {
    value: "threshold" as UnlockType,
    label: "Threshold",
    description: "Unlock after purchasing a set number of artworks",
    icon: Target,
    color: "from-orange-500 to-red-500",
  },
  {
    value: "custom" as UnlockType,
    label: "Custom",
    description: "Define your own unlock rules",
    icon: Settings,
    color: "from-gray-500 to-slate-500",
  },
]

export function UnlockTypeCards({ value, onChange }: UnlockTypeCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {unlockTypes.map((type) => {
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

