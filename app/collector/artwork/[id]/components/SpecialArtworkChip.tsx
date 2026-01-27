"use client"

import React from "react"
import { Lock, List, Clock, Star, Award, CheckCircle } from "lucide-react"

interface SpecialArtworkChipProps {
  type: "unlocks_hidden" | "series" | "timed_release" | "vip_access" | "limited_edition" | "authenticated"
  label: string
  sublabel?: string
  icon?: string
}

/**
 * SpecialArtworkChip - Badge components for special artwork properties
 * 
 * Chip Types:
 * - unlocks_hidden: This artwork unlocks hidden content
 * - series: Part of a series with position info
 * - timed_release: Part of time-based unlock series
 * - vip_access: Grants VIP tier access
 * - limited_edition: Shows edition info prominently
 * - authenticated: NFC verified status
 */
const SpecialArtworkChip: React.FC<SpecialArtworkChipProps> = ({
  type,
  label,
  sublabel,
  icon,
}) => {
  const getChipStyles = () => {
    switch (type) {
      case "unlocks_hidden":
        return {
          bg: "bg-purple-500/10 hover:bg-purple-500/20",
          border: "border-purple-500/30",
          text: "text-purple-300",
          iconColor: "text-purple-400",
          Icon: Lock,
        }
      case "series":
        return {
          bg: "bg-blue-500/10 hover:bg-blue-500/20",
          border: "border-blue-500/30",
          text: "text-blue-300",
          iconColor: "text-blue-400",
          Icon: List,
        }
      case "timed_release":
        return {
          bg: "bg-orange-500/10 hover:bg-orange-500/20",
          border: "border-orange-500/30",
          text: "text-orange-300",
          iconColor: "text-orange-400",
          Icon: Clock,
        }
      case "vip_access":
        return {
          bg: "bg-yellow-500/10 hover:bg-yellow-500/20",
          border: "border-yellow-500/30",
          text: "text-yellow-300",
          iconColor: "text-yellow-400",
          Icon: Star,
        }
      case "limited_edition":
        return {
          bg: "bg-pink-500/10 hover:bg-pink-500/20",
          border: "border-pink-500/30",
          text: "text-pink-300",
          iconColor: "text-pink-400",
          Icon: Award,
        }
      case "authenticated":
        return {
          bg: "bg-green-500/10 hover:bg-green-500/20",
          border: "border-green-500/30",
          text: "text-green-300",
          iconColor: "text-green-400",
          Icon: CheckCircle,
        }
      default:
        return {
          bg: "bg-gray-500/10 hover:bg-gray-500/20",
          border: "border-gray-500/30",
          text: "text-gray-300",
          iconColor: "text-gray-400",
          Icon: Award,
        }
    }
  }

  const styles = getChipStyles()
  const IconComponent = styles.Icon

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border backdrop-blur-sm transition-all ${styles.bg} ${styles.border} ${styles.text}`}
    >
      <IconComponent className={`h-4 w-4 ${styles.iconColor}`} />
      <div className="flex flex-col">
        <span className="text-sm font-semibold leading-tight">{label}</span>
        {sublabel && (
          <span className="text-xs opacity-80 leading-tight">{sublabel}</span>
        )}
      </div>
    </div>
  )
}

export default SpecialArtworkChip
