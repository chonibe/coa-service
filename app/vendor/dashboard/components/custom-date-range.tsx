"use client"

import { useState } from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface CustomDateRangeProps {
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  onApply: () => void
  className?: string
}

export function CustomDateRange({ dateRange, onDateRangeChange, onApply, className }: CustomDateRangeProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Format the date range for display
  const formatDateRange = () => {
    if (!dateRange?.from) {
      return "Select date range"
    }

    if (dateRange.to) {
      return `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`
    }

    return format(dateRange.from, "MMM d, yyyy")
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={onDateRangeChange}
            numberOfMonths={2}
          />
          <div className="flex items-center justify-end gap-2 p-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onDateRangeChange(undefined)
              }}
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (dateRange?.from && dateRange?.to) {
                  onApply()
                  setIsOpen(false)
                }
              }}
              disabled={!dateRange?.from || !dateRange?.to}
            >
              Apply Range
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
