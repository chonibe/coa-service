"use client"

import { ReactNode } from "react"
import { AlertCircle, CheckCircle, Clock, Info, Wallet, X } from "lucide-react"
import { Button } from "@/components/ui/button"
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
   * Whether the bar can be dismissed
   */
  dismissible?: boolean
  
  /**
   * Callback when dismissed
   */
  onDismiss?: () => void
  
  /**
   * Additional CSS classes
   */
  className?: string
  
  /**
   * Whether to show in compact mode (smaller padding)
   */
  compact?: boolean
}

const variantConfig = {
  info: {
    gradient: "from-blue-500 to-indigo-600",
    icon: Info,
    textColor: "text-white",
  },
  warning: {
    gradient: "from-amber-500 to-orange-500",
    icon: AlertCircle,
    textColor: "text-white",
  },
  success: {
    gradient: "from-green-500 to-emerald-600",
    icon: CheckCircle,
    textColor: "text-white",
  },
  error: {
    gradient: "from-red-500 to-rose-600",
    icon: AlertCircle,
    textColor: "text-white",
  },
  pending: {
    gradient: "from-blue-500 to-indigo-600",
    icon: Clock,
    textColor: "text-white",
  },
}

export function AnnouncementBar({
  variant,
  message,
  action,
  icon,
  dismissible = false,
  onDismiss,
  className,
  compact = false,
}: AnnouncementBarProps) {
  const config = variantConfig[variant]
  const Icon = icon || config.icon
  const actions = action ? (Array.isArray(action) ? action : [action]) : []

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
              {Icon && (
                typeof Icon === "function" ? (
                  <Icon className="h-5 w-5 flex-shrink-0" />
                ) : (
                  Icon
                )
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

              {dismissible && onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="h-8 w-8 p-0 text-white hover:bg-white/20"
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

// Missing import
import { useState, useEffect } from "react"
