"use client"

import { motion } from "framer-motion"
import { Check, FileText, Key, Video, Package, Percent, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

interface BenefitType {
  id: number
  name: string
  description?: string
  icon: string
}

interface BenefitTypeCardsProps {
  benefitTypes: BenefitType[]
  value: number | null
  onChange: (value: number) => void
  loading?: boolean
}

// Map icon names to components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "file-text": FileText,
  "key": Key,
  "video": Video,
  "package": Package,
  "percent": Percent,
  "eye": Eye,
}

// Color schemes for each benefit type
const getBenefitTypeConfig = (name: string) => {
  const normalized = name.toLowerCase()
  
  if (normalized.includes("digital") || normalized.includes("content")) {
    return {
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      borderColor: "border-blue-200 dark:border-blue-800",
      visual: "📄",
    }
  }
  if (normalized.includes("exclusive") || normalized.includes("access")) {
    return {
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      borderColor: "border-purple-200 dark:border-purple-800",
      visual: "🔑",
    }
  }
  if (normalized.includes("virtual") || normalized.includes("event")) {
    return {
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      borderColor: "border-green-200 dark:border-green-800",
      visual: "🎥",
    }
  }
  if (normalized.includes("physical") || normalized.includes("item")) {
    return {
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      borderColor: "border-orange-200 dark:border-orange-800",
      visual: "📦",
    }
  }
  if (normalized.includes("discount")) {
    return {
      color: "from-yellow-500 to-amber-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
      borderColor: "border-yellow-200 dark:border-yellow-800",
      visual: "💰",
    }
  }
  if (normalized.includes("behind") || normalized.includes("scenes")) {
    return {
      color: "from-indigo-500 to-violet-500",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
      borderColor: "border-indigo-200 dark:border-indigo-800",
      visual: "👁️",
    }
  }
  if (normalized.includes("hidden") || normalized.includes("series")) {
    return {
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-50 dark:bg-amber-950/20",
      borderColor: "border-amber-200 dark:border-amber-800",
      visual: "🔒",
    }
  }
  
  // Default
  return {
    color: "from-gray-500 to-slate-500",
    bgColor: "bg-gray-50 dark:bg-gray-950/20",
    borderColor: "border-gray-200 dark:border-gray-800",
    visual: "✨",
  }
}

export function BenefitTypeCards({ benefitTypes, value, onChange, loading = false }: BenefitTypeCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 rounded-xl border-2 border-muted bg-muted/30 animate-pulse"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {benefitTypes.map((type) => {
        const config = getBenefitTypeConfig(type.name)
        const IconComponent = iconMap[type.icon] || FileText
        const isSelected = value === type.id

        return (
          <motion.button
            key={type.id}
            type="button"
            onClick={() => onChange(type.id)}
            className={cn(
              "relative rounded-xl border-2 transition-all text-left overflow-hidden p-4",
              isSelected
                ? `${config.borderColor} ${config.bgColor} shadow-lg scale-105`
                : "border-muted hover:border-primary/50 hover:bg-muted/50",
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">{config.visual}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-base truncate">{type.name}</h3>
                  <div className={cn(
                    "px-2 py-0.5 rounded text-xs font-semibold bg-gradient-to-r text-white flex-shrink-0",
                    config.color
                  )}>
                    {type.name.split(" ")[0]}
                  </div>
                </div>
                {type.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {type.description}
                  </p>
                )}
                <div className={cn(
                  "h-1 rounded-full bg-gradient-to-r mt-2",
                  config.color
                )} />
              </div>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center bg-gradient-to-r text-white flex-shrink-0",
                    config.color
                  )}
                >
                  <Check className="h-5 w-5" />
                </motion.div>
              )}
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}

