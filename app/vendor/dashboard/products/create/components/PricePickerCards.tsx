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
  const tier1 = Math.round(min + range * 0.2) // Budget
  const tier2 = Math.round(min + range * 0.5) // Standard
  const tier3 = Math.round(min + range * 0.8) // Premium
  const tier4 = max // Exclusive

  // Adjust tiers to include recommended price if it's not too close to others
  // If recommended is close to tier2, use it; otherwise keep tier2
  const adjustedTier2 = Math.abs(recommended - tier2) < 3 ? recommended : tier2
  // If recommended is close to tier3, use it; otherwise keep tier3
  const adjustedTier3 = Math.abs(recommended - tier3) < 3 ? recommended : tier3
  
  // Ensure we don't have duplicate values
  const uniqueTiers = [tier1, adjustedTier2, adjustedTier3, tier4].filter((v, i, arr) => arr.indexOf(v) === i)
  
  // If we lost a tier due to duplicates, add recommended if it's unique
  if (uniqueTiers.length < 4 && !uniqueTiers.includes(recommended)) {
    uniqueTiers.splice(2, 0, recommended)
  }
  
  // Ensure we have exactly 4 tiers, sorted
  const sortedTiers = [...uniqueTiers].sort((a, b) => a - b).slice(0, 4)
  while (sortedTiers.length < 4) {
    sortedTiers.push(max)
  }
  
  const finalTier1 = sortedTiers[0] || tier1
  const finalTier2 = sortedTiers[1] || adjustedTier2
  const finalTier3 = sortedTiers[2] || adjustedTier3
  const finalTier4 = sortedTiers[3] || tier4

  const priceOptions: PriceOption[] = [
    {
      value: finalTier1,
      label: "Budget",
      description: `£${finalTier1} - Great for accessibility`,
      icon: PoundSterling,
      color: "from-green-500 to-emerald-500",
    },
    {
      value: finalTier2,
      label: "Standard",
      description: `£${finalTier2} - Recommended price`,
      icon: TrendingUp,
      color: "from-blue-500 to-cyan-500",
      badge: "Recommended",
    },
    {
      value: finalTier3,
      label: "Premium",
      description: `£${finalTier3} - Higher value positioning`,
      icon: Star,
      color: "from-purple-500 to-pink-500",
    },
    {
      value: finalTier4,
      label: "Exclusive",
      description: `£${finalTier4} - Maximum price point`,
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

