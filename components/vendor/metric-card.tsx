"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { ReactNode } from "react"

interface MetricCardProps {
  title: string
  value: string | number
  icon?: LucideIcon
  trend?: {
    value: number
    label?: string
    isPositive?: boolean
  }
  description?: string
  className?: string
  children?: ReactNode
  variant?: "default" | "elevated" | "outlined"
}

/**
 * Enhanced metric card with trend indicators and color coding
 * Used for displaying key metrics on the dashboard
 */
export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  className,
  children,
  variant = "default",
}: MetricCardProps) {
  const variantStyles = {
    default: "shadow-sm hover:shadow-md transition-shadow",
    elevated: "shadow-md hover:shadow-lg transition-shadow",
    outlined: "shadow-none border-2",
  }

  const getTrendIcon = () => {
    if (!trend) return null
    if (trend.value > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
    }
    if (trend.value < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
    }
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const getTrendColor = () => {
    if (!trend) return ""
    if (trend.value > 0) {
      return "text-green-600 dark:text-green-400"
    }
    if (trend.value < 0) {
      return "text-red-600 dark:text-red-400"
    }
    return "text-muted-foreground"
  }

  return (
    <Card className={cn(variantStyles[variant], className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
        </div>
        {trend && (
          <div className={cn("flex items-center gap-1 text-xs font-medium", getTrendColor())}>
            {getTrendIcon()}
            <span>
              {trend.value > 0 ? "+" : ""}
              {trend.value.toFixed(1)}%
            </span>
            {trend.label && <span className="text-muted-foreground">({trend.label})</span>}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {children}
      </CardContent>
    </Card>
  )
}

