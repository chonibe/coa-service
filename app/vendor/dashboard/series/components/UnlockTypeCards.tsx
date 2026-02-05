"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Lock, ArrowRight, Crown, Radio, FolderOpen, Book, ChevronDown, ChevronUp, Clock } from "lucide-react"
import type { UnlockType } from "@/types/artwork-series"
import { cn } from "@/lib/utils"


import { Button } from "@/components/ui"
interface UnlockTypeCardsProps {
  value: UnlockType
  onChange: (value: UnlockType) => void
}

// Organized unlock types with recommendations
const recommendedType = {
  value: "any_purchase" as UnlockType,
  label: "Open Collection",
  description: "All artworks available immediately",
  bestFor: "Single releases, standalone pieces",
  icon: FolderOpen,
  color: "from-blue-500 to-cyan-500",
  bgColor: "bg-blue-50 dark:bg-blue-950/20",
  borderColor: "border-blue-200 dark:border-blue-800",
}

const journeyTypes = [
  {
    value: "sequential" as UnlockType,
    label: "Sequential",
    description: "Unlock in order",
    bestFor: "Story arcs, album releases",
    icon: Book,
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
]

const advancedTypes = [
  {
    value: "threshold" as UnlockType,
    label: "Threshold",
    description: "Unlock after collecting N pieces",
    bestFor: "Collection milestones, tier rewards",
    icon: Crown,
    color: "from-orange-500 to-red-500",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-800",
  },
  {
    value: "nfc" as UnlockType,
    label: "NFC-Only",
    description: "Physical authentication required",
    bestFor: "Physical art, limited editions",
    icon: Radio,
    color: "from-indigo-500 to-blue-500",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
    borderColor: "border-indigo-200 dark:border-indigo-800",
  },
]

export function UnlockTypeCards({ value, onChange }: UnlockTypeCardsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const renderCard = (type: typeof recommendedType | typeof journeyTypes[0] | typeof advancedTypes[0], isFeatured = false) => {
    const Icon = type.icon
    const isSelected = value === type.value

    return (
      <motion.button
        key={type.value}
        type="button"
        onClick={() => onChange(type.value)}
        className={cn(
          "relative rounded-xl border-2 transition-all text-left overflow-hidden",
          "min-h-[120px] p-4",
          isSelected
            ? `${type.borderColor} ${type.bgColor} shadow-lg`
            : "border-border hover:border-primary/50 hover:bg-muted/50",
          isFeatured && "shadow-md"
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Selected indicator */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              "absolute top-3 right-3 h-6 w-6 rounded-full flex items-center justify-center",
              "bg-gradient-to-r text-white shadow-md",
              type.color
            )}
          >
            <Check className="h-4 w-4" />
          </motion.div>
        )}

        {/* Icon */}
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
          "bg-gradient-to-br",
          type.color,
          "text-white shadow-sm"
        )}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div>
          <h3 className="font-bold text-base mb-1">{type.label}</h3>
          <p className="text-sm text-muted-foreground mb-2">{type.description}</p>
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <span className="font-medium">Best for:</span>
            <span className="flex-1">{type.bestFor}</span>
          </div>
        </div>
      </motion.button>
    )
  }

  return (
    <div className="space-y-6">
      {/* Recommended */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Recommended for Most Artists
          </p>
        </div>
        {renderCard(recommendedType, true)}
      </div>

      {/* Create Collector Journeys */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Create Collector Journeys
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {journeyTypes.map((type) => renderCard(type))}
        </div>
      </div>

      {/* Advanced Options (Collapsible) */}
      <div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full justify-between h-auto py-3 px-4 hover:bg-muted/50"
        >
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-muted-foreground" />
            <p className="text-sm font-semibold text-muted-foreground">Advanced Options</p>
            <span className="text-xs text-muted-foreground/60">
              (Threshold, NFC-only)
            </span>
          </div>
          {showAdvanced ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </Button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                {advancedTypes.map((type) => renderCard(type))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

