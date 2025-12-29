"use client"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useState } from "react"

export type TimeRange = "7d" | "30d" | "90d" | "1y" | "all-time" | "custom"

export interface DateRange {
  from: Date
  to: Date
}

interface TimeRangeSelectorProps {
  value: TimeRange
  dateRange?: DateRange
  onChange: (range: TimeRange, customRange?: DateRange) => void
  className?: string
}

/**
 * Time range selector component for analytics
 * Supports preset ranges (7d, 30d, 90d, 1y, all-time) and custom date range
 */
export function TimeRangeSelector({
  value,
  dateRange,
  onChange,
  className,
}: TimeRangeSelectorProps) {
  const [isCustomOpen, setIsCustomOpen] = useState(false)
  const [customRange, setCustomRange] = useState<DateRange | undefined>(dateRange)

  const handlePresetChange = (range: TimeRange) => {
    onChange(range)
    setIsCustomOpen(false)
  }

  const handleCustomRangeSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      setCustomRange({ from: range.from, to: range.to })
      onChange("custom", { from: range.from, to: range.to })
      setIsCustomOpen(false)
    } else if (range?.from) {
      setCustomRange({ from: range.from, to: range.from })
    }
  }

  const getDateRangeLabel = () => {
    if (value === "custom" && customRange) {
      return `${format(customRange.from, "MMM d")} - ${format(customRange.to, "MMM d, yyyy")}`
    }
    if (value === "all-time") {
      return "All Time"
    }
    return value.toUpperCase()
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex gap-1 rounded-md border p-1">
        <Button
          variant={value === "7d" ? "default" : "ghost"}
          size="sm"
          onClick={() => handlePresetChange("7d")}
          className="h-8"
        >
          7D
        </Button>
        <Button
          variant={value === "30d" ? "default" : "ghost"}
          size="sm"
          onClick={() => handlePresetChange("30d")}
          className="h-8"
        >
          30D
        </Button>
        <Button
          variant={value === "90d" ? "default" : "ghost"}
          size="sm"
          onClick={() => handlePresetChange("90d")}
          className="h-8"
        >
          90D
        </Button>
        <Button
          variant={value === "1y" ? "default" : "ghost"}
          size="sm"
          onClick={() => handlePresetChange("1y")}
          className="h-8"
        >
          1Y
        </Button>
        <Button
          variant={value === "all-time" ? "default" : "ghost"}
          size="sm"
          onClick={() => handlePresetChange("all-time")}
          className="h-8"
        >
          All Time
        </Button>
      </div>

      <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={value === "custom" ? "default" : "outline"}
            size="sm"
            className={cn("h-8", value === "custom" && "bg-primary text-primary-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value === "custom" ? getDateRangeLabel() : "Custom"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={customRange?.from}
            selected={{
              from: customRange?.from,
              to: customRange?.to,
            }}
            onSelect={handleCustomRangeSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

