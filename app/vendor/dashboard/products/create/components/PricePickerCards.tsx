"use client"

import { motion } from "framer-motion"
import { Check, PoundSterling, TrendingUp, Star, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface PriceOption {
  value: number
  label: string
  description: string
  icon: typeof PoundSterling
  color: string
  badge?: string
}

interface PricePickerCardsProps {
  value: number | null
  onChange: (value: number) => void
  min: number
  max: number
  recommended: number
  disabled?: boolean
}

export function PricePickerCards({
  value,
  onChange,
  min,
  max,
  recommended,
  disabled = false,
}: PricePickerCardsProps) {
  // Calculate 4 price tiers based on range
  const range = max - min
  const tier1 = Math.round(min + range * 0.2) // Low
  const tier2 = Math.round(min + range * 0.5) // Medium
  const tier3 = Math.round(min + range * 0.8) // High
  const tier4 = max // Premium

  // Adjust tiers to be closer to recommended if it's in a specific range
  const getClosestTier = (price: number) => {
    const tiers = [tier1, tier2, tier3, tier4]
    return tiers.reduce((prev, curr) =>
      Math.abs(curr - price) < Math.abs(prev - price) ? curr : prev
    )
  }

  // Use recommended as one of the tiers if it's not too close to others
  const adjustedTier2 = Math.abs(recommended - tier2) < 5 ? tier2 : recommended
  const adjustedTier3 = Math.abs(recommended - tier3) < 5 ? tier3 : recommended

  const priceOptions: PriceOption[] = [
    {
      value: tier1,
      label: "Budget",
      description: `£${tier1} - Great for accessibility`,
      icon: PoundSterling,
      color: "from-green-500 to-emerald-500",
    },
    {
      value: adjustedTier2,
      label: "Standard",
      description: `£${adjustedTier2} - Recommended price`,
      icon: TrendingUp,
      color: "from-blue-500 to-cyan-500",
      badge: "Recommended",
    },
    {
      value: adjustedTier3,
      label: "Premium",
      description: `£${adjustedTier3} - Higher value positioning`,
      icon: Star,
      color: "from-purple-500 to-pink-500",
    },
    {
      value: tier4,
      label: "Exclusive",
      description: `£${tier4} - Maximum price point`,
      icon: Sparkles,
      color: "from-orange-500 to-red-500",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4">
      {priceOptions.map((option) => {
        const Icon = option.icon
        const isSelected = value === option.value
        const isRecommended = option.value === recommended

        return (
          <motion.button
            key={option.value}
            type="button"
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
            className={cn(
              "relative p-6 rounded-xl border-2 transition-all text-left",
              isSelected
                ? "border-primary bg-primary/5 shadow-lg scale-105"
                : "border-muted hover:border-primary/50 hover:bg-muted/50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            whileHover={!disabled ? { scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "p-3 rounded-lg bg-gradient-to-br",
                  option.color,
                  isSelected ? "opacity-100" : "opacity-60"
                )}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-base">{option.label}</h3>
                  {isRecommended && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      Best Value
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold mb-1">£{option.value}</p>
                <p className="text-sm text-muted-foreground">{option.description}</p>
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

