"use client"


import { Progress } from "@/components/ui"

import { CheckCircle2, Circle, TrendingUp } from "lucide-react"
import type { CompletionProgress, MilestoneConfig } from "@/types/artwork-series"
import { cn } from "@/lib/utils"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from "@/components/ui"
interface CompletionProgressProps {
  progress: CompletionProgress
  milestoneConfig?: MilestoneConfig | null
  completedAt?: string | null
  className?: string
}

export function CompletionProgress({
  progress,
  milestoneConfig,
  completedAt,
  className,
}: CompletionProgressProps) {
  const isCompleted = completedAt !== null
  const completionType = milestoneConfig?.completion_type || "all_sold"
  const threshold = milestoneConfig?.completion_threshold || 100

  const getCompletionStatus = () => {
    if (isCompleted) {
      return {
        label: "Completed",
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-50 dark:bg-green-900/20",
        borderColor: "border-green-500",
      }
    }

    if (progress.percentage_complete >= threshold) {
      return {
        label: "Ready to Complete",
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        borderColor: "border-blue-500",
      }
    }

    if (progress.percentage_complete > 0) {
      return {
        label: "In Progress",
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        borderColor: "border-blue-500",
      }
    }

    return {
      label: "Not Started",
      color: "text-muted-foreground",
      bgColor: "bg-muted/50",
      borderColor: "border-muted-foreground/30",
    }
  }

  const status = getCompletionStatus()

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Completion Progress</CardTitle>
          <Badge
            variant={isCompleted ? "default" : "outline"}
            className={cn(
              isCompleted && "bg-green-500 text-white",
              !isCompleted && status.borderColor
            )}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {status.label}
              </>
            ) : (
              <>
                <Circle className="h-3 w-3 mr-1" />
                {status.label}
              </>
            )}
          </Badge>
        </div>
        <CardDescription>
          {completionType === "all_sold"
            ? "Series completes when all artworks are sold"
            : completionType === "percentage_sold"
            ? `Series completes when ${threshold}% of artworks are sold`
            : "Series must be manually marked as complete"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progress.percentage_complete)}%</span>
          </div>
          <Progress value={progress.percentage_complete} className="h-3" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className={cn("p-3 rounded-lg border", status.bgColor, status.borderColor)}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className={cn("h-4 w-4", status.color)} />
              <span className={cn("text-sm font-medium", status.color)}>Sold</span>
            </div>
            <p className="text-2xl font-bold">{progress.sold_artworks}</p>
            <p className="text-xs text-muted-foreground">artworks sold</p>
          </div>

          <div className="p-3 rounded-lg border bg-muted/50 border-muted-foreground/30">
            <div className="flex items-center gap-2 mb-1">
              <Circle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold">{progress.total_artworks}</p>
            <p className="text-xs text-muted-foreground">artworks in series</p>
          </div>
        </div>

        {/* Completion Info */}
        {completionType === "percentage_sold" && (
          <div className="p-3 rounded-lg border bg-muted/50 border-muted-foreground/30">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Completion Threshold</span>
              <span className="font-medium">{threshold}%</span>
            </div>
            {progress.percentage_complete < threshold && (
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(threshold - progress.percentage_complete)}% remaining
              </p>
            )}
          </div>
        )}

        {/* Completion Date */}
        {isCompleted && completedAt && (
          <div className="p-3 rounded-lg border bg-green-50 dark:bg-green-900/20 border-green-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                Completed on {new Date(completedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
