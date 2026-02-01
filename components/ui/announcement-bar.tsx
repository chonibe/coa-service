"use client"

import { ReactNode, useState, useEffect } from "react"
import { AlertCircle, CheckCircle, Clock, Info, Wallet, X, ChevronDown, Bell } from "lucide-react"
import { Button } from "@/components/ui"
import { cn } from "@/lib/utils"

export type AnnouncementVariant = "info" | "warning" | "success" | "error" | "pending"

export interface AnnouncementBarAction {
  label: string
  onClick: () => void
  disabled?: boolean
  loading?: boolean
}

export interface AnnouncementBarProps {
  /**
   * Unique ID for this announcement (used for persistence)
   */
  id?: string
  
  /**
   * The variant/type of announcement - determines color scheme
   */
  variant: AnnouncementVariant
  
  /**
   * The main message to display
   */
  message: string | ReactNode
  
  /**
   * Optional action button(s) - can be single or array
   */
  action?: AnnouncementBarAction | AnnouncementBarAction[]
  
  /**
   * Optional custom icon (overrides variant default)
   */
  icon?: ReactNode
  
  /**
   * Whether the bar can be dismissed (collapsed to a marker)
   */
  dismissible?: boolean
  
  /**
   * Callback when dismissed
   */
  onDismiss?: () => void
  
  /**
   * Callback when reopened from marker
   */
  onReopen?: () => void
  
  /**
   * Text for the collapsed marker button
   */
  markerLabel?: string
  
  /**
   * Position of the marker when collapsed
   * @default "top" - Shows as a small bar at the top
   */
  markerPosition?: "top" | "bottom" | "floating"
  
  /**
   * Additional CSS classes
   */
  className?: string
  
  /**
   * Whether to show in compact mode (smaller padding)
   */
  compact?: boolean
  
  /**
   * Initial collapsed state
   */
  initiallyCollapsed?: boolean
}

const variantConfig = {
  info: {
    gradient: "from-blue-500 to-indigo-600",
    icon: Info,
    textColor: "text-white",
    markerColor: "bg-blue-600 hover:bg-blue-700",
  },
  warning: {
    gradient: "from-amber-500 to-orange-500",
    icon: AlertCircle,
    textColor: "text-white",
    markerColor: "bg-amber-600 hover:bg-amber-700",
  },
  success: {
    gradient: "from-green-500 to-emerald-600",
    icon: CheckCircle,
    textColor: "text-white",
    markerColor: "bg-green-600 hover:bg-green-700",
  },
  error: {
    gradient: "from-red-500 to-rose-600",
    icon: AlertCircle,
    textColor: "text-white",
    markerColor: "bg-red-600 hover:bg-red-700",
  },
  pending: {
    gradient: "from-blue-500 to-indigo-600",
    icon: Clock,
    textColor: "text-white",
    markerColor: "bg-indigo-600 hover:bg-indigo-700",
  },
}

export function AnnouncementBar({
  id,
  variant,
  message,
  action,
  icon,
  dismissible = false,
  onDismiss,
  onReopen,
  markerLabel,
  markerPosition = "top",
  className,
  compact = false,
  initiallyCollapsed = false,
}: AnnouncementBarProps) {
  const [isCollapsed, setIsCollapsed] = useState(initiallyCollapsed)
  const config = variantConfig[variant]
  const DefaultIcon = config.icon
  const actions = action ? (Array.isArray(action) ? action : [action]) : []

  // Load collapsed state from localStorage if id is provided
  useEffect(() => {
    if (id && typeof window !== "undefined") {
      const collapsed = localStorage.getItem(`announcement-${id}-collapsed`)
      if (collapsed === "true") {
        setIsCollapsed(true)
      }
    }
  }, [id])

  const handleDismiss = () => {
    setIsCollapsed(true)
    if (id && typeof window !== "undefined") {
      localStorage.setItem(`announcement-${id}-collapsed`, "true")
    }
    onDismiss?.()
  }

  const handleReopen = () => {
    setIsCollapsed(false)
    if (id && typeof window !== "undefined") {
      localStorage.setItem(`announcement-${id}-collapsed`, "false")
    }
    onReopen?.()
  }

  // Get marker label based on variant if not provided
  const getMarkerLabel = () => {
    if (markerLabel) return markerLabel
    switch (variant) {
      case "warning":
        return "Action Required"
      case "success":
        return "Ready"
      case "error":
        return "Issue"
      case "pending":
        return "Pending"
      default:
        return "Notification"
    }
  }

  // Collapsed marker view
  if (isCollapsed) {
    if (markerPosition === "floating") {
      return (
        <button
          onClick={handleReopen}
          className={cn(
            "fixed bottom-6 right-6 z-50 shadow-lg rounded-full p-3",
            config.markerColor,
            "text-white transition-all hover:scale-110",
            "flex items-center gap-2"
          )}
          title={`Expand ${getMarkerLabel()}`}
        >
          <Bell className="h-5 w-5" />
          <span className="text-sm font-medium pr-1">{getMarkerLabel()}</span>
        </button>
      )
    }

    // Top or bottom marker - inline positioning
    return (
      <div className={cn(
        "w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]",
        markerPosition === "top" ? "mb-6" : "mt-6"
      )}>
        <button
          onClick={handleReopen}
          className={cn(
            "w-full transition-all hover:opacity-90",
            config.markerColor,
            "text-white py-2 px-6",
            "flex items-center justify-center gap-2"
          )}
          title="Click to expand announcement"
        >
          <Bell className="h-4 w-4" />
          <span className="text-sm font-medium">{getMarkerLabel()}</span>
          <ChevronDown className="h-4 w-4 animate-bounce" />
        </button>
      </div>
    )
  }

  // Full announcement bar view
  return (
    <div
      className={cn(
        "w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] mb-6",
        className
      )}
    >
      <div className={cn("bg-gradient-to-r", config.gradient, config.textColor)}>
        <div className={cn("max-w-7xl mx-auto px-6", compact ? "py-2" : "py-3")}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {icon ? (
                icon
              ) : (
                <DefaultIcon className="h-5 w-5 flex-shrink-0" />
              )}
              <div className="font-medium truncate flex-1">
                {typeof message === "string" ? <span>{message}</span> : message}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {actions.map((act, idx) => (
                <Button
                  key={idx}
                  variant="secondary"
                  size="sm"
                  onClick={act.onClick}
                  disabled={act.disabled || act.loading}
                  className={cn(
                    "bg-white hover:bg-gray-100 font-semibold",
                    variant === "warning" && "text-amber-600",
                    variant === "success" && "text-emerald-600",
                    variant === "error" && "text-red-600",
                    variant === "info" && "text-blue-600",
                    variant === "pending" && "text-indigo-600"
                  )}
                >
                  {act.loading && (
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  )}
                  {act.label}
                </Button>
              ))}

              {dismissible && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="h-8 w-8 p-0 text-white hover:bg-white/20"
                  title="Collapse announcement"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Convenience hook for managing announcement bar visibility
export function useAnnouncementBar(storageKey?: string) {
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    if (storageKey && typeof window !== "undefined") {
      const dismissed = localStorage.getItem(storageKey)
      if (dismissed === "true") {
        setIsDismissed(true)
      }
    }
  }, [storageKey])

  const dismiss = () => {
    setIsDismissed(true)
    if (storageKey && typeof window !== "undefined") {
      localStorage.setItem(storageKey, "true")
    }
  }

  const reset = () => {
    setIsDismissed(false)
    if (storageKey && typeof window !== "undefined") {
      localStorage.removeItem(storageKey)
    }
  }

  return { isDismissed, dismiss, reset }
}

