"use client"


import { cn } from "@/lib/utils"
import { CheckCircle2, Clock, XCircle, AlertCircle, MinusCircle } from "lucide-react"

import { Badge } from "@/components/ui"
type StatusType = "active" | "pending" | "completed" | "error" | "disabled" | "review"

interface StatusBadgeProps {
  status: StatusType
  showIcon?: boolean
  className?: string
  children?: React.ReactNode
}

const statusConfig: Record<
  StatusType,
  { color: string; icon: typeof CheckCircle2; label: string }
> = {
  active: {
    color: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
    icon: CheckCircle2,
    label: "Active",
  },
  pending: {
    color: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
    icon: Clock,
    label: "Pending",
  },
  completed: {
    color: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
    icon: CheckCircle2,
    label: "Completed",
  },
  error: {
    color: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
    icon: XCircle,
    label: "Error",
  },
  disabled: {
    color: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800",
    icon: MinusCircle,
    label: "Disabled",
  },
  review: {
    color: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
    icon: AlertCircle,
    label: "Under Review",
  },
}

/**
 * Status badge component with color coding and icons
 * Provides consistent status visualization across the application
 */
export function StatusBadge({ status, showIcon = true, className, children }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 border font-medium",
        config.color,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {children || config.label}
    </Badge>
  )
}

