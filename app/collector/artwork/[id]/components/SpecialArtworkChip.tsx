"use client"

import { 
  Grid3x3, 
  Lock, 
  Clock, 
  Crown, 
  Hash,
  CheckCircle,
  Sparkles
} from "lucide-react"

import { Badge } from "@/components/ui"

export type ChipType = 
  | "series" 
  | "limited_edition" 
  | "unlocks_hidden" 
  | "timed_release" 
  | "vip_access" 
  | "authenticated"

export interface SpecialChip {
  type: ChipType
  label: string
  sublabel?: string
  icon?: string
}

interface SpecialArtworkChipProps {
  chip: SpecialChip
  size?: "sm" | "md" | "lg"
  className?: string
}

export function SpecialArtworkChip({ 
  chip, 
  size = "md",
  className = "" 
}: SpecialArtworkChipProps) {
  const getChipStyles = (type: ChipType) => {
    switch (type) {
      case "series":
        return {
          bg: "bg-gradient-to-r from-blue-500/90 to-indigo-600/90",
          border: "border-blue-500/50",
          icon: Grid3x3,
        }
      case "limited_edition":
        return {
          bg: "bg-gradient-to-r from-purple-500/90 to-pink-600/90",
          border: "border-purple-500/50",
          icon: Hash,
        }
      case "unlocks_hidden":
        return {
          bg: "bg-gradient-to-r from-amber-500/90 to-orange-600/90",
          border: "border-amber-500/50",
          icon: Sparkles,
        }
      case "timed_release":
        return {
          bg: "bg-gradient-to-r from-cyan-500/90 to-blue-600/90",
          border: "border-cyan-500/50",
          icon: Clock,
        }
      case "vip_access":
        return {
          bg: "bg-gradient-to-r from-yellow-500/90 to-amber-600/90",
          border: "border-yellow-500/50",
          icon: Crown,
        }
      case "authenticated":
        return {
          bg: "bg-gradient-to-r from-green-500/90 to-emerald-600/90",
          border: "border-green-500/50",
          icon: CheckCircle,
        }
      default:
        return {
          bg: "bg-gradient-to-r from-gray-500/90 to-slate-600/90",
          border: "border-gray-500/50",
          icon: Lock,
        }
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return {
          container: "px-2.5 py-1 text-xs gap-1.5",
          icon: "h-3 w-3",
          text: "text-xs",
        }
      case "lg":
        return {
          container: "px-5 py-2.5 text-base gap-3",
          icon: "h-5 w-5",
          text: "text-base",
        }
      default: // md
        return {
          container: "px-4 py-2 text-sm gap-2",
          icon: "h-4 w-4",
          text: "text-sm",
        }
    }
  }

  const styles = getChipStyles(chip.type)
  const sizeStyles = getSizeStyles()
  const Icon = styles.icon

  return (
    <div
      className={`
        inline-flex items-center ${sizeStyles.container}
        ${styles.bg} ${styles.border}
        border backdrop-blur-md
        rounded-full
        text-white font-medium
        shadow-lg
        transition-all hover:scale-105 hover:shadow-xl
        ${className}
      `}
    >
      <Icon className={sizeStyles.icon} />
      <div className="flex flex-col">
        <span className={sizeStyles.text}>
          {chip.label}
        </span>
        {chip.sublabel && (
          <span className="text-[0.7em] opacity-90 font-normal">
            {chip.sublabel}
          </span>
        )}
      </div>
    </div>
  )
}

// Helper function to generate chips from artwork data (server-side or client-side)
export function generateSpecialChips(artworkData: {
  editionNumber?: number | null
  editionTotal?: number | null
  nfcClaimedAt?: string | null
  seriesInfo?: {
    name: string
    position: number
    totalCount: number
  }
  unlocks?: {
    hiddenSeries?: boolean
    vipArtwork?: boolean
    vipSeries?: boolean
  }
  isTimedRelease?: boolean
}): SpecialChip[] {
  const chips: SpecialChip[] = []

  // Series position chip
  if (artworkData.seriesInfo) {
    chips.push({
      type: "series",
      label: `${artworkData.seriesInfo.name} ${artworkData.seriesInfo.position}/${artworkData.seriesInfo.totalCount}`,
    })
  }

  // Limited edition chip
  if (artworkData.editionNumber && artworkData.editionTotal) {
    chips.push({
      type: "limited_edition",
      label: `#${artworkData.editionNumber} of ${artworkData.editionTotal}`,
    })
  }

  // Unlocks hidden content chip
  if (artworkData.unlocks?.hiddenSeries) {
    chips.push({
      type: "unlocks_hidden",
      label: "Unlocks Hidden Series",
    })
  } else if (artworkData.unlocks?.vipArtwork) {
    chips.push({
      type: "unlocks_hidden",
      label: "Unlocks VIP Artwork",
    })
  }

  // VIP access chip
  if (artworkData.unlocks?.vipSeries) {
    chips.push({
      type: "vip_access",
      label: "VIP Access",
    })
  }

  // Timed release chip
  if (artworkData.isTimedRelease) {
    chips.push({
      type: "timed_release",
      label: "Timed Release",
    })
  }

  // Authenticated/Verified chip
  if (artworkData.nfcClaimedAt) {
    chips.push({
      type: "authenticated",
      label: "Verified",
      sublabel: new Date(artworkData.nfcClaimedAt).toLocaleDateString(),
    })
  }

  return chips
}
